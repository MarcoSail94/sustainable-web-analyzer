/**
 * unified-dashboard.js - Dashboard unificata per il Sustainable Web Analyzer
 * Gestisce sia dati base che avanzati, mostrando chiaramente quando certe metriche non sono disponibili
 */

// Import utility necessarie
import { formatFileSize, formatCurrency, formatPercent, formatTime, formatCO2 } from '/static/js/utils/formatters.js';
import { createComparisonChart, createCostBreakdownCharts } from '/static/js/modules/charts.js';
import { updateWebVitals, createWebVitalsChart } from '/static/js/modules/webVitals.js';

/**
 * Popolamento principale della dashboard con i dati disponibili
 * @param {Object} data - Dati di analisi
 */
export async function populateDashboard(data) {
  console.log("Populating unified dashboard with data:", data);

  // Verifica la presenza di dati
  if (!data) {
    console.error("Missing data for dashboard population");
    showError("Error loading analysis data");
    return;
  }

  // Mostra il banner che indica la qualità dell'analisi
  showAnalysisQualityBanner(data.metrics_availability);

  // Estrazione dati
  const metrics = data.metrics || {};
  const resources = data.resources || {};
  const optimizations = data.optimizations || [];
  const comparison = data.industry_comparison || {};
  const economicBenefits = metrics.economic_benefits || {};
  const webVitals = metrics.web_vitals || {};

  // Popolamento delle sezioni principali con gestione appropriata
  populateScoreOverview(metrics, comparison);
  populateResourceList(resources);
  populateOptimizations(optimizations);

  // Popola Web Vitals solo se abbiamo i dati o un messaggio esplicito di indisponibilità
  if (webVitals && !webVitals.unavailable) {
    populateWebVitals(webVitals, data.metrics_availability?.web_vitals);
  } else {
    hideWebVitalsSection(webVitals?.reason || "unavailable");
  }

  populateEconomicDetails(economicBenefits, data.metrics_availability?.economics);

  // Creazione dei grafici necessari
  try {
    createCharts(data);
  } catch (error) {
    console.error('Error creating charts:', error);
    showChartError();
  }

  // Se ci sono dati avanzati, popola le sezioni aggiuntive
  if (data.metrics_availability?.sustainability === 'enhanced') {
    console.log("Trovati dati avanzati, tentativo di popolamento metriche avanzate");
    try {
      // Log dei dati delle metriche prima del popolamento
      console.log("Web vitals:", data.metrics.web_vitals);
      console.log("Categoria scores:", data.metrics.web_vitals?.category_scores);
      console.log("Optimization scores:", data.metrics.web_vitals?.optimization_scores);

      populateEnhancedMetrics(data.metrics);
    } catch (error) {
      console.error('Error populating enhanced metrics:', error);
      console.error('Stack trace:', error.stack);
    }
  } else {
    console.log("Dati avanzati non disponibili. Metrics_availability:", data.metrics_availability);
  }

  // Scorri alla dashboard
  const dashboardSection = document.getElementById('dashboardSection');
  if (dashboardSection) {
    dashboardSection.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Mostra un banner che indica la qualità dell'analisi
 * @param {Object} metricsAvailability - Informazioni sulla disponibilità delle metriche
 */
function showAnalysisQualityBanner(metricsAvailability) {
  // Cerca un container esistente o creane uno nuovo
  let bannerContainer = document.getElementById('analysisQualityBanner');

  if (!bannerContainer) {
    bannerContainer = document.createElement('div');
    bannerContainer.id = 'analysisQualityBanner';

    // Inserisci il banner prima della dashboard
    const dashboard = document.getElementById('dashboardSection');
    if (dashboard && dashboard.firstChild) {
      dashboard.insertBefore(bannerContainer, dashboard.firstChild.nextSibling);
    }
  }

  // Determina la qualità complessiva dell'analisi
  let qualityLevel, message, style, icon;

  if (!metricsAvailability) {
    qualityLevel = 'unknown';
  } else if (metricsAvailability.web_vitals === 'available' && metricsAvailability.sustainability === 'enhanced') {
    qualityLevel = 'high';
  } else if (metricsAvailability.web_vitals === 'partial' || metricsAvailability.sustainability === 'standard') {
    qualityLevel = 'medium';
  } else {
    qualityLevel = 'basic';
  }

  switch (qualityLevel) {
    case 'high':
      message = 'Analisi completa con dati avanzati:';
      style = 'bg-green-50 border-green-200 text-green-700';
      icon = '<i class="fas fa-check-circle text-green-500"></i>';
      break;
    case 'medium':
      message = 'Analisi parziale con alcuni dati avanzati:';
      style = 'bg-blue-50 border-blue-200 text-blue-700';
      icon = '<i class="fas fa-info-circle text-blue-500"></i>';
      break;
    case 'basic':
      message = 'Analisi di base con metriche limitate:';
      style = 'bg-amber-50 border-amber-200 text-amber-700';
      icon = '<i class="fas fa-exclamation-triangle text-amber-500"></i>';
      break;
    default:
      message = 'Qualità analisi sconosciuta:';
      style = 'bg-gray-50 border-gray-200 text-gray-700';
      icon = '<i class="fas fa-question-circle text-gray-500"></i>';
  }

  // Crea il contenuto del banner
  bannerContainer.className = `p-3 my-4 rounded-lg border ${style} flex items-center`;
  bannerContainer.innerHTML = `
    <div class="mr-3">${icon}</div>
    <div>
      <span class="font-medium">${message}</span>
      <span class="text-sm ml-2">${getMetricsAvailabilityDescription(metricsAvailability)}</span>
    </div>
  `;
}

/**
 * Popola i dati Web Vitals nella dashboard
 * @param {Object} webVitals - Dati Web Vitals
 * @param {string} availability - Disponibilità dei dati ('available', 'partial', 'unavailable', 'skipped')
 */
function populateWebVitals(webVitals, availability) {
  const webVitalsSection = document.getElementById('webVitalsSection');
  if (!webVitalsSection) {
    console.error('Container webVitalsSection not found');
    return;
  }

  // Nascondi l'intera sezione se i dati sono completamente mancanti
  if (availability === 'unavailable' || availability === 'skipped') {
    showWebVitalsUnavailable(webVitalsSection, availability === 'skipped' ?
      'Web Vitals saltate per questo dominio (impostazione di configurazione)' :
      'Dati Web Vitals non disponibili');
    return;
  }

  // Log dettagliato per debugging
  console.log("Popolamento Web Vitals con dati:", webVitals);
  console.log("LCP:", webVitals.lcp);
  console.log("FID:", webVitals.fid);
  console.log("CLS:", webVitals.cls);
  console.log("Scores:", webVitals.scores);

  // Per dati parziali o completi, aggiorna i valori
  try {
    // IMPORTANTE: per CLS, un valore di 0 o molto piccolo è valido e positivo
    // Non considerarlo come un valore mancante
    updateWebVitalMetric('lcp', webVitals.lcp || null, 's', { good: 2.5, medium: 4.0 }, webVitals.scores?.lcp);
    updateWebVitalMetric('fid', webVitals.fid || null, 'ms', { good: 100, medium: 300 }, webVitals.scores?.fid);

    // Fix specifico per CLS: controlla esplicitamente se è undefined invece di usare || null
    // Questo perché CLS può essere 0 o un valore molto piccolo (che è un buon risultato)
    const clsValue = webVitals.cls !== undefined ? webVitals.cls : null;
    updateWebVitalMetric('cls', clsValue, '', { good: 0.1, medium: 0.25 }, webVitals.scores?.cls);

    // Aggiorna il grafico di confronto Web Vitals se possibile
    if (typeof createWebVitalsChart === 'function') {
      try {
        console.log("Creazione grafico Web Vitals con dati:", webVitals);
        createWebVitalsChart({ metrics: { web_vitals: webVitals } });
      } catch (e) {
        console.error('Error creating Web Vitals chart:', e);
        console.error('Stack trace:', e.stack);
        showWebVitalsChartError();
      }
    }

    // Se i dati sono parziali, mostra un avviso
    if (availability === 'partial') {
      showWebVitalsPartialNotice(webVitalsSection);
    }
  } catch (e) {
    console.error('Error updating Web Vitals:', e);
    console.error('Stack trace:', e.stack);
    showWebVitalsUnavailable(webVitalsSection, 'Errore nell\'aggiornamento dei dati Web Vitals');
  }
}

/**
 * Genera una descrizione della disponibilità delle metriche
 * @param {Object} metricsAvailability - Informazioni sulla disponibilità delle metriche
 * @returns {string} - Descrizione testuale
 */
function getMetricsAvailabilityDescription(metricsAvailability) {
  if (!metricsAvailability) return 'Informazioni sulla qualità dei dati non disponibili';

  const parts = [];

  if (metricsAvailability.web_vitals === 'available') {
    parts.push('Web Vitals completa');
  } else if (metricsAvailability.web_vitals === 'partial') {
    parts.push('Web Vitals parziali');
  } else if (metricsAvailability.web_vitals === 'unavailable') {
    parts.push('Web Vitals non disponibili');
  } else if (metricsAvailability.web_vitals === 'skipped') {
    parts.push('Web Vitals saltate');
  }

  if (metricsAvailability.analyzers_tried && metricsAvailability.analyzers_tried.length > 0) {
    // Trova il miglior analizzatore che ha avuto successo
    let successfulAnalyzer = null;
    if (metricsAvailability.web_vitals === 'available' || metricsAvailability.web_vitals === 'partial') {
      successfulAnalyzer = metricsAvailability.analyzers_tried[0];

      if (successfulAnalyzer === 'enhanced_lighthouse') {
        parts.push('analisi Lighthouse avanzata');
      } else if (successfulAnalyzer === 'standard_lighthouse') {
        parts.push('analisi Lighthouse standard');
      } else {
        parts.push('analisi base');
      }
    } else {
      // Se nessun analizzatore ha avuto successo, indicalo
      parts.push(`${metricsAvailability.analyzers_tried.length} analizzatori tentati`);
    }
  }

  return parts.join(', ');
}

/**
 * Popola la sezione di panoramica punteggi con gestione per dati mancanti
 * @param {Object} metrics - Metriche di sostenibilità
 * @param {Object} comparison - Dati di confronto con altri siti
 */
function populateScoreOverview(metrics, comparison) {
  const scoreOverview = document.getElementById('scoreOverview');
  if (!scoreOverview) {
    console.error('Container scoreOverview not found');
    return;
  }

  scoreOverview.innerHTML = '';

  // Punteggio sostenibilità (sempre disponibile con i dati base)
  const sustainabilityScore = metrics.sustainability_score;
  let scoreClass = 'red-score';
  let scoreIcon = 'fa-exclamation-circle';

  if (sustainabilityScore >= 80) {
    scoreClass = 'green-score';
    scoreIcon = 'fa-check-circle';
  } else if (sustainabilityScore >= 50) {
    scoreClass = 'yellow-score';
    scoreIcon = 'fa-exclamation-triangle';
  }

  let scoreDescription = "Evidenza tecnica da trasformare in roadmap";
  if (sustainabilityScore >= 80) {
    scoreDescription = "Buona leva differenziante per la proposta";
  } else if (sustainabilityScore >= 50) {
    scoreDescription = "Margine utile per priorità tecniche";
  }

  const sustainabilityCard = createScoreCard(
    'Score tecnico',
    `${sustainabilityScore}<span>/100</span>`,
    scoreDescription,
    scoreClass,
    scoreIcon
  );
  scoreOverview.appendChild(sustainabilityCard);

  // Emissioni CO2 (sempre disponibile con i dati base)
  let co2Class = 'green-score';
  let co2Icon = 'fa-leaf';
  if (metrics.co2_emissions > 1) {
    co2Class = 'red-score';
    co2Icon = 'fa-smog';
  } else if (metrics.co2_emissions > 0.5) {
    co2Class = 'yellow-score';
    co2Icon = 'fa-wind';
  }

  let comparisonText = "";
  if (comparison && comparison.better_than_percent) {
    comparisonText = `Benchmark: meglio del ${comparison.better_than_percent}% dei siti`;
  } else {
    comparisonText = "Dato utile per differenziare la proposta";
  }

  const co2Card = createScoreCard(
    'Impatto CO₂',
    `${metrics.co2_emissions}<span>g/view</span>`,
    comparisonText,
    co2Class,
    co2Icon
  );
  scoreOverview.appendChild(co2Card);

  // Peso totale (sempre disponibile con i dati base)
  const sizeCard = createScoreCard(
    'Peso pagina',
    `${metrics.total_size}`,
    'Asset e script da discutere con il cliente',
    'blue-score',
    'fa-weight-hanging'
  );
  scoreOverview.appendChild(sizeCard);

  // Tempo di caricamento (sempre disponibile con i dati base)
  let timeClass = 'green-score';
  let timeIcon = 'fa-tachometer-alt';
  if (metrics.load_time > 3) {
    timeClass = 'red-score';
  } else if (metrics.load_time > 2) {
    timeClass = 'yellow-score';
  }

  let timeDescription = "Segnale di page experience per la trattativa";
  if (comparison && comparison.average_load_time) {
    if (metrics.load_time > comparison.average_load_time) {
      timeDescription = `Leva: più lento della media (${comparison.average_load_time}s)`;
    } else {
      timeDescription = `Punto forte: meglio della media (${comparison.average_load_time}s)`;
    }
  }

  const timeCard = createScoreCard(
    'Caricamento',
    `${metrics.load_time}<span>s</span>`,
    timeDescription,
    timeClass,
    timeIcon
  );
  scoreOverview.appendChild(timeCard);
}

/**
 * Helper per creare una card di punteggio
 * @param {string} title - Titolo della card
 * @param {string} value - Valore HTML (può includere span per unità)
 * @param {string} description - Descrizione della metrica
 * @param {string} valueClass - Classe CSS per il valore
 * @param {string} icon - Classe dell'icona FontAwesome
 * @returns {HTMLElement} - Elemento card creato
 */
function createScoreCard(title, value, description, valueClass, icon) {
  const card = document.createElement('div');
  card.className = 'score-card';
  card.innerHTML = `
    <h3>${title}</h3>
    <div class="score-value ${valueClass}">${value}</div>
    <p><i class="fas ${icon}"></i> ${description}</p>
  `;
  return card;
}

/**
 * Popola la lista delle risorse
 * @param {Object} resources - Dati sulle risorse del sito
 */
function populateResourceList(resources) {
  const resourceList = document.getElementById('resourceList');
  if (!resourceList) {
    console.error('Container resourceList not found');
    return;
  }

  // Verifica che resources sia definito e non vuoto
  if (!resources || Object.keys(resources).length === 0) {
    resourceList.innerHTML = `
      <div class="resource-item unavailable-data">
        <div class="resource-message">
          <i class="fas fa-exclamation-circle"></i>
          Dati sulle risorse non disponibili
        </div>
      </div>
    `;
    return;
  }

  resourceList.innerHTML = `
    <div class="resource-item">
      <div class="resource-name"><strong>Risorsa</strong></div>
      <div class="resource-size"><strong>Peso</strong></div>
      <div class="resource-impact"><strong>Leva</strong></div>
    </div>
  `;

  // Mappatura delle icone per tipo di risorsa
  const resourceIcons = {
    'html': 'fa-html5',
    'css': 'fa-css3-alt',
    'javascript': 'fa-js',
    'images': 'fa-image',
    'fonts': 'fa-font',
    'other': 'fa-file'
  };

  for (const [type, data] of Object.entries(resources)) {
    const icon = resourceIcons[type] || 'fa-file';
    const resourceItem = document.createElement('div');
    resourceItem.className = 'resource-item';
    resourceItem.innerHTML = `
      <div class="resource-name"><i class="fab ${icon}"></i> ${capitalizeFirstLetter(type)} (${data.count})</div>
      <div class="resource-size">${data.size}</div>
      <div class="resource-impact">${data.co2}g CO₂</div>
    `;
    resourceList.appendChild(resourceItem);
  }
}

/**
 * Popola la sezione di suggerimenti di ottimizzazione
 * @param {Array} optimizations - Suggerimenti di ottimizzazione
 */
function populateOptimizations(optimizations) {
  const optimizationList = document.getElementById('optimizationList');
  if (!optimizationList) {
    console.error('Container optimizationList not found');
    return;
  }

  optimizationList.innerHTML = '';

  if (!optimizations || optimizations.length === 0) {
    optimizationList.innerHTML = `
      <div class="unavailable-data">
        <i class="fas fa-info-circle"></i>
        <p>Nessun suggerimento di ottimizzazione disponibile con i dati attuali.</p>
      </div>
    `;
    return;
  }

  optimizations.forEach(opt => {
    const priorityClass = opt.priority === 'high' ? 'high-priority' :
                        opt.priority === 'medium' ? 'medium-priority' : '';

    const priorityIcon = opt.priority === 'high' ? 'exclamation-circle' :
                        opt.priority === 'medium' ? 'exclamation-triangle' : 'info-circle';

    const optimizationCard = document.createElement('div');
    optimizationCard.className = `optimization-card ${priorityClass}`;

    optimizationCard.innerHTML = `
      <h3><i class="fas fa-${priorityIcon}"></i> ${opt.title}</h3>
      <p>${opt.description}</p>
      <div class="optimization-meta">
        <span>Leva consulente</span>
        <span>Task cliente</span>
      </div>
      <div class="impact-row">
        <div class="impact-item">
          <div class="impact-value">${opt.impact}g</div>
          <div class="impact-label">CO₂ risparmiabile</div>
        </div>
      </div>
    `;
    optimizationList.appendChild(optimizationCard);
  });
}

/**
 * Aggiorna la visualizzazione di una specifica metrica Web Vital
 * @param {string} metric - Nome della metrica (lcp, fid, cls)
 * @param {number|null} value - Valore della metrica, null se non disponibile
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
    console.warn(`Elements for Web Vital ${metric} not found`);
    return;
  }

  // Se il valore è null, mostra "N/A"
  if (value === null) {
    valueElement.textContent = "N/A";
    status.textContent = "Non disponibile";
    status.className = "web-vital-status unavailable";
    bar.style.width = "0%";
    bar.style.backgroundColor = "var(--gray-400)";
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
  barWidth = `${Math.min(100, score || 0)}%`;

  // Aggiorna gli elementi UI
  status.textContent = statusText;
  status.className = `web-vital-status ${statusClass}`;
  bar.style.backgroundColor = barColor;
  bar.style.width = barWidth;
}

/**
 * Nasconde la sezione Web Vitals quando i dati non sono disponibili
 * @param {string} reason - Motivo per nascondere la sezione
 */
function hideWebVitalsSection(reason) {
  const webVitalsSection = document.getElementById('webVitalsSection');
  if (webVitalsSection) {
    webVitalsSection.style.display = 'none';

    // Opzionalmente, aggiungi un messaggio nel container principale
    const dashboardSection = document.getElementById('dashboardSection');
    if (dashboardSection) {
      const placeholder = document.createElement('div');
      placeholder.className = 'web-vitals-placeholder detail-section';
      placeholder.innerHTML = `
        <h2><i class="fas fa-tachometer-alt"></i> Core Web Vitals</h2>
        <div class="unavailable-data">
          <i class="fas fa-info-circle"></i>
          <p>Le metriche Core Web Vitals non sono disponibili per questa analisi (${reason}).</p>
        </div>
      `;

      // Trova la posizione giusta per inserire il placeholder
      const optimizationSection = document.querySelector('.detail-section:has(h2 i.fa-lightbulb)');
      if (optimizationSection) {
        dashboardSection.insertBefore(placeholder, optimizationSection);
      } else {
        // Aggiungi alla fine se non troviamo il punto di riferimento
        dashboardSection.appendChild(placeholder);
      }
    }
  }
}

/**
 * Mostra un messaggio quando i dati Web Vitals non sono disponibili
 * @param {HTMLElement} section - Sezione Web Vitals
 * @param {string} message - Messaggio da mostrare
 */
function showWebVitalsUnavailable(section, message) {
  // Nascondi le card e il grafico
  const cards = section.querySelectorAll('.web-vital-card');
  cards.forEach(card => {
    card.style.display = 'none';
  });

  const chartContainer = section.querySelector('.web-vitals-chart-container');
  if (chartContainer) {
    chartContainer.style.display = 'none';
  }

  // Crea un messaggio di indisponibilità se non esiste già
  let unavailableMsg = section.querySelector('.unavailable-data');
  if (!unavailableMsg) {
    unavailableMsg = document.createElement('div');
    unavailableMsg.className = 'unavailable-data';
    section.querySelector('.web-vitals-grid').after(unavailableMsg);
  }

  unavailableMsg.innerHTML = `
    <i class="fas fa-exclamation-circle"></i>
    <p>${message}</p>
    <p class="advice-text">La misurazione delle Core Web Vitals richiede l'analisi JavaScript delle pagine. Prova a ripetere l'analisi con un timeout maggiore.</p>
  `;
}

/**
 * Mostra un avviso quando i dati Web Vitals sono parziali
 * @param {HTMLElement} section - Sezione Web Vitals
 */
function showWebVitalsPartialNotice(section) {
  // Aggiungi un avviso sopra il grafico
  const chartContainer = section.querySelector('.web-vitals-chart-container');
  if (chartContainer) {
    const notice = document.createElement('div');
    notice.className = 'partial-data-notice';
    notice.innerHTML = `
      <i class="fas fa-info-circle"></i>
      <p>I dati Web Vitals sono parziali o stimati. Alcuni valori potrebbero non essere accurati.</p>
    `;
    chartContainer.before(notice);
  }
}

/**
 * Mostra un errore quando c'è un problema con il grafico Web Vitals
 */
function showWebVitalsChartError() {
  const chartCanvas = document.getElementById('webVitalsChart');
  if (chartCanvas) {
    const container = chartCanvas.parentElement;
    container.innerHTML = `
      <div class="chart-error">
        <i class="fas fa-chart-bar"></i>
        <p>Impossibile creare il grafico Web Vitals</p>
      </div>
    `;
  }
}

/**
 * Popola i dettagli economici con supporto per dati mancanti
 * @param {Object} economicBenefits - Dati economici
 * @param {string} quality - Qualità dei dati ('basic', 'standard', 'enhanced')
 */
function populateEconomicDetails(economicBenefits, quality) {
  const benefitsGrid = document.getElementById('benefitsGrid');
  const costsTableBody = document.getElementById('costsTableBody');
  const totalCurrentCost = document.getElementById('totalCurrentCost');
  const totalPotentialSavings = document.getElementById('totalPotentialSavings');

  if (!benefitsGrid || !costsTableBody) {
    console.error('Economic containers not found');
    return;
  }

  benefitsGrid.innerHTML = '';
  costsTableBody.innerHTML = '';

  // Se i dati economici sono vuoti o molto limitati
  if (!economicBenefits || Object.keys(economicBenefits).length === 0) {
    showEconomicUnavailable();
    return;
  }

  // Popola le card dei benefici
  const annualCost = economicBenefits.current_monthly_cost * 12;
  const annualSavings = economicBenefits.potential_annual_savings;
  const savingsPercent = economicBenefits.potential_savings_percent;
  const savingsPerVisit = (economicBenefits.potential_monthly_savings / economicBenefits.estimated_monthly_visits) * 100; // centesimi di euro

  const benefitCards = [
    {
      value: `€${annualCost.toFixed(2)}`,
      label: 'Costo annuale attuale'
    },
    {
      value: `€${annualSavings.toFixed(2)}`,
      label: 'Risparmio annuale potenziale'
    },
    {
      value: `${savingsPercent}%`,
      label: 'Riduzione costi potenziale'
    },
    {
      value: `€${savingsPerVisit.toFixed(2)}`,
      label: 'Risparmio per visita'
    }
  ];

  benefitCards.forEach(card => {
    const benefitCard = document.createElement('div');
    benefitCard.className = 'benefit-card';
    benefitCard.innerHTML = `
      <div class="benefit-value">${card.value}</div>
      <div class="benefit-label">${card.label}</div>
    `;
    benefitsGrid.appendChild(benefitCard);
  });

  // Mostra avviso sulla qualità dei dati economici se necessario
  if (quality && quality !== 'enhanced') {
    const notice = document.createElement('div');
    notice.className = 'data-quality-notice';
    notice.innerHTML = `
      <i class="fas fa-info-circle"></i>
      <p>I dati economici sono basati su un'analisi ${quality === 'standard' ? 'standard' : 'semplificata'}. Per stime più precise, prova ad usare l'analizzatore avanzato.</p>
    `;
    benefitsGrid.after(notice);
  }

  // Popola la tabella dei costi dettagliati
  const costsData = economicBenefits.costs_breakdown || {};
  const savingsData = economicBenefits.savings_breakdown || {};

  // Mappatura dei nomi delle categorie
  const categoryNames = {
    'bandwidth': 'Costi di Banda',
    'energy': 'Costi Energetici',
    'seo_impact': 'Impatto SEO',
    'bounce_impact': 'Utenti Persi',
    'extra_maintenance': 'Manutenzione Extra',
    'extra_infrastructure': 'Infrastruttura'
  };

  // Mappatura delle descrizioni
  const categoryDescriptions = {
    'bandwidth': 'Costi di trasferimento dati mensili',
    'energy': 'Consumo energetico dei server',
    'seo_impact': 'Perdita di valore dalle conversioni mancate per peggiore posizionamento',
    'bounce_impact': 'Valore perso da utenti che abbandonano per lentezza',
    'extra_maintenance': 'Costi aggiuntivi per mantenere codice complesso',
    'extra_infrastructure': 'Costi aggiuntivi per server più potenti'
  };

  // Mappatura diretta tra chiavi di costo e chiavi di risparmio
  const costToSavingKeyMap = {
    'bandwidth': 'bandwidth',
    'energy': 'energy',
    'seo_impact': 'seo_conversions',
    'bounce_impact': 'reduced_bounce',
    'extra_maintenance': 'maintenance',
    'extra_infrastructure': 'infrastructure'
  };

  let totalCurrent = 0;
  let totalSavings = 0;

  // Itera su tutte le categorie di costo
  for (const [key, value] of Object.entries(costsData)) {
    // Usa la mappatura diretta invece di una espressione condizionale
    const savingKey = costToSavingKeyMap[key] || key;
    const savingValue = savingsData[savingKey] || 0;

    totalCurrent += value;
    totalSavings += savingValue;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${categoryNames[key] || key}</td>
      <td>€${value.toFixed(2)}</td>
      <td>€${savingValue.toFixed(2)}</td>
      <td>${categoryDescriptions[key] || ''}</td>
    `;
    costsTableBody.appendChild(row);
  }

  // Aggiorna i totali
  if (totalCurrentCost) totalCurrentCost.textContent = `€${totalCurrent.toFixed(2)}`;
  if (totalPotentialSavings) totalPotentialSavings.textContent = `€${totalSavings.toFixed(2)}`;

  // Crea i grafici di suddivisione dei costi se la funzione è disponibile
  try {
    if (typeof createCostBreakdownCharts === 'function') {
      createCostBreakdownCharts(economicBenefits);
    }
  } catch (e) {
    console.error('Error creating cost breakdown charts:', e);
    showCostChartError();
  }
}

/**
 * Mostra un messaggio quando i dati economici non sono disponibili
 */
function showEconomicUnavailable() {
  const benefitsSection = document.getElementById('economicBenefits');
  if (!benefitsSection) return;

  // Nascondi componenti che richiedono dati
  const componentsToHide = [
    '.benefits-grid',
    '.charts-row',
    '.costs-table-container',
    '.parameters-info'
  ];

  componentsToHide.forEach(selector => {
    const elements = benefitsSection.querySelectorAll(selector);
    elements.forEach(el => {
      el.style.display = 'none';
    });
  });

  // Aggiungi messaggio di indisponibilità
  const message = document.createElement('div');
  message.className = 'unavailable-data';
  message.innerHTML = `
    <i class="fas fa-exclamation-circle"></i>
    <p>Dati economici non disponibili con l'analisi corrente.</p>
    <p class="advice-text">I dati economici richiedono metriche di base come dimensione della pagina e tempo di caricamento.</p>
  `;

  // Inserisci dopo il titolo principale
  const title = benefitsSection.querySelector('h2');
  if (title && title.nextElementSibling) {
    title.nextElementSibling.after(message);
  } else if (title) {
    title.after(message);
  } else {
    benefitsSection.appendChild(message);
  }
}

/**
 * Mostra un errore quando c'è un problema con i grafici economici
 */
function showCostChartError() {
  const chartContainers = document.querySelectorAll('.chart-container');
  chartContainers.forEach(container => {
    container.innerHTML = `
      <div class="chart-error">
        <i class="fas fa-chart-bar"></i>
        <p>Impossibile creare il grafico</p>
      </div>
    `;
  });
}

/**
 * Crea tutti i grafici per la dashboard
 * @param {Object} data - Dati di analisi
 */
function createCharts(data) {
  const comparisonChart = document.getElementById('comparisonChart');
  if (comparisonChart && typeof createComparisonChart === 'function') {
    createComparisonChart(data);
  }

  // Altri grafici specifici per dati avanzati
  if (data.metrics_availability?.sustainability === 'enhanced') {
    createEnhancedCharts(data);
  }
}

/**
 * Crea grafici per dati avanzati
 * @param {Object} data - Dati di analisi avanzata
 */
function createEnhancedCharts(data) {
  // Implementazione per grafici avanzati
  // Potrebbe includere grafici di performance, accessibilità, ecc.
  console.log("Enhanced charts would be created here if implemented");
}

/**
 * Popola le metriche avanzate, disponibili solo con l'analizzatore Lighthouse Enhanced
 * @param {Object} metrics - Metriche complete
 */
function populateEnhancedMetrics(metrics) {
  console.log("Tentativo di popolare metriche avanzate", metrics);

  // Sezione per le metriche avanzate
  if (!document.getElementById('enhancedMetricsSection')) {
    console.log("Creazione sezione metriche avanzate");
    createEnhancedMetricsSection();
  }

  // Ottieni il container e puliscilo prima di aggiungere nuovi contenuti
  const container = document.getElementById('enhancedMetricsContainer');
  if (container) {
    container.innerHTML = '';
    console.log("Container metriche avanzate pulito per nuovi dati");
  } else {
    console.error("Container metriche avanzate non trovato");
    return;
  }

  // Log per verificare disponibilità metriche
  console.log("Disponibilità energy_efficiency:", !!metrics.energy_efficiency);
  console.log("Disponibilità accessibility:", !!metrics.accessibility);
  console.log("Disponibilità yearly_carbon_footprint:", !!metrics.yearly_carbon_footprint);
  console.log("Disponibilità category_scores:", !!metrics.category_scores);

  // Popola efficienza energetica (sempre piena larghezza)
  if (metrics.energy_efficiency) {
    console.log("Popolamento efficienza energetica", metrics.energy_efficiency);
    populateEnergyEfficiency(metrics.energy_efficiency);
  }

  // Crea una riga flessibile per ottimizzazioni e accessibilità
  const metricsRow = document.createElement('div');
  metricsRow.className = 'metrics-row';
  container.appendChild(metricsRow);

  // Colonna di sinistra (impatto ottimizzazioni)
  const leftColumn = document.createElement('div');
  leftColumn.className = 'metrics-column';
  metricsRow.appendChild(leftColumn);

  // Aggiungi impatto ottimizzazioni se disponibile
  if (metrics.energy_efficiency && metrics.energy_efficiency.optimization_impacts) {
    console.log("Popolamento impatto ottimizzazioni", metrics.energy_efficiency.optimization_impacts);
    populateOptimizationImpactsCompact(metrics.energy_efficiency.optimization_impacts, leftColumn);
  }

  // Colonna di destra (accessibilità)
  const rightColumn = document.createElement('div');
  rightColumn.className = 'metrics-column';
  metricsRow.appendChild(rightColumn);

  // Aggiungi accessibilità se disponibile
  if (metrics.accessibility) {
    console.log("Popolamento accessibilità", metrics.accessibility);
    populateAccessibilityCompact(metrics.accessibility, rightColumn);
  }

  // Popola impronta carbonica (sempre piena larghezza)
  if (metrics.yearly_carbon_footprint) {
    console.log("Popolamento impronta carbonica", metrics.yearly_carbon_footprint);
    populateCarbonFootprint(metrics.yearly_carbon_footprint);
  }

  // Popola punteggi categorie (sempre piena larghezza)
  if (metrics.category_scores) {
    console.log("Popolamento punteggi categorie", metrics.category_scores);
    populateCategoryScores(metrics.category_scores);
  }
}

/**
 * Crea la sezione per le metriche avanzate
 */
function createEnhancedMetricsSection() {
  const dashboardSection = document.getElementById('dashboardSection');
  if (!dashboardSection) return;

  // Verifica se la sezione esiste già
  if (document.getElementById('enhancedMetricsSection')) return;

  // Crea la sezione
  const section = document.createElement('div');
  section.id = 'enhancedMetricsSection';
  section.className = 'detail-section enhanced-metrics';
  section.innerHTML = `
    <h2><i class="fas fa-chart-line"></i> Metriche Avanzate</h2>
    <p>Queste metriche dettagliate forniscono un'analisi approfondita delle prestazioni di sostenibilità del tuo sito web.</p>

    <div id="enhancedMetricsContainer" class="enhanced-metrics-container">
      <!-- I contenuti verranno aggiunti dinamicamente -->
    </div>
  `;

  // Inserisci la sezione prima della sezione di confronto
  const comparisonSection = document.querySelector('.detail-section:has(h2 i.fa-chart-bar)');
  if (comparisonSection) {
    dashboardSection.insertBefore(section, comparisonSection);
  } else {
    // Aggiungi alla fine se non troviamo il punto di riferimento
    dashboardSection.appendChild(section);
  }
}

/**
 * Popola i dati di efficienza energetica
 * @param {Object} energyData - Dati di efficienza energetica
 */
function populateEnergyEfficiency(energyData) {
  const container = document.getElementById('enhancedMetricsContainer');
  if (!container) return;

  const section = document.createElement('div');
  section.className = 'energy-efficiency-section';

  // Calcola classe colore in base al punteggio
  const scorePercent = energyData.score;
  let scoreClass = 'red-score';
  if (scorePercent >= 80) {
    scoreClass = 'green-score';
  } else if (scorePercent >= 50) {
    scoreClass = 'yellow-score';
  }

  section.innerHTML = `
    <h3><i class="fas fa-bolt"></i> Efficienza Energetica</h3>

    <div class="energy-metrics-grid">
      <div class="energy-metric-card">
        <div class="metric-value ${scoreClass}">${scorePercent}%</div>
        <div class="metric-label">Punteggio Efficienza</div>
      </div>

      <div class="energy-metric-card">
        <div class="metric-value">${energyData.estimated_kwh_per_view} kWh</div>
        <div class="metric-label">Consumo per Visita</div>
      </div>

      <div class="energy-metric-card">
        <div class="metric-value">${energyData.estimated_yearly_kwh} kWh</div>
        <div class="metric-label">Consumo Annuale Stimato</div>
      </div>
    </div>
  `;

  container.appendChild(section);
}

/**
 * Versione compatta della funzione di impatto ottimizzazioni
 * @param {Object} impacts - Dati di impatto ottimizzazioni
 * @param {HTMLElement} container - Container in cui inserire
 */
function populateOptimizationImpactsCompact(impacts, container) {
  const section = document.createElement('div');
  section.className = 'impact-section';

  section.innerHTML = `
    <h4><i class="fas fa-chart-line"></i> Impatto delle Ottimizzazioni</h4>
    <div class="impact-bars">
      ${createImpactBars(impacts)}
    </div>
  `;

  container.appendChild(section);
}

/**
 * Crea le barre di impatto per le ottimizzazioni
 * @param {Object} impacts - Valori di impatto per categoria
 * @returns {string} - HTML per le barre di impatto
 */
function createImpactBars(impacts) {
  if (!impacts) return '';

  const categories = {
    images: 'Ottimizzazione Immagini',
    next_gen_formats: 'Formati Immagini Moderni',
    text_compression: 'Compressione Testi',
    js_optimization: 'Ottimizzazione JavaScript',
    caching: 'Strategie di Cache',
    http2: 'Utilizzo HTTP/2'
  };

  let html = '';

  for (const [key, value] of Object.entries(impacts)) {
    if (categories[key]) {
      // Utilizziamo variabili CSS personalizzate per l'animazione delle barre
      html += `
        <div class="impact-bar">
          <div class="impact-label">${categories[key]}</div>
          <div class="impact-track">
            <div class="impact-fill" style="--progress-width: ${value}%"></div>
          </div>
          <div class="impact-value">${value}%</div>
        </div>
      `;
    }
  }

  return html;
}

/**
 * Versione compatta della funzione accessibilità
 * @param {Object} accessibilityData - Dati di accessibilità
 * @param {HTMLElement} container - Container in cui inserire
 */
function populateAccessibilityCompact(accessibilityData, container) {
  const section = document.createElement('div');
  section.className = 'accessibility-section';

  // Determina la classe di colore in base al punteggio
  let scoreClass = 'red-score';
  if (accessibilityData.score >= 80) {
    scoreClass = 'green-score';
  } else if (accessibilityData.score >= 50) {
    scoreClass = 'yellow-score';
  }

  section.innerHTML = `
    <h4><i class="fas fa-universal-access"></i> Accessibilità</h4>

    <div class="accessibility-card">
      <div class="accessibility-details">
        <div class="accessibility-score">
          <div class="score-value ${scoreClass}">${accessibilityData.score}%</div>
          <div class="score-label">Punteggio Accessibilità</div>
        </div>
        <div class="accessibility-impact">
          ${accessibilityData.sustainability_impact}
        </div>
      </div>
    </div>
  `;

  container.appendChild(section);
}

/**
 * Popola i dati dell'impronta carbonica
 * @param {Object} footprintData - Dati dell'impronta carbonica
 */
function populateCarbonFootprint(footprintData) {
  const container = document.getElementById('enhancedMetricsContainer');
  if (!container) return;

  const section = document.createElement('div');
  section.className = 'carbon-footprint-section';

  section.innerHTML = `
    <h3><i class="fas fa-leaf"></i>  Carbon Footprint Annuale </h3>

    <div class="carbon-metrics-grid">
      <div class="carbon-metric-card">
        <div class="metric-icon"><i class="fas fa-smog"></i></div>
        <div class="metric-value">${footprintData.kg_co2} kg</div>
        <div class="metric-label">CO₂ Annuale</div>
      </div>

      <div class="carbon-metric-card">
        <div class="metric-icon"><i class="fas fa-tree"></i></div>
        <div class="metric-value">${footprintData.equivalent_trees}</div>
        <div class="metric-label">Alberi Equivalenti</div>
      </div>

      <div class="carbon-metric-card">
        <div class="metric-icon"><i class="fas fa-car"></i></div>
        <div class="metric-value">${footprintData.comparison.car_km} km</div>
        <div class="metric-label">Equivalente in Auto</div>
      </div>

      <div class="carbon-metric-card">
        <div class="metric-icon"><i class="fas fa-mobile-alt"></i></div>
        <div class="metric-value">${footprintData.comparison.smartphone_charges}</div>
        <div class="metric-label">Ricariche Smartphone</div>
      </div>
    </div>
  `;

  container.appendChild(section);
}

/**
 * Popola i punteggi delle categorie di Lighthouse
 * @param {Object} categoryScores - Punteggi delle categorie
 */
function populateCategoryScores(categoryScores) {
  const container = document.getElementById('enhancedMetricsContainer');
  if (!container) return;

  const section = document.createElement('div');
  section.className = 'category-scores-section';

  section.innerHTML = `
    <h3><i class="fas fa-chart-pie"></i> Punteggi Lighthouse</h3>

    <div class="lighthouse-grid">
      <div class="lighthouse-card performance">
        <div class="metric-icon"><i class="fas fa-tachometer-alt"></i></div>
        <div class="metric-value">${categoryScores.performance}%</div>
        <div class="metric-label">Performance</div>
      </div>

      <div class="lighthouse-card accessibility">
        <div class="metric-icon"><i class="fas fa-universal-access"></i></div>
        <div class="metric-value">${categoryScores.accessibility}%</div>
        <div class="metric-label">Accessibilità</div>
      </div>

      <div class="lighthouse-card best-practices">
        <div class="metric-icon"><i class="fas fa-check-circle"></i></div>
        <div class="metric-value">${categoryScores.best_practices}%</div>
        <div class="metric-label">Best Practices</div>
      </div>

      <div class="lighthouse-card seo">
        <div class="metric-icon"><i class="fas fa-search"></i></div>
        <div class="metric-value">${categoryScores.seo}%</div>
        <div class="metric-label">SEO</div>
      </div>
    </div>
  `;

  container.appendChild(section);
}
/**
 * Mostra un errore generale
 * @param {string} message - Messaggio di errore
 */
function showError(message) {
  console.error(message);
  // Potresti mostrare un toast o un alert
  alert(message);
}

/**
 * Mostra un errore generale quando c'è un problema con i grafici
 */
function showChartError() {
  const chartContainers = document.querySelectorAll('.chart-container');
  chartContainers.forEach(container => {
    container.innerHTML = `
      <div class="chart-error">
        <i class="fas fa-chart-bar"></i>
        <p>Impossibile creare il grafico</p>
      </div>
    `;
  });
}

/**
 * Helper per capitalizzare la prima lettera di una stringa
 * @param {string} str - Stringa da capitalizzare
 * @returns {string} - Stringa capitalizzata
 */
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Esporta funzioni che potrebbero essere utili anche esternamente
export {
  populateScoreOverview,
  populateResourceList,
  populateOptimizations,
  populateWebVitals,
  populateEconomicDetails,
  createCharts,
  showError
};
