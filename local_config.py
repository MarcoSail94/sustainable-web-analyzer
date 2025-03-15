# Configurazione locale per Sustainable Web Analyzer
# Questa configurazione sovrascrive config.py

# Il percorso di Lighthouse sarà aggiornato dallo script setup_lighthouse.sh
LIGHTHOUSE_PATH = '/opt/homebrew/bin/lighthouse'

# Abilita l'uso di Lighthouse per l'analisi delle Core Web Vitals
LIGHTHOUSE_ENABLED = True

# Opzioni avanzate per Lighthouse - personalizzale in base alle tue esigenze
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
        'mobile': False,           # Deve essere False quando formFactor è desktop
        'width': 1350,             # Larghezza desktop tipica
        'height': 940,             # Altezza desktop tipica
        'deviceScaleFactor': 1,    # Fattore di scala per desktop
        'disabled': False          # Mantieni attiva l'emulazione
    },
    'emulatedUserAgent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36', # User agent desktop
    'maxWaitForLoad': 120000,      # 2 minuti massimo attesa caricamento (in ms)
    'skipAudits': [                # Salta audit non essenziali per accelerare
        'full-page-screenshot',
        'screenshot-thumbnails',
        'final-screenshot',
        'third-party-summary'
    ]
}