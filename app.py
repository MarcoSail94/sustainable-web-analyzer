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

    # Register clean shutdown handler
    atexit.register(BrowserManager.shutdown)

    # Configure logging for the app
    if not app.debug:
        import logging
        from logging.handlers import RotatingFileHandler

        # Create logs directory if it doesn't exist
        if not os.path.exists('logs'):
            os.mkdir('logs')

        # Set up file handler for error logs
        file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Sustainable Web Analyzer startup')

    return app

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