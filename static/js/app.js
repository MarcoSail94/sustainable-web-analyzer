/**
 * app.js - Punto di ingresso principale con code splitting
 */

// Import dei moduli di base che sono sempre necessari
import './utils/formatters.js';
import './main.js';

// Lazy loading dei moduli per l'analisi
document.addEventListener('DOMContentLoaded', () => {
  // Rileva quale pagina è attualmente caricata
  const currentPage = getCurrentPage();

  // Carica solo i moduli necessari per la pagina attuale
  if (currentPage === 'index') {
    // Nella pagina principale, carica solo ciò che serve per il form di analisi
    import('./modules/analyzer.js').then(module => {
      // Inizializza analyzer quando il modulo è disponibile
      if (module.initializeAnalyzer) {
        module.initializeAnalyzer();
      }
    });
  } else if (currentPage === 'dashboard') {
    // Carica i moduli di visualizzazione solo quando l'utente arriva alla dashboard
    Promise.all([
      import('./modules/dashboard.js'),
      import('./modules/charts.js'),
      import('./modules/webVitals.js'),
      import('./modules/economics.js')
    ]).then(modules => {
      // Inizializza la dashboard quando tutti i moduli sono disponibili
      const [dashboardModule] = modules;
      if (dashboardModule.populateDashboard) {
        // Ottieni i dati dell'analisi dal localStorage o dall'API
        const analysisData = getAnalysisData();
        if (analysisData) {
          dashboardModule.populateDashboard(analysisData);
        }
      }
    });
  } else if (currentPage === 'methodology' || currentPage === 'about') {
    // Carica eventuali moduli specifici per queste pagine
    import('./pages/' + currentPage + '.js').catch(() => {
      console.log('Nessun modulo specifico da caricare per questa pagina');
    });
  }

  // Lazy load delle animazioni per tutte le pagine
  import('./utils/animations.js').then(module => {
    if (module.initAnimations) {
      module.initAnimations();
    }
  });

  // Carica il sistema di temi per tutte le pagine
  import('./utils/theme.js').then(module => {
    if (module.initTheme) {
      module.initTheme();
    }
  });
});

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