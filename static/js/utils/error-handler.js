/**
 * Global error handling system that provides consistent error messages
 * and recovery suggestions for various error scenarios.
 */

// Error categories and their user-friendly messages
const ERROR_TYPES = {
  // Network errors
  'NETWORK': {
    title: 'Errore di connessione',
    description: 'Impossibile connettersi al sito. Verifica la tua connessione internet o l\'URL inserito.',
    icon: 'fa-wifi',
    suggestions: [
      'Controlla che il sito sia raggiungibile',
      'Verifica la tua connessione internet',
      'Prova a disabilitare firewall o proxy'
    ]
  },
  // Timeout errors
  'TIMEOUT': {
    title: 'Tempo di analisi esaurito',
    description: 'L\'analisi ha impiegato troppo tempo. Il sito potrebbe essere troppo complesso o lento.',
    icon: 'fa-hourglass-end',
    suggestions: [
      'Riprova con un timeout più lungo',
      'Analizza una pagina più semplice del sito',
      'Controlla se il sito risponde lentamente anche normalmente'
    ]
  },
  // Invalid URL
  'INVALID_URL': {
    title: 'URL non valido',
    description: 'L\'URL inserito non è valido o non può essere analizzato.',
    icon: 'fa-exclamation-triangle',
    suggestions: [
      'Verifica che l\'URL sia scritto correttamente',
      'Assicurati di includere http:// o https://',
      'Prova con un altro sito'
    ]
  },
  // Server errors
  'SERVER_ERROR': {
    title: 'Errore del server',
    description: 'Si è verificato un errore interno del server durante l\'analisi.',
    icon: 'fa-server',
    suggestions: [
      'Riprova tra qualche minuto',
      'Contatta l\'amministratore del sito se l\'errore persiste',
      'Prova con un sito diverso'
    ]
  },
  // Script errors
  'SCRIPT_ERROR': {
    title: 'Errore di esecuzione',
    description: 'Si è verificato un errore durante l\'esecuzione degli script di analisi.',
    icon: 'fa-bug',
    suggestions: [
      'Riprova l\'analisi',
      'Disabilita eventuali estensioni del browser',
      'Prova con un browser diverso'
    ]
  },
  // Permission errors
  'PERMISSION_ERROR': {
    title: 'Errore di permessi',
    description: 'Non è stato possibile accedere al sito a causa di restrizioni di permessi.',
    icon: 'fa-lock',
    suggestions: [
      'Verifica che il sito non richieda autenticazione',
      'Controlla eventuali blocchi CORS',
      'Alcuni siti potrebbero bloccare l\'analisi automatica'
    ]
  },
  // Default error
  'UNKNOWN': {
    title: 'Errore sconosciuto',
    description: 'Si è verificato un errore imprevisto durante l\'analisi.',
    icon: 'fa-question-circle',
    suggestions: [
      'Riprova l\'analisi',
      'Prova con un sito diverso',
      'Controlla la console del browser per dettagli'
    ]
  }
};

/**
 * Determina il tipo di errore dalla risposta o dall'eccezione
 * @param {Object|Error} errorData - Dati di errore (response JSON o eccezione)
 * @returns {string} - Tipo di errore identificato
 */
function determineErrorType(errorData) {
  if (!errorData) return 'UNKNOWN';

  // Se è un oggetto di risposta API
  if (errorData.error_type) {
    const errorMsg = errorData.error || '';

    if (errorData.error_type === 'TimeoutError' || errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
      return 'TIMEOUT';
    }

    if (errorData.error_type === 'ConnectionError' || errorMsg.includes('connect') || errorMsg.includes('network')) {
      return 'NETWORK';
    }

    if (errorMsg.includes('permission') || errorMsg.includes('access') || errorMsg.includes('CORS')) {
      return 'PERMISSION_ERROR';
    }

    if (errorMsg.includes('URL') || errorMsg.includes('url') || errorMsg.includes('domain')) {
      return 'INVALID_URL';
    }

    if (errorData.error_type.includes('Server') || errorMsg.includes('server') || errorData.error_type.includes('HTTP')) {
      return 'SERVER_ERROR';
    }
  }
  // Se è un'eccezione JavaScript
  else if (errorData instanceof Error) {
    const errorMsg = errorData.message || '';

    if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
      return 'TIMEOUT';
    }

    if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('AJAX')) {
      return 'NETWORK';
    }

    if (errorMsg.includes('script') || errorMsg.includes('undefined') || errorMsg.includes('null')) {
      return 'SCRIPT_ERROR';
    }
  }

  return 'UNKNOWN';
}

/**
 * Mostra un errore user-friendly nell'elemento specificato
 * @param {HTMLElement} container - Elemento contenitore per il messaggio
 * @param {Object|Error|string} errorData - Dati dell'errore o messaggio
 */
export function showError(container, errorData) {
  if (!container) {
    console.error('Container elemento non specificato per l\'errore:', errorData);
    return;
  }

  // Se è una stringa, crea un oggetto errore semplice
  if (typeof errorData === 'string') {
    errorData = { error: errorData };
  }

  // Determina il tipo di errore
  const errorType = determineErrorType(errorData);
  const errorInfo = ERROR_TYPES[errorType];

  // Pulisci il contenitore
  container.innerHTML = '';
  container.style.display = 'block';

  // Crea il componente di errore
  const errorComponent = document.createElement('div');
  errorComponent.className = 'error-component';

  // Aggiungi il contenuto HTML dell'errore
  errorComponent.innerHTML = `
    <div class="error-header">
      <i class="fas ${errorInfo.icon}"></i>
      <h3>${errorInfo.title}</h3>
    </div>
    <div class="error-body">
      <p>${errorInfo.description}</p>
      <div class="error-details">
        ${errorData.error ? `<p class="error-message">${errorData.error}</p>` : ''}
      </div>
      <div class="error-suggestions">
        <h4>Suggerimenti:</h4>
        <ul>
          ${errorInfo.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
        </ul>
      </div>
      <div class="error-actions">
        <button class="retry-button">Riprova</button>
        <button class="dismiss-button">Chiudi</button>
      </div>
    </div>
  `;

  // Aggiungi l'elemento al container
  container.appendChild(errorComponent);

  // Scrollare fino all'errore
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Aggiungi event listeners per i pulsanti
  const retryButton = errorComponent.querySelector('.retry-button');
  if (retryButton) {
    retryButton.addEventListener('click', () => {
      container.style.display = 'none';
      // Trova il form e ri-sottomettilo se possibile
      const analyzerForm = document.getElementById('analyzerForm');
      if (analyzerForm) {
        analyzerForm.dispatchEvent(new Event('submit'));
      }
    });
  }

  const dismissButton = errorComponent.querySelector('.dismiss-button');
  if (dismissButton) {
    dismissButton.addEventListener('click', () => {
      container.style.display = 'none';
    });
  }

  // Dispatch event for analytics or other components
  document.dispatchEvent(new CustomEvent('analysis:error', {
    detail: {
      type: errorType,
      message: errorData.error || errorInfo.description
    }
  }));
}

/**
 * Aggiungi stili CSS necessari per gli errori
 */
export function injectErrorStyles() {
  if (document.getElementById('error-handler-styles')) return;

  const styleElement = document.createElement('style');
  styleElement.id = 'error-handler-styles';
  styleElement.textContent = `
    .error-component {
      background-color: var(--bg-card, #fff);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      border: 1px solid rgba(220, 38, 38, 0.2);
      margin: 1rem 0;
      animation: fadeIn 0.3s ease;
    }

    .error-header {
      background-color: rgba(220, 38, 38, 0.1);
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid rgba(220, 38, 38, 0.2);
    }

    .error-header i {
      color: rgb(220, 38, 38);
      font-size: 1.5rem;
    }

    .error-header h3 {
      margin: 0;
      font-size: 1.25rem;
      color: rgb(220, 38, 38);
    }

    .error-body {
      padding: 1.25rem;
    }

    .error-message {
      background-color: rgba(220, 38, 38, 0.05);
      padding: 0.75rem;
      border-radius: 4px;
      font-family: monospace;
      margin: 1rem 0;
      overflow-x: auto;
    }

    .error-suggestions {
      margin: 1.25rem 0;
    }

    .error-suggestions h4 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
    }

    .error-suggestions ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .error-suggestions li {
      margin-bottom: 0.5rem;
    }

    .error-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }

    .retry-button, .dismiss-button {
      padding: 0.5rem 1.25rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .retry-button {
      background-color: var(--primary-color, #16a34a);
      color: white;
    }

    .retry-button:hover {
      background-color: var(--primary-dark, #15803d);
    }

    .dismiss-button {
      background-color: #f3f4f6;
      color: #374151;
    }

    .dismiss-button:hover {
      background-color: #e5e7eb;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Dark mode support */
    [data-theme="dark"] .error-component {
      border-color: rgba(248, 113, 113, 0.3);
    }

    [data-theme="dark"] .error-header {
      background-color: rgba(248, 113, 113, 0.15);
      border-color: rgba(248, 113, 113, 0.3);
    }

    [data-theme="dark"] .error-header i,
    [data-theme="dark"] .error-header h3 {
      color: rgb(248, 113, 113);
    }

    [data-theme="dark"] .error-message {
      background-color: rgba(248, 113, 113, 0.1);
    }

    [data-theme="dark"] .dismiss-button {
      background-color: #374151;
      color: #f3f4f6;
    }

    [data-theme="dark"] .dismiss-button:hover {
      background-color: #4b5563;
    }
  `;

  document.head.appendChild(styleElement);
}

/**
 * Inizializza il sistema di gestione errori
 */
export function initErrorHandler() {
  // Inietta gli stili CSS
  injectErrorStyles();

  // Sostituisci la funzione showError esistente in analyzer.js
  // Questo dovrebbe essere fatto nel punto di ingresso dell'applicazione
  if (window.showError) {
    console.log('Sostituisco la funzione showError esistente');
    window.originalShowError = window.showError;
    window.showError = showError;
  }

  // Gestione errori globali
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    const errorContainer = document.getElementById('errorMessage');
    if (errorContainer) {
      showError(errorContainer, event.error);
    }
  });

  // Gestione promise non gestite
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    const errorContainer = document.getElementById('errorMessage');
    if (errorContainer) {
      showError(errorContainer, event.reason);
    }
  });
}

export default { showError, initErrorHandler };