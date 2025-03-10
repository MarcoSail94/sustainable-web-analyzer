/**
 * API Utility - Gestisce le chiamate API all'endpoint di analisi
 */

/**
 * Chiama l'API di analisi con l'URL e il numero di visite mensili
 *
 * @param {string} url - URL del sito da analizzare
 * @param {number} monthlyVisits - Numero di visite mensili stimate
 * @returns {Promise<Object>} - Risultati dell'analisi
 */
export async function callAnalyzeAPI(url, monthlyVisits = 10000) {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                monthly_visits: monthlyVisits
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Errore API (${response.status}): ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Errore durante la chiamata API:', error);
        throw error;
    }
}