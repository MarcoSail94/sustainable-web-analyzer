/**
 * Enhanced chart debugging code to fix rendering issues
 * Add this to your static/js/modules/charts.js file at the top
 */

// Debug function to check if chart containers are properly visible
function debugChartContainers() {
  console.log("Checking chart containers...");

  // Check all chart containers
  const containers = document.querySelectorAll('.chart-container, .web-vitals-chart-container');
  containers.forEach((container, index) => {
    const canvas = container.querySelector('canvas');

    console.log(`Chart container ${index}:`, {
      container: container,
      visible: isElementVisible(container),
      dimensions: {
        width: container.offsetWidth,
        height: container.offsetHeight
      },
      canvas: canvas ? {
        id: canvas.id,
        width: canvas.width,
        height: canvas.height,
        style: window.getComputedStyle(canvas)
      } : 'No canvas found',
      computedStyle: {
        display: window.getComputedStyle(container).display,
        visibility: window.getComputedStyle(container).visibility,
        overflow: window.getComputedStyle(container).overflow,
        position: window.getComputedStyle(container).position
      }
    });
  });

  // Check if Chart.js is properly initialized
  console.log("Chart.js availability:", typeof Chart !== 'undefined');
  console.log("Chart.js instances:", Chart.instances ? Object.keys(Chart.instances).length : 'No instances object');
}

// Helper to check if an element is actually visible
function isElementVisible(element) {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * Fix for chart containers with zero height
 * Call this before creating any chart
 */
function fixChartContainer(container) {
  if (!container) return false;

  // Check if the container has zero height
  if (container.offsetHeight === 0) {
    console.log(`Fixing zero height container: ${container.id || 'unnamed'}`);

    // Force a minimum height - adjust this value as needed
    container.style.height = '350px';

    // Find the canvas inside
    const canvas = container.querySelector('canvas');
    if (canvas) {
      // Set explicit dimensions on the canvas
      canvas.height = 350;
      // Width will adjust automatically with responsive: true
    }

    return true; // Container was fixed
  }

  return false; // No fix needed
}

/**
 * Enhanced createComparisonChart function with better error handling
 * @param {Object} data - Data for the chart
 */
export function createComparisonChart(data) {
  try {
    // Debug information
    debugChartContainers();

    // Get the container and canvas
    const container = document.querySelector('.chart-container');
    if (!container) {
      console.error('Chart container not found');
      return;
    }

    // Fix the container if needed
    fixChartContainer(container);

    const canvas = document.getElementById('comparisonChart');
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    // Verify Chart.js availability
    if (typeof Chart === 'undefined') {
      console.error('Chart.js not available');
      fallbackChartImplementation(container);
      return;
    }

    // Get the 2D context
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context from canvas');
      fallbackChartImplementation(container);
      return;
    }

    // Destroy previous chart instance if it exists
    if (window.comparisonChart && typeof window.comparisonChart.destroy === 'function') {
      window.comparisonChart.destroy();
    }

    // Check and prepare data for the chart
    if (!data || !data.metrics || !data.industry_comparison) {
      console.error('Invalid data for comparison chart:', data);
      fallbackChartImplementation(container, 'Dati insufficienti per il grafico di confronto');
      return;
    }

    // Prepare metrics data with validation
    const metrics = [
      {
        label: 'Emissioni CO₂ (g/view)',
        yourValue: data.metrics.co2_emissions || 0,
        industryAvg: data.industry_comparison?.average_co2 || 0.6  // Fallback value
      },
      {
        label: 'Tempo di Caricamento (s)',
        yourValue: data.metrics.load_time || 0,
        industryAvg: data.industry_comparison?.average_load_time || 2.5  // Fallback value
      },
      {
        label: 'Punteggio Sostenibilità (/100)',
        yourValue: data.metrics.sustainability_score || 0,
        industryAvg: data.industry_comparison?.average_sustainability_score || 75  // Fallback value
      }
    ];

    console.log("Chart data prepared:", metrics);

    // Ensure all values are valid numbers
    metrics.forEach(metric => {
      if (isNaN(metric.yourValue)) metric.yourValue = 0;
      if (isNaN(metric.industryAvg)) metric.industryAvg = 0;
    });

    // Create the chart with delayed rendering to ensure DOM is ready
    setTimeout(() => {
      try {
        // Force a redraw of the canvas
        canvas.width = canvas.width;

        // Create the chart
        window.comparisonChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: metrics.map(m => m.label),
            datasets: [
              {
                label: 'Il tuo sito',
                data: metrics.map(m => m.yourValue),
                backgroundColor: '#16a34a',
                borderColor: '#15803d',
                borderWidth: 1,
                borderRadius: 6
              },
              {
                label: 'Media di settore',
                data: metrics.map(m => m.industryAvg),
                backgroundColor: '#9ca3af',
                borderColor: '#6b7280',
                borderWidth: 1,
                borderRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  padding: 20,
                  font: {
                    size: 14
                  }
                }
              },
              tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleFont: {
                  size: 16,
                  weight: 'bold'
                },
                bodyFont: {
                  size: 14
                },
                padding: 16,
                cornerRadius: 8
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  display: true,
                  color: 'rgba(107, 114, 128, 0.1)'
                },
                ticks: {
                  font: {
                    size: 12
                  }
                }
              },
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  font: {
                    size: 12
                  }
                }
              }
            }
          }
        });

        console.log("Comparison chart created successfully");

        // After chart creation, check if it's visible
        if (window.comparisonChart) {
          console.log("Chart object exists:", window.comparisonChart);
          // Check if the chart is in Chart.instances
          console.log("Chart instances:", Chart.instances ?
              Object.keys(Chart.instances).length : 'No instances available');
        }
      } catch (innerError) {
        console.error("Error during delayed chart creation:", innerError);
        fallbackChartImplementation(container, `Errore nella creazione del grafico: ${innerError.message}`);
      }
    }, 250); // Delay to ensure DOM is ready

  } catch (error) {
    console.error('Error during chart creation:', error);
    console.error('Stack trace:', error.stack);

    const container = document.querySelector('.chart-container');
    if (container) {
      fallbackChartImplementation(container, `Errore nella creazione del grafico: ${error.message}`);
    }
  }
}

/**
 * Enhanced createCostBreakdownCharts function with better error handling
 */
export function createCostBreakdownCharts(economicBenefits) {
  try {
    // Debug information
    console.log("Creating economic charts with data:", economicBenefits);
    debugChartContainers();

    // Verify Chart.js availability
    if (typeof Chart === 'undefined') {
      console.error('Chart.js not available for cost charts');
      fallbackEconomicCharts();
      return;
    }

    // Verify data validity
    if (!economicBenefits || !economicBenefits.costs_breakdown) {
      console.error('Invalid economic data:', economicBenefits);
      fallbackEconomicCharts();
      return;
    }

    // Get the canvases
    const costsCanvas = document.getElementById('costsBreakdownChart');
    const savingsCanvas = document.getElementById('savingsBreakdownChart');

    if (!costsCanvas || !savingsCanvas) {
      console.error('Canvas elements for cost charts not found');
      return;
    }

    // Fix containers if needed
    const costsContainer = costsCanvas.parentNode;
    const savingsContainer = savingsCanvas.parentNode;

    fixChartContainer(costsContainer);
    fixChartContainer(savingsContainer);

    // Delayed chart creation to ensure DOM is ready
    setTimeout(() => {
      try {
        // Force a redraw of the canvases
        costsCanvas.width = costsCanvas.width;
        savingsCanvas.width = savingsCanvas.width;

        // Rest of the cost chart creation code...
        const costsData = economicBenefits.costs_breakdown;
        const costsCtx = costsCanvas.getContext('2d');

        if (!costsCtx) {
          console.error('Could not get context for costs canvas');
          return;
        }

        // Destroy previous charts if they exist
        if (window.costsChart && typeof window.costsChart.destroy === 'function') {
          window.costsChart.destroy();
        }

        if (window.savingsChart && typeof window.savingsChart.destroy === 'function') {
          window.savingsChart.destroy();
        }

        // Check cost values
        const costValues = [
          costsData.bandwidth || 0,
          costsData.energy || 0,
          costsData.seo_impact || 0,
          costsData.bounce_impact || 0,
          costsData.extra_maintenance || 0,
          costsData.extra_infrastructure || 0
        ];

        // Check if all values are zero
        if (costValues.every(val => val === 0)) {
          const container = costsCanvas.parentNode;
          container.innerHTML = `
            <div class="text-center p-4">
              <p>Dati insufficienti per creare il grafico dei costi.</p>
            </div>
          `;
          return;
        }

        // Create costs chart
        window.costsChart = new Chart(costsCtx, {
          type: 'doughnut',
          data: {
            labels: [
              'Costi di Banda',
              'Costi Energetici',
              'Impatto SEO',
              'Utenti Persi',
              'Costi Manutenzione',
              'Infrastruttura Extra'
            ],
            datasets: [{
              data: costValues,
              backgroundColor: [
                '#3b82f6', // blu
                '#10b981', // verde
                '#f59e0b', // arancione
                '#ef4444', // rosso
                '#8b5cf6', // viola
                '#6b7280'  // grigio
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    return `${label}: €${value.toFixed(2)}`;
                  }
                }
              },
              title: {
                display: true,
                text: 'Suddivisione dei Costi Mensili',
                font: {
                  size: 16
                }
              }
            }
          }
        });

        console.log("Costs chart created successfully");

        // Savings chart - only if data is available
        if (economicBenefits.savings_breakdown) {
          const savingsData = economicBenefits.savings_breakdown;
          const savingsCtx = savingsCanvas.getContext('2d');

          if (!savingsCtx) {
            console.error('Could not get context for savings canvas');
            return;
          }

          // Verify savings values
          const savingsValues = [
            savingsData.bandwidth || 0,
            savingsData.energy || 0,
            savingsData.seo_conversions || 0,
            savingsData.reduced_bounce || 0,
            savingsData.maintenance || 0,
            savingsData.infrastructure || 0
          ];

          // If all savings are zero, show a message
          if (savingsValues.every(val => val === 0)) {
            const container = savingsCanvas.parentNode;
            container.innerHTML = `
              <div class="text-center p-4">
                <p>Dati insufficienti per creare il grafico dei risparmi.</p>
              </div>
            `;
            return;
          }

          // Create savings chart
          window.savingsChart = new Chart(savingsCtx, {
            type: 'doughnut',
            data: {
              labels: [
                'Risparmio Banda',
                'Risparmio Energia',
                'Migliore SEO',
                'Meno Rimbalzi',
                'Meno Manutenzione',
                'Infrastruttura Ottimizzata'
              ],
              datasets: [{
                data: savingsValues,
                backgroundColor: [
                  '#3b82f6', // blu
                  '#10b981', // verde
                  '#f59e0b', // arancione
                  '#ef4444', // rosso
                  '#8b5cf6', // viola
                  '#6b7280'  // grigio
                ],
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.label || '';
                      const value = context.raw || 0;
                      return `${label}: €${value.toFixed(2)}`;
                    }
                  }
                },
                title: {
                  display: true,
                  text: 'Potenziali Risparmi Mensili',
                  font: {
                    size: 16
                  }
                }
              }
            }
          });

          console.log("Savings chart created successfully");
        }
      } catch (innerError) {
        console.error("Error during delayed economic chart creation:", innerError);
        fallbackEconomicCharts();
      }
    }, 250); // Delay to ensure DOM is ready

  } catch (error) {
    console.error('Error creating economic charts:', error);
    console.error('Stack trace:', error.stack);
    fallbackEconomicCharts();
  }
}

/**
 * Enhanced fallback for when charts can't be created
 */
function fallbackChartImplementation(container, message = null) {
  if (!container) return;

  const errorMessage = message || 'Non è stato possibile caricare la libreria per i grafici.';

  container.innerHTML = `
    <div style="text-align: center; padding: 20px; background-color: var(--bg-alt, #f8f9fa); border-radius: 8px; height: 100%;">
      <p><strong>Visualizzazione grafica non disponibile</strong></p>
      <p>${errorMessage}</p>
      <p style="margin-top: 15px;">Prova a ricaricare la pagina o a utilizzare un browser diverso.</p>
    </div>
  `;

  console.log("Fallback chart implemented");
}

/**
 * Enhanced fallback for economic charts
 */
function fallbackEconomicCharts() {
  const costsContainer = document.getElementById('costsBreakdownChart');
  const savingsContainer = document.getElementById('savingsBreakdownChart');

  const fallbackHTML = `
    <div style="text-align: center; padding: 20px; background-color: var(--bg-alt, #f8f9fa); border-radius: 8px; height: 100%;">
      <p><strong>Grafico non disponibile</strong></p>
      <p>Non è stato possibile caricare i grafici di suddivisione dei costi.</p>
      <p style="margin-top: 15px;">Prova a ricaricare la pagina o a utilizzare un browser diverso.</p>
    </div>
  `;

  if (costsContainer && costsContainer.parentNode) {
    costsContainer.parentNode.innerHTML = fallbackHTML;
  }

  if (savingsContainer && savingsContainer.parentNode) {
    savingsContainer.parentNode.innerHTML = fallbackHTML;
  }

  console.log("Fallback economic charts implemented");
}