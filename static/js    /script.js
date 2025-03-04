// Funzione per verificare se Chart.js è caricato correttamente
function ensureChartJsLoaded(callback) {
    // Se Chart è già definito, usa quello
    if (typeof Chart !== 'undefined') {
        callback();
        return;
    }

    console.log("Chart.js non caricato. Tentativo di caricamento dinamico...");

    // Altrimenti, carica Chart.js dinamicamente
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/chart.js/3.9.1/chart.min.js';
    script.integrity = 'sha512-ElRFoEQdI5Ht6kZvyzXhYG9NqjtkmlkfYk0wr6wHxU9JEHakS7UJZNeml5ALk+8IKlU6jDgMabC3vkumRokgJA==';
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';

    script.onload = function() {
        console.log("Chart.js caricato con successo.");
        callback();
    };

    script.onerror = function() {
        console.error("Impossibile caricare Chart.js. La funzionalità dei grafici sarà limitata.");
        // Implementa una soluzione di fallback per i grafici
        fallbackChartImplementation();
    };

    document.head.appendChild(script);
}

// Implementazione di fallback quando Chart.js non può essere caricato
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

// Modifica la funzione createComparisonChart per usare il caricamento sicuro
function createComparisonChart(data) {
    ensureChartJsLoaded(function() {
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
    });
}