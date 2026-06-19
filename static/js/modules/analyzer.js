/**
 * modules/analyzer.js - Versione semplificata che utilizza automaticamente il miglior analizzatore disponibile
 */

/**
 * Inizializza l'analizzatore
 */
export function initializeAnalyzer() {
  const analyzerForm = document.getElementById('analyzerForm');
  if (!analyzerForm) return;

  // Verifica se l'handler è già impostato per evitare duplicazioni
  if (!analyzerForm._handlerInitialized) {
    // Implementa correttamente la delega degli eventi per un DOM più pulito
    analyzerForm.addEventListener('submit', handleAnalysisSubmit);
    analyzerForm._handlerInitialized = true;
  }

  // Gestisci altre interazioni del form
  const toggleAdvancedBtn = document.getElementById('toggleAdvanced');
  if (toggleAdvancedBtn && !toggleAdvancedBtn._handlerInitialized) {
    toggleAdvancedBtn.addEventListener('click', toggleAdvancedOptions);
    toggleAdvancedBtn._handlerInitialized = true;
    toggleAdvancedBtn.setAttribute('aria-expanded', 'false');
  }

  // Pre-popola il form se ci sono parametri nell'URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlToAnalyze = urlParams.get('url');
  if (urlToAnalyze) {
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
      urlInput.value = urlToAnalyze;
      // Opzionalmente avvia automaticamente l'analisi
      // analyzerForm.dispatchEvent(new Event('submit'));
    }
  }

  // Aggiungi funzionalità al pulsante di download
  const downloadReportBtn = document.getElementById('downloadReportBtn');
  if (downloadReportBtn && !downloadReportBtn._handlerInitialized) {
    downloadReportBtn.addEventListener('click', handleReportDownload);
    downloadReportBtn._handlerInitialized = true;
  }

  // Aggiungi funzionalità al pulsante di condivisione
  const shareReportBtn = document.getElementById('shareReportBtn');
  if (shareReportBtn && !shareReportBtn._handlerInitialized) {
    shareReportBtn.addEventListener('click', handleShareResults);
    shareReportBtn._handlerInitialized = true;
  }
}

/**
 * Gestisce l'invio del form di analisi
 * @param {Event} e - Evento submit
 */
async function handleAnalysisSubmit(e) {
  e.preventDefault();

  const analyzerForm = e.currentTarget;
  const urlInput = document.getElementById('urlInput');
  const loadingSection = document.getElementById('loadingSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const errorMessage = document.getElementById('errorMessage');
  const submitButton = analyzerForm?.querySelector('.submit-btn');
  const loadingMessage = document.getElementById('loadingMessage');

  if (analyzerForm?._analysisInProgress) {
    return;
  }

  // Valida l'input
  if (!urlInput || !urlInput.value) {
    showError(errorMessage, "Inserisci un URL valido");
    return;
  }

  // Ottieni le visite mensili
  const monthlyVisitsInput = document.getElementById('monthlyVisits');
  let monthlyVisits = 10000; // Valore predefinito

  if (monthlyVisitsInput && monthlyVisitsInput.value) {
    const parsedValue = parseInt(monthlyVisitsInput.value, 10);
    if (!isNaN(parsedValue) && parsedValue > 0) {
      monthlyVisits = parsedValue;
    }
  }

  // Nascondi errori precedenti
  if (errorMessage) {
    errorMessage.style.display = 'none';
  }

  setAnalysisInProgress(analyzerForm, submitButton, true);

  // Mostra il caricamento
  if (loadingSection) {
    loadingSection.style.display = 'block';
    loadingSection.removeAttribute('aria-hidden');

    if (loadingMessage) {
      loadingMessage.textContent = 'Audit in corso, raccolgo evidenze tecniche...';
    }

    requestAnimationFrame(() => {
      loadingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (dashboardSection) {
    dashboardSection.style.display = 'none';
  }

  try {
    // Chiama l'API per l'analisi - il backend selezionerà automaticamente il miglior analizzatore
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: urlInput.value,
        monthly_visits: monthlyVisits
      }),
    });

    const data = await response.json();

    // Nascondi il caricamento
    if (loadingSection) {
      loadingSection.style.display = 'none';
      loadingSection.setAttribute('aria-hidden', 'true');
    }

    if (!data.success) {
      // Mostra errore
      showError(errorMessage, data.error || "Si è verificato un errore durante l'analisi");
      setAnalysisInProgress(analyzerForm, submitButton, false);
      return;
    }

    // Salva i dati per uso futuro
    window.analysisData = data;
    try {
      localStorage.setItem('analysisData', JSON.stringify(data));
    } catch (e) {
      console.warn('Impossibile salvare i dati in localStorage:', e);
    }

    // Carica il modulo dashboard unificato
    const dashboardModule = await import('./unified-dashboard.js');

    if (dashboardModule.populateDashboard && dashboardSection) {
      try {
        await dashboardModule.populateDashboard(data);
      } catch (err) {
        console.error('Errore durante il popolamento della dashboard:', err);
      }

      // Mostra la dashboard
      dashboardSection.style.display = 'block';
      dashboardSection.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (error) {
    console.error('Errore durante l\'analisi:', error);

    // Nascondi il caricamento
    if (loadingSection) {
      loadingSection.style.display = 'none';
      loadingSection.setAttribute('aria-hidden', 'true');
    }

    // Mostra errore
    showError(errorMessage, "Si è verificato un errore durante l'analisi: " + (error.message || 'Errore sconosciuto'));
  } finally {
    setAnalysisInProgress(analyzerForm, submitButton, false);
  }
}

function setAnalysisInProgress(form, submitButton, isInProgress) {
  if (form) {
    form._analysisInProgress = isInProgress;
    form.setAttribute('aria-busy', isInProgress ? 'true' : 'false');
  }

  if (!submitButton) return;

  submitButton.disabled = isInProgress;
  submitButton.innerHTML = isInProgress
    ? '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i><span>Audit in corso...</span>'
    : '<i class="fas fa-magnifying-glass" aria-hidden="true"></i><span>Prepara audit</span>';
}

/**
 * Gestisce il download del report
 */
function handleReportDownload() {
  // Mostrar mensaje informativo de que la característica está deshabilitada temporalmente
  alert('La funzionalità di download del report PDF è temporaneamente disabilitata. Questa funzione sarà disponibile in un aggiornamento futuro.');

  /* Código anterior comentado
  const analysisData = window.analysisData;
  if (!analysisData) {
    alert('Nessuna analisi disponibile da scaricare!');
    return;
  }

  // Usa ID dell'analisi o un timestamp come fallback
  const analysisId = analysisData.id || Date.now();

  // Reindirizza all'endpoint di download
  window.location.href = `/api/report/${analysisId}`;
  */
}

/**
 * Gestisce la condivisione dei risultati
 */
function handleShareResults() {
  const analysisData = window.analysisData;
  if (!analysisData) {
    alert('Nessuna analisi disponibile da condividere!');
    return;
  }

  // Esempio base di condivisione
  if (navigator.share) {
    // API Web Share
    navigator.share({
      title: `Analisi di Sostenibilità Web: ${analysisData.domain}`,
      text: `Il sito ${analysisData.domain} ha un punteggio di sostenibilità di ${analysisData.metrics.sustainability_score}/100.`,
      url: window.location.href
    }).catch(err => {
      console.error('Errore nella condivisione:', err);
    });
  } else {
    // Fallback: copia l'URL negli appunti
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('URL copiato negli appunti!');
    }).catch(err => {
      console.error('Errore nella copia URL:', err);
      alert(`Copia manualmente questo URL: ${url}`);
    });
  }
}

/**
 * Mostra un messaggio di errore
 * @param {HTMLElement} errorElement - Elemento HTML per l'errore
 * @param {string} message - Messaggio di errore
 */
function showError(errorElement, message) {
  if (!errorElement) return;

  errorElement.textContent = message;
  errorElement.style.display = 'block';

  // Scroll fino al messaggio di errore
  errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Gestisce il toggle delle opzioni avanzate
 */
function toggleAdvancedOptions() {
  const advancedOptions = document.getElementById('advancedOptions');
  if (!advancedOptions) return;

  const isHidden = advancedOptions.style.display === 'none';
  advancedOptions.style.display = isHidden ? 'block' : 'none';

  // Aggiorna il testo del pulsante e l'attributo aria-expanded
  this.innerHTML = isHidden ?
    '<i class="fas fa-sliders"></i> Nascondi parametri' :
    '<i class="fas fa-sliders"></i> Parametri';
  this.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
}

// Esporta funzioni aggiuntive se necessario
export { showError, toggleAdvancedOptions, handleAnalysisSubmit };
