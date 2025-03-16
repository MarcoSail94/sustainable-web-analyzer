/**
 * unified-dashboard.js - Dashboard unificata per il Sustainable Web Analyzer
 * Gestisce sia dati base che avanzati, mostrando chiaramente quando certe metriche non sono disponibili
 */

// Import utility necessarie
import { formatFileSize } from '/static/js/utils/formatters.js';
import { updateThemeIcon, updateCharts } from '/static/js/utils/theme.js';

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
  populateWebVitals(webVitals, data.metrics_availability?.web_vitals);
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
    try {
      populateEnhancedMetrics(data.metrics);
    } catch (error) {
      console.error('Error populating enhanced metrics:', error);
    }
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
      message = 'Analisi completa con dati avanzati';
      style = 'bg-green-50 border-green-200 text-green-700';
      icon = '<i class="fas fa-check-circle text-green-500"></i>';
      break;
    case 'medium':
      message = 'Analisi parziale con alcuni dati avanzati';
      style = 'bg-blue-50 border-blue-200 text-blue-700';
      icon = '<i class="fas fa-info-circle text-blue-500"></i>';
      break;
    case 'basic':
      message = 'Analisi di base con metriche limitate';
      style = 'bg-amber-50 border-amber-200 text-amber-700';
      icon = '<i class="fas fa-exclamation-triangle text-amber-500"></i>';
      break;
    default:
      message = 'Qualità analisi sconosciuta';
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
 * Genera una descrizione della disponibilità delle metriche
 * @param {Object} metricsAvailability - Informazioni sulla disponibilità delle metriche
 * @returns {string} - Descrizione testuale
 */
function getMetricsAvailabilityDescription(metricsAvailability) {
  if (!metricsAvailability) return 'Informazioni sulla qualità dei dati non disponibili';

  const parts = [];

  if (metricsAvailability.web_vitals === 'available') {
    parts.push('Web Vitals complete');
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

  let scoreDescription = "Il tuo sito necessita di miglioramenti";
  if (sustainabilityScore >= 80) {
    scoreDescription = "Il tuo sito è molto efficiente";
  } else if (sustainabilityScore >= 50) {
    scoreDescription = "Il tuo sito è abbastanza efficiente";
  }

  const sustainabilityCard = createScoreCard(
    'Punteggio Sostenibilità',
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
    comparisonText = `Meglio del ${comparison.better_than_percent}% dei siti web`;
  } else {
    comparisonText = "Dati di confronto non disponibili";
  }

  const co2Card = createScoreCard(
    'Emissioni CO₂',
    `${metrics.co2_emissions}<span>g/view</span>`,
    comparisonText,
    co2Class,
    co2Icon
  );
  scoreOverview.appendChild(co2Card);

  // Peso totale (sempre disponibile con i dati base)
  const sizeCard = createScoreCard(
    'Peso Totale',
    `${metrics.total_size}`,
    'Dimensione delle risorse del sito',
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

  let timeDescription = "Tempo di caricamento del sito";
  if (comparison && comparison.average_load_time) {
    if (metrics.load_time > comparison.average_load_time) {
      timeDescription = `Lento rispetto alla media (${comparison.average_load_time}s)`;
    } else {
      timeDescription = `Veloce rispetto alla media (${comparison.average_load_time}s)`;
    }
  }

  const timeCard = createScoreCard(
    'Tempo di Caricamento',
    `${metrics.load_time}<span>s</span>`,
    timeDescription,
    timeClass,
    timeIcon
  );
  scoreOverview.appendChild(timeCard);
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
      <div class="resource-name"><strong>Tipo</strong></div>
      <div class="resource-size"><strong>Dimensione</strong></div>
      <div class="resource-impact"><strong>Impatto</strong></div>
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
      <div class="impact-row">
        <div class="impact-item">
          <div class="impact-value">${opt.impact}g</div>
          <div class="impact-label">CO₂ Risparmiato</div>
        </div>
      </div>
    `;
    optimizationList.appendChild(optimizationCard);
  });
}

/**
 * Popola le metriche Web Vitals
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

  // Per dati parziali o completi, aggiorna i valori
  try {
    updateWebVitalMetric('lcp', webVitals.lcp || null, 's', { good: 2.5, medium: 4.0 }, webVitals.scores?.lcp);
    updateWebVitalMetric('fid', webVitals.fid || null, 'ms', { good: 100, medium: 300 }, webVitals.scores?.fid);
    updateWebVitalMetric('cls', webVitals.cls || null, '', { good: 0.1, medium: 0.25 }, webVitals.scores?.cls);

    // Aggiorna il grafico di confronto Web Vitals se possibile
    if (typeof createWebVitalsChart === 'function') {
      try {
        createWebVitalsChart({ metrics: { web_vitals: webVitals } });
      } catch (e) {
        console.error('Error creating Web Vitals chart:', e);
        showWebVitalsChartError();
      }
    }

    // Se i dati sono parziali, mostra un avviso
    if (availability === 'partial') {
      showWebVitalsPartialNotice(webVitalsSection);
    }
  } catch (e) {
    console.error('Error updating Web Vitals:', e);
    showWebVitalsUnavailable(webVitalsSection, 'Errore nell\'aggiornamento dei dati Web Vitals');
  }
}

/**
 * Aggiorna la visualizzazione di una specifica metrica Web Vital con supporto per dati mancanti
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

}