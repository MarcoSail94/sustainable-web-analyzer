/**
 * Utility per la formattazione dei dati
 */

/**
 * Formatta una dimensione in byte in una stringa leggibile
 * @param {number} sizeBytes - Dimensione in byte
 * @returns {string} - Dimensione formattata (e.g., "1.23 MB", "456 KB")
 */
export function formatFileSize(sizeBytes) {
    if (sizeBytes >= 1024 * 1024) {
        return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
    } else if (sizeBytes >= 1024) {
        return `${Math.round(sizeBytes / 1024)} KB`;
    } else {
        return `${sizeBytes} B`;
    }
}

/**
 * Formatta un valore come valuta
 * @param {number} value - Valore da formattare
 * @param {string} currency - Simbolo valuta (default: '€')
 * @param {number} decimals - Numero di decimali (default: 2)
 * @returns {string} - Stringa formattata come valuta
 */
export function formatCurrency(value, currency = '€', decimals = 2) {
    return `${currency}${value.toFixed(decimals)}`;
}

/**
 * Formatta un valore come percentuale
 * @param {number} value - Valore da formattare (0-100 o 0-1)
 * @param {number} decimals - Numero di decimali (default: 0)
 * @returns {string} - Stringa formattata come percentuale
 */
export function formatPercent(value, decimals = 0) {
    // Gestisce sia range 0-100 che 0-1
    if (value < 0) {
        value = 0;
    } else if (value <= 1 && decimals === 0) {
        value = value * 100;
    } else if (value > 100) {
        value = 100;
    }

    return `${value.toFixed(decimals)}%`;
}

/**
 * Formatta un tempo in secondi in una stringa leggibile
 * @param {number} seconds - Tempo in secondi
 * @param {boolean} milliseconds - Se includere i millisecondi (default: false)
 * @returns {string} - Stringa tempo formattata
 */
export function formatTime(seconds, milliseconds = false) {
    if (milliseconds) {
        return `${seconds.toFixed(2)}s`;
    } else {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (minutes > 0) {
            return `${minutes}m ${Math.round(secs)}s`;
        } else {
            return `${secs.toFixed(1)}s`;
        }
    }
}

/**
 * Formatta le emissioni di CO2 in grammi in una stringa leggibile
 * @param {number} grams - Emissioni di CO2 in grammi
 * @returns {string} - Stringa CO2 formattata
 */
export function formatCO2(grams) {
    if (grams >= 1000) {
        return `${(grams/1000).toFixed(2)} kg CO₂`;
    } else {
        return `${grams.toFixed(2)} g CO₂`;
    }
}

/**
 * Ottiene una descrizione del punteggio di sostenibilità
 * @param {number} score - Punteggio di sostenibilità (0-100)
 * @returns {string} - Descrizione del punteggio
 */
export function getSustainabilityScoreDescription(score) {
    if (score >= 80) {
        return "Eccellente - Il tuo sito è molto efficiente";
    } else if (score >= 70) {
        return "Buono - Il tuo sito è efficiente ma ha margini di miglioramento";
    } else if (score >= 50) {
        return "Discreto - Il tuo sito necessita di ottimizzazione";
    } else if (score >= 30) {
        return "Insufficiente - Il tuo sito richiede miglioramenti significativi";
    } else {
        return "Critico - Il tuo sito necessita di ottimizzazione urgente";
    }
}

/**
 * Ottiene lo stato di una metrica Web Vital
 * @param {string} metric - Nome della metrica ('lcp', 'fid', o 'cls')
 * @param {number} value - Valore della metrica
 * @returns {Object} - Stato della metrica {class, text}
 */
export function getWebVitalStatus(metric, value) {
    if (metric === 'lcp') {  // Largest Contentful Paint (secondi)
        if (value < 2.5) {
            return { class: 'status-good', text: 'Buono' };
        } else if (value < 4.0) {
            return { class: 'status-needs-improvement', text: 'Migliorabile' };
        } else {
            return { class: 'status-poor', text: 'Scarso' };
        }
    } else if (metric === 'fid') {  // First Input Delay (millisecondi)
        if (value < 100) {
            return { class: 'status-good', text: 'Buono' };
        } else if (value < 300) {
            return { class: 'status-needs-improvement', text: 'Migliorabile' };
        } else {
            return { class: 'status-poor', text: 'Scarso' };
        }
    } else if (metric === 'cls') {  // Cumulative Layout Shift (punteggio)
        if (value < 0.1) {
            return { class: 'status-good', text: 'Buono' };
        } else if (value < 0.25) {
            return { class: 'status-needs-improvement', text: 'Migliorabile' };
        } else {
            return { class: 'status-poor', text: 'Scarso' };
        }
    }
    return { class: 'unknown', text: 'Sconosciuto' };
}