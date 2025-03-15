"""
API routes con integrazione Lighthouse avanzata per analisi Web Vitals completa.
"""

import time
import traceback
from flask import Blueprint, request, jsonify, current_app, g
from urllib.parse import urlparse
from datetime import datetime

from modules.resource_analyzer import ResourceAnalyzer
from modules.web_vitals_analyzer import WebVitalsAnalyzer
from modules.lighthouse_analyzer import LighthouseAnalyzer
from modules.sustainability import SustainabilityAnalyzer
from modules.economics import EconomicAnalyzer

# Importa i moduli migliorati (se disponibili)
try:
    from enhanced_modules.lighthouse_analyzer import EnhancedLighthouseAnalyzer
    from enhanced_modules.sustainability import EnhancedSustainabilityAnalyzer
    ENHANCED_MODULES_AVAILABLE = True
except ImportError:
    ENHANCED_MODULES_AVAILABLE = False
    current_app.logger.warning("Enhanced modules not available. Using standard modules only.")

from config import Config

# Create blueprint
api_bp = Blueprint('api', __name__)

def calculate_adaptive_timeout(url, resource_data=None):
    """
    Calcola un timeout adattivo basato sul dominio e sulla dimensione stimata.

    Args:
        url: URL da analizzare
        resource_data: Dati di risorse pre-analizzati (se disponibili)

    Returns:
        Timeout appropriato in secondi
    """
    from urllib.parse import urlparse
    domain = urlparse(url).netloc

    # Verifica impostazioni specifiche per dominio
    domain_settings = Config.get_domain_settings(domain)

    # Ottieni timeout specifico per il dominio o usa quello predefinito
    base_timeout = domain_settings.get('timeout', Config.BROWSER_TIMEOUT)
    lighthouse_timeout = domain_settings.get('lighthouse_timeout',
                                             getattr(Config, 'LIGHTHOUSE_TIMEOUT', base_timeout))

    # Se il timeout adattivo è abilitato e abbiamo i dati delle risorse,
    # aggiusta il timeout in base alla dimensione
    if getattr(Config, 'ADAPTIVE_TIMEOUT', False) and resource_data:
        total_size_mb = resource_data.get('total_size', 0) / (1024 * 1024)

        # Calcola il timeout aggiuntivo basato sulla dimensione
        # (TIMEOUT_PER_MB secondi aggiuntivi per ogni MB)
        size_based_timeout = getattr(Config, 'BASE_TIMEOUT', 60) + (
                total_size_mb * getattr(Config, 'TIMEOUT_PER_MB', 20))

        # Usa il timeout maggiore tra quello basato sulla dimensione e quello specifico del dominio
        adaptive_timeout = max(base_timeout, size_based_timeout)

        # Limita il timeout a un massimo ragionevole (es. 5 minuti)
        max_timeout = getattr(Config, 'MAX_TIMEOUT', 300)
        return min(adaptive_timeout, max_timeout)

    # Se non è possibile calcolare un timeout adattivo, usa il timeout del dominio
    return lighthouse_timeout

@api_bp.route('/analyze', methods=['POST'])
def analyze():
    """Analizza un URL per metriche di sostenibilità con analisi completa Lighthouse."""
    start_time = time.time()
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No JSON data provided'}), 400

        url = data.get('url')
        monthly_visits = data.get('monthly_visits', Config.DEFAULT_MONTHLY_VISITS)
        use_enhanced = data.get('use_enhanced', True) and ENHANCED_MODULES_AVAILABLE  # Usa enhanced solo se disponibile

        # Valida visite mensili
        try:
            monthly_visits = int(monthly_visits)
            if monthly_visits <= 0:
                monthly_visits = Config.DEFAULT_MONTHLY_VISITS
        except (ValueError, TypeError):
            monthly_visits = Config.DEFAULT_MONTHLY_VISITS

        if not url:
            return jsonify({'success': False, 'error': 'URL not specified'}), 400

        # Valida URL
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        # Normalizza l'URL (rimuovi slash finali)
        url = url.rstrip('/')

        # Ottieni dominio per impostazioni specifiche
        domain = urlparse(url).netloc
        domain_settings = Config.get_domain_settings(domain)

        # Imposta timeout per l'analisi iniziale (lo aggiorneremo dopo)
        initial_timeout = domain_settings.get('timeout', Config.BROWSER_TIMEOUT)
        skip_web_vitals = domain_settings.get('skip_web_vitals', False)

        # Logga i dettagli della richiesta
        current_app.logger.info(f"Analysis requested for URL: {url} (initial timeout: {initial_timeout}s, enhanced: {use_enhanced})")

        # Analizza risorse
        current_app.logger.info(f"Analyzing resources for URL: {url}")
        resource_analyzer = ResourceAnalyzer(url)
        resource_data = resource_analyzer.analyze()

        if not resource_data:
            return jsonify({'success': False, 'error': 'Resource analysis failed'}), 500

        if 'error' in resource_data:
            return jsonify({
                'success': False,
                'error': resource_data['error']
            }), 500

        # Ora che abbiamo i dati delle risorse, calcola il timeout adattivo
        adaptive_timeout = calculate_adaptive_timeout(url, resource_data)
        current_app.logger.info(f"Using adaptive timeout: {adaptive_timeout}s based on resource size")

        # Analizza Web Vitals con l'approccio migliorato o standard
        if not skip_web_vitals:
            current_app.logger.info(f"Analyzing Web Vitals for URL: {url} with enhanced={use_enhanced}, timeout={adaptive_timeout}s")

            if Config.LIGHTHOUSE_ENABLED and use_enhanced:
                try:
                    # Prova a usare l'analizzatore Lighthouse migliorato
                    enhanced_analyzer = EnhancedLighthouseAnalyzer()
                    web_vitals_data = enhanced_analyzer.measure_web_vitals(
                        url,
                        timeout=adaptive_timeout,
                        options=getattr(Config, 'LIGHTHOUSE_OPTIONS', None)
                    )
                    web_vitals_data['analyzer_type'] = 'lighthouse-enhanced'
                    current_app.logger.info("Web Vitals analyzed using Enhanced Lighthouse Analyzer")
                except Exception as e:
                    current_app.logger.warning(f"Enhanced Lighthouse analysis failed: {str(e)}")
                    current_app.logger.warning("Falling back to standard Lighthouse analyzer")

                    try:
                        # Fallback a Lighthouse standard
                        lighthouse_analyzer = LighthouseAnalyzer()
                        web_vitals_data = lighthouse_analyzer.measure_web_vitals(
                            url,
                            timeout=adaptive_timeout,
                            options=getattr(Config, 'LIGHTHOUSE_OPTIONS', None)
                        )
                        web_vitals_data['analyzer_type'] = 'lighthouse'
                        current_app.logger.info("Web Vitals analyzed using Standard Lighthouse")
                    except Exception as e2:
                        current_app.logger.warning(f"Standard Lighthouse analysis failed: {str(e2)}")
                        current_app.logger.warning("Falling back to traditional Web Vitals analyzer")

                        # Fallback all'analizzatore tradizionale
                        web_vitals_analyzer = WebVitalsAnalyzer()
                        web_vitals_data = web_vitals_analyzer.measure_web_vitals(url, timeout=adaptive_timeout)
                        web_vitals_data['analyzer_type'] = 'pyppeteer'

            elif Config.LIGHTHOUSE_ENABLED and not use_enhanced:
                # Usa Lighthouse standard se enhanced non è richiesto
                try:
                    lighthouse_analyzer = LighthouseAnalyzer()
                    web_vitals_data = lighthouse_analyzer.measure_web_vitals(
                        url,
                        timeout=adaptive_timeout,
                        options=getattr(Config, 'LIGHTHOUSE_OPTIONS', None)
                    )
                    web_vitals_data['analyzer_type'] = 'lighthouse'
                    current_app.logger.info("Web Vitals analyzed using Standard Lighthouse")
                except Exception as e:
                    current_app.logger.warning(f"Lighthouse analysis failed: {str(e)}")
                    current_app.logger.warning("Falling back to traditional Web Vitals analyzer")

                    # Fallback all'analizzatore tradizionale
                    web_vitals_analyzer = WebVitalsAnalyzer()
                    web_vitals_data = web_vitals_analyzer.measure_web_vitals(url, timeout=adaptive_timeout)
                    web_vitals_data['analyzer_type'] = 'pyppeteer'
            else:
                # Usa l'analizzatore tradizionale se Lighthouse è disabilitato
                web_vitals_analyzer = WebVitalsAnalyzer()
                web_vitals_data = web_vitals_analyzer.measure_web_vitals(url, timeout=adaptive_timeout)
                web_vitals_data['analyzer_type'] = 'pyppeteer'
        else:
            current_app.logger.info(f"Skipping Web Vitals for {domain} (configured in domain settings)")
            web_vitals_analyzer = WebVitalsAnalyzer()
            web_vitals_data = web_vitals_analyzer._fallback_values(url)
            web_vitals_data['skipped'] = True
            web_vitals_data['analyzer_type'] = 'none'

        # Calcola metriche di sostenibilità con l'analizzatore appropriato
        current_app.logger.info("Calculating sustainability metrics")
        if use_enhanced and web_vitals_data.get('analyzer_type') == 'lighthouse-enhanced' and ENHANCED_MODULES_AVAILABLE:
            # Usa l'analizzatore di sostenibilità migliorato
            sustainability_analyzer = EnhancedSustainabilityAnalyzer(
                resource_data=resource_data,
                web_vitals_data=web_vitals_data
            )
        else:
            # Usa l'analizzatore di sostenibilità standard
            sustainability_analyzer = SustainabilityAnalyzer(
                resource_data=resource_data,
                web_vitals_data=web_vitals_data
            )

        sustainability_metrics = sustainability_analyzer.calculate_metrics()

        # Genera suggerimenti di ottimizzazione
        optimizations = sustainability_analyzer.generate_optimizations()

        # Calcola benefici economici
        current_app.logger.info("Calculating economic benefits")
        economic_analyzer = EconomicAnalyzer(
            resource_data=resource_data,
            sustainability_data=sustainability_metrics,
            monthly_visits=monthly_visits
        )
        economic_benefits = economic_analyzer.calculate_benefits()
        industry_comparison = economic_analyzer.generate_comparison_data()

        # Aggiungi benefici economici alle metriche di sostenibilità
        sustainability_metrics['economic_benefits'] = economic_benefits

        # Crea struttura del report di base
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
            'analyzer_type': web_vitals_data.get('analyzer_type', 'unknown'),
            'id': int(time.time())  # Timestamp come ID semplice
        }

        # Aggiungi web vitals alle metriche
        report['metrics']['web_vitals'] = {
            'lcp': round(web_vitals_data.get('lcp', 0)/1000, 2),  # Converti in secondi
            'fid': round(web_vitals_data.get('fid', 0), 2),  # Millisecondi
            'cls': round(web_vitals_data.get('cls', 0), 3),  # Punteggio
            'scores': web_vitals_data.get('scores', {}),
            'analyzer_type': web_vitals_data.get('analyzer_type', 'unknown'),
            'is_fallback': web_vitals_data.get('is_fallback', False),
            'skipped': web_vitals_data.get('skipped', False)
        }

        # Aggiungi metriche Lighthouse standard se disponibili
        if web_vitals_data.get('analyzer_type') in ['lighthouse', 'lighthouse-enhanced']:
            report['metrics']['web_vitals']['lighthouse_score'] = web_vitals_data.get('lighthouse_score', 0)
            report['metrics']['web_vitals']['speed_index'] = web_vitals_data.get('speed_index', 0)
            report['metrics']['web_vitals']['ttfb'] = web_vitals_data.get('ttfb', 0)
            report['metrics']['web_vitals']['time_to_interactive'] = web_vitals_data.get('time_to_interactive', 0)

            # Aggiungi total blocking time se disponibile
            if 'total_blocking_time' in web_vitals_data:
                report['metrics']['web_vitals']['total_blocking_time'] = web_vitals_data.get('total_blocking_time', 0)

            # Aggiungi first contentful paint se disponibile
            if 'first_contentful_paint' in web_vitals_data:
                report['metrics']['web_vitals']['first_contentful_paint'] = web_vitals_data.get('first_contentful_paint', 0)

        # Aggiungi metriche avanzate se si utilizza Lighthouse Enhanced
        if web_vitals_data.get('analyzer_type') == 'lighthouse-enhanced':
            # Aggiungi punteggi di ottimizzazione
            if 'optimization_scores' in web_vitals_data:
                report['metrics']['optimization'] = web_vitals_data.get('optimization_scores', {})

            # Aggiungi punteggi delle categorie
            if 'category_scores' in web_vitals_data:
                report['metrics']['category_scores'] = web_vitals_data.get('category_scores', {})

            # Aggiungi metriche di performance dettagliate
            if 'performance_metrics' in web_vitals_data:
                report['metrics']['performance_details'] = web_vitals_data.get('performance_metrics', {})

            # Aggiungi metriche energetiche da sostenibilità se disponibili
            if 'energy_efficiency' in sustainability_metrics:
                report['metrics']['energy'] = sustainability_metrics.get('energy_efficiency', {})

            # Aggiungi impronta carbonica annuale se disponibile
            if 'yearly_carbon_footprint' in sustainability_metrics:
                report['metrics']['carbon_footprint'] = sustainability_metrics.get('yearly_carbon_footprint', {})

            # Aggiungi punteggio di accessibilità se disponibile
            if 'accessibility_score' in web_vitals_data:
                report['metrics']['accessibility'] = {
                    'score': web_vitals_data.get('accessibility_score', 0)
                }

        # Memorizza il report nell'oggetto g per uso successivo
        g.analysis_data = report

        # Logga il completamento con successo
        current_app.logger.info(f"Analysis completed for {url} in {report['analysis_time']}s using {web_vitals_data.get('analyzer_type', 'unknown')} analyzer")

        return jsonify(report)

    except Exception as e:
        elapsed = time.time() - start_time
        current_app.logger.error(f"Error during analysis ({elapsed:.2f}s): {str(e)}")
        current_app.logger.error(traceback.format_exc())

        return jsonify({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }), 500

@api_bp.route('/report/<string:analysis_id>', methods=['GET'])
def download_report(analysis_id):
    """Generate and download a report for an analysis."""
    # Temporarily disabled PDF generation
    return jsonify({
        'success': False,
        'error': 'PDF generation is temporarily disabled. Please try again later.',
        'message': 'This feature requires additional system libraries (libgobject-2.0-0). PDF generation will be available in a future update.'
    }), 501