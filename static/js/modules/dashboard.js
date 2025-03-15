/**
 * Modulo Dashboard ottimizzato - Percorsi di importazione corretti
 */

// Importazioni corrette con percorsi assoluti
import { createComparisonChart } from '/static/js/modules/charts.js';
import { updateWebVitals } from '/static/js/modules/webVitals.js';
import { populateEconomicDetails } from '/static/js/modules/economics.js';
import { formatFileSize } from '/static/js/utils/formatters.js';

/**
 * Funzione principale per popolare la dashboard completa
 * @param {Object} data - Dati di analisi
 */
export async function populateDashboard(data) {
  console.log("Popolamento dashboard con dati:", data);

  // Verifica se usare la dashboard avanzata o standard
  const isEnhanced = data.analyzer_type === 'lighthouse-enhanced';
  const enhancedDashboardContainer = document.getElementById('enhancedDashboardContainer');

  // Banner informativo per il tipo di analisi
  showAnalysisTypeBanner(data.analyzer_type);

  // Nascondi tutte le sezioni della dashboard standard inizialmente
  const standardSections = [
    'scoreOverview',
    'webVitalsSection',
    'economicBenefits',
    'resourceList',
    'optimizationList'
  ];

  standardSections.forEach(id => {
    const element = document.getElementById(id);
    if (element && element.parentElement) {
      element.parentElement.style.display = 'none';
    }
  });

  // Se dovremmo usare la dashboard avanzata e il container esiste
  if (isEnhanced && enhancedDashboardContainer) {
    console.log("Tentativo di rendering dashboard avanzata React...");

    try {
      // Importa dinamicamente il loader della dashboard avanzata - PERCORSO CORRETTO
      const dashboardLoader = await import('/static/js/modules/dashboard-loader.js');

      if (dashboardLoader && dashboardLoader.loadEnhancedDashboard) {
        // Mostra il container della dashboard avanzata
        enhancedDashboardContainer.style.display = 'block';

        // Tenta di caricare la dashboard avanzata
        const success = await dashboardLoader.loadEnhancedDashboard(data, enhancedDashboardContainer);

        if (success) {
          console.log("Dashboard avanzata caricata con successo.");
          return; // Termina qui se la dashboard avanzata è stata caricata con successo
        } else {
          console.warn("Fallback alla dashboard standard (errore nel caricamento avanzato).");
        }
      } else {
        console.warn("Modulo dashboard-loader.js non trovato o senza loadEnhancedDashboard.");
      }
    } catch (error) {
      console.error("Errore nel caricamento della dashboard avanzata:", error);
    }
  } else if (isEnhanced) {
    console.warn("Container per dashboard avanzata non trovato, ma analyzer_type è lighthouse-enhanced.");
  } else {
    console.log("Utilizzo dashboard standard per analyzer_type:", data.analyzer_type);
  }

  // Se arriviamo qui, dobbiamo usare la dashboard standard

  // Nascondi il container della dashboard avanzata se esiste
  if (enhancedDashboardContainer) {
    enhancedDashboardContainer.style.display = 'none';
  }

  // Mostra tutte le sezioni della dashboard standard
  standardSections.forEach(id => {
    const element = document.getElementById(id);
    if (element && element.parentElement) {
      element.parentElement.style.display = 'block';
    }
  });

  // Estrai i dati necessari
  const metrics = data.metrics;
  const resources = data.resources;
  const optimizations = data.optimizations;
  const comparison = data.industry_comparison;
  const economicBenefits = metrics.economic_benefits || {
    current_monthly_cost: 5.20,
    potential_savings_percent: 30,
    potential_monthly_savings: 1.56,
    potential_annual_savings: 18.72,
    bandwidth_cost_per_visit: 0.52,
    estimated_monthly_visits: 10000,
    costs_breakdown: {
      bandwidth: 2.10,
      energy: 0.60,
      seo_impact: 1.20,
      bounce_impact: 0.80,
      extra_maintenance: 0.30,
      extra_infrastructure: 0.20
    },
    savings_breakdown: {
      bandwidth: 0.63,
      energy: 0.18,
      seo_conversions: 0.84,
      reduced_bounce: 0.48,
      maintenance: 0.24,
      infrastructure: 0.18
    }
  };

  // Popola le metriche principali
  populateScoreOverview(metrics, comparison);

  // Popola la lista delle risorse
  populateResourceList(resources);

  // Popola i suggerimenti di ottimizzazione
  populateOptimizations(optimizations);

  // Crea il grafico di confronto con gestione degli errori
  try {
    createComparisonChart(data);
  } catch (error) {
    console.error('Errore durante la creazione del grafico:', error);
  }

  // Popola i dettagli economici
  populateEconomicDetails(economicBenefits);

  // Aggiorna la visualizzazione delle Web Vitals
  updateWebVitals(data);
}

// Il resto delle funzioni rimane invariato
// [Le altre funzioni di supporto sono qui...]

// Implementazione della funzione showAnalysisTypeBanner e altre funzioni di supporto...
function showAnalysisTypeBanner(analyzerType) {
  // Cerca un container esistente o creane uno nuovo
  let bannerContainer = document.getElementById('analyzerTypeBanner');

  if (!bannerContainer) {
    bannerContainer = document.createElement('div');
    bannerContainer.id = 'analyzerTypeBanner';

    // Inserisci il banner prima della dashboard
    const dashboard = document.getElementById('dashboardSection');
    if (dashboard) {
      dashboard.insertBefore(bannerContainer, dashboard.firstChild);
    }
  }

  // Determina il tipo di analisi e il messaggio appropriato
  let message, style, icon;

  switch (analyzerType) {
    case 'lighthouse-enhanced':
      message = 'Analisi completa con Lighthouse potenziato';
      style = 'bg-green-50 border-green-200 text-green-700';
      icon = '<i class="fas fa-bolt text-green-500"></i>';
      break;
    case 'lighthouse':
      message = 'Analisi con Lighthouse standard';
      style = 'bg-blue-50 border-blue-200 text-blue-700';
      icon = '<i class="fas fa-tachometer-alt text-blue-500"></i>';
      break;
    case 'pyppeteer':
      message = 'Analisi con Web Vitals standard';
      style = 'bg-amber-50 border-amber-200 text-amber-700';
      icon = '<i class="fas fa-spinner text-amber-500"></i>';
      break;
    default:
      message = 'Analisi standard';
      style = 'bg-gray-50 border-gray-200 text-gray-700';
      icon = '<i class="fas fa-info-circle text-gray-500"></i>';
  }

  // Crea il contenuto del banner
  bannerContainer.className = `p-3 mb-4 rounded-lg border ${style} flex items-center`;
  bannerContainer.innerHTML = `
    <div class="mr-3">${icon}</div>
    <div>
      <span class="font-medium">${message}</span>
      <span class="text-sm ml-2">${analyzerType === 'lighthouse-enhanced' ?
        'Visualizzazione avanzata disponibile' :
        'Dashboard standard in uso'}
      </span>
    </div>
  `;
}

function populateScoreOverview(metrics, comparison) {
  const scoreOverview = document.getElementById('scoreOverview');
  if (!scoreOverview) {
    console.error('Container scoreOverview non trovato');
    return;
  }

  scoreOverview.innerHTML = '';

  // Punteggio sostenibilità
  let scoreClass = 'red-score';
  let scoreIcon = 'fa-exclamation-circle';
  if (metrics.sustainability_score >= 80) {
    scoreClass = 'green-score';
    scoreIcon = 'fa-check-circle';
  } else if (metrics.sustainability_score >= 50) {
    scoreClass = 'yellow-score';
    scoreIcon = 'fa-exclamation-triangle';
  }

  let scoreDescription = "Il tuo sito necessita di miglioramenti";
  if (metrics.sustainability_score >= 80) {
    scoreDescription = "Il tuo sito è molto efficiente";
  } else if (metrics.sustainability_score >= 50) {
    scoreDescription = "Il tuo sito è abbastanza efficiente";
  }

  const sustainabilityCard = createScoreCard(
    'Punteggio Sostenibilità',
    `${metrics.sustainability_score}<span>/100</span>`,
    scoreDescription,
    scoreClass,
    scoreIcon
  );
  scoreOverview.appendChild(sustainabilityCard);

  // Emissioni CO2
  let co2Class = 'green-score';
  let co2Icon = 'fa-leaf';
  if (metrics.co2_emissions > 1) {
    co2Class = 'red-score';
    co2Icon = 'fa-smog';
  } else if (metrics.co2_emissions > 0.5) {
    co2Class = 'yellow-score';
    co2Icon = 'fa-wind';
  }

  const co2Card = createScoreCard(
    'Emissioni CO₂',
    `${metrics.co2_emissions}<span>g/view</span>`,
    `Meglio del ${comparison.better_than_percent}% dei siti web`,
    co2Class,
    co2Icon
  );
  scoreOverview.appendChild(co2Card);

  // Peso totale
  const sizeCard = createScoreCard(
    'Peso Totale',
    `${metrics.total_size}`,
    'Dimensione delle risorse del sito',
    'blue-score',
    'fa-weight-hanging'
  );
  scoreOverview.appendChild(sizeCard);

  // Tempo di caricamento
  let timeClass = 'green-score';
  let timeIcon = 'fa-tachometer-alt';
  if (metrics.load_time > 3) {
    timeClass = 'red-score';
  } else if (metrics.load_time > 2) {
    timeClass = 'yellow-score';
  }

  let timeDescription = `Veloce rispetto alla media (${comparison.average_load_time}s)`;
  if (metrics.load_time > comparison.average_load_time) {
    timeDescription = `Lento rispetto alla media (${comparison.average_load_time}s)`;
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

function populateResourceList(resources) {
  const resourceList = document.getElementById('resourceList');
  if (!resourceList) {
    console.error('Container resourceList non trovato');
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

function populateOptimizations(optimizations) {
  const optimizationList = document.getElementById('optimizationList');
  if (!optimizationList) {
    console.error('Container optimizationList non trovato');
    return;
  }

  optimizationList.innerHTML = '';

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

function createScoreCard(title, value, description, valueClass, iconName) {
  const card = document.createElement('div');
  card.className = 'score-card';
  card.innerHTML = `
    <h3>${title}</h3>
    <div class="score-value ${valueClass}">${value}</div>
    <p class="text-center"><i class="fas ${iconName}"></i> ${description}</p>
  `;
  return card;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Esporta le funzioni
export { populateScoreOverview, populateResourceList, populateOptimizations, createScoreCard, showAnalysisTypeBanner };