# Configurazione locale per Sustainable Web Analyzer
# Questa configurazione sovrascrive config.py

LIGHTHOUSE_PATH = '/opt/homebrew/bin/lighthouse'

LIGHTHOUSE_ENABLED = True

# Timeout aumentato per evitare errori su pagine complesse
BROWSER_TIMEOUT = 180  # 3 minuti
LIGHTHOUSE_TIMEOUT = 240  # 4 minuti

# Configurazione ottimizzata per evitare errori di cicli di dipendenza
LIGHTHOUSE_OPTIONS = {
    # Include tutte le categorie per l'analisi completa
    'onlyCategories': ['performance', 'accessibility', 'best-practices', 'seo'],

    # Disabilitiamo completamente il throttling per maggiore stabilità
    'throttling': {
        'cpuSlowdownMultiplier': 1,
        'requestLatencyMs': 0,
        'downloadThroughputKbps': 0,
        'uploadThroughputKbps': 0
    },

    # Simuliamo un desktop
    'formFactor': 'desktop',
    'screenEmulation': {
        'mobile': False,
        'width': 1350,
        'height': 940,
        'deviceScaleFactor': 1,
        'disabled': False
    },

    # User agent standard
    'emulatedUserAgent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',

    # Aumentiamo il timeout per il caricamento
    'maxWaitForLoad': 120000,

    # Saltiamo solo gli audit meno importanti che possono causare problemi
    'skipAudits': [
        'full-page-screenshot',
        'screenshot-thumbnails',
        'final-screenshot'
    ]
}