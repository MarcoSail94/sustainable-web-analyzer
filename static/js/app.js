/**
 * app.js - Punto di ingresso principale con code splitting avanzato e lazy loading
 * Versione migliorata con:
 * - Caricamento asincrono ottimizzato dei moduli
 * - Lazy loading delle immagini
 * - Prefetching intelligente
 * - Gestione degli stati di caricamento
 * - Supporto avanzato per React e React DOM
 */

// Import moduli globali essenziali
import './main.js';

// Update the MODULES configuration in app.js
const MODULES = {
  analyzer: './modules/analyzer.js',
  unifiedDashboard: './modules/unified-dashboard.js', // Replace dashboard & enhanced-dashboard
  charts: './modules/charts.js',
  webVitals: './modules/webVitals.js',
  economics: './modules/economics.js',
  utils: {
    theme: './utils/theme.js',
    animations: './utils/animations.js',
    formatters: './utils/formatters.js'
  },
  pages: {
    index: './pages/index.js',
    methodology: './pages/methodology.js',
    about: './pages/about.js'
  }
};

// Then update any dashboard loading code to use the unified dashboard
if (appState.currentPage === 'dashboard') {
  // Load the unified dashboard module
  pageModules.push(loadModule(MODULES.unifiedDashboard));
}

/**
 * Cache dei moduli per evitare caricamenti duplicati
 */
const moduleCache = new Map();

/**
 * Registra lo stato dell'applicazione
 */
const appState = {
  currentPage: null,
  loadedModules: [],
  isLoading: false,
  isInitialized: false,
  themeInitialized: false,
  reactInitialized: false
};

/**
 * Inizializza l'applicazione quando il DOM è pronto
 */
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * Funzione principale di inizializzazione
 */
function initializeApp() {
  // Registra la pagina corrente
  appState.currentPage = getCurrentPage();
  console.log(`Inizializzazione per la pagina: ${appState.currentPage}`);

  // Mostra un indicatore di caricamento se necessario
  if (shouldShowLoadingIndicator()) {
    showLoadingIndicator();
  }

  // Verifica la disponibilità di React e ReactDOM
  checkReactAvailability();

  // Inizializzazione prioritaria del tema prima di altri moduli
  initTheme().then(() => {
    // Carica i moduli essenziali per tutte le pagine
    loadCoreModules().then(() => {
      // Carica i moduli specifici per la pagina corrente
      loadPageSpecificModules().then(() => {
        // Rimuovi l'indicatore di caricamento
        hideLoadingIndicator();

        // Registra che l'inizializzazione è completa
        appState.isInitialized = true;

        // Innesca un evento personalizzato per eventuali listener
        document.dispatchEvent(new CustomEvent('app:initialized'));
      });
    });
  });

  // Inizializza l'analizzatore se siamo nella pagina principale
  if (appState.currentPage === 'index') {
    loadModule(MODULES.analyzer).then(module => {
      if (module && module.initializeAnalyzer) {
        module.initializeAnalyzer();
      }
    });
  }

  // Inizializza il lazy loading per le immagini
  initLazyLoadImages();

  // Prefetching intelligente per migliorare la reattività dell'interfaccia
  initPrefetching();
}

/**
 * Verifica la disponibilità di React e ReactDOM e li precarica se necessario
 */
function checkReactAvailability() {
  // Controlla se React e ReactDOM sono disponibili
  if (typeof window.React === 'undefined' || typeof window.ReactDOM === 'undefined') {
    console.warn('React o ReactDOM non sono disponibili. Verranno precaricati per la dashboard avanzata.');

    // Tentativo di pre-caricamento delle librerie
    preloadReactLibraries();
  } else {
    console.log('React e ReactDOM disponibili.');
    appState.reactInitialized = true;
  }
}

/**
 * Pre-carica le librerie React per evitare problemi di rendering
 */
function preloadReactLibraries() {
  // Usa l'attributo preload per caricare le librerie in anticipo
  const preloadReact = document.createElement('link');
  preloadReact.rel = 'preload';
  preloadReact.as = 'script';
  preloadReact.href = 'https://unpkg.com/react@17/umd/react.production.min.js';
  document.head.appendChild(preloadReact);

  const preloadReactDOM = document.createElement('link');
  preloadReactDOM.rel = 'preload';
  preloadReactDOM.as = 'script';
  preloadReactDOM.href = 'https://unpkg.com/react-dom@17/umd/react-dom.production.min.js';
  document.head.appendChild(preloadReactDOM);

  // Carica effettivamente gli script
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        console.log(`Script caricato: ${src}`);
        resolve();
      };
      script.onerror = (err) => {
        console.error(`Errore caricamento script: ${src}`, err);
        reject(err);
      };
      document.head.appendChild(script);
    });
  };

  // Carica React e ReactDOM in sequenza per garantire l'ordine corretto
  loadScript('https://unpkg.com/react@17/umd/react.production.min.js')
    .then(() => loadScript('https://unpkg.com/react-dom@17/umd/react-dom.production.min.js'))
    .then(() => {
      console.log('React e ReactDOM caricati con successo');
      appState.reactInitialized = true;

      // Invia un evento personalizzato per notificare che React è pronto
      document.dispatchEvent(new CustomEvent('react:loaded'));
    })
    .catch(err => console.error('Errore nel caricamento di React:', err));
}

/**
 * Inizializza il sistema di temi
 */
async function initTheme() {
  if (appState.themeInitialized) return;

  try {
    const themeModule = await import('./utils/theme.js');
    if (themeModule.initTheme) {
      themeModule.initTheme();
      appState.themeInitialized = true;
    }
  } catch (error) {
    console.error('Errore durante l\'inizializzazione del tema:', error);
  }
}

/**
 * Carica i moduli fondamentali necessari su tutte le pagine
 */
async function loadCoreModules() {
  const coreModules = [
    loadModule(MODULES.utils.formatters),
    loadModule(MODULES.utils.animations)
  ];

  return Promise.all(coreModules);
}

/**
 * Carica i moduli specifici della pagina corrente
 */
async function loadPageSpecificModules() {
  const pageModules = [];

  switch (appState.currentPage) {
    case 'index':
      // Nella pagina principale, carica il modulo per il form di analisi
      pageModules.push(loadModule(MODULES.analyzer));
      break;

    case 'dashboard':
      // Nella dashboard carica i moduli di visualizzazione e analisi
      pageModules.push(
        loadModule(MODULES.dashboard),
        loadModule(MODULES.charts),
        loadModule(MODULES.webVitals),
        loadModule(MODULES.economics)
      );
      break;

    case 'methodology':
    case 'about':
      // Carica eventuali moduli specifici per queste pagine informative
      const specificPageModule = `./pages/${appState.currentPage}.js`;
      try {
        pageModules.push(loadModule(specificPageModule));
      } catch (e) {
        console.log(`Nessun modulo specifico per ${appState.currentPage}`);
      }
      break;
  }

  return Promise.all(pageModules);
}

/**
 * Carica un modulo in modo asincrono con cache
 * @param {string} modulePath - Percorso del modulo
 * @returns {Promise} - Promise che si risolve quando il modulo è caricato
 */
async function loadModule(modulePath) {
  if (!modulePath) return Promise.resolve(null);

  // Controlla se il modulo è già in cache
  if (moduleCache.has(modulePath)) {
    return moduleCache.get(modulePath);
  }

  try {
    // Carica il modulo in modo asincrono
    const modulePromise = import(modulePath).then(module => {
      // Inizializza il modulo se ha un metodo init
      if (module.init) {
        module.init();
      } else if (module.default && typeof module.default.init === 'function') {
        module.default.init();
      } else if (module.initializeAnalyzer) {
        // Caso specifico per il modulo analyzer
        module.initializeAnalyzer();
      }

      // Registra il modulo caricato
      appState.loadedModules.push(modulePath);

      return module;
    });

    // Memorizza la promise nella cache
    moduleCache.set(modulePath, modulePromise);

    return modulePromise;
  } catch (error) {
    console.error(`Errore durante il caricamento del modulo ${modulePath}:`, error);
    return null;
  }
}

/**
 * Determina se mostrare un indicatore di caricamento
 * @returns {boolean} - True se è necessario un indicatore
 */
function shouldShowLoadingIndicator() {
  // Mostra l'indicatore solo per pagine che richiedono molti dati
  return ['dashboard'].includes(appState.currentPage);
}

/**
 * Mostra l'indicatore di caricamento
 */
function showLoadingIndicator() {
  appState.isLoading = true;

  // Crea un elemento di caricamento se non esiste già
  if (!document.getElementById('app-loading-indicator')) {
    const loader = document.createElement('div');
    loader.id = 'app-loading-indicator';
    loader.className = 'app-loading';
    loader.innerHTML = '<div class="loading-spinner"></div><p>Caricamento in corso...</p>';
    document.body.appendChild(loader);
  } else {
    document.getElementById('app-loading-indicator').style.display = 'flex';
  }
}

/**
 * Nasconde l'indicatore di caricamento
 */
function hideLoadingIndicator() {
  appState.isLoading = false;

  const loader = document.getElementById('app-loading-indicator');
  if (loader) {
    // Anima la scomparsa dell'indicatore
    loader.classList.add('fade-out');

    // Rimuovi dopo l'animazione
    setTimeout(() => {
      loader.style.display = 'none';
      loader.classList.remove('fade-out');
    }, 300);
  }
}

/**
 * Implementa il lazy loading delle immagini
 */
function initLazyLoadImages() {
  // Seleziona tutte le immagini con attributo data-src o class="lazy"
  const lazyImages = document.querySelectorAll('img[data-src], img.lazy');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src || img.getAttribute('data-lazy');

          if (src) {
            // Effetto di dissolvenza per immagini che appaiono
            img.style.opacity = '0';

            // Carica l'immagine
            img.src = src;

            // Quando l'immagine è caricata, la mostra con dissolvenza
            img.onload = () => {
              img.style.transition = 'opacity 0.3s ease-in';
              img.style.opacity = '1';
              img.removeAttribute('data-src');
              img.removeAttribute('data-lazy');
              img.classList.remove('lazy');
            };

            observer.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '200px 0px', // Carica le immagini prima che entrino nel viewport
      threshold: 0.01
    });

    lazyImages.forEach(img => {
      // Imposta un'immagine placeholder molto piccola o un colore solido
      if (!img.src && !img.style.backgroundColor) {
        img.style.backgroundColor = '#f0f0f0';
      }

      imageObserver.observe(img);
    });
  } else {
    // Fallback per browser che non supportano IntersectionObserver
    lazyImages.forEach(img => {
      const src = img.dataset.src || img.getAttribute('data-lazy');
      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
        img.removeAttribute('data-lazy');
        img.classList.remove('lazy');
      }
    });
  }
}

/**
 * Implementa il prefetching intelligente di moduli
 */
function initPrefetching() {
  // Prefetch dei moduli che potrebbero essere necessari nella navigazione successiva
  if (appState.currentPage === 'index') {
    // Se siamo nella home, prefetch la dashboard
    prefetchModule(MODULES.dashboard);

    // Se l'analizzatore React è richiesto, prefetch il modulo enhanced-dashboard
    if (document.getElementById('enhancedDashboardContainer')) {
      prefetchModule('./modules/enhanced-dashboard.js');
    }
  }

  // Aggiunge listener per prefetch sui link
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');

    // Prefetch solo per link interni
    if (href && href.startsWith('/') && !href.startsWith('#')) {
      link.addEventListener('mouseenter', () => {
        // Quando l'utente passa sopra a un link, prefetch la pagina
        const pageName = getPageNameFromHref(href);
        if (pageName && MODULES.pages[pageName]) {
          prefetchModule(MODULES.pages[pageName]);
        }
      });
    }
  });
}

/**
 * Prefetch di un modulo per caricamento anticipato
 * @param {string} modulePath - Percorso del modulo da precaricare
 */
function prefetchModule(modulePath) {
  if (!modulePath || moduleCache.has(modulePath)) return;

  // Utilizza l'hint al browser di prelazione
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = modulePath;
  link.as = 'script';
  document.head.appendChild(link);

  // Registra che abbiamo avviato il prefetching
  moduleCache.set(modulePath, true);
}

/**
 * Estrae il nome della pagina dall'URL
 * @param {string} href - URL della pagina
 * @returns {string} - Nome della pagina
 */
function getPageNameFromHref(href) {
  const path = href.split('/').filter(Boolean);
  return path[0] || 'index';
}

/**
 * Determina la pagina corrente dall'URL
 * @returns {string} - Nome della pagina corrente
 */
function getCurrentPage() {
  const path = window.location.pathname;

  if (path.includes('/methodology')) {
    return 'methodology';
  } else if (path.includes('/about')) {
    return 'about';
  } else if (path.includes('/dashboard')) {
    return 'dashboard';
  } else {
    return 'index';
  }
}

/**
 * Ottiene i dati dell'analisi dal localStorage o dall'URL
 * @returns {Object|null} - Dati dell'analisi o null
 */
function getAnalysisData() {
  // Prima controlla se i dati sono nello stato dell'applicazione
  if (window.analysisData) {
    return window.analysisData;
  }

  // Controlla se i dati sono nel localStorage
  const savedData = localStorage.getItem('analysisData');
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error('Errore nel parsing dei dati salvati:', e);
    }
  }

  // Controlla i parametri URL per un ID di analisi
  const urlParams = new URLSearchParams(window.location.search);
  const analysisId = urlParams.get('id');

  if (analysisId) {
    // Carica i dati tramite API (qui implementazione da completare)
    // ...
  }

  return null;
}

// Esporta funzioni utili
export {
  loadModule,
  getAnalysisData,
  initLazyLoadImages,
  appState,
  checkReactAvailability
};