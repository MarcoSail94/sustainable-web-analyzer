/**
 * Modulo Analyzer - Gestisce la form di analisi e il caricamento dei risultati
 */

import { callAnalyzeAPI } from '../utils/api.js';
import { populateDashboard } from './dashboard.js';

document.addEventListener('DOMContentLoaded', function() {
    initializeAnalyzer();
    initializeAdvancedOptions();
    initializeActionButtons();
});

/**
 * Inizializza il form di analisi e il processo di submit
 */
function initializeAnalyzer() {
    const analyzerForm = document.getElementById('analyzerForm');
    const loadingSection = document.getElementById('loadingSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const errorMessage = document.getElementById('errorMessage');

    if (!analyzerForm) return;

    analyzerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const urlInput = document.getElementById('urlInput').value;
        if (!urlInput) return;

        // Ottieni il valore delle visite mensili
        const monthlyVisitsInput = document.getElementById('monthlyVisits');
        let monthlyVisits = 10000; // Valore predefinito

        if (monthlyVisitsInput && monthlyVisitsInput.value) {
            const parsedValue = parseInt(monthlyVisitsInput.value, 10);
            if (!isNaN(parsedValue) && parsedValue > 0) {
                monthlyVisits = parsedValue;
            }
        }

        // Nascondi eventuali errori precedenti
        errorMessage.style.display = 'none';

        // Mostra il caricamento con animazione
        loadingSection.style.display = 'block';
        loadingSection.classList.add('animate__animated', 'animate__fadeIn');
        dashboardSection.style.display = 'none';

        try {
            // Chiama l'API per l'analisi
            const data = await callAnalyzeAPI(urlInput, monthlyVisits);

            // Nascondi il caricamento
            loadingSection.style.display = 'none';

            if (!data.success) {
                // Mostra messaggio di errore
                errorMessage.textContent = data.error || "Si è verificato un errore durante l'analisi";
                errorMessage.style.display = 'block';
                errorMessage.classList.add('animate__animated', 'animate__fadeIn');
                return;
            }

            // Popola i dati nella dashboard
            populateDashboard(data);

            // Mostra la dashboard con animazione
            dashboardSection.style.display = 'block';
            dashboardSection.classList.add('animate__animated', 'animate__fadeIn');

            // Scorri fino alla dashboard
            dashboardSection.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            // Nascondi il caricamento
            loadingSection.style.display = 'none';

            // Mostra messaggio di errore
            errorMessage.textContent = "Si è verificato un errore durante l'analisi: " + error.message;
            errorMessage.style.display = 'block';
            errorMessage.classList.add('animate__animated', 'animate__fadeIn');
        }
    });
}

/**
 * Inizializza le opzioni avanzate
 */
function initializeAdvancedOptions() {
    const toggleAdvancedBtn = document.getElementById('toggleAdvanced');
    const advancedOptions = document.getElementById('advancedOptions');

    if (toggleAdvancedBtn && advancedOptions) {
        toggleAdvancedBtn.addEventListener('click', function() {
            const isHidden = advancedOptions.style.display === 'none';
            advancedOptions.style.display = isHidden ? 'block' : 'none';
            toggleAdvancedBtn.innerHTML = isHidden ?
                '<i class="fas fa-chevron-up"></i> Nascondi Opzioni Avanzate' :
                '<i class="fas fa-chevron-down"></i> Mostra Opzioni Avanzate';
        });
    }
}

/**
 * Inizializza i pulsanti di azione (download, condivisione)
 */
function initializeActionButtons() {
    const downloadReportBtn = document.getElementById('downloadReportBtn');
    const shareReportBtn = document.getElementById('shareReportBtn');

    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', function() {
            alert('Funzionalità di download report in arrivo a breve!');
        });
    }

    if (shareReportBtn) {
        shareReportBtn.addEventListener('click', function() {
            alert('Funzionalità di condivisione risultati in arrivo a breve!');
        });
    }
}

// Esporta le funzioni per l'uso in altri moduli
export { initializeAnalyzer };