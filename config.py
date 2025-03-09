"""
Configuration settings for the application.
Different configurations for development, testing, and production environments.
"""

import os

class Config:
    """Base configuration."""

    # Application settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-please-change-in-production')
    HOST = '0.0.0.0'
    PORT = int(os.environ.get('PORT', 8080))

    # Browser settings
    BROWSER_TIMEOUT = 30  # seconds

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

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    USE_RELOADER = False  # Disable reloader to prevent browser process duplication

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DEBUG = True
    USE_RELOADER = False

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    USE_RELOADER = False

    # In production, get secret key from environment
    SECRET_KEY = os.environ.get('SECRET_KEY')

    # Production should use HTTPS
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}