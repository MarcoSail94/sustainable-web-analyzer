"""
API route unificata con pipeline di analisi intelligente e gestione trasparente dei dati mancanti.
"""

import time
import traceback
from flask import Blueprint, request, jsonify, current_app
from urllib.parse import urlparse
from datetime import datetime

from modules.resource_analyzer import ResourceAnalyzer
from modules.web_vitals_analyzer import WebVitalsAnalyzer
from modules.sustainability import SustainabilityAnalyzer
from modules.economics import EconomicAnalyzer

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
        current_app.logger.warning("Lighthouse modules not available. Using basic analyzer only.")
    elif not ENHANCED_AVAILABLE:
        current_app.logger.warning("Enhanced modules not available. Using standard Lighthouse.")

from config import Config

# Create blueprint
api_bp = Blueprint('api', __name__)

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
        except (ValueError, TypeError):
            monthly_visits = Config.DEFAULT_MONTHLY_VISITS

        if not url:
            return jsonify({'success': False, 'error': 'URL not specified'}), 400

        # Valida URL
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        # Normalizza l'URL
        url = url.rstrip('/')

        # Ottieni dominio e impostazioni
        domain = urlparse(url).netloc
        domain_settings = Config.get_domain_settings(domain)
        skip_web_vitals = domain_settings.get('skip_web_vitals', False)

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

        # Step 1: Analisi delle risorse (sempre richiesta)
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
        adaptive_timeout = calculate_adaptive_timeout(url, resource_data)
        current_app.logger.info(f"Using adaptive timeout: {adaptive_timeout}s")

        # Step 3: Analisi Web Vitals (con pipeline di analizzatori)
        if not skip_web_vitals:
            current_app.logger.info(f"Starting Web Vitals analysis for URL: {url}")

            # Pipeline di analisi Web Vitals: Enhanced → Standard → Basic
            analyzers_to_try = []

            # Determina quali analizzatori sono disponibili
            if ENHANCED_AVAILABLE:
                analyzers_to_try.append(('enhanced_lighthouse', EnhancedLighthouseAnalyzer()))
            if LIGHTHOUSE_AVAILABLE:
                analyzers_to_try.append(('standard_lighthouse', LighthouseAnalyzer()))
            analyzers_to_try.append(('basic', WebVitalsAnalyzer()))

            # Tenta l'analisi con ogni analizzatore disponibile
            for analyzer_type, analyzer in analyzers_to_try:
                metrics_availability['analyzers_tried'].append(analyzer_type)

                try:
                    current_app.logger.info(f"Trying {analyzer_type} analyzer")
                    if analyzer_type.endswith('lighthouse'):
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

        # Step 4: Calcola metriche di sostenibilità con l'analizzatore appropriato
        current_app.logger.info("Calculating sustainability metrics")

        if ENHANCED_AVAILABLE and web_vitals_data.get('analyzer_type') == 'enhanced_lighthouse':
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
            if web_vitals_data.get('analyzer_type') in ['enhanced_lighthouse', 'standard_lighthouse']:
                report['metrics']['web_vitals']['lighthouse_score'] = web_vitals_data.get('lighthouse_score', None)
                report['metrics']['web_vitals']['speed_index'] = web_vitals_data.get('speed_index', None)
                report['metrics']['web_vitals']['ttfb'] = web_vitals_data.get('ttfb', None)
                report['metrics']['web_vitals']['time_to_interactive'] = web_vitals_data.get('time_to_interactive', None)

                # Aggiungi altre metriche se disponibili (senza valori di default)
                for metric in ['total_blocking_time', 'first_contentful_paint']:
                    if metric in web_vitals_data:
                        report['metrics']['web_vitals'][metric] = web_vitals_data.get(metric)

            # Aggiungi metriche avanzate se si utilizza Lighthouse Enhanced
            if web_vitals_data.get('analyzer_type') == 'enhanced_lighthouse':
                current_app.logger.info("Usato l'analizzatore Lighthouse Enhanced")

                # Verifica la presenza delle metriche avanzate
                has_optimization_scores = 'optimization_scores' in web_vitals_data
                has_category_scores = 'category_scores' in web_vitals_data
                has_energy_metrics = 'energy_metrics' in web_vitals_data

                current_app.logger.info(f"Disponibilità metriche avanzate: optimization_scores={has_optimization_scores}, "
                                        f"category_scores={has_category_scores}, energy_metrics={has_energy_metrics}")

                # Se questi dati sono presenti, log i loro valori
                if has_category_scores:
                    current_app.logger.info(f"Punteggi categorie: {web_vitals_data['category_scores']}")

                # Aggiungi punteggi di ottimizzazione se disponibili
                if has_optimization_scores:
                    current_app.logger.info(f"Optimization scores: {web_vitals_data['optimization_scores']}")
                    report['metrics']['optimization'] = web_vitals_data.get('optimization_scores')

                # Logga anche i dati Web Vitals
                current_app.logger.info(f"Web Vitals: LCP={web_vitals_data.get('lcp')}, FID={web_vitals_data.get('fid')}, CLS={web_vitals_data.get('cls')}")

                # Logga i punteggi Web Vitals
                if 'scores' in web_vitals_data:
                    current_app.logger.info(f"Web Vitals Scores: {web_vitals_data['scores']}")

           # if web_vitals_data.get('analyzer_type') == 'enhanced_lighthouse':
           #     # Aggiungi punteggi di ottimizzazione se disponibili
           #     if 'optimization_scores' in web_vitals_data:
           #         report['metrics']['optimization'] = web_vitals_data.get('optimization_scores')

           #     # Aggiungi punteggi delle categorie se disponibili
           #     if 'category_scores' in web_vitals_data:
           #         report['metrics']['category_scores'] = web_vitals_data.get('category_scores')

           #     # Aggiungi metriche di performance dettagliate se disponibili
           #     if 'performance_metrics' in web_vitals_data:
           #         report['metrics']['performance_details'] = web_vitals_data.get('performance_metrics')

           #     # Aggiungi metriche energetiche se disponibili
           #     if 'energy_efficiency' in sustainability_metrics:
           #         report['metrics']['energy'] = sustainability_metrics.get('energy_efficiency')

           #     # Aggiungi impronta carbonica annuale se disponibile
           #     if 'yearly_carbon_footprint' in sustainability_metrics:
           #         report['metrics']['carbon_footprint'] = sustainability_metrics.get('yearly_carbon_footprint')

           #     # Aggiungi punteggio di accessibilità se disponibile
           #     if 'accessibility_score' in web_vitals_data:
           #         report['metrics']['accessibility'] = {
           #             'score': web_vitals_data.get('accessibility_score')
           #         }
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