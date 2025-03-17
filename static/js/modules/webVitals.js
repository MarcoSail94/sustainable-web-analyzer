/**
 * Crea il grafico delle Web Vitals utilizzando solo dati reali misurati
 * @param {Object} data - Può essere l'oggetto dati completo o un formato semplificato con {metrics: {web_vitals: ...}}
 */
function createWebVitalsChart(data) {
    // Supporta sia il formato completo che il formato ridotto
    const webVitals = data.metrics?.web_vitals || data;

    if (!webVitals) {
        console.error('Dati Web Vitals non disponibili per il grafico');
        return;
    }

    try {
        const ctx = document.getElementById('webVitalsChart');
        if (!ctx) {
            console.error('Canvas per WebVitalsChart non trovato');
            return;
        }

        // Distruggi eventuali grafici precedenti
        if (window.webVitalsChart && typeof window.webVitalsChart.destroy === 'function') {
            window.webVitalsChart.destroy();
        }

        // Log per debug
        console.log('Creazione grafico Web Vitals con dati:', webVitals);
        console.log('Canvas dimensioni:', ctx.width, ctx.height);
        console.log('Container dimensioni:', ctx.parentNode.offsetWidth, ctx.parentNode.offsetHeight);

        // Assicurati che il container abbia un'altezza minima
        if (ctx.parentNode.offsetHeight < 200) {
            ctx.parentNode.style.height = '350px';
            console.log('Applicata altezza minima al container del grafico');
        }

        // Forza un ridimensionamento del canvas
        ctx.height = ctx.parentNode.offsetHeight;
        ctx.width = ctx.parentNode.offsetWidth;

        // Prepara i dati per il grafico
        // Verifica se i dati sono realmente presenti prima di usarli
        const lcpValue = webVitals.lcp !== undefined ? webVitals.lcp : 0;
        const fidValue = webVitals.fid !== undefined ? webVitals.fid / 1000 : 0; // Converti in secondi
        const clsValue = webVitals.cls !== undefined ? webVitals.cls * 10 : 0; // Moltiplica per scala

        // Prepara i valori target (questi sono standard Web Vitals)
        const lcpTarget = 2.5;
        const fidTarget = 0.1; // 100ms in secondi
        const clsTarget = 0.1 * 10; // Scalato come i dati reali

        // Crea i dataset
        const datasets = [
            {
                label: 'Il tuo sito',
                data: [lcpValue, fidValue, clsValue],
                backgroundColor: 'rgba(22, 163, 74, 0.2)',
                borderColor: 'rgba(22, 163, 74, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(22, 163, 74, 1)',
                pointRadius: 4
            },
            {
                label: 'Obiettivo',
                data: [lcpTarget, fidTarget, clsTarget],
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                borderDash: [5, 5],
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointRadius: 3
            }
        ];

        // Aggiungi una nota per indicare che il grafico mostra solo i dati reali
        const container = ctx.parentNode;
        if (container) {
            const noteExists = container.querySelector('.data-availability-note');
            if (!noteExists) {
                const note = document.createElement('div');
                note.className = 'data-availability-note';
                note.style.textAlign = 'center';
                note.style.marginTop = '10px';
                note.style.fontSize = '0.875rem';
                note.style.color = 'var(--text-secondary)';
                note.innerHTML = '<i class="fas fa-info-circle"></i> Il grafico mostra solo i dati reali misurati e i valori target standard';
                container.appendChild(note);
            }
        }

        // Calcola il valore massimo per il grafico
        const maxValue = Math.max(
            lcpValue * 1.2,
            fidValue * 1.2,
            clsValue * 1.2,
            lcpTarget * 1.2,
            fidTarget * 1.2,
            clsTarget * 1.2
        );

        // Usa setTimeout per assicurarsi che il DOM sia pronto
        setTimeout(() => {
            // Forza un ridimensionamento del canvas prima di creare il grafico
            const dpr = window.devicePixelRatio || 1;
            const rect = ctx.getBoundingClientRect();
            ctx.width = rect.width * dpr;
            ctx.height = rect.height * dpr;
            ctx.style.width = `${rect.width}px`;
            ctx.style.height = `${rect.height}px`;

            console.log('Canvas ridimensionato a:', ctx.width, ctx.height);

            // Crea il grafico con configurazione completa
            window.webVitalsChart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: ['LCP', 'FID', 'CLS'],
                    datasets: datasets
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
                            max: maxValue,
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
            console.log('Grafico Web Vitals creato con successo');
        }, 100); // Un breve ritardo per assicurarsi che il DOM sia aggiornato
    } catch (error) {
        console.error('Errore durante la creazione del grafico Web Vitals:', error);
        console.error('Stack trace:', error.stack);

        // Implementa un fallback visibile in caso di errore
        const container = document.querySelector('.web-vitals-chart-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; background-color: #f9fafb; border-radius: 8px; height: 100%;">
                    <p><strong>Visualizzazione grafico non disponibile</strong></p>
                    <p>Si è verificato un errore durante la creazione del grafico: ${error.message}</p>
                    <p style="margin-top: 15px; font-size: 0.85rem; color: #666;">Dettaglio tecnico: ${error.stack ? error.stack.split('\n')[0] : 'Errore sconosciuto'}</p>
                </div>
            `;
        }
    }
}

/**
 * Aggiorna la visualizzazione delle Web Vitals
 * @param {Object} data - Dati di analisi
 */
function updateWebVitals(data) {
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

    if (!valueElement || !bar || !status || !card) {
        console.warn(`Elementi per Web Vital ${metric} non trovati`);
        return;
    }

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

// Esporta le funzioni
export { updateWebVitals, createWebVitalsChart };