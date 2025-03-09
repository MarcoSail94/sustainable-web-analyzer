"""
Main routes for the Sustainable Web Analyzer.
Handles requests for the main pages of the application.
"""

from flask import Blueprint, render_template, current_app

# Create blueprint
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Render the main index page."""
    return render_template('index.html')

@main_bp.route('/about')
def about():
    """Render the about page."""
    return render_template('about.html')

@main_bp.route('/methodology')
def methodology():
    """Render the methodology page."""
    return render_template('methodology.html')