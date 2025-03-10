/**
 * Modulo Charts - Gestisce la creazione e aggiornamento dei grafici
 */

/**
 * Crea il grafico di confronto con altri siti
 * @param {Object} data - Dati di analisi
 */
export function createComparisonChart(data) {
    try {
        const ctx = document.getElementById('comparisonChart').getContext('2d');

        // Verifica che Chart sia disponibile
        if (typeof Chart === 'undefined') {
            console.error('Chart.js non disponibile. Utilizzo fallback');
            fallbackChartImplementation();
            return;
        }

        // Distruggi eventuali grafici precedenti
        if (window.comparisonChart && typeof window.comparisonChart.destroy === 'function') {
            window.comparisonChart.destroy();
        }

        const metrics = [
            {
                label: 'Emissioni CO₂ (g/view)',
                yourValue: data.metrics.co2_emissions,
                industryAvg: data.industry_comparison.average_co2
            },
            {
                label: 'Tempo di Caricamento (s)',
                yourValue: data.metrics.load_time,
                industryAvg: data.industry_comparison.average_load_time
            },
            {
                label: 'Punteggio Sostenibilità (/100)',
                yourValue: data.metrics.sustainability_score,
                industryAvg: 75 // Valore di esempio
            }
        ];

        window.comparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: metrics.map(m => m.label),
                datasets: [
                    {
                        label: 'Il tuo sito',
                        data: metrics.map(m => m.yourValue),
                        backgroundColor: '#16a34a',
                        borderColor: '#15803d',
                        borderWidth: 1,
                        borderRadius: 6
                    },
                    {
                        label: 'Media di settore',
                        data: metrics.map(m => m.industryAvg),
                        backgroundColor: '#9ca3af',
                        borderColor: '#6b7280',
                        borderWidth: 1,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        titleFont: {
                            size: 16,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 14
                        },
                        padding: 16,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(107, 114, 128, 0.1)'
                        },
                        ticks: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Errore durante la creazione del grafico:', error);
        fallbackChartImplementation();
    }
}

/**
 * Crea il grafico di suddivisione dei costi
 * @param {Object} economicBenefits - Dati economici
 */
export function createCostBreakdownCharts(economicBenefits) {
    // Verifica che Chart.js sia disponibile
    if (typeof Chart === 'undefined') {
        console.error('Chart.js non disponibile per i grafici di costo');
        fallbackEconomicCharts();
        return;
    }

    // Crea il grafico di suddivisione dei costi
    const costsData = economicBenefits.costs_breakdown;
    const costsCtx = document.getElementById('costsBreakdownChart').getContext('2d');

    // Distruggi eventuali grafici precedenti
    if (window.costsChart && typeof window.costsChart.destroy === 'function') {
        window.costsChart.destroy();
    }

    window.costsChart = new Chart(costsCtx, {
        type: 'doughnut',
        data: {
            labels: [
                'Costi di Banda',
                'Costi Energetici',
                'Impatto SEO',
                'Utenti Persi',
                'Costi Manutenzione',
                'Infrastruttura Extra'
            ],
            datasets: [{
                data: [
                    costsData.bandwidth,
                    costsData.energy,
                    costsData.seo_impact,
                    costsData.bounce_impact,
                    costsData.extra_maintenance,
                    costsData.extra_infrastructure
                ],
                backgroundColor: [
                    '#3b82f6', // blu
                    '#10b981', // verde
                    '#f59e0b', // arancione
                    '#ef4444', // rosso
                    '#8b5cf6', // viola
                    '#6b7280'  // grigio
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: €${value.toFixed(2)}`;
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Suddivisione dei Costi Mensili',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });

    // Implementazione del grafico di suddivisione dei risparmi
    // ... [resto del codice]
}

/**
 * Funzione di fallback per quando Chart.js non può essere caricato
 */
function fallbackChartImplementation() {
    // Visualizza un messaggio nella sezione del grafico
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                <p><strong>Visualizzazione grafica non disponibile</strong></p>
                <p>Non è stato possibile caricare la libreria per i grafici. Ecco un riassunto testuale:</p>
                <ul style="text-align: left; margin-top: 15px;">
                    <li>Il tuo sito ha emissioni di CO₂ diverse dalla media del settore</li>
                    <li>Il tempo di caricamento potrebbe essere migliorato</li>
                    <li>Il punteggio di sostenibilità mostra come il tuo sito si confronta con altri</li>
                </ul>
                <p style="margin-top: 15px;">Per vedere i grafici dettagliati, assicurati di avere una connessione internet stabile.</p>
            </div>
        `;
    }
}

/**
 * Funzione di fallback per i grafici economici
 */
function fallbackEconomicCharts() {
    const costsChart = document.getElementById('costsBreakdownChart');
    const savingsChart = document.getElementById('savingsBreakdownChart');

    // Implementare messaggi di fallback per entrambi i grafici
    // ... [implementazione]
}

// Esporta le funzioni
export { fallbackChartImplementation, fallbackEconomicCharts };