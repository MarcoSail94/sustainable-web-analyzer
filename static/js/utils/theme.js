/**
 * Sistema di gestione temi (chiaro/scuro)
 */

/**
 * Inizializza il sistema di temi
 */
export function initTheme() {
  // Controlla se esiste una preferenza salvata
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');

  if (!themeToggle || !themeIcon) return;

  // Imposta il tema iniziale
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';
    updateThemeIcon(savedTheme === 'dark');
  } else if (prefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.checked = true;
    updateThemeIcon(true);
  }

  // Toggle del tema
  themeToggle.addEventListener('change', function(e) {
    const isDark = e.target.checked;
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(isDark);

    // Comunica il cambio agli eventuali iframe o componenti
    document.querySelectorAll('iframe').forEach(iframe => {
      try {
        iframe.contentWindow.postMessage({ type: 'theme-change', theme }, '*');
      } catch (e) {
        console.warn('Impossibile comunicare con iframe', e);
      }
    });

    // Aggiorna i grafici se esistono
    updateCharts(theme);
  });
}

/**
 * Aggiorna l'icona del tema
 * @param {boolean} isDark - Se il tema è scuro
 */
function updateThemeIcon(isDark) {
  const themeIcon = document.getElementById('themeIcon');
  if (!themeIcon) return;

  themeIcon.className = isDark ? 'fas fa-sun theme-icon' : 'fas fa-moon theme-icon';
}

/**
 * Aggiorna i grafici con i colori del tema corrente
 * @param {string} theme - Il tema corrente ('light' o 'dark')
 */
function updateCharts(theme) {
  // Se Chart.js è presente, aggiorna i temi dei grafici
  if (typeof Chart !== 'undefined' && Chart.instances) {
    // Configura gli stili per il tema corrente
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = theme === 'dark' ? '#f9fafb' : '#111827';

    // Aggiorna tutti i grafici esistenti
    Object.values(Chart.instances).forEach(chart => {
      if (!chart.options || !chart.options.scales) return;

      // Aggiorna le opzioni di scala
      if (chart.options.scales.y) {
        chart.options.scales.y.grid.color = gridColor;
        chart.options.scales.y.ticks.color = textColor;
      }

      if (chart.options.scales.x) {
        chart.options.scales.x.grid.color = gridColor;
        chart.options.scales.x.ticks.color = textColor;
      }

      // Aggiorna le opzioni dei plugin
      if (chart.options.plugins && chart.options.plugins.legend) {
        chart.options.plugins.legend.labels.color = textColor;
      }

      // Aggiorna il grafico
      chart.update();
    });
  }
}

// Esporta le funzioni
export { updateThemeIcon, updateCharts };