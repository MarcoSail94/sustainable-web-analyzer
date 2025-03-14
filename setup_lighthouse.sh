#!/bin/bash
# Script per l'installazione e configurazione di Lighthouse

echo "=== Configurazione di Lighthouse per Sustainable Web Analyzer ==="
echo ""

# Verifica se Node.js è installato
if ! command -v node &> /dev/null; then
    echo "Node.js non trovato. È necessario installare Node.js."
    echo "Visita https://nodejs.org/en/download/ per le istruzioni di installazione."
    exit 1
fi

# Verifica la versione di Node.js (minimo 14.x richiesto per Lighthouse)
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "È richiesto Node.js v14.x o successivo. Versione attuale: $(node -v)"
    echo "Aggiorna Node.js e riprova."
    exit 1
fi

echo "✅ Node.js trovato: $(node -v)"

# Verifica se npm è installato
if ! command -v npm &> /dev/null; then
    echo "npm non trovato. È necessario installare npm."
    echo "Solitamente viene installato con Node.js."
    exit 1
fi

echo "✅ npm trovato: $(npm -v)"

# Verifica se Lighthouse è già installato
LIGHTHOUSE_INSTALLED=false
if command -v lighthouse &> /dev/null; then
    echo "✅ Lighthouse è già installato: $(lighthouse --version)"
    LIGHTHOUSE_INSTALLED=true
fi

# Chiedi all'utente se desidera installare o aggiornare Lighthouse
if [ "$LIGHTHOUSE_INSTALLED" = true ]; then
    read -p "Desideri aggiornare Lighthouse all'ultima versione? (y/n): " UPGRADE_LIGHTHOUSE
    if [[ $UPGRADE_LIGHTHOUSE =~ ^[Yy]$ ]]; then
        echo "Aggiornamento di Lighthouse..."
        npm install -g lighthouse@latest
        echo "✅ Lighthouse aggiornato: $(lighthouse --version)"
    fi
else
    echo "Lighthouse non trovato."
    read -p "Desideri installare Lighthouse globalmente? (y/n): " INSTALL_LIGHTHOUSE
    if [[ $INSTALL_LIGHTHOUSE =~ ^[Yy]$ ]]; then
        echo "Installazione di Lighthouse..."
        npm install -g lighthouse

        # Verifica l'installazione
        if command -v lighthouse &> /dev/null; then
            echo "✅ Lighthouse installato: $(lighthouse --version)"
        else
            echo "❌ Installazione di Lighthouse fallita."
            echo "Prova ad eseguire manualmente: sudo npm install -g lighthouse"
            exit 1
        fi
    else
        echo "❌ Lighthouse è richiesto per l'analisi delle Core Web Vitals."
        echo "Installa Lighthouse manualmente con: npm install -g lighthouse"
        exit 1
    fi
fi

# Verifica se Chrome è installato
echo "Verifica dell'installazione di Chrome..."
if command -v google-chrome &> /dev/null; then
    echo "✅ Google Chrome trovato: $(google-chrome --version)"
elif command -v chrome &> /dev/null; then
    echo "✅ Chrome trovato: $(chrome --version)"
elif command -v chromium &> /dev/null; then
    echo "✅ Chromium trovato: $(chromium --version)"
elif [ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    echo "✅ Google Chrome trovato (macOS)"
elif [ -f "C:/Program Files/Google/Chrome/Application/chrome.exe" ]; then
    echo "✅ Google Chrome trovato (Windows)"
elif [ -f "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe" ]; then
    echo "✅ Google Chrome trovato (Windows 32-bit)"
else
    echo "⚠️ Chrome non trovato. Lighthouse potrebbe non funzionare correttamente."
    echo "Si consiglia di installare Google Chrome o Chromium."
fi

# Crea o aggiorna il file di configurazione
echo ""
echo "Aggiornamento della configurazione..."

# Trova il percorso di Lighthouse
LIGHTHOUSE_PATH=$(which lighthouse)

# Crea o modifica il file di configurazione local_config.py
CONFIG_FILE="local_config.py"

# Verifica se il file esiste
if [ -f "$CONFIG_FILE" ]; then
    # Aggiorna il file esistente
    if grep -q "LIGHTHOUSE_PATH" "$CONFIG_FILE"; then
        # Aggiorna il percorso esistente
        sed -i.bak "s|LIGHTHOUSE_PATH = .*|LIGHTHOUSE_PATH = '$LIGHTHOUSE_PATH'|g" "$CONFIG_FILE"
    else
        # Aggiungi la nuova impostazione
        echo "LIGHTHOUSE_PATH = '$LIGHTHOUSE_PATH'" >> "$CONFIG_FILE"
    fi
else
    # Crea un nuovo file di configurazione
    echo "# Configurazione locale per Sustainable Web Analyzer" > "$CONFIG_FILE"
    echo "# Questa configurazione sovrascrive config.py" >> "$CONFIG_FILE"
    echo "" >> "$CONFIG_FILE"
    echo "LIGHTHOUSE_PATH = '$LIGHTHOUSE_PATH'" >> "$CONFIG_FILE"
fi

echo "✅ Configurazione aggiornata in $CONFIG_FILE"

echo ""
echo "=== Configurazione completata ==="
echo "Ora puoi utilizzare Lighthouse per l'analisi delle Core Web Vitals"
echo "Esegui: python app.py"
echo ""