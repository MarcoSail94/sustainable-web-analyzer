"""
Configuration settings with domain-specific timeouts and handling.
"""

import os

def env_bool(name, default=False):
    """Read a boolean value from the environment."""
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in ('1', 'true', 'yes', 'on')

class Config:
    """Base configuration."""

    # Application settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-please-change-in-production')
    HOST = '0.0.0.0'
    PORT = int(os.environ.get('PORT', 8080))
    IS_VERCEL = env_bool('VERCEL', False)
    ANALYSIS_WORKER_URL = os.environ.get('ANALYSIS_WORKER_URL')
    ANALYSIS_WORKER_TOKEN = os.environ.get('ANALYSIS_WORKER_TOKEN')
    REQUIRE_ANALYSIS_AUTH = env_bool('REQUIRE_ANALYSIS_AUTH', False)
    WORKER_REQUEST_TIMEOUT = int(os.environ.get('WORKER_REQUEST_TIMEOUT', 290))
    INLINE_ANALYSIS_ENABLED = env_bool('INLINE_ANALYSIS_ENABLED', not IS_VERCEL)
    ANALYSIS_PROVIDER = os.environ.get(
        'ANALYSIS_PROVIDER',
        'pagespeed' if IS_VERCEL else 'local'
    )
    PAGESPEED_API_KEY = os.environ.get('PAGESPEED_API_KEY')
    PAGESPEED_STRATEGY = os.environ.get('PAGESPEED_STRATEGY', 'desktop')
    PAGESPEED_LOCALE = os.environ.get('PAGESPEED_LOCALE', 'it')
    PAGESPEED_TIMEOUT = int(os.environ.get('PAGESPEED_TIMEOUT', 120))

    # Browser settings
    BROWSER_TIMEOUT = 90  # Aumentato da 45 secondi a 90 secondi


    # Requests settings
    REQUEST_RETRIES = 3
    REQUEST_BACKOFF_FACTOR = 0.5

    # Concurrency settings
    MAX_WORKERS = 10  # Maximum concurrent resource fetch workers

    # Analysis settings
    DEFAULT_MONTHLY_VISITS = 10000
    MAX_MONTHLY_VISITS = int(os.environ.get('MAX_MONTHLY_VISITS', 10000000))
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
        'italiaonline.it': {'timeout': 180, 'lighthouse_timeout': 240, 'skip_web_vitals': False},
        'repubblica.it': {'timeout': 120, 'lighthouse_timeout': 180, 'skip_web_vitals': False},
        'corriere.it': {'timeout': 120, 'lighthouse_timeout': 180, 'skip_web_vitals': False},
        'tgcom.com': {'timeout': 120, 'lighthouse_timeout': 180, 'skip_web_vitals': False}
        # Aggiungi altri domini problematici secondo necessità
    }

    # Impostazioni Lighthouse
    LIGHTHOUSE_ENABLED = env_bool('LIGHTHOUSE_ENABLED', True)
    BROWSER_ANALYSIS_ENABLED = env_bool('BROWSER_ANALYSIS_ENABLED', True)
    LIGHTHOUSE_PATH = None  # Sarà rilevato automaticamente o impostato da local_config.py
    LIGHTHOUSE_TIMEOUT = 180  # Timeout specifico per Lighthouse (3 minuti)
    RESOURCE_FETCH_TIMEOUT = 45  # Timeout per il fetch delle singole risorse

    # Timeout adattivo basato sulla dimensione stimata della pagina
    ADAPTIVE_TIMEOUT = True  # Abilita il timeout adattivo
    BASE_TIMEOUT = 60  # Timeout base in secondi
    TIMEOUT_PER_MB = 20  # Secondi aggiuntivi per MB di dati

    # Opzioni avanzate per Lighthouse
    LIGHTHOUSE_OPTIONS = {
        'onlyCategories': ['performance', 'accessibility', 'best-practices', 'seo'],
        'throttling': {
            'cpuSlowdownMultiplier': 1,  # No CPU throttling
            'requestLatencyMs': 0,       # No network latency throttling
            'downloadThroughputKbps': 0, # No download throttling
            'uploadThroughputKbps': 0    # No upload throttling
        },
        'formFactor': 'desktop',         # Analisi desktop
        'maxWaitForLoad': 120000,        # 2 minuti massimo attesa caricamento (in ms)
        'skipAudits': [                  # Salta audit non essenziali per accelerare
            'full-page-screenshot',
            'screenshot-thumbnails',
            'final-screenshot',
            'third-party-summary'
        ]
    }
    # Buffer di sicurezza per evitare che il processo termini proprio mentre sta per completare
    TIMEOUT_BUFFER = 30  # Secondi aggiuntivi di buffer


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
        if os.environ.get('FLASK_ENV') == 'production' or cls.IS_VERCEL:
            return False

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

    @classmethod
    def init_app(cls):
        if not cls.SECRET_KEY:
            raise RuntimeError('SECRET_KEY must be set in production')

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

# Carica configurazioni locali
Config.load_local_config()
