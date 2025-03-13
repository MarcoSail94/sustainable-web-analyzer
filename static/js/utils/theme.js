/**
 * Sistema di gestione temi (chiaro/scuro) migliorato
 * - Aggiunta prevenzione "flash" iniziale
 * - Migliorata l'integrazione con altre librerie
 * - Aggiunto supporto per preferenze del sistema operativo
 * - Migliorato supporto per grafici in modalità scura
 */

// IMPORTANTE: Questo script deve essere caricato prima degli altri per prevenire il "flash of unstyled content"
(function() {
  // Tenta di leggere il tema salvato dal localStorage subito
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Applica immediatamente il tema senza attendere che il DOM sia completamente caricato
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else if (prefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

/**
 * Inizializza il sistema di temi completo
 */
export function initTheme() {
  // Controlla se esiste una preferenza salvata
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');

  if (!themeToggle || !themeIcon) return;

  // Imposta lo stato del toggle in base al tema
  if (savedTheme) {
    themeToggle.checked = savedTheme === 'dark';
    updateThemeIcon(savedTheme === 'dark');
  } else if (prefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.checked = true;
    updateThemeIcon(true);
  }

  // Aggiorna in base a cambiamenti nelle preferenze del sistema
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkModeMediaQuery.addEventListener('change', (e) => {
    // Solo se l'utente non ha già una preferenza salvata
    if (!localStorage.getItem('theme')) {
      const isDark = e.matches;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      if (themeToggle) themeToggle.checked = isDark;
      if (themeIcon) updateThemeIcon(isDark);

      // Aggiorna i grafici se esistono
      updateCharts(isDark ? 'dark' : 'light');
    }
  });

  // Toggle del tema
  themeToggle.addEventListener('change', function(e) {
    const isDark = e.target.checked;
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(isDark);

    // Applica transizione fluida quando si cambia tema
    document.documentElement.classList.add('theme-transition');
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 500);

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

    // Evento personalizzato per consentire ad altri moduli di reagire al cambio tema
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  });

  // Applica immediatamente il tema ai grafici all'avvio
  const currentTheme = document.documentElement.getAttribute('data-theme') ||
                      (prefersDark ? 'dark' : 'light');
  updateCharts(currentTheme);
}

/**
 * Aggiorna l'icona del tema
 * @param {boolean} isDark - Se il tema è scuro
 */
function updateThemeIcon(isDark) {
  const themeIcon = document.getElementById('themeIcon');
  if (!themeIcon) return;

  themeIcon.className = isDark ? 'fas fa-sun theme-icon' : 'fas fa-moon theme-icon';

  // Animazione per l'icona
  themeIcon.classList.add('icon-spin');
  setTimeout(() => {
    themeIcon.classList.remove('icon-spin');
  }, 500);
}

/**
 * Aggiorna i grafici con i colori del tema corrente
 * @param {string} theme - Il tema corrente ('light' o 'dark')
 */
function updateCharts(theme) {
  // Se Chart.js è presente, aggiorna i temi dei grafici
  if (typeof Chart === 'undefined' || !Chart.instances) {
    return;
  }

  // Configura gli stili completi per il tema corrente
  const isDark = theme === 'dark';

  // Colori per il tema scuro
  const darkThemeColors = {
    backgroundColor: '#2a354b',      // Sfondo del grafico
    gridColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    textColor: '#f9fafb',           // Colore del testo
    tooltipBackgroundColor: '#374151',
    tooltipBorderColor: '#4b5563',
    tooltipTextColor: '#f3f4f6',
    // Colori per i dataset di grafici a barre/linee
    colors: [
      '#22c55e',  // Verde primario
      '#93c5fd',  // Blu chiaro
      '#fcd34d',  // Giallo
      '#f87171',  // Rosso
      '#c084fc',  // Viola
      '#d1d5db'   // Grigio chiaro
    ],
    // Colori per grafici a torta/ciambella
    pieColors: [
      '#22c55e',  // Verde
      '#60a5fa',  // Blu
      '#fbbf24',  // Arancione
      '#f87171',  // Rosso
      '#c084fc',  // Viola
      '#94a3b8'   // Grigio
    ]
  };

  // Colori per il tema chiaro (default)
  const lightThemeColors = {
    backgroundColor: '#ffffff',      // Sfondo bianco
    gridColor: 'rgba(0, 0, 0, 0.1)',
    borderColor: 'rgba(0, 0, 0, 0.2)',
    textColor: '#111827',           // Testo scuro
    tooltipBackgroundColor: '#ffffff',
    tooltipBorderColor: '#d1d5db',
    tooltipTextColor: '#111827',
    // Colori per i dataset di grafici a barre/linee
    colors: [
      '#16a34a',  // Verde primario
      '#3b82f6',  // Blu
      '#fbbf24',  // Giallo
      '#ef4444',  // Rosso
      '#8b5cf6',  // Viola
      '#6b7280'   // Grigio
    ],
    // Colori per grafici a torta/ciambella
    pieColors: [
      '#16a34a',  // Verde
      '#3b82f6',  // Blu
      '#f59e0b',  // Arancione
      '#ef4444',  // Rosso
      '#8b5cf6',  // Viola
      '#6b7280'   // Grigio
    ]
  };

  // Seleziona il set di colori appropriato
  const colors = isDark ? darkThemeColors : lightThemeColors;

  // Imposta i colori di default globali per Chart.js
  Chart.defaults.color = colors.textColor;
  Chart.defaults.borderColor = colors.borderColor;

  // Imposta gli stili globali per i tooltip
  Chart.defaults.plugins.tooltip.backgroundColor = colors.tooltipBackgroundColor;
  Chart.defaults.plugins.tooltip.borderColor = colors.tooltipBorderColor;
  Chart.defaults.plugins.tooltip.titleColor = colors.tooltipTextColor;
  Chart.defaults.plugins.tooltip.bodyColor = colors.tooltipTextColor;
  Chart.defaults.plugins.tooltip.footerColor = colors.tooltipTextColor;

  // Crea stili personalizzati per il tema corrente
  const chartjsTheme = {
    backgroundColor: colors.backgroundColor,
    color: colors.textColor,
    borderColor: colors.borderColor,
    grid: {
      color: colors.gridColor
    },
    tooltip: {
      backgroundColor: colors.tooltipBackgroundColor,
      borderColor: colors.tooltipBorderColor,
      titleColor: colors.tooltipTextColor,
      bodyColor: colors.tooltipTextColor
    }
  };

  // Aggiorna tutti i grafici esistenti
  Object.values(Chart.instances).forEach(chart => {
    // Aggiorna lo sfondo del canvas se presente
    if (chart.canvas && chart.canvas.parentNode) {
      chart.canvas.parentNode.style.backgroundColor = colors.backgroundColor;
    }

    // Aggiorna le opzioni di scala
    if (chart.options && chart.options.scales) {
      // Per asse Y
      Object.keys(chart.options.scales).forEach(scaleId => {
        const scale = chart.options.scales[scaleId];

        // Aggiorna colori della griglia e del testo
        if (scale.grid) {
          scale.grid.color = colors.gridColor;
          scale.grid.borderColor = colors.borderColor;
        }

        if (scale.ticks) {
          scale.ticks.color = colors.textColor;
        }

        // Se è un asse radiale (per grafici radar)
        if (scale.angleLines) {
          scale.angleLines.color = colors.gridColor;
        }

        if (scale.pointLabels) {
          scale.pointLabels.color = colors.textColor;
        }
      });
    }

    // Aggiorna le opzioni dei plugin
    if (chart.options.plugins) {
      // Legend
      if (chart.options.plugins.legend) {
        chart.options.plugins.legend.labels.color = colors.textColor;
        chart.options.plugins.legend.labels.boxWidth = 15;
        chart.options.plugins.legend.title.color = colors.textColor;
      }

      // Tooltip
      if (chart.options.plugins.tooltip) {
        chart.options.plugins.tooltip.backgroundColor = colors.tooltipBackgroundColor;
        chart.options.plugins.tooltip.borderColor = colors.tooltipBorderColor;
        chart.options.plugins.tooltip.titleColor = colors.tooltipTextColor;
        chart.options.plugins.tooltip.bodyColor = colors.tooltipTextColor;
      }

      // Titolo
      if (chart.options.plugins.title) {
        chart.options.plugins.title.color = colors.textColor;
      }
    }

    // Aggiorna i colori dei dataset per specifici tipi di grafici
    if (chart.config && chart.config.type) {
      // Per grafici a torta/ciambella
      if (['pie', 'doughnut'].includes(chart.config.type)) {
        chart.data.datasets.forEach((dataset, i) => {
          dataset.backgroundColor = colors.pieColors;
        });
      }
      // Per grafici a barre
      else if (['bar', 'line', 'radar'].includes(chart.config.type)) {
        chart.data.datasets.forEach((dataset, i) => {
          const colorIndex = i % colors.colors.length;
          // Mantieni il colore specificato dall'utente o usa il colore del tema
          if (!dataset._originalBackgroundColor) {
            dataset._originalBackgroundColor = dataset.backgroundColor;
          }

          // Gestisci diversi tipi di colori (array, stringa, ecc.)
          if (!dataset._userSpecifiedColors) {
            dataset.borderColor = colors.colors[colorIndex];

            // Per linee
            if (chart.config.type === 'line') {
              dataset.backgroundColor = isDark
                ? `${colors.colors[colorIndex]}33` // 20% opacity
                : `${colors.colors[colorIndex]}1A`; // 10% opacity
            } else {
              dataset.backgroundColor = colors.colors[colorIndex];
            }
          }
        });
      }
    }

    // Aggiorna il grafico
    chart.update('none'); // 'none' evita l'animazione
  });
}

// Esporta le funzioni
export { updateThemeIcon, updateCharts };