"""
PageSpeed Insights analyzer.

Uses Google's PageSpeed Insights API to obtain Lighthouse lab data without
running Chromium inside this application runtime.
"""

import copy
import logging
import time
from urllib.parse import urlparse

from config import Config


logger = logging.getLogger(__name__)


class PageSpeedInsightsError(RuntimeError):
    """Base error for PageSpeed Insights failures."""

    def __init__(self, message, status_code=None, retryable=False):
        super().__init__(message)
        self.status_code = status_code
        self.retryable = retryable


class PageSpeedRateLimitError(PageSpeedInsightsError):
    """Raised when Google throttles PageSpeed Insights requests."""


class PageSpeedInsightsAnalyzer:
    """Analyze a public URL using the PageSpeed Insights API."""

    ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
    _cache = {}

    def __init__(self, api_key=None, strategy=None, locale=None, session=None):
        configured_key = api_key if api_key is not None else Config.PAGESPEED_API_KEY
        self.api_key = self._normalize_api_key(configured_key)
        self.strategy = (strategy or Config.PAGESPEED_STRATEGY or 'desktop').lower()
        self.locale = locale or Config.PAGESPEED_LOCALE
        self.session = session

    def measure_web_vitals(self, url, timeout=None, options=None):
        """
        Run PageSpeed Insights and return metrics in the existing analyzer shape.
        """
        cache_key = self._cache_key(url, options=options)
        cached_metrics = self._get_cached_metrics(cache_key)
        if cached_metrics:
            logger.info('Using cached PageSpeed Insights metrics for %s', url)
            return cached_metrics

        session = self.session or self._create_session()
        response = session.get(
            self.ENDPOINT,
            params=self._build_params(url, options=options),
            timeout=timeout or Config.PAGESPEED_TIMEOUT
        )
        self._raise_for_error_response(response)
        metrics = self._extract_metrics(response.json())
        self._set_cached_metrics(cache_key, metrics)
        return metrics

    def _build_params(self, url, options=None):
        categories = ['performance', 'accessibility', 'best-practices', 'seo']
        if options and isinstance(options, dict):
            categories = options.get('onlyCategories', categories)

        params = [
            ('url', url),
            ('strategy', self.strategy),
            ('locale', self.locale)
        ]
        for category in categories:
            params.append(('category', category))

        if self.api_key:
            params.append(('key', self.api_key))

        return params

    def _cache_key(self, url, options=None):
        return tuple(
            (name, value)
            for name, value in self._build_params(url, options=options)
            if name != 'key'
        )

    def _get_cached_metrics(self, cache_key):
        ttl = max(0, getattr(Config, 'PAGESPEED_CACHE_TTL', 0))
        if ttl == 0:
            return None

        entry = self._cache.get(cache_key)
        if not entry:
            return None

        expires_at, metrics = entry
        if expires_at <= time.time():
            self._cache.pop(cache_key, None)
            return None

        return copy.deepcopy(metrics)

    def _set_cached_metrics(self, cache_key, metrics):
        ttl = max(0, getattr(Config, 'PAGESPEED_CACHE_TTL', 0))
        if ttl == 0:
            return

        max_entries = max(1, getattr(Config, 'PAGESPEED_CACHE_MAX_ENTRIES', 128))
        if len(self._cache) >= max_entries:
            oldest_key = min(self._cache, key=lambda key: self._cache[key][0])
            self._cache.pop(oldest_key, None)

        self._cache[cache_key] = (
            time.time() + ttl,
            copy.deepcopy(metrics)
        )

    def _normalize_api_key(self, api_key):
        if not api_key:
            return None

        normalized = str(api_key).strip()
        if not normalized:
            return None

        placeholder_tokens = (
            '<',
            'change-me',
            'optional',
            'your-',
            'la tua key',
            'api-key',
            'google-api-key'
        )
        lowered = normalized.lower()
        if any(token in lowered for token in placeholder_tokens):
            logger.warning('Ignoring placeholder PageSpeed API key configuration')
            return None

        return normalized

    def _raise_for_error_response(self, response):
        if response.status_code < 400:
            return

        message = self._extract_error_message(response)
        retry_after = self._retry_after(response)

        if response.status_code == 429:
            if self.api_key:
                detail = 'Google ha limitato le richieste PageSpeed per quota o frequenza.'
            else:
                detail = (
                    'Google ha limitato le richieste PageSpeed anonime. '
                    'Configura una PAGESPEED_API_KEY reale oppure riprova piu tardi.'
                )
            if retry_after:
                detail = f'{detail} Retry-After: {retry_after}.'
            raise PageSpeedRateLimitError(
                f'{detail} Dettaglio Google: {message}',
                status_code=429,
                retryable=True
            )

        raise PageSpeedInsightsError(
            f'PageSpeed Insights returned HTTP {response.status_code}: {message}',
            status_code=response.status_code,
            retryable=response.status_code >= 500
        )

    def _extract_error_message(self, response):
        try:
            payload = response.json()
        except ValueError:
            text = getattr(response, 'text', '') or response.reason or 'Request failed'
            return text[:300]

        error = payload.get('error', {})
        if isinstance(error, dict):
            return error.get('message') or error.get('status') or 'Request failed'
        return str(error or 'Request failed')[:300]

    def _retry_after(self, response):
        headers = getattr(response, 'headers', {}) or {}
        return headers.get('Retry-After')

    def _extract_metrics(self, pagespeed_data):
        lighthouse_data = pagespeed_data.get('lighthouseResult', {})
        if not lighthouse_data:
            raise RuntimeError('PageSpeed Insights response does not include lighthouseResult')

        audits = lighthouse_data.get('audits', {})
        categories = lighthouse_data.get('categories', {})

        lcp_value = self._audit_numeric(audits, 'largest-contentful-paint')
        fid_value = self._audit_numeric(
            audits,
            'max-potential-fid',
            fallback_ids=('total-blocking-time',)
        )
        cls_value = self._audit_numeric(audits, 'cumulative-layout-shift')

        category_scores = {
            'performance': self._category_score(categories, 'performance'),
            'accessibility': self._category_score(categories, 'accessibility'),
            'best_practices': self._category_score(categories, 'best-practices'),
            'seo': self._category_score(categories, 'seo')
        }

        performance_metrics = {
            'lcp': round(lcp_value, 2),
            'fid': round(fid_value, 2),
            'cls': round(cls_value, 3),
            'speed_index': round(self._audit_numeric(audits, 'speed-index'), 2),
            'ttfb': round(self._audit_numeric(audits, 'server-response-time'), 2),
            'time_to_interactive': round(self._audit_numeric(audits, 'interactive'), 2),
            'total_blocking_time': round(self._audit_numeric(audits, 'total-blocking-time'), 2),
            'first_contentful_paint': round(self._audit_numeric(audits, 'first-contentful-paint'), 2),
            'first_meaningful_paint': round(self._audit_numeric(audits, 'first-meaningful-paint'), 2),
            'render_blocking_resources': len(self._audit_items(audits, 'render-blocking-resources')),
            'uses_responsive_images': self._audit_score(audits, 'uses-responsive-images'),
            'offscreen_images': self._audit_score(audits, 'offscreen-images'),
            'uses_optimized_images': self._audit_score(
                audits,
                'uses-optimized-images',
                'uses-responsive-images'
            ),
            'uses_webp_images': self._audit_score(
                audits,
                'uses-webp-images',
                'modern-image-formats'
            ),
            'uses_text_compression': self._audit_score(audits, 'uses-text-compression'),
            'uses_rel_preconnect': self._audit_score(audits, 'uses-rel-preconnect'),
            'efficient_animated_content': self._audit_score(audits, 'efficient-animated-content'),
            'bootup_time': round(self._audit_numeric(audits, 'bootup-time'), 2),
            'mainthread_work_breakdown': round(self._audit_numeric(audits, 'mainthread-work-breakdown'), 2),
            'third_party_summary': len(self._audit_items(audits, 'third-party-summary')),
            'unused_javascript': self._audit_score(audits, 'unused-javascript'),
            'network_requests': len(self._audit_items(audits, 'network-requests')),
            'network_rtt': round(self._audit_numeric(audits, 'network-rtt'), 2),
            'network_server_latency': round(self._audit_numeric(audits, 'network-server-latency'), 2),
            'total_byte_weight': round(self._audit_numeric(audits, 'total-byte-weight'), 2),
            'uses_long_cache_ttl': self._audit_score(audits, 'uses-long-cache-ttl'),
            'dom_size': self._audit_numeric(audits, 'dom-size'),
            'duplicated_javascript': self._audit_score(audits, 'duplicated-javascript'),
            'legacy_javascript': self._audit_score(audits, 'legacy-javascript')
        }

        sustainability_indicators = {
            'font_display': self._audit_score(audits, 'font-display'),
            'preload_lcp_image': self._audit_score(audits, 'preload-lcp-image'),
            'unsized_images': self._audit_score(audits, 'unsized-images'),
            'non_composited_animations': self._audit_score(audits, 'non-composited-animations'),
            'image_size_responsive': self._audit_score(audits, 'image-size-responsive'),
            'uses_http2': self._audit_score(audits, 'uses-http2')
        }

        network_stats = self._extract_network_stats(audits)
        web_vitals_scores = self.calculate_web_vitals_scores(lcp_value, fid_value, cls_value)
        load_time = round((performance_metrics['time_to_interactive'] or lcp_value) / 1000, 2)
        resource_data = self._extract_resource_data(audits, load_time)

        metrics = {
            'lcp': performance_metrics['lcp'],
            'fid': performance_metrics['fid'],
            'cls': performance_metrics['cls'],
            'scores': web_vitals_scores,
            'lighthouse_score': category_scores['performance'],
            'accessibility_score': category_scores['accessibility'],
            'best_practices_score': category_scores['best_practices'],
            'seo_score': category_scores['seo'],
            'speed_index': performance_metrics['speed_index'],
            'ttfb': performance_metrics['ttfb'],
            'time_to_interactive': performance_metrics['time_to_interactive'],
            'total_blocking_time': performance_metrics['total_blocking_time'],
            'first_contentful_paint': performance_metrics['first_contentful_paint'],
            'total_byte_weight': performance_metrics['total_byte_weight'],
            'network_requests': performance_metrics['network_requests'],
            'dom_size': performance_metrics['dom_size'],
            'bootup_time': performance_metrics['bootup_time'],
            'mainthread_work': performance_metrics['mainthread_work_breakdown'],
            'optimization_scores': {
                'compress_images': performance_metrics['uses_optimized_images'],
                'next_gen_images': performance_metrics['uses_webp_images'],
                'text_compression': performance_metrics['uses_text_compression'],
                'js_optimization': performance_metrics['unused_javascript'],
                'cache_policy': performance_metrics['uses_long_cache_ttl'],
                'http2': sustainability_indicators['uses_http2']
            },
            'performance_metrics': performance_metrics,
            'sustainability_indicators': sustainability_indicators,
            'energy_metrics': {},
            'category_scores': category_scores,
            'network_stats': network_stats,
            'resource_data': resource_data,
            'load_time': load_time,
            'source': 'pagespeed-insights',
            'final_url': pagespeed_data.get('id') or lighthouse_data.get('finalUrl'),
            'fetch_time': lighthouse_data.get('fetchTime') or pagespeed_data.get('analysisUTCTimestamp'),
            'analyzer_type': 'pagespeed_insights'
        }

        logger.info('PageSpeed Insights metrics extracted for %s', metrics.get('final_url'))
        return metrics

    def _extract_resource_data(self, audits, load_time):
        resources = {
            'html': {'size_bytes': 0, 'count': 0},
            'css': {'size_bytes': 0, 'count': 0},
            'javascript': {'size_bytes': 0, 'count': 0},
            'images': {'size_bytes': 0, 'count': 0},
            'fonts': {'size_bytes': 0, 'count': 0},
            'other': {'size_bytes': 0, 'count': 0}
        }

        total_size = 0
        first_domain = None
        third_party_domains = set()

        for item in self._audit_items(audits, 'network-requests'):
            size = item.get('transferSize', 0) or 0
            resource_type = (item.get('resourceType') or item.get('mimeType') or 'other').lower()
            url = item.get('url') or ''

            if first_domain is None and url:
                first_domain = self._host_from_url(url)

            bucket = self._resource_bucket(resource_type)
            resources[bucket]['size_bytes'] += size
            resources[bucket]['count'] += 1
            total_size += size

            host = self._host_from_url(url)
            if first_domain and host and host != first_domain:
                third_party_domains.add(host)

        total_byte_weight = self._audit_numeric(audits, 'total-byte-weight')
        if total_byte_weight > total_size:
            missing_size = total_byte_weight - total_size
            resources['other']['size_bytes'] += missing_size
            resources['other']['count'] += 1
            total_size = total_byte_weight

        for resource in resources.values():
            size_bytes = resource['size_bytes']
            resource['size'] = self._format_file_size(size_bytes)
            resource['co2'] = round((size_bytes / (1024 * 1024)) * Config.CO2_PER_MB, 2)

        return {
            'resources': resources,
            'total_size': total_size,
            'load_time': load_time,
            'third_party_count': len(third_party_domains),
            'source': 'pagespeed-insights'
        }

    def _extract_network_stats(self, audits):
        network_stats = {
            'total': 0,
            'js': 0,
            'css': 0,
            'img': 0,
            'media': 0,
            'font': 0,
            'document': 0,
            'xhr': 0,
            'fetch': 0,
            'other': 0,
            'third_party': 0
        }

        items = self._audit_items(audits, 'network-requests')
        first_domain = None
        for item in items:
            size = item.get('transferSize', 0) or 0
            resource_type = (item.get('resourceType') or item.get('mimeType') or 'other').lower()
            url = item.get('url') or ''

            if first_domain is None and url:
                first_domain = self._host_from_url(url)

            key = self._resource_key(resource_type)
            network_stats['total'] += size
            network_stats[key] += size

            host = self._host_from_url(url)
            if first_domain and host and host != first_domain:
                network_stats['third_party'] += size

        return network_stats

    def _resource_key(self, resource_type):
        if 'script' in resource_type or 'javascript' in resource_type:
            return 'js'
        if 'stylesheet' in resource_type or 'css' in resource_type:
            return 'css'
        if 'image' in resource_type:
            return 'img'
        if 'font' in resource_type:
            return 'font'
        if 'media' in resource_type or 'video' in resource_type or 'audio' in resource_type:
            return 'media'
        if 'document' in resource_type:
            return 'document'
        if 'xhr' in resource_type:
            return 'xhr'
        if 'fetch' in resource_type:
            return 'fetch'
        return 'other'

    def _resource_bucket(self, resource_type):
        key = self._resource_key(resource_type)
        return {
            'js': 'javascript',
            'css': 'css',
            'img': 'images',
            'font': 'fonts',
            'document': 'html'
        }.get(key, 'other')

    def _format_file_size(self, size_bytes):
        if size_bytes >= 1024 * 1024:
            return f"{round(size_bytes / (1024 * 1024), 2)} MB"
        return f"{round(size_bytes / 1024)} KB"

    def _host_from_url(self, url):
        try:
            return urlparse(url).netloc
        except Exception:
            return None

    def _create_session(self):
        import requests

        return requests.Session()

    def _audit_numeric(self, audits, audit_id, fallback_ids=()):
        audit = audits.get(audit_id, {})
        value = audit.get('numericValue')
        if value is not None:
            return value

        for fallback_id in fallback_ids:
            value = audits.get(fallback_id, {}).get('numericValue')
            if value is not None:
                return value

        return 0

    def _audit_score(self, audits, *audit_ids):
        for audit_id in audit_ids:
            audit = audits.get(audit_id, {})
            if audit.get('score') is not None:
                return audit.get('score')
        return 1

    def _audit_items(self, audits, audit_id):
        return audits.get(audit_id, {}).get('details', {}).get('items', []) or []

    def _category_score(self, categories, category_id):
        score = categories.get(category_id, {}).get('score')
        return round((score or 0) * 100, 1)

    def calculate_web_vitals_scores(self, lcp, fid, cls):
        scores = {}

        if lcp < 2500:
            scores['lcp'] = 100
        elif lcp < 4000:
            scores['lcp'] = int(100 - (lcp - 2500) / 1500 * 50)
        else:
            scores['lcp'] = max(0, int(50 - min(50, (lcp - 4000) / 4000 * 50)))

        if fid < 100:
            scores['fid'] = 100
        elif fid < 300:
            scores['fid'] = int(100 - (fid - 100) / 200 * 50)
        else:
            scores['fid'] = max(0, int(50 - min(50, (fid - 300) / 300 * 50)))

        if cls < 0.1:
            scores['cls'] = 100
        elif cls < 0.25:
            scores['cls'] = int(100 - (cls - 0.1) / 0.15 * 50)
        else:
            scores['cls'] = max(0, int(50 - min(50, (cls - 0.25) / 0.25 * 50)))

        scores['overall'] = int((scores['lcp'] * 0.4) + (scores['fid'] * 0.3) + (scores['cls'] * 0.3))
        return scores
