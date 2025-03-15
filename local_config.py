# Configurazione locale per Sustainable Web Analyzer
# Questa configurazione sovrascrive config.py

LIGHTHOUSE_PATH = '/opt/homebrew/bin/lighthouse'

LIGHTHOUSE_ENABLED = True

LIGHTHOUSE_OPTIONS = {
    'onlyCategories': ['performance', 'accessibility', 'best-practices', 'seo'],
    'throttling': {
        'cpuSlowdownMultiplier': 1,
        'requestLatencyMs': 0,
        'downloadThroughputKbps': 0,
        'uploadThroughputKbps': 0
    },
    'formFactor': 'desktop',
    'screenEmulation': {
        'mobile': False,
        'width': 1350,
        'height': 940,
        'deviceScaleFactor': 1,
        'disabled': False
    },
    'emulatedUserAgent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36', # User agent desktop
    'maxWaitForLoad': 120000,
    'skipAudits': [
        'full-page-screenshot',
        'screenshot-thumbnails',
        'final-screenshot',
        'third-party-summary'
    ]
}