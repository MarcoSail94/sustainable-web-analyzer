"""
API route unificata con pipeline di analisi intelligente e gestione trasparente dei dati mancanti.
"""

import time
import traceback
import logging
import requests
from flask import Blueprint, request, jsonify, current_app
from urllib.parse import urlparse

from modules.resource_analyzer import ResourceAnalyzer
from modules.pagespeed_insights_analyzer import PageSpeedInsightsAnalyzer
from modules.web_vitals_analyzer import WebVitalsAnalyzer
from modules.sustainability import SustainabilityAnalyzer
from modules.economics import EconomicAnalyzer
from utils.url_validation import UnsafeUrlError, normalize_and_validate_url

logger = logging.getLogger(__name__)

# Importa i moduli avanzati (se disponibili)
try:
    from enhanced_modules.lighthouse_analyzer import EnhancedLighthouseAnalyzer
    from modules.lighthouse_analyzer import LighthouseAnalyzer
    from enhanced_modules.sustainability import EnhancedSustainabilityAnalyzer
    LIGHTHOUSE_AVAILABLE = True
    ENHANCED_AVAILABLE = True
except ImportError:
    try:
        from modules.lighthouse_analyzer import LighthouseAnalyzer
        LIGHTHOUSE_AVAILABLE = True
        ENHANCED_AVAILABLE = False
    except ImportError:
        LIGHTHOUSE_AVAILABLE = False
        ENHANCED_AVAILABLE = False

    if not LIGHTHOUSE_AVAILABLE:
        logger.warning("Lighthouse modules not available. Using basic analyzer only.")
    elif not ENHANCED_AVAILABLE:
        logger.warning("Enhanced modules not available. Using standard Lighthouse.")

from config import Config

# Create blueprint
api_bp = Blueprint('api', __name__)

@api_bp.route('/health', methods=['GET'])
def health():
    """Health check endpoint for hosting platforms."""
    return jsonify({
        'success': True,
        'status': 'ok',
        'analysis_provider': Config.ANALYSIS_PROVIDER,
        'analysis_worker_configured': bool(Config.ANALYSIS_WORKER_URL),
        'inline_analysis_enabled': Config.INLINE_ANALYSIS_ENABLED,
        'pagespeed_configured': bool(Config.PAGESPEED_API_KEY),
        'lighthouse_enabled': Config.LIGHTHOUSE_ENABLED,
        'browser_analysis_enabled': Config.BROWSER_ANALYSIS_ENABLED
    })

def proxy_analysis_to_worker(url, monthly_visits):
    """Forward an analysis request to the dedicated Lighthouse worker."""
    endpoint = Config.ANALYSIS_WORKER_URL.rstrip('/')
    if not endpoint.endswith('/api/analyze'):
        endpoint = endpoint + '/api/analyze'

    headers = {'Content-Type': 'application/json'}
    if Config.ANALYSIS_WORKER_TOKEN:
        headers['Authorization'] = f'Bearer {Config.ANALYSIS_WORKER_TOKEN}'

    response = requests.post(
        endpoint,
        json={'url': url, 'monthly_visits': monthly_visits},
        headers=headers,
        timeout=Config.WORKER_REQUEST_TIMEOUT
    )

    try:
        payload = response.json()
    except ValueError:
        current_app.logger.error(
            'Analysis worker returned a non-JSON response: %s',
            response.text[:500]
        )
        return jsonify({
            'success': False,
            'error': 'Analysis worker returned an invalid response'
        }), 502

    return jsonify(payload), response.status_code

def require_analysis_auth():
    """Require a shared bearer token when this app is deployed as a worker."""
    if not Config.REQUIRE_ANALYSIS_AUTH:
        return None

    expected = Config.ANALYSIS_WORKER_TOKEN
    provided = request.headers.get('Authorization', '')
    if not expected or provided != f'Bearer {expected}':
        return jsonify({
            'success': False,
            'error': 'Unauthorized analysis request'
        }), 401

    return None

def calculate_adaptive_timeout(url, resource_data=None):
    """
    Calcola un timeout adattivo basato sul dominio e sulla dimensione stimata.
    """
    domain = urlparse(url).netloc
    domain_settings = Config.get_domain_settings(domain)
    base_timeout = domain_settings.get('timeout', Config.BROWSER_TIMEOUT)

    if getattr(Config, 'ADAPTIVE_TIMEOUT', False) and resource_data:
        total_size_mb = resource_data.get('total_size', 0) / (1024 * 1024)
        size_based_timeout = getattr(Config, 'BASE_TIMEOUT', 60) + (
                total_size_mb * getattr(Config, 'TIMEOUT_PER_MB', 20))
        adaptive_timeout = max(base_timeout, size_based_timeout)
        max_timeout = getattr(Config, 'MAX_TIMEOUT', 300)
        return min(adaptive_timeout, max_timeout)

    return base_timeout

@api_bp.route('/analyze', methods=['POST'])
def analyze():
    """
    Endpoint unificato per l'analisi del sito web.
    Utilizza una pipeline di analisi intelligente che prova analizzatori in ordine di capacità.
    """
    start_time = time.time()
    try:
        auth_error = require_analysis_auth()
        if auth_error:
            return auth_error

        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No JSON data provided'}), 400

        url = data.get('url')
        monthly_visits = data.get('monthly_visits', Config.DEFAULT_MONTHLY_VISITS)

        # Valida visite mensili
        try:
            monthly_visits = int(monthly_visits)
            if monthly_visits <= 0:
                monthly_visits = Config.DEFAULT_MONTHLY_VISITS
            monthly_visits = min(monthly_visits, Config.MAX_MONTHLY_VISITS)
        except (ValueError, TypeError):
            monthly_visits = Config.DEFAULT_MONTHLY_VISITS

        if not url:
            return jsonify({'success': False, 'error': 'URL not specified'}), 400

        try:
            url = normalize_and_validate_url(url)
        except UnsafeUrlError as e:
            return jsonify({'success': False, 'error': str(e)}), 400

        if Config.ANALYSIS_PROVIDER == 'worker':
            if not Config.ANALYSIS_WORKER_URL:
                return jsonify({
                    'success': False,
                    'error': 'Analysis worker is not configured for this deployment',
                    'error_type': 'WorkerNotConfigured'
                }), 503

            try:
                return proxy_analysis_to_worker(url, monthly_visits)
            except requests.RequestException as e:
                current_app.logger.error(f"Analysis worker request failed: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': 'Analysis worker is unavailable',
                    'error_type': type(e).__name__
                }), 502

        if not Config.INLINE_ANALYSIS_ENABLED and Config.ANALYSIS_PROVIDER != 'pagespeed':
            return jsonify({
                'success': False,
                'error': 'Inline analysis is disabled for this deployment',
                'error_type': 'InlineAnalysisDisabled'
            }), 503

        # Ottieni dominio e impostazioni
        domain = urlparse(url).netloc
        domain_settings = Config.get_domain_settings(domain)
        skip_web_vitals = domain_settings.get('skip_web_vitals', False)
        if Config.ANALYSIS_PROVIDER == 'pagespeed':
            skip_web_vitals = False

        # Metadati sulla disponibilità delle metriche
        metrics_availability = {
            'resources': 'unknown',  # Sarà "available" o "error"
            'web_vitals': 'unknown',  # Sarà "available", "unavailable", "partial" o "error"
            'sustainability': 'unknown',  # Sarà "basic", "standard" o "enhanced"
            'economics': 'unknown',  # Sarà "basic", "standard" o "enhanced"
            'analyzers_tried': []  # Lista degli analizzatori tentati
        }

        # Inizializza contenitori per dati e errori
        resource_data = None
        web_vitals_data = None
        resource_error = None
        web_vitals_error = None

        # Step 1: Analisi delle risorse.
        # Con PageSpeed, il breakdown arriva dal risultato Lighthouse e non serve
        # fare crawling locale delle risorse dalla funzione Vercel.
        if Config.ANALYSIS_PROVIDER == 'pagespeed':
            metrics_availability['resources'] = 'pending_pagespeed'
            current_app.logger.info("Skipping local resource crawl; using PageSpeed network data")
        else:
            current_app.logger.info(f"Analyzing resources for URL: {url}")
            try:
                resource_analyzer = ResourceAnalyzer(url)
                resource_data = resource_analyzer.analyze()

                if not resource_data:
                    resource_error = "Resource analysis failed without specific error"
                    metrics_availability['resources'] = 'error'
                elif 'error' in resource_data:
                    resource_error = resource_data['error']
                    metrics_availability['resources'] = 'error'
                else:
                    metrics_availability['resources'] = 'available'
            except Exception as e:
                resource_error = str(e)
                metrics_availability['resources'] = 'error'
                current_app.logger.error(f"Error in resource analysis: {str(e)}")

            # Se l'analisi delle risorse fallisce completamente, fornisci un errore
            if metrics_availability['resources'] == 'error':
                return jsonify({
                    'success': False,
                    'error': f"Resource analysis failed: {resource_error}",
                    'metrics_availability': metrics_availability
                }), 500

        # Step 2: Calcola timeout adattivo per Web Vitals
        if Config.ANALYSIS_PROVIDER == 'pagespeed':
            adaptive_timeout = Config.PAGESPEED_TIMEOUT
        else:
            adaptive_timeout = calculate_adaptive_timeout(url, resource_data)
        current_app.logger.info(f"Using adaptive timeout: {adaptive_timeout}s")

        # Step 3: Analisi Web Vitals (con pipeline di analizzatori)
        if not skip_web_vitals:
            current_app.logger.info(f"Starting Web Vitals analysis for URL: {url}")

            # Pipeline di analisi Web Vitals: Enhanced → Standard → Basic
            analyzers_to_try = []

            # Determina quali analizzatori sono disponibili
            if Config.ANALYSIS_PROVIDER == 'pagespeed':
                analyzers_to_try.append(('pagespeed_insights', PageSpeedInsightsAnalyzer()))
            elif Config.LIGHTHOUSE_ENABLED and ENHANCED_AVAILABLE:
                analyzers_to_try.append(('enhanced_lighthouse', EnhancedLighthouseAnalyzer()))
                if LIGHTHOUSE_AVAILABLE:
                    analyzers_to_try.append(('standard_lighthouse', LighthouseAnalyzer()))
                if Config.BROWSER_ANALYSIS_ENABLED:
                    analyzers_to_try.append(('basic', WebVitalsAnalyzer()))
            else:
                if Config.LIGHTHOUSE_ENABLED and LIGHTHOUSE_AVAILABLE:
                    analyzers_to_try.append(('standard_lighthouse', LighthouseAnalyzer()))
                if Config.BROWSER_ANALYSIS_ENABLED:
                    analyzers_to_try.append(('basic', WebVitalsAnalyzer()))

            if not analyzers_to_try:
                metrics_availability['web_vitals'] = 'skipped'
                web_vitals_data = {
                    'analyzer_type': 'none',
                    'skipped': True,
                    'reason': 'Web Vitals analyzers disabled for this runtime'
                }
            else:
                # Tenta l'analisi con ogni analizzatore disponibile
                for analyzer_type, analyzer in analyzers_to_try:
                    metrics_availability['analyzers_tried'].append(analyzer_type)

                    try:
                        current_app.logger.info(f"Trying {analyzer_type} analyzer")
                        if analyzer_type.endswith('lighthouse') or analyzer_type == 'pagespeed_insights':
                            web_vitals_data = analyzer.measure_web_vitals(
                                url,
                                timeout=adaptive_timeout,
                                options=getattr(Config, 'LIGHTHOUSE_OPTIONS', None)
                            )
                        else:
                            web_vitals_data = analyzer.measure_web_vitals(url, timeout=adaptive_timeout)

                        # Aggiungi informazioni sul tipo di analizzatore utilizzato
                        web_vitals_data['analyzer_type'] = analyzer_type

                        # Verifica se sono presenti valori di fallback
                        if web_vitals_data.get('is_fallback', False):
                            metrics_availability['web_vitals'] = 'partial'
                            current_app.logger.warning(f"Partial data from {analyzer_type} (fallback values used)")
                        else:
                            metrics_availability['web_vitals'] = 'available'
                            current_app.logger.info(f"Complete data from {analyzer_type}")

                        # Analisi riuscita, esci dal ciclo
                        break

                    except Exception as e:
                        current_app.logger.warning(f"Error with {analyzer_type} analyzer: {str(e)}")
                        web_vitals_error = f"{analyzer_type} analysis failed: {str(e)}"
                        # Continua con il prossimo analizzatore

            # Se tutti gli analizzatori falliscono
            if web_vitals_data is None:
                metrics_availability['web_vitals'] = 'unavailable'
                current_app.logger.error(f"All Web Vitals analyzers failed: {web_vitals_error}")
                # Creiamo una struttura vuota per web_vitals, non valori fittizi
                web_vitals_data = {
                    'analyzer_type': 'none',
                    'unavailable': True,
                    'error': web_vitals_error
                }
        else:
            # Web Vitals analisi saltata per config
            metrics_availability['web_vitals'] = 'skipped'
            web_vitals_data = {
                'analyzer_type': 'none',
                'skipped': True
            }

        if Config.ANALYSIS_PROVIDER == 'pagespeed':
            resource_data = web_vitals_data.get('resource_data')
            if resource_data:
                metrics_availability['resources'] = 'available'
            else:
                metrics_availability['resources'] = 'error'
                return jsonify({
                    'success': False,
                    'error': web_vitals_data.get('error') or 'PageSpeed Insights analysis failed',
                    'metrics_availability': metrics_availability
                }), 502

        # Step 4: Calcola metriche di sostenibilità con l'analizzatore appropriato
        current_app.logger.info("Calculating sustainability metrics")

        enhanced_analyzer_types = ['enhanced_lighthouse', 'pagespeed_insights']
        if ENHANCED_AVAILABLE and web_vitals_data.get('analyzer_type') in enhanced_analyzer_types:
            # Usa l'analizzatore di sostenibilità migliorato
            sustainability_analyzer = EnhancedSustainabilityAnalyzer(
                resource_data=resource_data,
                web_vitals_data=web_vitals_data
            )
            metrics_availability['sustainability'] = 'enhanced'
        else:
            # Usa l'analizzatore di sostenibilità standard
            sustainability_analyzer = SustainabilityAnalyzer(
                resource_data=resource_data,
                web_vitals_data=web_vitals_data
            )

            if metrics_availability['web_vitals'] in ['available', 'partial']:
                metrics_availability['sustainability'] = 'standard'
            else:
                metrics_availability['sustainability'] = 'basic'

        # Calcola i dati di sostenibilità disponibili con i dati che abbiamo
        sustainability_metrics = sustainability_analyzer.calculate_metrics()

        # Step 5: Genera suggerimenti di ottimizzazione con i dati disponibili
        optimizations = sustainability_analyzer.generate_optimizations()

        # Step 6: Calcola benefici economici basati sui dati disponibili
        current_app.logger.info("Calculating economic benefits")
        economic_analyzer = EconomicAnalyzer(
            resource_data=resource_data,
            sustainability_data=sustainability_metrics,
            monthly_visits=monthly_visits
        )
        economic_benefits = economic_analyzer.calculate_benefits()
        industry_comparison = economic_analyzer.generate_comparison_data()
        current_app.logger.info(f"Industry comparison data generated: {industry_comparison}")


        # Determina la qualità dei dati economici
        if metrics_availability['sustainability'] == 'enhanced':
            metrics_availability['economics'] = 'enhanced'
        elif metrics_availability['sustainability'] == 'standard':
            metrics_availability['economics'] = 'standard'
        else:
            metrics_availability['economics'] = 'basic'

        # Aggiungi benefici economici alle metriche di sostenibilità
        sustainability_metrics['economic_benefits'] = economic_benefits

        # Step 7: Crea la risposta finale
        report = {
            'success': True,
            'url': url,
            'domain': domain,
            'metrics': sustainability_metrics,
            'resources': resource_data['resources'],
            'optimizations': optimizations,
            'industry_comparison': industry_comparison,
            'analysis_time': round(time.time() - start_time, 2),
            'domain_settings': {
                'timeout': adaptive_timeout,
                'skip_web_vitals': skip_web_vitals
            },
            'analysis_provider': Config.ANALYSIS_PROVIDER,
            'metrics_availability': metrics_availability,
            'id': int(time.time())  # Timestamp come ID semplice
        }

        # Step 8: Aggiungi web vitals alle metriche
        if metrics_availability['web_vitals'] in ['available', 'partial']:
            # Abbiamo dati reali o parziali
            report['metrics']['web_vitals'] = {
                'lcp': round(web_vitals_data.get('lcp', 0)/1000, 2),  # Converti in secondi
                'fid': round(web_vitals_data.get('fid', 0), 2),  # Millisecondi
                'cls': round(web_vitals_data.get('cls', 0), 3),  # Punteggio
                'scores': web_vitals_data.get('scores', {}),
                'analyzer_type': web_vitals_data.get('analyzer_type', 'unknown'),
                'is_fallback': web_vitals_data.get('is_fallback', False),
                'is_partial': metrics_availability['web_vitals'] == 'partial'
            }

            # Aggiungi metriche Lighthouse standard se disponibili
            if web_vitals_data.get('analyzer_type') in ['enhanced_lighthouse', 'standard_lighthouse', 'pagespeed_insights']:
                report['metrics']['web_vitals']['lighthouse_score'] = web_vitals_data.get('lighthouse_score', None)
                report['metrics']['web_vitals']['speed_index'] = web_vitals_data.get('speed_index', None)
                report['metrics']['web_vitals']['ttfb'] = web_vitals_data.get('ttfb', None)
                report['metrics']['web_vitals']['time_to_interactive'] = web_vitals_data.get('time_to_interactive', None)

                # Aggiungi altre metriche se disponibili (senza valori di default)
                for metric in ['total_blocking_time', 'first_contentful_paint']:
                    if metric in web_vitals_data:
                        report['metrics']['web_vitals'][metric] = web_vitals_data.get(metric)

            # Aggiungi metriche avanzate se si utilizza Lighthouse Enhanced
            if web_vitals_data.get('analyzer_type') in ['enhanced_lighthouse', 'pagespeed_insights']:
                current_app.logger.info("Aggiunta metriche avanzate al livello corretto")

                # Calcola la dimensione in MB per le metriche energetiche
                total_mb = resource_data.get('total_size', 0) / (1024 * 1024)

                # 1. Aggiungi punteggi categorie
                if 'category_scores' in web_vitals_data:
                    report['metrics']['category_scores'] = web_vitals_data['category_scores']
                    current_app.logger.info(f"Aggiunti category_scores al top level: {web_vitals_data['category_scores']}")

                # 2. Aggiungi punteggi di ottimizzazione
                if 'optimization_scores' in web_vitals_data:
                    report['metrics']['optimization'] = web_vitals_data['optimization_scores']
                    current_app.logger.info(f"Aggiunti optimization_scores al top level: {web_vitals_data['optimization_scores']}")

                    # 3. Crea metriche di efficienza energetica dai punteggi di ottimizzazione
                    optimization_scores = web_vitals_data['optimization_scores']
                    # Calcolo ponderato dei fattori che influenzano l'efficienza energetica
                    energy_efficiency_score = (
                                                      (optimization_scores.get('compress_images', 0.5) * 0.2) +
                                                      (optimization_scores.get('next_gen_images', 0.5) * 0.2) +
                                                      (optimization_scores.get('text_compression', 0.5) * 0.1) +
                                                      (optimization_scores.get('js_optimization', 0.5) * 0.3) +
                                                      (optimization_scores.get('cache_policy', 0.5) * 0.1) +
                                                      (optimization_scores.get('http2', 0.5) * 0.1)
                                              ) * 100

                    # Converti optimization_scores da valori 0-1 a percentuali 0-100 per il frontend
                    optimization_impacts = {
                        key: round(value * 100)
                        for key, value in optimization_scores.items()
                    }

                    report['metrics']['energy_efficiency'] = {
                        'score': round(energy_efficiency_score, 1),
                        'estimated_kwh_per_view': round(total_mb * Config.ENERGY_CONSUMPTION_PER_MB, 6),
                        'estimated_yearly_kwh': round(total_mb * Config.ENERGY_CONSUMPTION_PER_MB * monthly_visits * 12, 2),
                        'optimization_impacts': optimization_impacts
                    }
                    current_app.logger.info(f"Aggiunta energy_efficiency al top level con score: {energy_efficiency_score:.1f}")

                # 4. Aggiungi metriche di accessibilità
                if 'accessibility_score' in web_vitals_data:
                    report['metrics']['accessibility'] = {
                        'score': web_vitals_data['accessibility_score'],
                        'sustainability_impact': 'Migliore accessibilità riduce il consumo energetico permettendo agli utenti di completare le azioni più velocemente'
                    }
                    current_app.logger.info(f"Aggiunta accessibility al top level con score: {web_vitals_data['accessibility_score']}")

                # 5. Aggiungi impronta carbonica annuale
                co2_per_view = report['metrics']['co2_emissions']
                yearly_co2_kg = round((co2_per_view / 1000) * monthly_visits * 12, 2)
                yearly_trees = round(yearly_co2_kg / 21, 1)  # Un albero assorbe circa 21 kg di CO2 all'anno

                report['metrics']['yearly_carbon_footprint'] = {
                    'kg_co2': yearly_co2_kg,
                    'equivalent_trees': yearly_trees,
                    'comparison': {
                        'car_km': round(yearly_co2_kg / 0.12, 1),  # 0.12 kg CO2 per km
                        'smartphone_charges': round(yearly_co2_kg / 0.005, 0),  # 5g CO2 per carica
                    }
                }
                current_app.logger.info(f"Aggiunta yearly_carbon_footprint al top level con kg_co2: {yearly_co2_kg}")

                # 6. Aggiungi metriche di performance dettagliate
                if 'performance_metrics' in web_vitals_data:
                    report['metrics']['performance_details'] = {
                        key: value for key, value in web_vitals_data['performance_metrics'].items()
                        if key not in ['lcp', 'fid', 'cls']  # Evita duplicazione di metriche già incluse
                    }
                    current_app.logger.info("Aggiunti performance_details al top level")
        else:
            # Nessun dato Web Vitals disponibile - comunica chiaramente l'indisponibilità
            report['metrics']['web_vitals'] = {
                'unavailable': True,
                'reason': 'unavailable' if metrics_availability['web_vitals'] == 'unavailable' else 'skipped',
                'analyzer_type': web_vitals_data.get('analyzer_type', 'none')
            }

            if web_vitals_error:
                report['metrics']['web_vitals']['error'] = web_vitals_error

        # Logga il completamento con successo
        current_app.logger.info(f"Report contains industry_comparison: {'industry_comparison' in report}")
        current_app.logger.info(f"Analysis completed for {url} in {report['analysis_time']}s using {metrics_availability}")

        return jsonify(report)

    except Exception as e:
        elapsed = time.time() - start_time
        current_app.logger.error(f"Error during analysis ({elapsed:.2f}s): {str(e)}")
        current_app.logger.error(traceback.format_exc())

        return jsonify({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__,
            'metrics_availability': metrics_availability if 'metrics_availability' in locals() else {'error': 'global_error'}
        }), 500
