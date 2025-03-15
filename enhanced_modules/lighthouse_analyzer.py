"""
Lighthouse Web Vitals Analyzer migliorato.
Estrae e analizza tutte le metriche disponibili da Lighthouse.
"""

import os
import json
import logging
import subprocess
import tempfile
from urllib.parse import urlparse
import shutil
from config import Config

# Configura logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EnhancedLighthouseAnalyzer:
    """
    Analyzer avanzato che utilizza Google Lighthouse per estrarre
    tutte le metriche di performance e accessibilità disponibili.
    """

    def __init__(self):
        """Initialize the Lighthouse analyzer."""
        # Verifica se Lighthouse CLI è installato
        self.lighthouse_path = self._find_lighthouse_binary()

    def measure_web_vitals(self, url, timeout=None, options=None):
        """
        Misura tutte le metriche possibili usando Lighthouse.

        Args:
            url: URL da analizzare
            timeout: Timeout opzionale in secondi
            options: Opzioni Lighthouse opzionali

        Returns:
            Dictionary con tutte le metriche disponibili
        """
        if timeout is None:
            timeout = Config.LIGHTHOUSE_TIMEOUT or Config.BROWSER_TIMEOUT

        logger.info(f"Measuring comprehensive metrics using Lighthouse for: {url} (timeout: {timeout}s)")

        # Pre-check the URL domain
        try:
            domain = urlparse(url).netloc
            logger.info(f"Analyzing domain: {domain}")
        except Exception as e:
            logger.warning(f"URL parsing error: {str(e)}")

        # Set default Lighthouse options with multiple categories
        lighthouse_options = {
            'onlyCategories': ['performance', 'accessibility', 'best-practices', 'seo'],
            'output': 'json',
            'quiet': True,
            'maxWaitForLoad': timeout * 1000,  # Convert to ms
            'throttling': {
                'cpuSlowdownMultiplier': 1,
                'requestLatencyMs': 0,
                'downloadThroughputKbps': 0,
                'uploadThroughputKbps': 0
            }
        }

        # Update with user options if provided
        if options and isinstance(options, dict):
            lighthouse_options.update(options)

        try:
            # Run Lighthouse and get metrics
            metrics = self._run_lighthouse(url, lighthouse_options)
            return metrics
        except Exception as e:
            logger.error(f"Lighthouse analysis failed: {str(e)}")
            return self._fallback_values(url)

    def _run_lighthouse(self, url, options):
        """
        Run Lighthouse CLI with improved timeout handling.

        Args:
            url: URL to analyze
            options: Lighthouse options

        Returns:
            Dictionary with Web Vitals metrics
        """
        if not self.lighthouse_path:
            raise EnvironmentError("Lighthouse not found. Please install it with: npm install -g lighthouse")

        # Get domain for domain-specific settings
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        domain_settings = getattr(Config, 'DOMAIN_SETTINGS', {}).get(domain, {})

        # Determine appropriate timeout
        base_timeout = getattr(Config, 'LIGHTHOUSE_TIMEOUT', 120)
        domain_timeout = domain_settings.get('lighthouse_timeout', base_timeout)

        # Add buffer for process management
        process_timeout = domain_timeout + getattr(Config, 'TIMEOUT_BUFFER', 30)

        # Create a temporary file for the Lighthouse report
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as tmp_file:
            temp_filename = tmp_file.name

        try:
            # Construct the Lighthouse command with better Chrome flags
            cmd = [
                self.lighthouse_path,
                url,
                '--output=json',
                f'--output-path={temp_filename}',
                # Improved Chrome flags for better stability and performance
                '--chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage --disable-extensions --disable-infobars"',
                '--quiet'
            ]

            # Add category
            categories = options.get('onlyCategories', ['performance'])
            category_param = f"--only-categories={','.join(categories)}"
            cmd.append(category_param)

            # Add max wait for load if specified
            if 'maxWaitForLoad' in options:
                cmd.append(f"--max-wait-for-load={options['maxWaitForLoad']}")

            # Add throttling settings if specified
            if 'throttling' in options and options['throttling'] is not None:
                throttling = options['throttling']
                cpu_slowdown = throttling.get('cpuSlowdownMultiplier', 1)
                cmd.append(f"--throttling.cpuSlowdownMultiplier={cpu_slowdown}")

                # Add network throttling settings if they exist
                if 'requestLatencyMs' in throttling:
                    cmd.append(f"--throttling.requestLatencyMs={throttling['requestLatencyMs']}")
                if 'downloadThroughputKbps' in throttling:
                    cmd.append(f"--throttling.downloadThroughputKbps={throttling['downloadThroughputKbps']}")
                if 'uploadThroughputKbps' in throttling:
                    cmd.append(f"--throttling.uploadThroughputKbps={throttling['uploadThroughputKbps']}")

            # Add form factor if specified
            if 'formFactor' in options:
                cmd.append(f"--form-factor={options['formFactor']}")

            # Skip specific audits if specified for faster analysis
            if 'skipAudits' in options and options['skipAudits']:
                skip_audits = ','.join(options['skipAudits'])
                cmd.append(f"--skip-audits={skip_audits}")

            # Log command with improved visualization
            logger.info(f"Running Lighthouse with timeout {domain_timeout}s for domain {domain}")
            logger.debug(f"Command: {' '.join(cmd)}")

            # Run Lighthouse with properly configured timeout
            process = subprocess.run(
                cmd,
                check=True,
                stderr=subprocess.PIPE,
                stdout=subprocess.PIPE,
                text=True,
                timeout=process_timeout  # Use domain-specific timeout with buffer
            )

            # Read the JSON report
            with open(temp_filename, 'r') as f:
                lighthouse_data = json.load(f)

            # Extract Web Vitals and other metrics
            return self._extract_comprehensive_metrics(lighthouse_data)

        except subprocess.TimeoutExpired as e:
            logger.error(f"Lighthouse process timed out after {process_timeout}s: {str(e)}")
            if hasattr(e, 'stderr') and e.stderr:
                logger.error(f"Stderr: {e.stderr}")
            raise RuntimeError(f"Lighthouse process timed out after {process_timeout}s")
        except subprocess.SubprocessError as e:
            logger.error(f"Lighthouse process error: {str(e)}")
            if hasattr(e, 'stderr') and e.stderr:
                logger.error(f"Stderr: {e.stderr}")
            raise RuntimeError(f"Lighthouse process failed: {str(e)}")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Lighthouse JSON: {str(e)}")
            raise RuntimeError(f"Invalid Lighthouse JSON output: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during Lighthouse analysis: {str(e)}")
            raise
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_filename):
                try:
                    os.unlink(temp_filename)
                except Exception as e:
                    logger.warning(f"Failed to delete temporary file {temp_filename}: {str(e)}")

    def _extract_comprehensive_metrics(self, lighthouse_data):
        """
        Estrae TUTTE le metriche disponibili dal rapporto Lighthouse.

        Args:
            lighthouse_data: I dati del rapporto JSON di Lighthouse

        Returns:
            Dictionary con tutte le metriche disponibili
        """
        try:
            # Get the audits section
            audits = lighthouse_data.get('audits', {})
            categories = lighthouse_data.get('categories', {})

            # Extract Core Web Vitals
            lcp_audit = audits.get('largest-contentful-paint', {})
            fid_audit = audits.get('max-potential-fid', {})
            cls_audit = audits.get('cumulative-layout-shift', {})

            # Convert to milliseconds if needed
            lcp_value = lcp_audit.get('numericValue', 0)
            fid_value = fid_audit.get('numericValue', 0)
            cls_value = cls_audit.get('numericValue', 0)

            # Calculate Web Vitals scores
            web_vitals_scores = self.calculate_web_vitals_scores(lcp_value, fid_value, cls_value)

            # Extract network statistics
            network_stats = self._extract_network_stats(lighthouse_data)

            # Extract all important performance metrics
            performance_metrics = {
                # Core Web Vitals
                'lcp': round(lcp_value, 2),  # Largest Contentful Paint
                'fid': round(fid_value, 2),  # First Input Delay (proxy)
                'cls': round(cls_value, 3),  # Cumulative Layout Shift

                # Other important performance metrics
                'speed_index': round(audits.get('speed-index', {}).get('numericValue', 0), 2),
                'ttfb': round(audits.get('server-response-time', {}).get('numericValue', 0), 2),
                'time_to_interactive': round(audits.get('interactive', {}).get('numericValue', 0), 2),
                'total_blocking_time': round(audits.get('total-blocking-time', {}).get('numericValue', 0), 2),
                'first_contentful_paint': round(audits.get('first-contentful-paint', {}).get('numericValue', 0), 2),
                'first_meaningful_paint': round(audits.get('first-meaningful-paint', {}).get('numericValue', 0), 2),

                # Resource efficiency metrics
                'render_blocking_resources': len(audits.get('render-blocking-resources', {}).get('details', {}).get('items', [])),
                'uses_responsive_images': audits.get('uses-responsive-images', {}).get('score', 1),
                'offscreen_images': audits.get('offscreen-images', {}).get('score', 1),
                'uses_optimized_images': audits.get('uses-optimized-images', {}).get('score', 1),
                'uses_webp_images': audits.get('uses-webp-images', {}).get('score', 1),
                'uses_text_compression': audits.get('uses-text-compression', {}).get('score', 1),
                'uses_rel_preconnect': audits.get('uses-rel-preconnect', {}).get('score', 1),
                'efficient_animated_content': audits.get('efficient-animated-content', {}).get('score', 1),

                # JavaScript metrics
                'bootup_time': round(audits.get('bootup-time', {}).get('numericValue', 0), 2),
                'mainthread_work_breakdown': round(audits.get('mainthread-work-breakdown', {}).get('numericValue', 0), 2),
                'third_party_summary': len(audits.get('third-party-summary', {}).get('details', {}).get('items', [])),
                'unused_javascript': audits.get('unused-javascript', {}).get('score', 1),

                # Network metrics
                'network_requests': len(audits.get('network-requests', {}).get('details', {}).get('items', [])),
                'network_rtt': round(audits.get('network-rtt', {}).get('numericValue', 0), 2),
                'network_server_latency': round(audits.get('network-server-latency', {}).get('numericValue', 0), 2),
                'total_byte_weight': round(audits.get('total-byte-weight', {}).get('numericValue', 0), 2),
                'uses_long_cache_ttl': audits.get('uses-long-cache-ttl', {}).get('score', 1),

                # Energy efficiency indicators
                'dom_size': audits.get('dom-size', {}).get('numericValue', 0),
                'duplicated_javascript': audits.get('duplicated-javascript', {}).get('score', 1),
                'legacy_javascript': audits.get('legacy-javascript', {}).get('score', 1),
            }

            # Domain-specific metrics for sustainability
            sustainability_indicators = {
                'font_display': audits.get('font-display', {}).get('score', 1),
                'preload_lcp_image': audits.get('preload-lcp-image', {}).get('score', 1),
                'unsized_images': audits.get('unsized-images', {}).get('score', 1),
                'non_composited_animations': audits.get('non-composited-animations', {}).get('score', 1),
                'image_size_responsive': audits.get('image-size-responsive', {}).get('score', 1),
                'uses_http2': audits.get('uses-http2', {}).get('score', 1),
            }

            # Get category scores
            category_scores = {
                'performance': round(categories.get('performance', {}).get('score', 0) * 100, 1),
                'accessibility': round(categories.get('accessibility', {}).get('score', 0) * 100, 1),
                'best_practices': round(categories.get('best-practices', {}).get('score', 0) * 100, 1),
                'seo': round(categories.get('seo', {}).get('score', 0) * 100, 1),
            }

            # Extract detailed energy consumption metrics
            energy_metrics = {}
            try:
                # This is an experimental metric and might not be available in all Lighthouse versions
                energy_audit = audits.get('energy-efficiency', {})
                if energy_audit:
                    energy_metrics = {
                        'energy_efficiency_score': energy_audit.get('score', 0.5),
                        'energy_details': energy_audit.get('details', {})
                    }
            except:
                pass

            # Estimate approximate load time (using Time to Interactive)
            load_time = round(performance_metrics['time_to_interactive'] / 1000, 2)  # Convert to seconds

            # Create the enhanced metrics object
            enhanced_metrics = {
                # Core Web Vitals and scores
                'lcp': performance_metrics['lcp'],
                'fid': performance_metrics['fid'],
                'cls': performance_metrics['cls'],
                'scores': web_vitals_scores,

                # Standard lighthouse scores
                'lighthouse_score': category_scores['performance'],
                'accessibility_score': category_scores['accessibility'],
                'best_practices_score': category_scores['best_practices'],
                'seo_score': category_scores['seo'],

                # Key performance metrics
                'speed_index': performance_metrics['speed_index'],
                'ttfb': performance_metrics['ttfb'],
                'time_to_interactive': performance_metrics['time_to_interactive'],
                'total_blocking_time': performance_metrics['total_blocking_time'],
                'first_contentful_paint': performance_metrics['first_contentful_paint'],

                # Resource metrics
                'total_byte_weight': performance_metrics['total_byte_weight'],
                'network_requests': performance_metrics['network_requests'],
                'dom_size': performance_metrics['dom_size'],

                # JS metrics
                'bootup_time': performance_metrics['bootup_time'],
                'mainthread_work': performance_metrics['mainthread_work_breakdown'],

                # Optimization scores
                'optimization_scores': {
                    'compress_images': performance_metrics['uses_optimized_images'],
                    'next_gen_images': performance_metrics['uses_webp_images'],
                    'text_compression': performance_metrics['uses_text_compression'],
                    'js_optimization': performance_metrics['unused_javascript'],
                    'cache_policy': performance_metrics['uses_long_cache_ttl'],
                    'http2': sustainability_indicators['uses_http2'],
                },

                # Full performance metrics
                'performance_metrics': performance_metrics,

                # Sustainability indicators
                'sustainability_indicators': sustainability_indicators,

                # Energy metrics
                'energy_metrics': energy_metrics,

                # Category scores
                'category_scores': category_scores,

                # Network statistics
                'network_stats': network_stats,

                # Load time and report time
                'load_time': load_time,
                'analyzer_type': 'lighthouse-enhanced'
            }

            return enhanced_metrics

        except Exception as e:
            logger.error(f"Error extracting metrics from Lighthouse data: {str(e)}")
            raise RuntimeError(f"Failed to extract metrics: {str(e)}")

    def _extract_network_stats(self, lighthouse_data):
        """
        Extract detailed network statistics from Lighthouse data.

        Args:
            lighthouse_data: The Lighthouse JSON report data

        Returns:
            Dictionary of network stats with detailed breakdown
        """
        try:
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

            # Extract network details from the audit
            network_requests = lighthouse_data.get('audits', {}).get('network-requests', {})
            items = network_requests.get('details', {}).get('items', [])

            # Get main document domain to identify third-party resources
            main_document = None
            for item in items:
                if item.get('resourceType') == 'Document' and not main_document:
                    main_document = urlparse(item.get('url', '')).netloc
                    break

            # Count domains for third-party analysis
            domains = set()
            third_party_domains = set()

            for item in items:
                resource_size = item.get('transferSize', 0)
                resource_type = item.get('resourceType', 'other').lower()

                # Get domain for third-party detection
                item_url = item.get('url', '')
                item_domain = urlparse(item_url).netloc if item_url else None

                if item_domain:
                    domains.add(item_domain)
                    if main_document and item_domain != main_document and not item_domain.endswith(main_document.split('www.')[-1]):
                        third_party_domains.add(item_domain)
                        network_stats['third_party'] += resource_size

                # Update total size
                network_stats['total'] += resource_size

                # Update specific type size
                if resource_type in ['script', 'javascript']:
                    network_stats['js'] += resource_size
                elif resource_type in ['stylesheet', 'css']:
                    network_stats['css'] += resource_size
                elif resource_type in ['image', 'img']:
                    network_stats['img'] += resource_size
                elif resource_type in ['media']:
                    network_stats['media'] += resource_size
                elif resource_type in ['font']:
                    network_stats['font'] += resource_size
                elif resource_type in ['document']:
                    network_stats['document'] += resource_size
                elif resource_type in ['xhr']:
                    network_stats['xhr'] += resource_size
                elif resource_type in ['fetch']:
                    network_stats['fetch'] += resource_size
                else:
                    network_stats['other'] += resource_size

            # Add metadata
            network_stats['domain_count'] = len(domains)
            network_stats['third_party_domains'] = len(third_party_domains)
            network_stats['third_party_percent'] = round((network_stats['third_party'] / max(1, network_stats['total'])) * 100, 1)

            return network_stats
        except Exception as e:
            logger.warning(f"Error extracting network stats: {str(e)}")
            return {
                'total': 0,
                'js': 0,
                'css': 0,
                'img': 0,
                'font': 0,
                'other': 0
            }

    def _find_lighthouse_binary(self):
        """
        Find the Lighthouse binary in the system.

        Returns:
            Path to the Lighthouse binary or None if not found
        """
        # Check if we have a custom path in config
        custom_path = getattr(Config, 'LIGHTHOUSE_PATH', None)
        if custom_path and os.path.exists(custom_path):
            return custom_path

        # Try to find 'lighthouse' in PATH
        lighthouse_path = shutil.which('lighthouse')
        if lighthouse_path:
            return lighthouse_path

        # Try common locations
        common_paths = [
            '/usr/local/bin/lighthouse',
            '/usr/bin/lighthouse',
            # Windows paths with Node.js installation
            'C:\\Program Files\\nodejs\\lighthouse',
            'C:\\Program Files (x86)\\nodejs\\lighthouse',
            # NPM global paths
            os.path.expanduser('~/.npm-global/bin/lighthouse'),
            os.path.expanduser('~/npm/bin/lighthouse'),
            os.path.expanduser('~/node_modules/.bin/lighthouse')
        ]

        for path in common_paths:
            if os.path.exists(path):
                return path

        logger.warning("Lighthouse binary not found. Ensure it's installed with 'npm install -g lighthouse'")
        return None

    def _fallback_values(self, url):
        """Generate comprehensive fallback values when measurement fails."""
        logger.warning(f"Using fallback values for metrics for {url}")

        # Web Vitals fallbacks
        web_vitals = {
            'lcp': 3000,  # 3 seconds
            'fid': 150,   # 150 ms
            'cls': 0.15,  # 0.15
            'scores': self.calculate_web_vitals_scores(3000, 150, 0.15),
        }

        # Performance metrics fallbacks
        performance_metrics = {
            'speed_index': 4500,
            'ttfb': 600,
            'time_to_interactive': 5000,
            'total_blocking_time': 350,
            'first_contentful_paint': 2000,
            'first_meaningful_paint': 2500,
            'bootup_time': 1500,
            'mainthread_work': 2500,
            'total_byte_weight': 2500000,
            'network_requests': 50,
            'dom_size': 800,
        }

        # Optimization scores fallbacks (all medium)
        optimization_scores = {
            'compress_images': 0.5,
            'next_gen_images': 0.5,
            'text_compression': 0.5,
            'js_optimization': 0.5,
            'cache_policy': 0.5,
            'http2': 0.5,
        }

        # Category scores fallbacks (all medium)
        category_scores = {
            'performance': 50,
            'accessibility': 50,
            'best_practices': 50,
            'seo': 50,
        }

        return {
            # Core Web Vitals
            'lcp': web_vitals['lcp'],
            'fid': web_vitals['fid'],
            'cls': web_vitals['cls'],
            'scores': web_vitals['scores'],

            # Standard lighthouse scores
            'lighthouse_score': category_scores['performance'],
            'accessibility_score': category_scores['accessibility'],
            'best_practices_score': category_scores['best_practices'],
            'seo_score': category_scores['seo'],

            # Key performance metrics
            'speed_index': performance_metrics['speed_index'],
            'ttfb': performance_metrics['ttfb'],
            'time_to_interactive': performance_metrics['time_to_interactive'],
            'total_blocking_time': performance_metrics['total_blocking_time'],
            'first_contentful_paint': performance_metrics['first_contentful_paint'],

            # Resource metrics
            'total_byte_weight': performance_metrics['total_byte_weight'],
            'network_requests': performance_metrics['network_requests'],
            'dom_size': performance_metrics['dom_size'],

            # JS metrics
            'bootup_time': performance_metrics['bootup_time'],
            'mainthread_work': performance_metrics['mainthread_work'],

            # Optimization scores
            'optimization_scores': optimization_scores,

            # Full performance metrics
            'performance_metrics': performance_metrics,

            # Category scores
            'category_scores': category_scores,

            # Network statistics
            'network_stats': {
                'total': 0,
                'js': 0,
                'css': 0,
                'img': 0,
                'font': 0,
                'other': 0
            },

            # Load time and report time
            'load_time': 5.0,  # 5 seconds
            'analyzer_type': 'lighthouse-enhanced',
            'is_fallback': True
        }

    def calculate_web_vitals_scores(self, lcp, fid, cls):
        """
        Calculate scores for each metric according to Google's guidelines:
        - LCP: Good < 2.5s, Needs Improvement < 4s, Poor >= 4s
        - FID: Good < 100ms, Needs Improvement < 300ms, Poor >= 300ms
        - CLS: Good < 0.1, Needs Improvement < 0.25, Poor >= 0.25
        """
        scores = {}

        # LCP Score (Largest Contentful Paint)
        if lcp < 2500:  # 2.5 seconds
            scores['lcp'] = 100
        elif lcp < 4000:  # 4 seconds
            # Scale from 100 to 50 in the range 2.5s-4s
            scores['lcp'] = int(100 - (lcp - 2500) / 1500 * 50)
        else:
            # Scale from 50 to 0 for values above 4s, with minimum 0
            scores['lcp'] = max(0, int(50 - min(50, (lcp - 4000) / 4000 * 50)))

        # FID Score (First Input Delay)
        if fid < 100:  # 100 milliseconds
            scores['fid'] = 100
        elif fid < 300:  # 300 milliseconds
            # Scale from 100 to 50 in the range 100ms-300ms
            scores['fid'] = int(100 - (fid - 100) / 200 * 50)
        else:
            # Scale from 50 to 0 for values above 300ms, with minimum 0
            scores['fid'] = max(0, int(50 - min(50, (fid - 300) / 300 * 50)))

        # CLS Score (Cumulative Layout Shift)
        if cls < 0.1:
            scores['cls'] = 100
        elif cls < 0.25:
            # Scale from 100 to 50 in the range 0.1-0.25
            scores['cls'] = int(100 - (cls - 0.1) / 0.15 * 50)
        else:
            # Scale from 50 to 0 for values above 0.25, with minimum 0
            scores['cls'] = max(0, int(50 - min(50, (cls - 0.25) / 0.25 * 50)))

        # Overall Web Vitals score (weighted average)
        scores['overall'] = int((scores['lcp'] * 0.4) + (scores['fid'] * 0.3) + (scores['cls'] * 0.3))

        return scores