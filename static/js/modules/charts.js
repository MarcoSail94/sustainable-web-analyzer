/**
 * Modulo Charts - Gestisce la creazione e aggiornamento dei grafici
 */

/**
 * Verifica se Chart.js è disponibile
 * @returns {boolean} true se Chart.js è disponibile, altrimenti false
 */
function isChartJsAvailable() {
    return typeof Chart !== 'undefined';
}

/**
 * Crea il grafico di confronto con altri siti
 * @param {Object} data - Dati di analisi
 */
export function createComparisonChart(data) {
    try {
        const chartContainer = document.querySelector('.chart-container');
        if (!chartContainer) {
            console.error('Container per il grafico non trovato');
            return;
        }

        const canvas = document.getElementById('comparisonChart');
        if (!canvas) {
            console.error('Canvas per il grafico non trovato');
            return;
        }

        // Verifica che Chart sia disponibile
        if (!isChartJsAvailable()) {
            console.error('Chart.js non disponibile. Utilizzo fallback');
            fallbackChartImplementation(chartContainer);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Impossibile ottenere il contesto del canvas');
            fallbackChartImplementation(chartContainer);
            return;
        }

        // Distruggi eventuali grafici precedenti
        if (window.comparisonChart && typeof window.comparisonChart.destroy === 'function') {
            window.comparisonChart.destroy();
        }

        const metrics = [
            {
                label: 'Emissioni CO₂ (g/view)',
                yourValue: data.metrics.co2_emissions || 0,
                industryAvg: data.industry_comparison?.average_co2 || 0
            },
            {
                label: 'Tempo di Caricamento (s)',
                yourValue: data.metrics.load_time || 0,
                industryAvg: data.industry_comparison?.average_load_time || 0
            },
            {
                label: 'Punteggio Sostenibilità (/100)',
                yourValue: data.metrics.sustainability_score || 0,
                industryAvg: data.industry_comparison?.average_sustainability_score || 75 // Valore di fallback
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
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            fallbackChartImplementation(chartContainer);
        }
    }
}

/**
 * Crea il grafico di suddivisione dei costi
 * @param {Object} economicBenefits - Dati economici
 */
export function createCostBreakdownCharts(economicBenefits) {
    try {
        // Verifica che Chart.js sia disponibile
        if (!isChartJsAvailable()) {
            console.error('Chart.js non disponibile per i grafici di costo');
            fallbackEconomicCharts();
            return;
        }

        // Verifica che i dati siano definiti
        if (!economicBenefits || !economicBenefits.costs_breakdown) {
            console.error('Dati economici non validi');
            return;
        }

        const costsCanvas = document.getElementById('costsBreakdownChart');
        const savingsCanvas = document.getElementById('savingsBreakdownChart');

        if (!costsCanvas || !savingsCanvas) {
            console.error('Canvas per i grafici dei costi non trovati');
            return;
        }

        // Crea il grafico di suddivisione dei costi
        const costsData = economicBenefits.costs_breakdown;
        const costsCtx = costsCanvas.getContext('2d');

        if (!costsCtx) {
            console.error('Impossibile ottenere il contesto del canvas per i costi');
            return;
        }

        // Distruggi eventuali grafici precedenti
        if (window.costsChart && typeof window.costsChart.destroy === 'function') {
            window.costsChart.destroy();
        }

        if (window.savingsChart && typeof window.savingsChart.destroy === 'function') {
            window.savingsChart.destroy();
        }

        // Crea il grafico dei costi
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
                        costsData.bandwidth || 0,
                        costsData.energy || 0,
                        costsData.seo_impact || 0,
                        costsData.bounce_impact || 0,
                        costsData.extra_maintenance || 0,
                        costsData.extra_infrastructure || 0
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

        // Verifica che i dati per il grafico dei risparmi siano disponibili
        if (economicBenefits.savings_breakdown) {
            const savingsData = economicBenefits.savings_breakdown;
            const savingsCtx = savingsCanvas.getContext('2d');

            if (!savingsCtx) {
                console.error('Impossibile ottenere il contesto del canvas per i risparmi');
                return;
            }

            // Crea il grafico dei risparmi
            window.savingsChart = new Chart(savingsCtx, {
                type: 'doughnut',
                data: {
                    labels: [
                        'Risparmio Banda',
                        'Risparmio Energia',
                        'Migliore SEO',
                        'Meno Rimbalzi',
                        'Meno Manutenzione',
                        'Infrastruttura Ottimizzata'
                    ],
                    datasets: [{
                        data: [
                            savingsData.bandwidth || 0,
                            savingsData.energy || 0,
                            savingsData.seo_conversions || 0,
                            savingsData.reduced_bounce || 0,
                            savingsData.maintenance || 0,
                            savingsData.infrastructure || 0
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
                            text: 'Potenziali Risparmi Mensili',
                            font: {
                                size: 16
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Errore nella creazione dei grafici economici:', error);
        fallbackEconomicCharts();
    }
}

/**
 * Funzione di fallback per quando Chart.js non può essere caricato
 * @param {HTMLElement} container - Container del grafico
 */
function fallbackChartImplementation(container) {
    if (!container) return;

    container.innerHTML = `
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

/**
 * Funzione di fallback per i grafici economici
 */
function fallbackEconomicCharts() {
    const costsContainer = document.getElementById('costsBreakdownChart');
    const savingsContainer = document.getElementById('savingsBreakdownChart');

    const fallbackHTML = `
        <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
            <p><strong>Grafico non disponibile</strong></p>
            <p>Non è stato possibile caricare i grafici di suddivisione dei costi.</p>
        </div>
    `;

    if (costsContainer && costsContainer.parentNode) {
        costsContainer.parentNode.innerHTML = fallbackHTML;
    }

    if (savingsContainer && savingsContainer.parentNode) {
        savingsContainer.parentNode.innerHTML = fallbackHTML;
    }
}

// Esporta le funzioni
export { fallbackChartImplementation, fallbackEconomicCharts };