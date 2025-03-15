# Configurazione locale per Sustainable Web Analyzer
# Questa configurazione sovrascrive config.py

LIGHTHOUSE_PATH = '/opt/homebrew/bin/lighthouse'

LIGHTHOUSE_ENABLED = True

# Timeout aumentato per evitare errori su pagine complesse
BROWSER_TIMEOUT = 120  # 2 minuti
LIGHTHOUSE_TIMEOUT = 180  # 3 minuti

# Configurazione ottimizzata per evitare errori di cicli di dipendenza
LIGHTHOUSE_OPTIONS = {
    # Limitiamo le categorie solo alla performance per velocizzare l'analisi
    'onlyCategories': ['performance'],

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

    # Saltiamo gli audit che possono causare problemi
    'skipAudits': [
        'full-page-screenshot',
        'screenshot-thumbnails',
        'final-screenshot',
        'third-party-summary',
        'largest-contentful-paint-element',  # Può causare problemi su alcuni siti
        'layout-shifts',  # Può causare problemi di ciclo
        'network-requests',  # Riduce la complessità
        'network-server-latency',  # Riduce la complessità
        'mainthread-work-breakdown',  # Può causare timeout
        'bootup-time'  # Può causare timeout
    ],

    # Opzioni aggiuntive per migliorare la stabilità
    'gathererTimeoutMs': 60000,  # Timeout di 60s per i gatherer
    'pauseAfterFcpMs': 1000,     # Pausa dopo FCP per stabilizzare
    'pauseAfterLoadMs': 1000,    # Pausa dopo il caricamento
    'debugNavigation': False,    # Disabilita debug
    'onlyAudits': None,          # Non limitare gli audit specifici
    'disableStorageReset': True  # Non resettare lo storage (più stabile)
}