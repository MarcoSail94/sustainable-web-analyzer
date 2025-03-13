"""
API routes with domain-specific settings and improved error handling.
"""

import time
import traceback
from flask import Blueprint, request, jsonify, current_app, g
from urllib.parse import urlparse
from datetime import datetime

from modules.resource_analyzer import ResourceAnalyzer
from modules.web_vitals_analyzer import WebVitalsAnalyzer
from modules.sustainability import SustainabilityAnalyzer
from modules.economics import EconomicAnalyzer
from config import Config

# Create blueprint
api_bp = Blueprint('api', __name__)

@api_bp.route('/analyze', methods=['POST'])
def analyze():
    """Analyze a URL for sustainability metrics."""
    start_time = time.time()
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No JSON data provided'}), 400

        url = data.get('url')
        monthly_visits = data.get('monthly_visits', Config.DEFAULT_MONTHLY_VISITS)

        # Validate monthly visits
        try:
            monthly_visits = int(monthly_visits)
            if monthly_visits <= 0:
                monthly_visits = Config.DEFAULT_MONTHLY_VISITS
        except (ValueError, TypeError):
            monthly_visits = Config.DEFAULT_MONTHLY_VISITS

        if not url:
            return jsonify({'success': False, 'error': 'URL not specified'}), 400

        # Validate URL
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        # Normalize the URL (remove trailing slashes)
        url = url.rstrip('/')

        # Get domain for specific settings
        domain = urlparse(url).netloc
        domain_settings = Config.get_domain_settings(domain)

        # Set timeout for analysis
        analysis_timeout = domain_settings.get('timeout', Config.BROWSER_TIMEOUT)
        skip_web_vitals = domain_settings.get('skip_web_vitals', False)

        # Log the request details
        current_app.logger.info(f"Analysis requested for URL: {url} (timeout: {analysis_timeout}s)")

        # Analyze resources
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

        # Analyze Web Vitals if not skipped for this domain
        if not skip_web_vitals:
            current_app.logger.info(f"Analyzing Web Vitals for URL: {url}")
            web_vitals_analyzer = WebVitalsAnalyzer()
            web_vitals_data = web_vitals_analyzer.measure_web_vitals(url, timeout=analysis_timeout)
        else:
            current_app.logger.info(f"Skipping Web Vitals for {domain} (configured in domain settings)")
            web_vitals_analyzer = WebVitalsAnalyzer()
            web_vitals_data = web_vitals_analyzer._fallback_values(url)
            web_vitals_data['skipped'] = True

        # Calculate sustainability metrics
        current_app.logger.info("Calculating sustainability metrics")
        sustainability_analyzer = SustainabilityAnalyzer(
            resource_data=resource_data,
            web_vitals_data=web_vitals_data
        )
        sustainability_metrics = sustainability_analyzer.calculate_metrics()

        # Generate optimization suggestions
        optimizations = sustainability_analyzer.generate_optimizations()

        # Calculate economic benefits
        current_app.logger.info("Calculating economic benefits")
        economic_analyzer = EconomicAnalyzer(
            resource_data=resource_data,
            sustainability_data=sustainability_metrics,
            monthly_visits=monthly_visits
        )
        economic_benefits = economic_analyzer.calculate_benefits()
        industry_comparison = economic_analyzer.generate_comparison_data()

        # Add economic benefits to sustainability metrics
        sustainability_metrics['economic_benefits'] = economic_benefits

        # Create full report
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
                'timeout': analysis_timeout,
                'skip_web_vitals': skip_web_vitals
            },
            'id': int(time.time())  # Timestamp as a simple ID
        }

        # Add web vitals to metrics
        report['metrics']['web_vitals'] = {
            'lcp': round(web_vitals_data.get('lcp', 0)/1000, 2),  # Convert to seconds
            'fid': round(web_vitals_data.get('fid', 0), 2),  # Milliseconds
            'cls': round(web_vitals_data.get('cls', 0), 3),  # Score
            'scores': web_vitals_data.get('scores', {}),
            'is_fallback': web_vitals_data.get('is_fallback', False),
            'skipped': web_vitals_data.get('skipped', False)
        }

        # Store the report in the g object for later use
        g.analysis_data = report

        # Log successful completion
        current_app.logger.info(f"Analysis completed for {url} in {report['analysis_time']}s")

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