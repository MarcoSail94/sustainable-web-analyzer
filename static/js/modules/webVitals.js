/**
 * Modulo WebVitals - Gestisce l'aggiornamento e visualizzazione delle Core Web Vitals
 */

/**
 * Aggiorna la visualizzazione delle Web Vitals
 * @param {Object} data - Dati di analisi
 */
export function updateWebVitals(data) {
    const webVitals = data.metrics.web_vitals;
    if (!webVitals) return;

    // LCP (Largest Contentful Paint)
    updateWebVitalMetric('lcp', webVitals.lcp, 's',
        { good: 2.5, medium: 4.0 },
        webVitals.scores.lcp);

    // FID (First Input Delay)
    updateWebVitalMetric('fid', webVitals.fid, 'ms',
        { good: 100, medium: 300 },
        webVitals.scores.fid);

    // CLS (Cumulative Layout Shift)
    updateWebVitalMetric('cls', webVitals.cls, '',
        { good: 0.1, medium: 0.25 },
        webVitals.scores.cls);

    // Crea il grafico di confronto Web Vitals
    createWebVitalsChart(data);
}

/**
 * Aggiorna la visualizzazione di una specifica metrica Web Vital
 * @param {string} metric - Nome della metrica (lcp, fid, cls)
 * @param {number} value - Valore della metrica
 * @param {string} unit - Unità di misura (s, ms, '')
 * @param {Object} thresholds - Soglie per buono/medio ({ good, medium })
 * @param {number} score - Punteggio percentuale (0-100)
 */
function updateWebVitalMetric(metric, value, unit, thresholds, score) {
    const valueElement = document.getElementById(`${metric}Value`);
    const bar = document.getElementById(`${metric}Bar`);
    const status = document.getElementById(`${metric}Status`);
    const card = document.getElementById(`${metric}Card`);

    // Formatta il valore in base alla metrica
    let displayValue;
    if (metric === 'lcp') {
        displayValue = value.toFixed(2) + unit;
    } else if (metric === 'fid') {
        displayValue = Math.round(value) + unit;
    } else { // cls
        displayValue = value.toFixed(3);
    }

    valueElement.textContent = displayValue;

    // Determina lo stato della metrica
    let statusText, statusClass, barColor, barWidth;

    if ((metric === 'lcp' && value < thresholds.good) ||
        (metric === 'fid' && value < thresholds.good) ||
        (metric === 'cls' && value < thresholds.good)) {
        statusText = "Buono";
        statusClass = "status-good";
        barColor = "var(--success-color)";
    } else if ((metric === 'lcp' && value < thresholds.medium) ||
               (metric === 'fid' && value < thresholds.medium) ||
               (metric === 'cls' && value < thresholds.medium)) {
        statusText = "Migliorabile";
        statusClass = "status-needs-improvement";
        barColor = "var(--warning-color)";
    } else {
        statusText = "Scarso";
        statusClass = "status-poor";
        barColor = "var(--danger-color)";
    }

    // Imposta la larghezza della barra in base al punteggio
    barWidth = `${Math.min(100, score)}%`;

    // Aggiorna gli elementi UI
    status.textContent = statusText;
    status.className = `web-vital-status ${statusClass}`;
    bar.style.backgroundColor = barColor;
    bar.style.width = barWidth;
}

/**
 * Crea il grafico delle Web Vitals
 * @param {Object} data - Dati di analisi
 */
function createWebVitalsChart(data) {
    const webVitals = data.metrics.web_vitals;
    const industryAvg = data.industry_comparison.average_web_vitals;

    if (!webVitals || !industryAvg) return;

    try {
        const ctx = document.getElementById('webVitalsChart').getContext('2d');

        // Verifica che Chart.js sia disponibile
        if (typeof Chart === 'undefined') {
            console.error('Chart.js non disponibile per il grafico Web Vitals');
            return;
        }

        // Distruggi eventuali grafici precedenti
        if (window.webVitalsChart && typeof window.webVitalsChart.destroy === 'function') {
            window.webVitalsChart.destroy();
        }

        // Prepara i dati per il grafico
        const lcpData = {
            actual: webVitals.lcp,
            target: 2.5,
            industry: industryAvg.lcp,
            label: 'LCP (s)'
        };

        const fidData = {
            actual: webVitals.fid / 1000, // Converti in secondi per scala uniforme
            target: 0.1,
            industry: industryAvg.fid / 1000,
            label: 'FID (s)'
        };

        const clsData = {
            actual: webVitals.cls * 10, // Moltiplica per avere una scala comparabile
            target: 0.1 * 10,
            industry: industryAvg.cls * 10,
            label: 'CLS (x10)'
        };

        window.webVitalsChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['LCP', 'FID', 'CLS'],
                datasets: [
                    {
                        label: 'Il tuo sito',
                        data: [lcpData.actual, fidData.actual, clsData.actual],
                        backgroundColor: 'rgba(22, 163, 74, 0.2)',
                        borderColor: 'rgba(22, 163, 74, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(22, 163, 74, 1)',
                        pointRadius: 4
                    },
                    {
                        label: 'Media di settore',
                        data: [lcpData.industry, fidData.industry, clsData.industry],
                        backgroundColor: 'rgba(107, 114, 128, 0.2)',
                        borderColor: 'rgba(107, 114, 128, 1)',
                        borderWidth: 2,
                        pointBackgroundColor: 'rgba(107, 114, 128, 1)',
                        pointRadius: 4
                    },
                    {
                        label: 'Obiettivo',
                        data: [lcpData.target, fidData.target, clsData.target],
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                        pointRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        min: 0,
                        max: Math.max(
                            lcpData.actual * 1.2,
                            lcpData.industry * 1.2,
                            fidData.actual * 1.2,
                            fidData.industry * 1.2,
                            clsData.actual * 1.2,
                            clsData.industry * 1.2
                        ),
                        ticks: {
                            backdropColor: 'transparent',
                            color: 'rgba(0, 0, 0, 0.7)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            boxWidth: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.raw || 0;
                                const datasetIndex = context.datasetIndex;
                                const index = context.dataIndex;

                                // Determina l'unità in base all'indice
                                let unit, displayValue;
                                if (index === 0) { // LCP
                                    unit = 's';
                                    displayValue = value;
                                } else if (index === 1) { // FID
                                    unit = 'ms';
                                    displayValue = value * 1000; // Riconverti in ms
                                } else { // CLS
                                    unit = '';
                                    displayValue = value / 10; // Riconverti al valore originale
                                }

                                return `${label}: ${displayValue.toFixed(2)}${unit}`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Errore durante la creazione del grafico Web Vitals:', error);
    }
}

// Esporta le funzioni
export { createWebVitalsChart };