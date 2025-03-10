/**
 * Modulo Economics - Gestisce i dati economici e la loro visualizzazione
 */

import { createCostBreakdownCharts } from './charts.js';

/**
 * Popola i dettagli economici nella dashboard
 * @param {Object} economicBenefits - Dati sui benefici economici
 */
export function populateEconomicDetails(economicBenefits) {
    // Popola le card dei benefici
    populateBenefitsGrid(economicBenefits);

    // Popola la tabella dei costi
    populateCostsTable(economicBenefits);

    // Crea i grafici di suddivisione
    createCostBreakdownCharts(economicBenefits);
}

/**
 * Popola la griglia delle card dei benefici economici
 * @param {Object} economicBenefits - Dati sui benefici economici
 */
function populateBenefitsGrid(economicBenefits) {
    const benefitsGrid = document.getElementById('benefitsGrid');
    benefitsGrid.innerHTML = '';

    // Calcola importi annuali per le card principali
    const annualCost = economicBenefits.current_monthly_cost * 12;
    const annualSavings = economicBenefits.potential_annual_savings;
    const savingsPercent = economicBenefits.potential_savings_percent;
    const savingsPerVisit = (economicBenefits.potential_monthly_savings / economicBenefits.estimated_monthly_visits) * 100; // in centesimi di euro

    const benefitCards = [
        {
            value: `€${annualCost.toFixed(2)}`,
            label: 'Costo annuale attuale'
        },
        {
            value: `€${annualSavings.toFixed(2)}`,
            label: 'Risparmio annuale potenziale'
        },
        {
            value: `${savingsPercent}%`,
            label: 'Riduzione costi potenziale'
        },
        {
            value: `${savingsPerVisit.toFixed(2)}¢`,
            label: 'Risparmio per visita'
        }
    ];

    benefitCards.forEach(card => {
        const benefitCard = document.createElement('div');
        benefitCard.className = 'benefit-card';
        benefitCard.innerHTML = `
            <div class="benefit-value">${card.value}</div>
            <div class="benefit-label">${card.label}</div>
        `;
        benefitsGrid.appendChild(benefitCard);
    });
}

/**
 * Popola la tabella dei costi dettagliati
 * @param {Object} economicBenefits - Dati sui benefici economici
 */
function populateCostsTable(economicBenefits) {
    // Popola la tabella dei costi
    const costsTableBody = document.getElementById('costsTableBody');
    costsTableBody.innerHTML = '';

    // Mappatura dei nomi delle categorie
    const categoryNames = {
        'bandwidth': 'Costi di Banda',
        'energy': 'Costi Energetici',
        'seo_impact': 'Impatto SEO',
        'bounce_impact': 'Utenti Persi',
        'extra_maintenance': 'Manutenzione Extra',
        'extra_infrastructure': 'Infrastruttura'
    };

    // Mappatura delle descrizioni
    const categoryDescriptions = {
        'bandwidth': 'Costi di trasferimento dati mensili',
        'energy': 'Consumo energetico dei server',
        'seo_impact': 'Perdita di valore dalle conversioni mancate per peggiore posizionamento',
        'bounce_impact': 'Valore perso da utenti che abbandonano per lentezza',
        'extra_maintenance': 'Costi aggiuntivi per mantenere codice complesso',
        'extra_infrastructure': 'Costi aggiuntivi per server più potenti'
    };

    // Mappatura diretta tra chiavi di costo e chiavi di risparmio
    const costToSavingKeyMap = {
        'bandwidth': 'bandwidth',
        'energy': 'energy',
        'seo_impact': 'seo_conversions',
        'bounce_impact': 'reduced_bounce',
        'extra_maintenance': 'maintenance',
        'extra_infrastructure': 'infrastructure'
    };

    const costsData = economicBenefits.costs_breakdown;
    const savingsData = economicBenefits.savings_breakdown;

    let totalCurrent = 0;
    let totalSavings = 0;

    // Itera su tutte le categorie di costo
    for (const [key, value] of Object.entries(costsData)) {
        // Usa la mappatura diretta invece di una espressione condizionale
        const savingKey = costToSavingKeyMap[key] || key;
        const savingValue = savingsData[savingKey] || 0;

        totalCurrent += value;
        totalSavings += savingValue;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${categoryNames[key] || key}</td>
            <td>€${value.toFixed(2)}</td>
            <td>€${savingValue.toFixed(2)}</td>
            <td>${categoryDescriptions[key] || ''}</td>
        `;
        costsTableBody.appendChild(row);
    }

    // Aggiorna i totali
    document.getElementById('totalCurrentCost').textContent = `€${totalCurrent.toFixed(2)}`;
    document.getElementById('totalPotentialSavings').textContent = `€${totalSavings.toFixed(2)}`;
}

// Esporta le funzioni
export { populateBenefitsGrid, populateCostsTable };