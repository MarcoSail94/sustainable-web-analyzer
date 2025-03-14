# Configurazione locale per Sustainable Web Analyzer
# Questa configurazione sovrascrive config.py

# Il percorso di Lighthouse sarà aggiornato dallo script setup_lighthouse.sh
LIGHTHOUSE_PATH = '/opt/homebrew/bin/lighthouse'

# Abilita l'uso di Lighthouse per l'analisi delle Core Web Vitals
LIGHTHOUSE_ENABLED = True

# Opzioni avanzate per Lighthouse - personalizzale in base alle tue esigenze
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