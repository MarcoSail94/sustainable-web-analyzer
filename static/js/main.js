/**
 * File JavaScript principale
 * Inizializza funzionalità generali dell'applicazione
 */

document.addEventListener('DOMContentLoaded', function() {
    // Verifico che Chart.js sia caricato correttamente
    if (typeof Chart === 'undefined') {
        console.error('Chart.js non è stato caricato. Utilizzo fallback');
    } else {
        console.log('Chart.js caricato correttamente');
    }

    // Altre inizializzazioni generali
    setupTooltips();
});

/**
 * Inizializza tooltip e altre funzionalità UI
 */
function setupTooltips() {
    // Implementazione tooltip quando disponibile
    const tooltipTriggers = document.querySelectorAll('[title]');
    if (tooltipTriggers.length > 0) {
        // Implementazione tooltip
        tooltipTriggers.forEach(trigger => {
            // Per ora usiamo il tooltip nativo
            // In futuro potremo sostituirlo con una libreria
        });
    }
}