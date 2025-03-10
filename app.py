"""
Main application file for the Sustainable Web Analyzer.
This file initializes and runs the Flask application.
"""

import os
import atexit
from flask import Flask, request, got_request_exception

from modules.browser_manager import BrowserManager
from routes.main import main_bp
from routes.api import api_bp
from utils.jinja_filters import register_filters
from config import config

def create_app(config_name='default'):
    """Create and configure the Flask application."""
    app = Flask(__name__, static_folder='static', template_folder='templates')
    app.config.from_object(config[config_name])

    # Register blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp, url_prefix='/api')

    # Register Jinja filters
    register_filters(app)

    # Register clean shutdown
    atexit.register(shutdown_browser)

    # Initialize browser on first request (for Flask 2.3+)
    # Note: This replaces the deprecated @app.before_first_request
    with app.app_context():
        initialize_browser()

    return app

def initialize_browser():
    """Initialize headless browser."""
    try:
        print("Initializing headless browser...")
        BrowserManager.initialize_browser()
        print("Browser initialized successfully")
    except Exception as e:
        print(f"Error initializing browser: {e}")
        # Log more details about the error

def shutdown_browser():
    """Close the browser properly when the application exits."""
    try:
        print("Shutting down headless browser...")
        BrowserManager.shutdown()
    except Exception as e:
        print(f"Error shutting down browser: {e}")

if __name__ == '__main__':
    # Get environment
    env = os.environ.get('FLASK_ENV', 'development')

    # Create app with appropriate config
    app = create_app(env)

    # Run the app
    app.run(
        host=app.config.get('HOST', '0.0.0.0'),
        port=int(app.config.get('PORT', 8080)),
        debug=app.config.get('DEBUG', False),
        use_reloader=app.config.get('USE_RELOADER', False)
    )