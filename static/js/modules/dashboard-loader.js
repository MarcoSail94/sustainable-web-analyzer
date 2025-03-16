/**
 * Carica la dashboard avanzata in modo asincrono
 * @param {Object} data - Dati di analisi del sito
 * @param {HTMLElement} container - Container per la dashboard
 * @returns {Promise<boolean>} - Promise che si risolve a true se il caricamento è avvenuto con successo
 */
export async function loadEnhancedDashboard(data, container) {
  console.log("Inizializzazione dashboard avanzata...");

  // Salva lo stato originale delle sezioni standard
  if (!window._originalDashboardState) {
    window._originalDashboardState = {};
    document.querySelectorAll('.detail-section').forEach(section => {
      window._originalDashboardState[section.id || `section_${Math.random().toString(36).substr(2, 9)}`] =
        section.style.display || 'block';
    });
  }

  // IMPORTANTE: Nascondi immediatamente tutte le sezioni della dashboard standard
  // per evitare che vengano visualizzate entrambe le dashboard
  hideStandardDashboardSections();

  try {
    // Verifica che React e ReactDOM siano disponibili
    if (!window.React || !window.ReactDOM) {
      console.warn("React o ReactDOM non disponibili. Caricamento delle librerie...");
      await loadReactLibraries();

      // Verifica di nuovo dopo il caricamento
      if (!window.React || !window.ReactDOM) {
        console.error("Impossibile caricare React. Fallback alla dashboard standard.");
        showStandardDashboardSections();
        return false;
      }
    }

    // Visualizza un indicatore di caricamento
    showLoadingIndicator(container);

    // Aggiungi classe per il tema corrente al container
    updateContainerThemeClass(container);

    // Aggiungi un listener per i cambiamenti di tema
    addThemeChangeListener(container);

    // Verifica che il componente EnhancedDashboard sia già stato definito
    if (window.EnhancedDashboard) {
      console.log("Componente EnhancedDashboard già disponibile in window");
      const success = renderDashboard(window.EnhancedDashboard, data, container);
      return success;
    }

    // Strategia 1: Caricamento diretto dello script
    const success = await loadEnhancedDashboardScript();

    if (success && window.EnhancedDashboard) {
      console.log("EnhancedDashboard caricato con successo tramite script");
      return renderDashboard(window.EnhancedDashboard, data, container);
    }

    // Strategia 2: Definizione diretta del componente
    console.log("Definizione diretta del componente React EnhancedDashboard");

    // Definisci il componente React direttamente
    window.EnhancedDashboard = defineEnhancedDashboardComponent();

    // Renderizza il componente definito
    return renderDashboard(window.EnhancedDashboard, data, container);

  } catch (error) {
    console.error("Errore durante il caricamento della dashboard avanzata:", error);
    showErrorMessage(container, error);
    showStandardDashboardSections();
    return false;
  }
}

/**
 * Nasconde tutte le sezioni della dashboard standard
 */
function hideStandardDashboardSections() {
  const standardSections = [
    'scoreOverview',
    'webVitalsSection',
    'economicBenefits',
    'resourceList',
    'optimizationList'
  ];

  // Salva lo stato corrente per il ripristino se non è già stato salvato
  if (!window._dashboardState) {
    window._dashboardState = {};
  }

  standardSections.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      // Ottieni il container genitore della sezione
      const parentSection = element.closest('.detail-section');
      if (parentSection) {
        // Salva lo stato attuale di visualizzazione
        window._dashboardState[parentSection.id || `parent_of_${id}`] = parentSection.style.display;
        parentSection.style.display = 'none';
      } else if (element.parentElement) {
        // Caso alternativo per elementi che non sono in un .detail-section
        window._dashboardState[id] = element.parentElement.style.display;
        element.parentElement.style.display = 'none';
      }
    }
  });

  // Nascondi anche eventuali sezioni detail-section eccetto il container React
  document.querySelectorAll('.detail-section').forEach(section => {
    const id = section.id || '';
    if (!id.includes('enhancedDashboard') && !id.includes('dashboardContainer')) {
      window._dashboardState[`section_${id}`] = section.style.display;
      section.style.display = 'none';
    }
  });

  // Log di debug
  console.log("Dashboard standard nascosta", window._dashboardState);
}

/**
 * Mostra le sezioni della dashboard standard
 */
function showStandardDashboardSections() {
  const standardSections = [
    'scoreOverview',
    'webVitalsSection',
    'economicBenefits',
    'resourceList',
    'optimizationList'
  ];

  console.log("Ripristino dashboard standard", window._dashboardState || "nessuno stato salvato");

  standardSections.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      // Ottieni il container genitore della sezione
      const parentSection = element.closest('.detail-section');
      if (parentSection) {
        // Ripristina lo stato originale del genitore
        const stateKey = parentSection.id || `parent_of_${id}`;
        const originalDisplay = (window._dashboardState && window._dashboardState[stateKey]) ||
                               (window._originalDashboardState && window._originalDashboardState[stateKey]) ||
                               'block';
        parentSection.style.display = originalDisplay !== 'none' ? originalDisplay : 'block';
      } else if (element.parentElement) {
        // Caso alternativo
        const originalDisplay = (window._dashboardState && window._dashboardState[id]) || 'block';
        element.parentElement.style.display = originalDisplay !== 'none' ? originalDisplay : 'block';
      }
    }
  });

  // Ripristina anche eventuali sezioni detail-section
  document.querySelectorAll('.detail-section').forEach(section => {
    const id = section.id || '';
    if (!id.includes('enhancedDashboard') && !id.includes('dashboardContainer')) {
      const stateKey = `section_${id}`;
      const originalDisplay = (window._dashboardState && window._dashboardState[stateKey]) ||
                            (window._originalDashboardState && window._originalDashboardState[id]) ||
                            'block';
      section.style.display = originalDisplay !== 'none' ? originalDisplay : 'block';
    }
  });
}

/**
 * Aggiunge classe per il tema corrente al container
 */
function updateContainerThemeClass(container) {
  // Rimuovi prima le classi di tema esistenti
  container.classList.remove('theme-light', 'theme-dark');

  // Aggiungi la classe appropriata in base al tema corrente
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  container.classList.add(`theme-${currentTheme}`);
}

/**
 * Aggiunge un listener per i cambiamenti di tema
 */
function addThemeChangeListener(container) {
  // Rimuovi eventuali listener esistenti per evitare duplicati
  if (window._themeChangeListenerAdded) {
    return;
  }

  // Definisci una funzione per gestire i cambiamenti di tema
  const handleThemeChange = () => {
    updateContainerThemeClass(container);
  };

  // Aggiungi il listener
  window.addEventListener('themechange', handleThemeChange);

  // Osserva anche cambiamenti all'attributo data-theme
  if (window.MutationObserver) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          handleThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Salva l'observer per evitare perdite di memoria
    window._themeObserver = observer;
  }

  window._themeChangeListenerAdded = true;

  // Aggiorna immediatamente
  handleThemeChange();
}

/**
 * Mostra un indicatore di caricamento nella dashboard
 * @param {HTMLElement} container - Container per la dashboard
 */
function showLoadingIndicator(container) {
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
}

/**
 * Mostra un messaggio di errore nella dashboard
 * @param {HTMLElement} container - Container per la dashboard
 * @param {Error} error - Errore da mostrare
 */
function showErrorMessage(container, error) {
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
            <p class="text-red-700 dark:text-red-300 text-sm mt-2">
              Dettaglio errore: ${error.message || 'Errore sconosciuto'}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Carica React e ReactDOM se non sono disponibili
 * @returns {Promise<boolean>}
 */
async function loadReactLibraries() {
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      // Verifica se lo script è già stato caricato
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve(true);
        return;
      }

      console.log(`Caricamento script: ${src}`);
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        console.log(`Script caricato con successo: ${src}`);
        resolve(true);
      };
      script.onerror = (err) => {
        console.error(`Errore caricamento script: ${src}`, err);
        reject(err);
      };
      document.head.appendChild(script);
    });
  };

  try {
    // Carica React e ReactDOM da CDN
    if (!window.React) {
      await loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
    }
    if (!window.ReactDOM) {
      await loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
    }

    // Verifica che i componenti siano stati caricati correttamente
    if (!window.React || !window.ReactDOM) {
      // Prova un'ultima volta con un breve timeout
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log("React e ReactDOM caricati con successo");
    return true;
  } catch (error) {
    console.error("Errore durante il caricamento di React:", error);
    return false;
  }
}

/**
 * Carica il componente EnhancedDashboard tramite uno script
 * @returns {Promise<boolean>}
 */
async function loadEnhancedDashboardScript() {
  return new Promise((resolve) => {
    // Se il componente è già definito, restituisci immediatamente true
    if (window.EnhancedDashboard) {
      resolve(true);
      return;
    }

    // Prova a caricare come modulo ES
    import('/static/js/modules/enhanced-dashboard.js')
      .then(module => {
        window.EnhancedDashboard = module.default || module;
        console.log("Enhanced dashboard module caricato con successo");
        resolve(true);
      })
      .catch(err => {
        console.warn("Impossibile caricare come modulo ES:", err);

        // Fallback: definisci il componente direttamente tramite script
        const script = document.createElement('script');
        script.innerHTML = `
          // Definisci il componente EnhancedDashboard globalmente
          window.EnhancedDashboard = ${defineEnhancedDashboardComponent.toString()}();
        `;

        script.onload = () => {
          console.log("Script EnhancedDashboard caricato con successo");
          resolve(true);
        };

        script.onerror = (err) => {
          console.error("Errore caricamento script EnhancedDashboard:", err);
          resolve(false);
        };

        document.head.appendChild(script);

        // Fallback resolve in caso lo script non scatti gli eventi
        setTimeout(() => {
          if (window.EnhancedDashboard) {
            resolve(true);
          } else {
            resolve(false);
          }
        }, 1000);
      });
  });
}

/**
 * Renderizza la dashboard React
 * @param {Function} EnhancedDashboard - Componente React della dashboard
 * @param {Object} data - Dati di analisi
 * @param {HTMLElement} container - Container per la dashboard
 * @returns {boolean} - True se il rendering è avvenuto con successo
 */
function renderDashboard(EnhancedDashboard, data, container) {
  console.log("Rendering componente React EnhancedDashboard...");

  try {
    // Assicurati che i dati minimi siano disponibili
    data = ensureMinimumData(data);

    // Crea un elemento wrapper per gestire meglio i fallimenti di render
    const wrapperElement = document.createElement('div');
    wrapperElement.className = 'enhanced-dashboard-wrapper';
    container.innerHTML = ''; // Svuota il container prima di aggiungere il wrapper
    container.appendChild(wrapperElement);

    // Salva un riferimento al container wrapper nel window per eventuale debugging
    window._enhancedDashboardWrapper = wrapperElement;

    // Usa createRoot per React 18
    if (window.ReactDOM.createRoot) {
      console.log("Usando ReactDOM.createRoot (React 18+)");
      try {
        const root = window.ReactDOM.createRoot(wrapperElement);
        root.render(window.React.createElement(EnhancedDashboard, { data }));

        // Salva il root per eventuale cleanup
        window._reactRoot = root;
      } catch (e) {
        console.error("Errore con createRoot:", e);
        throw e;
      }
    } else {
      // Fallback a render per versioni precedenti
      console.log("Usando ReactDOM.render (React < 18)");
      window.ReactDOM.render(
        window.React.createElement(EnhancedDashboard, { data }),
        wrapperElement
      );
    }

    console.log("Dashboard avanzata renderizzata con successo!");
    return true;
  } catch (error) {
    console.error("Errore durante il rendering della dashboard:", error);
    showErrorMessage(container, error);
    showStandardDashboardSections();
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
    estimated_monthly_visits: 0,
    costs_breakdown: {},
    savings_breakdown: {}
  };

  // Garantisce risorse e ottimizzazioni
  data.resources = data.resources || {};
  data.optimizations = data.optimizations || [];

  return data;
}

/**
 * Definisce il componente EnhancedDashboard come funzione
 * @returns {Function} - Componente React EnhancedDashboard
 */
function defineEnhancedDashboardComponent() {
  return function EnhancedDashboard({ data }) {
    const React = window.React;
    const [activeTab, setActiveTab] = React.useState('sustainability');

    // Estrazione dei dati necessari
    const metrics = data?.metrics || {};
    const webVitals = metrics?.web_vitals || {};
    const resources = data?.resources || {};
    const optimizations = data?.optimizations || [];
    const economicBenefits = metrics?.economic_benefits || {};

    // Colori per i punteggi
    const getScoreColor = (score) => {
      if (score >= 80) return '#10b981'; // verde
      if (score >= 50) return '#f59e0b'; // giallo
      return '#ef4444'; // rosso
    };

    // Formatta i numeri grandi
    const formatNumber = (num) => {
      if (!num) return '0';
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toString();
    };

    // Componente per una metrica
    const MetricCard = ({ title, value, prefix = '', suffix = '', color, description = '', isHighlighted = false }) => (
      React.createElement('div', {
        className: `p-4 rounded-lg shadow-md ${isHighlighted ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' : 'bg-white dark:bg-gray-800'} transition-transform hover:transform hover:scale-105`
      }, [
        React.createElement('div', { className: 'flex justify-between items-start mb-3' }, [
          React.createElement('h3', { className: `text-sm font-medium ${isHighlighted ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}` }, title),
          React.createElement('div', { className: `p-2 rounded-full ${isHighlighted ? 'bg-white/20' : ''}`, style: !isHighlighted ? {color} : {} },
            React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', className: 'h-5 w-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
              React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' })
            )
          )
        ]),
        React.createElement('div', { className: 'flex items-baseline' },
          React.createElement('span', {
            className: `text-2xl font-bold ${isHighlighted ? 'text-white' : 'text-gray-800 dark:text-white'}`,
            style: !isHighlighted ? {color} : {}
          }, `${prefix}${typeof value === 'number' ? value.toFixed(2).replace(/\.?0+$/, '') : value}${suffix}`)
        ),
        description && React.createElement('p', { className: `mt-1 text-xs ${isHighlighted ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}` }, description)
      ])
    );

    return React.createElement('div', { className: 'p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg' }, [
      // Banner che indica l'uso della dashboard avanzata
      React.createElement('div', { className: 'mb-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700' },
        React.createElement('div', { className: 'flex items-center' }, [
          React.createElement('div', { className: 'w-10 h-10 flex items-center justify-center rounded-full bg-green-500 text-white' },
            React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', className: 'h-6 w-6', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' },
              React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M13 10V3L4 14h7v7l9-11h-7z' })
            )
          ),
          React.createElement('div', { className: 'ml-4' }, [
            React.createElement('h3', { className: 'text-lg font-bold text-green-800 dark:text-green-200' }, 'Dashboard Avanzata'),
            React.createElement('p', { className: 'text-green-700 dark:text-green-300' }, 'Visualizzazione con dati avanzati di Lighthouse attiva')
          ])
        ])
      ),

      // Tabs per navigare tra le sezioni
      React.createElement('div', { className: 'flex flex-wrap border-b border-gray-200 dark:border-gray-700 mb-6' }, [
        React.createElement('button', {
          className: `px-4 py-2 font-medium rounded-t-lg text-sm mr-2 ${
            activeTab === 'sustainability'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`,
          onClick: () => setActiveTab('sustainability')
        }, 'Sostenibilità'),

        React.createElement('button', {
          className: `px-4 py-2 font-medium rounded-t-lg text-sm mr-2 ${
            activeTab === 'performance'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`,
          onClick: () => setActiveTab('performance')
        }, 'Performance'),

        React.createElement('button', {
          className: `px-4 py-2 font-medium rounded-t-lg text-sm mr-2 ${
            activeTab === 'economics'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`,
          onClick: () => setActiveTab('economics')
        }, 'Economia'),

        React.createElement('button', {
          className: `px-4 py-2 font-medium rounded-t-lg text-sm ${
            activeTab === 'optimizations'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`,
          onClick: () => setActiveTab('optimizations')
        }, 'Ottimizzazioni')
      ]),

      // Pannello Sostenibilità
      activeTab === 'sustainability' && React.createElement('div', { className: 'animate-fade-in' }, [
        React.createElement('h2', { className: 'text-xl font-bold text-gray-800 dark:text-white mb-4' }, 'Sostenibilità Digitale'),

        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6' }, [
          React.createElement(MetricCard, {
            title: 'Punteggio Sostenibilità',
            value: metrics.sustainability_score || 0,
            suffix: '/100',
            color: getScoreColor(metrics.sustainability_score || 0)
          }),
          React.createElement(MetricCard, {
            title: 'Emissioni CO₂',
            value: metrics.co2_emissions || 0,
            suffix: 'g/view',
            color: '#3b82f6'
          }),
          React.createElement(MetricCard, {
            title: 'Dimensione Totale',
            value: metrics.total_size || '0 KB',
            color: '#8b5cf6'
          }),
          React.createElement(MetricCard, {
            title: 'Tempo di Caricamento',
            value: metrics.load_time || 0,
            suffix: 's',
            color: metrics.load_time > 3 ? '#ef4444' : '#10b981'
          })
        ])
      ]),

      // Pannello Performance
      activeTab === 'performance' && React.createElement('div', { className: 'animate-fade-in' }, [
        React.createElement('h2', { className: 'text-xl font-bold text-gray-800 dark:text-white mb-4' }, 'Core Web Vitals e Performance'),

        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6' }, [
          React.createElement(MetricCard, {
            title: 'LCP',
            value: webVitals.lcp || 0,
            suffix: 's',
            color: webVitals.lcp > 4 ? '#ef4444' : webVitals.lcp > 2.5 ? '#f59e0b' : '#10b981',
            description: 'Largest Contentful Paint'
          }),
          React.createElement(MetricCard, {
            title: 'FID',
            value: webVitals.fid || 0,
            suffix: 'ms',
            color: webVitals.fid > 300 ? '#ef4444' : webVitals.fid > 100 ? '#f59e0b' : '#10b981',
            description: 'First Input Delay'
          }),
          React.createElement(MetricCard, {
            title: 'CLS',
            value: webVitals.cls || 0,
            color: webVitals.cls > 0.25 ? '#ef4444' : webVitals.cls > 0.1 ? '#f59e0b' : '#10b981',
            description: 'Cumulative Layout Shift'
          }),
          React.createElement(MetricCard, {
            title: 'Performance',
            value: webVitals.lighthouse_score || 0,
            suffix: '/100',
            color: getScoreColor(webVitals.lighthouse_score || 0),
            isHighlighted: true
          })
        ])
      ]),

      // Pannello Economico
      activeTab === 'economics' && React.createElement('div', { className: 'animate-fade-in' }, [
        React.createElement('h2', { className: 'text-xl font-bold text-gray-800 dark:text-white mb-4' }, 'Benefici Economici'),

        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6' }, [
          React.createElement(MetricCard, {
            title: 'Costo Mensile',
            value: economicBenefits.current_monthly_cost || 0,
            prefix: '€',
            color: '#ef4444'
          }),
          React.createElement(MetricCard, {
            title: 'Risparmio Potenziale',
            value: economicBenefits.potential_annual_savings || 0,
            prefix: '€',
            suffix: '/anno',
            color: '#10b981',
            isHighlighted: true
          }),
          React.createElement(MetricCard, {
            title: 'Riduzione Costi',
            value: economicBenefits.potential_savings_percent || 0,
            suffix: '%',
            color: '#3b82f6'
          }),
          React.createElement(MetricCard, {
            title: 'Visite Mensili',
            value: formatNumber(economicBenefits.estimated_monthly_visits || 0),
            color: '#8b5cf6'
          })
        ])
      ]),

      // Pannello Ottimizzazioni
      activeTab === 'optimizations' && React.createElement('div', { className: 'animate-fade-in' }, [
        React.createElement('h2', { className: 'text-xl font-bold text-gray-800 dark:text-white mb-4' }, 'Opportunità di Ottimizzazione'),

        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-6' },
          optimizations.map((opt, index) =>
            React.createElement('div', {
              key: index,
              className: `bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 ${
                opt.priority === 'high'
                  ? 'border-red-500'
                  : opt.priority === 'medium'
                  ? 'border-amber-500'
                  : 'border-green-500'
              } hover:shadow-lg transition-shadow duration-300`
            }, [
              React.createElement('h3', { className: 'text-base font-semibold text-gray-800 dark:text-white mb-2' }, opt.title),
              React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400 mb-3' }, opt.description),
              React.createElement('div', { className: 'flex flex-wrap gap-2 text-xs' }, [
                React.createElement('span', { className: 'px-2 py-1 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded' },
                  `CO₂: ${opt.impact}g`
                ),
                React.createElement('span', { className: 'px-2 py-1 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded' },
                  `Risparmio: €${opt.economic_impact}`
                ),
                React.createElement('span', { className: 'px-2 py-1 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded' },
                  opt.resource_type
                )
              ])
            ])
          )
        )
      ])
    ]);
  };
}