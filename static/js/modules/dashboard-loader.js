/**
 * Carica la dashboard avanzata in modo asincrono
 * @param {Object} data - Dati di analisi del sito
 * @param {HTMLElement} container - Container per la dashboard
 * @returns {Promise<boolean>} - Promise che si risolve a true se il caricamento è avvenuto con successo
 */
export async function loadEnhancedDashboard(data, container) {
  console.log("Inizializzazione dashboard avanzata...", data);

  try {
    // Verifica che React e ReactDOM siano disponibili
    if (!window.React || !window.ReactDOM) {
      console.warn("React o ReactDOM non disponibili. Caricamento delle librerie...");
      await loadReactLibraries();

      // Verifica di nuovo dopo il caricamento
      if (!window.React || !window.ReactDOM) {
        console.error("Impossibile caricare React. Fallback alla dashboard standard.");
        return false;
      }
    }

    // Visualizza un indicatore di caricamento
    container.innerHTML = `
      <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg animate-pulse">
        <div class="flex justify-center items-center h-64">
          <div class="text-center">
            <svg class="animate-spin h-10 w-10 text-green-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">Caricamento dashboard avanzata...</p>
          </div>
        </div>
      </div>
    `;

    // Importa il componente EnhancedDashboard in modo dinamico - PERCORSO CORRETTO
    const EnhancedDashboardModule = await import('/static/js/modules/enhanced-dashboard.js');
    const EnhancedDashboard = EnhancedDashboardModule.default;

    if (!EnhancedDashboard) {
      console.error("Componente EnhancedDashboard non trovato.");
      return false;
    }

    // Log per debug
    console.log("Componente EnhancedDashboard importato:", EnhancedDashboard);
    console.log("Dati per il rendering:", JSON.stringify(data).substring(0, 500) + "...");

    // DEBUG: Garantisce che i dati non siano undefined o vuoti
    if (!data || !data.metrics || Object.keys(data.metrics).length === 0) {
      console.error("Dati invalidi o mancanti per EnhancedDashboard", data);

      // Fix temporaneo: garantisce che ci siano almeno i dati minimi
      data = ensureMinimumData(data);
    }

    // Crea l'elemento React
    console.log("Rendering componente React EnhancedDashboard...");

    // Usa createRoot per React 18
    if (window.ReactDOM.createRoot) {
      const root = window.ReactDOM.createRoot(container);
      root.render(window.React.createElement(EnhancedDashboard, { data }));
    } else {
      // Fallback a render per versioni precedenti
      window.ReactDOM.render(
        window.React.createElement(EnhancedDashboard, { data }),
        container
      );
    }

    console.log("Dashboard avanzata renderizzata con successo!");
    return true;
  } catch (error) {
    console.error("Errore durante il caricamento della dashboard avanzata:", error);
    container.innerHTML = `
      <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div class="flex items-center">
            <div class="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-bold text-red-800 dark:text-red-200">Errore di Caricamento</h3>
              <p class="text-red-700 dark:text-red-300">
                Si è verificato un errore durante il caricamento della dashboard avanzata. Verrà utilizzata la dashboard standard.
              </p>
              <button
                class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onclick="window.location.reload()"
              >
                Ricarica Pagina
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    return false;
  }
}

/**
 * Funzione per garantire che ci siano dati minimi per il rendering
 * @param {Object} data - Dati originali che potrebbero essere incompleti
 * @returns {Object} - Dati con valori minimi garantiti
 */
function ensureMinimumData(data) {
  // Crea un oggetto base se mancante
  data = data || {};

  // Garantisce valori base per metrics
  data.metrics = data.metrics || {};
  data.metrics.sustainability_score = data.metrics.sustainability_score || 0;
  data.metrics.co2_emissions = data.metrics.co2_emissions || 0;
  data.metrics.total_size = data.metrics.total_size || "0 KB";
  data.metrics.load_time = data.metrics.load_time || 0;

  // Garantisce Web Vitals
  data.metrics.web_vitals = data.metrics.web_vitals || {
    lcp: 0,
    fid: 0,
    cls: 0,
    scores: { lcp: 0, fid: 0, cls: 0, overall: 0 },
    lighthouse_score: 0
  };

  // Garantisce dati economici
  data.metrics.economic_benefits = data.metrics.economic_benefits || {
    current_monthly_cost: 0,
    potential_annual_savings: 0,
    potential_savings_percent: 0,
    estimated_monthly_visits: 0
  };

  // Garantisce risorse e ottimizzazioni
  data.resources = data.resources || {};
  data.optimizations = data.optimizations || [];

  return data;
}

/**
 * Carica React e ReactDOM se non sono disponibili
 * @returns {Promise<void>}
 */
async function loadReactLibraries() {
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  try {
    // Usa versioni più recenti di React e ReactDOM
    await loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
    await loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
    console.log("React e ReactDOM caricati con successo");
  } catch (error) {
    console.error("Errore durante il caricamento di React:", error);
    throw error;
  }
}