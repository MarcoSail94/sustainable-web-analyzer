"""
API routes for the Sustainable Web Analyzer.
Handles requests for page analysis and returns structured results.
"""

from flask import Blueprint, request, jsonify, current_app
from urllib.parse import urlparse

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
    try:
        data = request.get_json()
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

        # Analyze resources
        current_app.logger.info(f"Analyzing resources for URL: {url}")
        resource_analyzer = ResourceAnalyzer(url)
        resource_data = resource_analyzer.analyze()

        if 'error' in resource_data:
            return jsonify({
                'success': False,
                'error': resource_data['error']
            }), 500

        # Analyze Web Vitals
        current_app.logger.info(f"Analyzing Web Vitals for URL: {url}")
        web_vitals_analyzer = WebVitalsAnalyzer()
        web_vitals_data = web_vitals_analyzer.measure_web_vitals(url)

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
        domain = urlparse(url).netloc
        report = {
            'success': True,
            'url': url,
            'domain': domain,
            'metrics': sustainability_metrics,
            'resources': resource_data['resources'],
            'optimizations': optimizations,
            'industry_comparison': industry_comparison
        }

        # Add web vitals to metrics
        report['metrics']['web_vitals'] = {
            'lcp': round(web_vitals_data.get('lcp', 0)/1000, 2),  # Convert to seconds
            'fid': round(web_vitals_data.get('fid', 0), 2),  # Milliseconds
            'cls': round(web_vitals_data.get('cls', 0), 3),  # Score
            'scores': web_vitals_data.get('scores', {})
        }

        return jsonify(report)

    except Exception as e:
        current_app.logger.error(f"Error during analysis: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500