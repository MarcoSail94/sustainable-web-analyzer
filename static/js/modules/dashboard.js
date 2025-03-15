/**
 * Modulo Dashboard - Gestisce la popolazione della dashboard con i dati di analisi
 */

import { createComparisonChart } from './charts.js';
import { updateWebVitals } from './webVitals.js';
import { populateEconomicDetails } from './economics.js';
import { formatFileSize } from '../utils/formatters.js';

/**
 * Funzione principale per popolare la dashboard completa
 * @param {Object} data - Dati di analisi
 */
export function populateDashboard(data) {
    const metrics = data.metrics;
    const resources = data.resources;
    const optimizations = data.optimizations;
    const comparison = data.industry_comparison;
    const economicBenefits = metrics.economic_benefits || {
        current_monthly_cost: 5.20,
        potential_savings_percent: 30,
        potential_monthly_savings: 1.56,
        potential_annual_savings: 18.72,
        bandwidth_cost_per_visit: 0.52,
        estimated_monthly_visits: 10000,
        costs_breakdown: {
            bandwidth: 2.10,
            energy: 0.60,
            seo_impact: 1.20,
            bounce_impact: 0.80,
            extra_maintenance: 0.30,
            extra_infrastructure: 0.20
        },
        savings_breakdown: {
            bandwidth: 0.63,
            energy: 0.18,
            seo_conversions: 0.84,
            reduced_bounce: 0.48,
            maintenance: 0.24,
            infrastructure: 0.18
        }
    };

    // Verifica se usare la dashboard avanzata
    const isEnhanced = data.analyzer_type === 'lighthouse-enhanced';

    if (isEnhanced && document.getElementById('enhancedDashboardContainer')) {
        // Utilizza la dashboard avanzata se disponibile
        renderEnhancedDashboard(data);
    } else {
        // Altrimenti utilizza la dashboard standard

        // Popola le metriche principali
        populateScoreOverview(metrics, comparison);

        // Popola la lista delle risorse
        populateResourceList(resources);

        // Popola i suggerimenti di ottimizzazione
        populateOptimizations(optimizations);

        // Crea il grafico di confronto con gestione degli errori
        try {
            createComparisonChart(data);
        } catch (error) {
            console.error('Errore durante la creazione del grafico:', error);
        }

        // Popola i dettagli economici
        populateEconomicDetails(economicBenefits);

        // Aggiorna la visualizzazione delle Web Vitals
        updateWebVitals(data);

        // Mostra la sezione Web Vitals
        document.getElementById('webVitalsSection').style.display = 'block';
    }
}

/**
 * Renderizza la dashboard avanzata utilizzando React
 * @param {Object} data - Dati di analisi
 */
async function renderEnhancedDashboard(data) {
    try {
        // Importa la dashboard avanzata dinamicamente
        const { default: EnhancedDashboard } = await import('./enhanced-dashboard.js');

        // Renderizza il componente React
        const container = document.getElementById('enhancedDashboardContainer');

        // Utilizza ReactDOM.render o React.createElement in base alla disponibilità
        if (window.ReactDOM && window.React) {
            window.ReactDOM.render(
                window.React.createElement(EnhancedDashboard, { data }),
                container
            );
            console.log('Enhanced dashboard rendered successfully with ReactDOM');
        } else {
            console.error('ReactDOM or React not found. Make sure they are loaded.');
            // Fallback alla dashboard standard
            populateScoreOverview(data.metrics, data.industry_comparison);
            populateResourceList(data.resources);
            populateOptimizations(data.optimizations);
        }
    } catch (error) {
        console.error('Error rendering enhanced dashboard:', error);
        // Fallback alla dashboard standard in caso di errore
        populateScoreOverview(data.metrics, data.industry_comparison);
        populateResourceList(data.resources);
        populateOptimizations(data.optimizations);
    }
}

/**
 * Popola la panoramica dei punteggi
 * @param {Object} metrics - Metriche di sostenibilità
 * @param {Object} comparison - Dati di confronto con la media del settore
 */
function populateScoreOverview(metrics, comparison) {
    const scoreOverview = document.getElementById('scoreOverview');
    scoreOverview.innerHTML = '';

    // Punteggio sostenibilità
    let scoreClass = 'red-score';
    let scoreIcon = 'fa-exclamation-circle';
    if (metrics.sustainability_score >= 80) {
        scoreClass = 'green-score';
        scoreIcon = 'fa-check-circle';
    } else if (metrics.sustainability_score >= 50) {
        scoreClass = 'yellow-score';
        scoreIcon = 'fa-exclamation-triangle';
    }

    let scoreDescription = "Il tuo sito necessita di miglioramenti";
    if (metrics.sustainability_score >= 80) {
        scoreDescription = "Il tuo sito è molto efficiente";
    } else if (metrics.sustainability_score >= 50) {
        scoreDescription = "Il tuo sito è abbastanza efficiente";
    }

    const sustainabilityCard = createScoreCard(
        'Punteggio Sostenibilità',
        `${metrics.sustainability_score}<span>/100</span>`,
        scoreDescription,
        scoreClass,
        scoreIcon
    );
    scoreOverview.appendChild(sustainabilityCard);

    // Emissioni CO2
    let co2Class = 'green-score';
    let co2Icon = 'fa-leaf';
    if (metrics.co2_emissions > 1) {
        co2Class = 'red-score';
        co2Icon = 'fa-smog';
    } else if (metrics.co2_emissions > 0.5) {
        co2Class = 'yellow-score';
        co2Icon = 'fa-wind';
    }

    const co2Card = createScoreCard(
        'Emissioni CO₂',
        `${metrics.co2_emissions}<span>g/view</span>`,
        `Meglio del ${comparison.better_than_percent}% dei siti web`,
        co2Class,
        co2Icon
    );
    scoreOverview.appendChild(co2Card);

    // Peso totale
    const sizeCard = createScoreCard(
        'Peso Totale',
        `${metrics.total_size}`,
        'Dimensione delle risorse del sito',
        'blue-score',
        'fa-weight-hanging'
    );
    scoreOverview.appendChild(sizeCard);

    // Tempo di caricamento
    let timeClass = 'green-score';
    let timeIcon = 'fa-tachometer-alt';
    if (metrics.load_time > 3) {
        timeClass = 'red-score';
    } else if (metrics.load_time > 2) {
        timeClass = 'yellow-score';
    }

    let timeDescription = `Veloce rispetto alla media (${comparison.average_load_time}s)`;
    if (metrics.load_time > comparison.average_load_time) {
        timeDescription = `Lento rispetto alla media (${comparison.average_load_time}s)`;
    }

    const timeCard = createScoreCard(
        'Tempo di Caricamento',
        `${metrics.load_time}<span>s</span>`,
        timeDescription,
        timeClass,
        timeIcon
    );
    scoreOverview.appendChild(timeCard);
}

/**
 * Popola la lista delle risorse
 * @param {Object} resources - Dati delle risorse
 */
function populateResourceList(resources) {
    const resourceList = document.getElementById('resourceList');
    resourceList.innerHTML = `
        <div class="resource-item">
            <div class="resource-name"><strong>Tipo</strong></div>
            <div class="resource-size"><strong>Dimensione</strong></div>
            <div class="resource-impact"><strong>Impatto</strong></div>
        </div>
    `;

    // Mappatura delle icone per tipo di risorsa
    const resourceIcons = {
        'html': 'fa-html5',
        'css': 'fa-css3-alt',
        'javascript': 'fa-js',
        'images': 'fa-image',
        'fonts': 'fa-font',
        'other': 'fa-file'
    };

    for (const [type, data] of Object.entries(resources)) {
        const icon = resourceIcons[type] || 'fa-file';
        const resourceItem = document.createElement('div');
        resourceItem.className = 'resource-item';
        resourceItem.innerHTML = `
            <div class="resource-name"><i class="fab ${icon}"></i> ${capitalizeFirstLetter(type)} (${data.count})</div>
            <div class="resource-size">${data.size}</div>
            <div class="resource-impact">${data.co2}g CO₂</div>
        `;
        resourceList.appendChild(resourceItem);
    }
}

/**
 * Popola i suggerimenti di ottimizzazione
 * @param {Array} optimizations - Lista di ottimizzazioni
 */
function populateOptimizations(optimizations) {
    const optimizationList = document.getElementById('optimizationList');
    optimizationList.innerHTML = '';

    optimizations.forEach(opt => {
        const priorityClass = opt.priority === 'high' ? 'high-priority' :
                            opt.priority === 'medium' ? 'medium-priority' : '';

        const priorityIcon = opt.priority === 'high' ? 'exclamation-circle' :
                            opt.priority === 'medium' ? 'exclamation-triangle' : 'info-circle';

        const optimizationCard = document.createElement('div');
        optimizationCard.className = `optimization-card ${priorityClass}`;

        optimizationCard.innerHTML = `
            <h3><i class="fas fa-${priorityIcon}"></i> ${opt.title}</h3>
            <p>${opt.description}</p>
            <div class="impact-row">
                <div class="impact-item">
                    <div class="impact-value">${opt.impact}g</div>
                    <div class="impact-label">CO₂ Risparmiato</div>
                </div>
            </div>
        `;
        optimizationList.appendChild(optimizationCard);
    });
}

/**
 * Crea una card per il punteggio
 * @param {string} title - Titolo della card
 * @param {string} value - Valore da mostrare
 * @param {string} description - Descrizione
 * @param {string} valueClass - Classe CSS per lo stile del valore
 * @param {string} iconName - Nome dell'icona Font Awesome
 * @returns {HTMLElement} - Elemento card creato
 */
function createScoreCard(title, value, description, valueClass, iconName) {
    const card = document.createElement('div');
    card.className = 'score-card';
    card.innerHTML = `
        <h3>${title}</h3>
        <div class="score-value ${valueClass}">${value}</div>
        <p class="text-center"><i class="fas ${iconName}"></i> ${description}</p>
    `;
    return card;
}

/**
 * Converte la prima lettera di una stringa in maiuscolo
 * @param {string} string - Stringa da convertire
 * @returns {string} - Stringa con la prima lettera maiuscola
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Esporta le funzioni
export { populateScoreOverview, populateResourceList, populateOptimizations, createScoreCard };