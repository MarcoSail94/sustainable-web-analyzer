/**
 * section-organizer.js
 * Script per riorganizzare le sezioni della dashboard nel Sustainable Web Analyzer
 * Posiziona le sezioni nell'ordine specificato:
 * 1. Card punteggi
 * 2. Core Web Vitals
 * 3. Metriche Avanzate
 * 4. Analisi delle Risorse
 * 5. Suggerimenti di Ottimizzazione
 * 6. Confronto con altri Siti
 * 7. Benefici Economici
 */

document.addEventListener('DOMContentLoaded', function() {
  // Attendiamo che la dashboard sia inizializzata e popolata
  const checkDashboardReady = setInterval(function() {
    const dashboard = document.getElementById('dashboardSection');
    if (dashboard && dashboard.style.display !== 'none' && dashboard.querySelector('.score-overview')) {
      clearInterval(checkDashboardReady);
      reorganizeSections();
    }
  }, 500);
});

/**
 * Funzione principale per riorganizzare le sezioni
 */
function reorganizeSections() {
  console.log("Riorganizzazione delle sezioni della dashboard...");
  const dashboard = document.getElementById('dashboardSection');
  if (!dashboard) return;

  // 1. Prima otteniamo tutti i container delle sezioni
  const headerEl = dashboard.querySelector('.dashboard-header');
  const qualityBannerEl = document.getElementById('analysisQualityBanner');
  const scoreOverviewEl = document.getElementById('scoreOverview');
  const webVitalsEl = document.getElementById('webVitalsSection');
  const enhancedMetricsEl = document.getElementById('enhancedMetricsSection');
  const resourceSectionEl = getElementByHeadingText(dashboard, 'Analisi delle Risorse');
  const optimizationsSectionEl = getElementByHeadingText(dashboard, 'Suggerimenti di Ottimizzazione');
  const comparisonSectionEl = getElementByHeadingText(dashboard, 'Confronto con altri Siti');
  const economicBenefitsEl = document.getElementById('economicBenefits');
  const actionButtonsEl = dashboard.querySelector('.action-buttons');

  // Array con gli elementi nel nuovo ordine desiderato
  const newOrder = [
    headerEl,
    qualityBannerEl,
    scoreOverviewEl,            // 1. Card punteggi
    webVitalsEl,                // 2. Core Web Vitals
    enhancedMetricsEl,          // 3. Metriche Avanzate (se disponibile)
    resourceSectionEl,          // 4. Analisi delle Risorse
    optimizationsSectionEl,     // 5. Suggerimenti di Ottimizzazione
    comparisonSectionEl,        // 6. Confronto con altri Siti
    economicBenefitsEl,         // 7. Benefici Economici
    actionButtonsEl             // Pulsanti di azione finale
  ];

  // 2. Riordina gli elementi nel DOM
  let previousElement = null;
  newOrder.forEach(element => {
    if (element) {
      // Rimuoviamo l'elemento corrente se ha già un genitore
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }

      // Se abbiamo un elemento precedente, inseriamo dopo di esso
      if (previousElement && previousElement.parentNode === dashboard) {
        previousElement.after(element);
      } else {
        // Altrimenti aggiungiamo alla fine della dashboard
        dashboard.appendChild(element);
      }

      previousElement = element;
    }
  });

  console.log("Riorganizzazione sezioni completata");
}

/**
 * Trova un elemento in base al testo del suo heading
 * @param {HTMLElement} container - Elemento contenitore in cui cercare
 * @param {string} headingText - Testo da cercare nell'heading
 * @returns {HTMLElement|null} - Elemento trovato o null
 */
function getElementByHeadingText(container, headingText) {
  const detailSections = container.querySelectorAll('.detail-section');
  for (const section of detailSections) {
    const heading = section.querySelector('h2');
    if (heading && heading.textContent.includes(headingText)) {
      return section;
    }
  }
  return null;
}