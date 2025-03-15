import React, { useState } from 'react';
import { LineChart, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const EnhancedDashboard = ({ data }) => {
  const [activeTab, setActiveTab] = useState('sustainability');

  // Verificare se sono disponibili metriche avanzate
  const isEnhanced = data?.analyzer_type === 'lighthouse-enhanced';
  const metrics = data?.metrics || {};
  const webVitals = metrics?.web_vitals || {};
  const performanceDetails = metrics?.performance_details || {};
  const optimizationScores = metrics?.optimization || {};
  const categoryScores = metrics?.category_scores || {};
  const energyMetrics = metrics?.energy || {};
  const carbonFootprint = metrics?.carbon_footprint || {};

  // Dati per il grafico radar delle performance
  const performanceRadarData = [
    { name: 'LCP', value: webVitals.lcp || 0, fullMark: 4 },
    { name: 'FID', value: webVitals.fid / 1000 || 0, fullMark: 0.3 },
    { name: 'CLS', value: webVitals.cls * 10 || 0, fullMark: 2.5 },
    { name: 'TTI', value: webVitals.time_to_interactive / 1000 || 0, fullMark: 5 },
    { name: 'TTFB', value: webVitals.ttfb / 1000 || 0, fullMark: 0.6 },
    { name: 'Speed Index', value: webVitals.speed_index / 1000 || 0, fullMark: 4.5 },
  ];

  // Dati per il grafico a barre delle ottimizzazioni
  const optimizationBarData = [
    { name: 'Immagini', score: Math.round((optimizationScores.compress_images || 0.5) * 100) },
    { name: 'Next-Gen', score: Math.round((optimizationScores.next_gen_images || 0.5) * 100) },
    { name: 'Compress', score: Math.round((optimizationScores.text_compression || 0.5) * 100) },
    { name: 'JS Optim', score: Math.round((optimizationScores.js_optimization || 0.5) * 100) },
    { name: 'Cache', score: Math.round((optimizationScores.cache_policy || 0.5) * 100) },
    { name: 'HTTP/2', score: Math.round((optimizationScores.http2 || 0.5) * 100) },
  ];

  // Dati per il grafico dei punteggi complessivi
  const categoryScoreData = [
    { name: 'Performance', score: categoryScores.performance || 0 },
    { name: 'Accessibilità', score: categoryScores.accessibility || 0 },
    { name: 'Best Practices', score: categoryScores.best_practices || 0 },
    { name: 'SEO', score: categoryScores.seo || 0 },
    { name: 'Sostenibilità', score: metrics.sustainability_score || 0 },
  ];

  // Colori per i punteggi
  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  // Formatta i numeri grandi
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num;
  };

  return (
    <div className="enhanced-dashboard">
      {/* Tabs per navigare tra le sezioni */}
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'sustainability' ? 'active' : ''}`}
          onClick={() => setActiveTab('sustainability')}
        >
          <i className="fas fa-leaf mr-2"></i> Sostenibilità
        </button>
        <button
          className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <i className="fas fa-tachometer-alt mr-2"></i> Performance
        </button>
        <button
          className={`tab-button ${activeTab === 'optimization' ? 'active' : ''}`}
          onClick={() => setActiveTab('optimization')}
        >
          <i className="fas fa-sliders-h mr-2"></i> Ottimizzazioni
        </button>
        <button
          className={`tab-button ${activeTab === 'energy' ? 'active' : ''}`}
          onClick={() => setActiveTab('energy')}
        >
          <i className="fas fa-bolt mr-2"></i> Energia
        </button>
      </div>

      {/* Pannello di sostenibilità */}
      {activeTab === 'sustainability' && (
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Sostenibilità Digitale</h2>
            <p>Panoramica completa dell'impatto ambientale del sito web</p>
          </div>

          <div className="metrics-overview">
            <div className="metric-card highlight">
              <div className="metric-value">{metrics.sustainability_score}<span>/100</span></div>
              <div className="metric-label">Punteggio Sostenibilità</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics.co2_emissions}<span>g/view</span></div>
              <div className="metric-label">Emissioni CO₂</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics.load_time}<span>s</span></div>
              <div className="metric-label">Tempo di Caricamento</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{metrics.total_size}</div>
              <div className="metric-label">Dimensione Totale</div>
            </div>
          </div>

          {carbonFootprint && (
            <div className="carbon-section">
              <h3><i className="fas fa-globe mr-2"></i> Impronta di Carbonio Annuale</h3>

              <div className="carbon-metrics">
                <div className="carbon-metric">
                  <div className="carbon-value">{carbonFootprint.kg_co2} kg</div>
                  <div className="carbon-label">CO₂ all'anno</div>
                </div>
                <div className="carbon-metric">
                  <div className="carbon-value">{carbonFootprint.equivalent_trees}</div>
                  <div className="carbon-label">Alberi equivalenti</div>
                </div>
                <div className="carbon-metric">
                  <div className="carbon-value">{formatNumber(carbonFootprint.comparison?.car_km || 0)} km</div>
                  <div className="carbon-label">Equivalenti in auto</div>
                </div>
                <div className="carbon-metric">
                  <div className="carbon-value">{formatNumber(carbonFootprint.comparison?.smartphone_charges || 0)}</div>
                  <div className="carbon-label">Ricariche smartphone</div>
                </div>
              </div>
            </div>
          )}

          <div className="category-chart-container">
            <h3><i className="fas fa-chart-bar mr-2"></i> Punteggi di Qualità</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                width={500}
                height={300}
                data={categoryScoreData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" name="Punteggio">
                  {categoryScoreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Pannello performance */}
      {activeTab === 'performance' && (
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Analisi Performance</h2>
            <p>Dettagli delle metriche di performance e Web Vitals</p>
          </div>

          <div className="metrics-overview">
            <div className="metric-card">
              <div className="metric-value">{webVitals.lcp}<span>s</span></div>
              <div className="metric-label">LCP</div>
              <div className="metric-explanation">Largest Contentful Paint</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{webVitals.fid}<span>ms</span></div>
              <div className="metric-label">FID</div>
              <div className="metric-explanation">First Input Delay</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{webVitals.cls}</div>
              <div className="metric-label">CLS</div>
              <div className="metric-explanation">Cumulative Layout Shift</div>
            </div>
            <div className="metric-card highlight">
              <div className="metric-value">{webVitals.lighthouse_score}<span>/100</span></div>
              <div className="metric-label">Performance Score</div>
            </div>
          </div>

          <div className="performance-radar-container">
            <h3><i className="fas fa-tachometer-alt mr-2"></i> Radar delle Performance</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis />
                <Radar name="Tuo Sito" dataKey="value" stroke="#16a34a" fill="#16a34a" fillOpacity={0.6} />
                <Tooltip formatter={(value) => value.toFixed(2)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {isEnhanced && (
            <div className="additional-metrics">
              <h3><i className="fas fa-th-list mr-2"></i> Metriche Avanzate</h3>
              <div className="metrics-table">
                <div className="metric-row">
                  <div className="metric-name">First Contentful Paint</div>
                  <div className="metric-value">{(performanceDetails.first_contentful_paint / 1000).toFixed(2)}s</div>
                </div>
                <div className="metric-row">
                  <div className="metric-name">Speed Index</div>
                  <div className="metric-value">{(performanceDetails.speed_index / 1000).toFixed(2)}s</div>
                </div>
                <div className="metric-row">
                  <div className="metric-name">Time to Interactive</div>
                  <div className="metric-value">{(performanceDetails.time_to_interactive / 1000).toFixed(2)}s</div>
                </div>
                <div className="metric-row">
                  <div className="metric-name">Total Blocking Time</div>
                  <div className="metric-value">{performanceDetails.total_blocking_time}ms</div>
                </div>
                <div className="metric-row">
                  <div className="metric-name">Dimensione DOM</div>
                  <div className="metric-value">{performanceDetails.dom_size} elementi</div>
                </div>
                <div className="metric-row">
                  <div className="metric-name">Richieste di Rete</div>
                  <div className="metric-value">{performanceDetails.network_requests}</div>
                </div>
                <div className="metric-row">
                  <div className="metric-name">Bootup Time JS</div>
                  <div className="metric-value">{(performanceDetails.bootup_time / 1000).toFixed(2)}s</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pannello ottimizzazioni */}
      {activeTab === 'optimization' && (
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Opportunità di Ottimizzazione</h2>
            <p>Aree di miglioramento e loro punteggi</p>
          </div>

          {isEnhanced && (
            <div className="optimization-chart-container">
              <h3><i className="fas fa-chart-bar mr-2"></i> Punteggi di Ottimizzazione</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  width={500}
                  height={300}
                  data={optimizationBarData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" name="Punteggio">
                    {optimizationBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="optimization-explanations">
            <h3><i className="fas fa-lightbulb mr-2"></i> Spiegazioni Tecniche</h3>
            <div className="explanations-grid">
              <div className="explanation-card">
                <h4>Compressione Immagini</h4>
                <p>Le immagini devono essere propriamente ottimizzate tramite compressione senza perdita di qualità percepibile.</p>
                <div className="score-pill" style={{ backgroundColor: getScoreColor(optimizationScores.compress_images * 100 || 50) }}>
                  {Math.round((optimizationScores.compress_images || 0.5) * 100)}/100
                </div>
              </div>
              <div className="explanation-card">
                <h4>Immagini Next-Gen</h4>
                <p>Formati moderni come WebP e AVIF offrono migliore compressione rispetto a PNG e JPEG.</p>
                <div className="score-pill" style={{ backgroundColor: getScoreColor(optimizationScores.next_gen_images * 100 || 50) }}>
                  {Math.round((optimizationScores.next_gen_images || 0.5) * 100)}/100
                </div>
              </div>
              <div className="explanation-card">
                <h4>Compressione Testo</h4>
                <p>HTML, CSS e JavaScript dovrebbero essere compressi con gzip o brotli.</p>
                <div className="score-pill" style={{ backgroundColor: getScoreColor(optimizationScores.text_compression * 100 || 50) }}>
                  {Math.round((optimizationScores.text_compression || 0.5) * 100)}/100
                </div>
              </div>
              <div className="explanation-card">
                <h4>Ottimizzazione JS</h4>
                <p>Rimuovere codice JavaScript non utilizzato e minificare quello rimanente.</p>
                <div className="score-pill" style={{ backgroundColor: getScoreColor(optimizationScores.js_optimization * 100 || 50) }}>
                  {Math.round((optimizationScores.js_optimization || 0.5) * 100)}/100
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pannello energia */}
      {activeTab === 'energy' && (
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Efficienza Energetica</h2>
            <p>Consumo energetico e impatto ambientale</p>
          </div>

          {energyMetrics && (
            <div className="energy-metrics-overview">
              <div className="metric-card highlight">
                <div className="metric-value">{energyMetrics.score}<span>/100</span></div>
                <div className="metric-label">Efficienza Energetica</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{energyMetrics.estimated_kwh_per_view}<span>kWh</span></div>
                <div className="metric-label">Consumo per Visita</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{energyMetrics.estimated_yearly_kwh}<span>kWh</span></div>
                <div className="metric-label">Consumo Annuale</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{metrics.co2_emissions}<span>g CO₂</span></div>
                <div className="metric-label">Emissioni per Visita</div>
              </div>
            </div>
          )}

          <div className="energy-impact-section">
            <h3><i className="fas fa-info-circle mr-2"></i> Impatto degli Ottimizzazioni</h3>
            <p>Come i diversi aspetti del tuo sito influenzano l'efficienza energetica:</p>

            {energyMetrics?.optimization_impacts && (
              <div className="impact-bars">
                <div className="impact-bar">
                  <div className="impact-label">Ottimizzazione Immagini</div>
                  <div className="impact-track">
                    <div className="impact-fill" style={{ width: `${energyMetrics.optimization_impacts.images}%`, backgroundColor: getScoreColor(energyMetrics.optimization_impacts.images) }}></div>
                  </div>
                  <div className="impact-value">{energyMetrics.optimization_impacts.images}%</div>
                </div>
                <div className="impact-bar">
                  <div className="impact-label">Formati Immagine Moderni</div>
                  <div className="impact-track">
                    <div className="impact-fill" style={{ width: `${energyMetrics.optimization_impacts.next_gen_formats}%`, backgroundColor: getScoreColor(energyMetrics.optimization_impacts.next_gen_formats) }}></div>
                  </div>
                  <div className="impact-value">{energyMetrics.optimization_impacts.next_gen_formats}%</div>
                </div>
                <div className="impact-bar">
                  <div className="impact-label">Compressione Testo</div>
                  <div className="impact-track">
                    <div className="impact-fill" style={{ width: `${energyMetrics.optimization_impacts.text_compression}%`, backgroundColor: getScoreColor(energyMetrics.optimization_impacts.text_compression) }}></div>
                  </div>
                  <div className="impact-value">{energyMetrics.optimization_impacts.text_compression}%</div>
                </div>
                <div className="impact-bar">
                  <div className="impact-label">Ottimizzazione JavaScript</div>
                  <div className="impact-track">
                    <div className="impact-fill" style={{ width: `${energyMetrics.optimization_impacts.js_optimization}%`, backgroundColor: getScoreColor(energyMetrics.optimization_impacts.js_optimization) }}></div>
                  </div>
                  <div className="impact-value">{energyMetrics.optimization_impacts.js_optimization}%</div>
                </div>
                <div className="impact-bar">
                  <div className="impact-label">Caching Efficiente</div>
                  <div className="impact-track">
                    <div className="impact-fill" style={{ width: `${energyMetrics.optimization_impacts.caching}%`, backgroundColor: getScoreColor(energyMetrics.optimization_impacts.caching) }}></div>
                  </div>
                  <div className="impact-value">{energyMetrics.optimization_impacts.caching}%</div>
                </div>
                <div className="impact-bar">
                  <div className="impact-label">Utilizzo di HTTP/2</div>
                  <div className="impact-track">
                    <div className="impact-fill" style={{ width: `${energyMetrics.optimization_impacts.http2}%`, backgroundColor: getScoreColor(energyMetrics.optimization_impacts.http2) }}></div>
                  </div>
                  <div className="impact-value">{energyMetrics.optimization_impacts.http2}%</div>
                </div>
              </div>
            )}
          </div>

          <div className="energy-tips">
            <h3><i className="fas fa-lightbulb mr-2"></i> Consigli per l'efficienza energetica</h3>
            <ul className="tips-list">
              <li><i className="fas fa-check mr-2"></i> <strong>Riduci il JavaScript</strong>: Il parsing e l'esecuzione del JS sono operazioni ad alta intensità di CPU che consumano molta energia.</li>
              <li><i className="fas fa-check mr-2"></i> <strong>Ottimizza le immagini</strong>: Immagini più piccole richiedono meno larghezza di banda e meno energia per essere trasferite.</li>
              <li><i className="fas fa-check mr-2"></i> <strong>Usa un CDN verde</strong>: Alcuni Content Delivery Network funzionano con energia rinnovabile.</li>
              <li><i className="fas fa-check mr-2"></i> <strong>Implementa caching aggressivo</strong>: Il caching riduce le richieste di rete e il consumo energetico.</li>
              <li><i className="fas fa-check mr-2"></i> <strong>Riduce gli script di terze parti</strong>: Gli script esterni spesso aggiungono peso e complessità computazionale.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDashboard;