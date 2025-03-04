// Funzione per confrontare le metriche del sito con la media di settore
function createComparisonChart(data) {
    const ctx = document.getElementById('comparisonChart').getContext('2d');

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
                    backgroundColor: '#2ecc71',
                    borderColor: '#27ae60',
                    borderWidth: 1
                },
                {
                    label: 'Media di settore',
                    data: metrics.map(m => m.industryAvg),
                    backgroundColor: '#95a5a6',
                    borderColor: '#7f8c8d',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Funzione di fallback per quando Chart.js non può essere caricato
function fallbackChartImplementation() {
    // Visualizza un messaggio nella sezione del grafico
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 4px;">
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