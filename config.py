"""
Configuration settings with domain-specific timeouts and handling.
"""

import os

class Config:
    """Base configuration."""

    # Application settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-please-change-in-production')
    HOST = '0.0.0.0'
    PORT = int(os.environ.get('PORT', 8080))

    # Browser settings
    BROWSER_TIMEOUT = 45  # seconds - increased from 30

    # Requests settings
    REQUEST_RETRIES = 3
    REQUEST_BACKOFF_FACTOR = 0.5

    # Concurrency settings
    MAX_WORKERS = 10  # Maximum concurrent resource fetch workers

    # Analysis settings
    DEFAULT_MONTHLY_VISITS = 10000
    CO2_PER_MB = 0.2  # g CO2 per MB transferred

    # Economic analysis parameters
    BANDWIDTH_COST_PER_GB = 0.015  # € per GB
    ENERGY_COST_PER_KWH = 0.20  # € per kWh
    ENERGY_CONSUMPTION_PER_MB = 0.0002  # kWh per MB
    AVERAGE_CONVERSION_VALUE = 25  # € per conversion
    AVERAGE_CONVERSION_RATE = 0.018  # 1.8% conversion rate
    HOURLY_DEV_RATE = 45  # € per hour for development work

    # Logging configuration
    LOG_LEVEL = 'INFO'
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_FILE = 'logs/app.log'
    LOG_MAX_SIZE = 10 * 1024 * 1024  # 10 MB
    LOG_BACKUP_COUNT = 5

    # Domain-specific settings
    # For sites with known issues, use different strategies or shorter timeouts
    DOMAIN_SETTINGS = {
        # Format: 'domain': {'timeout': seconds, 'skip_web_vitals': boolean}
        'tgcom.com': {'timeout': 20, 'skip_web_vitals': True} # Known to time out frequently
    }

    # Impostazioni Lighthouse
    LIGHTHOUSE_ENABLED = True
    LIGHTHOUSE_PATH = None  # Sarà rilevato automaticamente o impostato da local_config.py
    LIGHTHOUSE_TIMEOUT = 60  # Timeout in secondi per l'analisi Lighthouse

    # Opzioni avanzate per Lighthouse
    LIGHTHOUSE_OPTIONS = {
        'onlyCategories': ['performance'],
        'throttling': {
            'cpuSlowdownMultiplier': 1,
            'requestLatencyMs': 0,
            'downloadThroughputKbps': 0,
            'uploadThroughputKbps': 0
        },
        'formFactor': 'desktop'  # Può essere 'mobile' o 'desktop'
    }

    @classmethod
    def get_domain_settings(cls, domain):
        """
        Get settings for a specific domain.

        Args:
            domain: Domain name

        Returns:
            Dictionary of domain-specific settings, or default values
        """
        # Strip www prefix for lookup
        lookup_domain = domain.replace('www.', '')

        # Check for exact match
        if lookup_domain in cls.DOMAIN_SETTINGS:
            return cls.DOMAIN_SETTINGS[lookup_domain]

        # Check for subdomain match
        for known_domain, settings in cls.DOMAIN_SETTINGS.items():
            if lookup_domain.endswith('.' + known_domain):
                return settings

        # Default settings
        return {
            'timeout': cls.BROWSER_TIMEOUT,
            'skip_web_vitals': False
        }

    # Carica configurazioni locali se disponibili
    @classmethod
    def load_local_config(cls):
        try:
            import local_config
            for attr in dir(local_config):
                if not attr.startswith('__'):
                    setattr(cls, attr, getattr(local_config, attr))
            return True
        except ImportError:
            return False

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    USE_RELOADER = False  # Disable reloader to prevent browser process duplication
    LOG_LEVEL = 'DEBUG'

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DEBUG = True
    USE_RELOADER = False
    BROWSER_TIMEOUT = 15  # Lower timeout for testing

    # Use in-memory simulated data for tests
    SIMULATE_WEB_VITALS = True

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    USE_RELOADER = False
    BROWSER_TIMEOUT = 60  # Higher timeout for production

    # In production, get secret key from environment
    SECRET_KEY = os.environ.get('SECRET_KEY')

    # Production should use HTTPS
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True

    # More resource fetch workers in production
    MAX_WORKERS = 20

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

# Carica configurazioni locali
Config.load_local_config()