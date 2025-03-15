import React, { useState, useEffect } from 'react';

// Componente principale della dashboard avanzata
const EnhancedDashboard = ({ data }) => {
  // Stato per gestire il tab attivo
  const [activeTab, setActiveTab] = useState('sustainability');

  // Estrazione dei dati necessari
  const metrics = data?.metrics || {};
  const webVitals = metrics?.web_vitals || {};
  const resources = data?.resources || {};
  const optimizations = data?.optimizations || [];
  const economicBenefits = metrics?.economic_benefits || {};
  const carbonFootprint = metrics?.carbon_footprint || {};

  // Colori per i punteggi
  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // verde
    if (score >= 50) return '#f59e0b'; // giallo
    return '#ef4444'; // rosso
  };

  // Formatta i numeri grandi
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Verifica se i dati avanzati sono disponibili
  const hasEnhancedData = metrics.energy || carbonFootprint || metrics.performance_details;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      {/* Banner che indica l'uso della dashboard avanzata */}
      <div className="mb-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
        <div className="flex items-center">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-bold text-green-800 dark:text-green-200">Dashboard Avanzata</h3>
            <p className="text-green-700 dark:text-green-300">
              {hasEnhancedData
                ? "Visualizzazione con dati avanzati di Lighthouse attiva"
                : "Dashboard avanzata attiva, ma dati estesi non disponibili"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs per navigare tra le sezioni */}
      <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`px-4 py-2 font-medium rounded-t-lg text-sm mr-2 ${
            activeTab === 'sustainability'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setActiveTab('sustainability')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Sostenibilità
        </button>
        <button
          className={`px-4 py-2 font-medium rounded-t-lg text-sm mr-2 ${
            activeTab === 'performance'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setActiveTab('performance')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Performance
        </button>
        <button
          className={`px-4 py-2 font-medium rounded-t-lg text-sm mr-2 ${
            activeTab === 'economics'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setActiveTab('economics')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Economia
        </button>
        <button
          className={`px-4 py-2 font-medium rounded-t-lg text-sm ${
            activeTab === 'optimizations'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setActiveTab('optimizations')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Ottimizzazioni
        </button>
      </div>

      {/* Pannello Sostenibilità */}
      {activeTab === 'sustainability' && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Sostenibilità Digitale
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Punteggio Sostenibilità"
              value={metrics.sustainability_score || 0}
              suffix="/100"
              color={getScoreColor(metrics.sustainability_score || 0)}
              icon={<SustainabilityIcon />}
            />
            <MetricCard
              title="Emissioni CO₂"
              value={metrics.co2_emissions || 0}
              suffix="g/view"
              color="#3b82f6"
              icon={<CO2Icon />}
            />
            <MetricCard
              title="Dimensione Totale"
              value={metrics.total_size || "0 KB"}
              color="#8b5cf6"
              icon={<SizeIcon />}
            />
            <MetricCard
              title="Tempo di Caricamento"
              value={metrics.load_time || 0}
              suffix="s"
              color={metrics.load_time > 3 ? "#ef4444" : "#10b981"}
              icon={<SpeedIcon />}
            />
          </div>

          {carbonFootprint && (
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 mb-6 border border-green-200 dark:border-green-800">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Impronta di Carbonio Annuale
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {carbonFootprint.kg_co2 || 0} kg
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">CO₂ all'anno</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {carbonFootprint.equivalent_trees || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Alberi equivalenti</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatNumber(carbonFootprint.comparison?.car_km || 0)} km
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Equivalenti in auto</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatNumber(carbonFootprint.comparison?.smartphone_charges || 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Ricariche smartphone</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Ripartizione Risorse
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantità</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dimensione</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Impatto CO₂</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(resources).map(([type, data]) => (
                    <tr key={type} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ResourceIcon type={type} />
                          <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{data.count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{data.size}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{data.co2}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pannello Performance */}
      {activeTab === 'performance' && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Core Web Vitals e Performance
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="LCP"
              value={webVitals.lcp || 0}
              suffix="s"
              color={webVitals.lcp > 4 ? "#ef4444" : webVitals.lcp > 2.5 ? "#f59e0b" : "#10b981"}
              icon={<LCPIcon />}
              description="Largest Contentful Paint"
            />
            <MetricCard
              title="FID"
              value={webVitals.fid || 0}
              suffix="ms"
              color={webVitals.fid > 300 ? "#ef4444" : webVitals.fid > 100 ? "#f59e0b" : "#10b981"}
              icon={<FIDIcon />}
              description="First Input Delay"
            />
            <MetricCard
              title="CLS"
              value={webVitals.cls || 0}
              color={webVitals.cls > 0.25 ? "#ef4444" : webVitals.cls > 0.1 ? "#f59e0b" : "#10b981"}
              icon={<CLSIcon />}
              description="Cumulative Layout Shift"
            />
            <MetricCard
              title="Performance"
              value={webVitals.lighthouse_score || 0}
              suffix="/100"
              color={getScoreColor(webVitals.lighthouse_score || 0)}
              icon={<PerformanceIcon />}
              isHighlighted={true}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Metriche Dettagliate
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailMetric
                title="First Contentful Paint"
                value={(webVitals.first_contentful_paint/1000).toFixed(2) || "N/A"}
                suffix="s"
              />
              <DetailMetric
                title="Speed Index"
                value={(webVitals.speed_index/1000).toFixed(2) || "N/A"}
                suffix="s"
              />
              <DetailMetric
                title="Time to Interactive"
                value={(webVitals.time_to_interactive/1000).toFixed(2) || "N/A"}
                suffix="s"
              />
              <DetailMetric
                title="Total Blocking Time"
                value={webVitals.total_blocking_time || "N/A"}
                suffix="ms"
              />
              <DetailMetric
                title="Caricamento Server"
                value={(webVitals.ttfb/1000).toFixed(2) || "N/A"}
                suffix="s"
              />
              <DetailMetric
                title="Browser Connection"
                value={metrics.performance_details?.network_rtt || "N/A"}
                suffix="ms"
              />
            </div>
          </div>
        </div>
      )}

      {/* Pannello Economico */}
      {activeTab === 'economics' && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Benefici Economici
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Costo Mensile"
              value={economicBenefits.current_monthly_cost || 0}
              prefix="€"
              color="#ef4444"
              icon={<CostIcon />}
            />
            <MetricCard
              title="Risparmio Potenziale"
              value={economicBenefits.potential_annual_savings || 0}
              prefix="€"
              suffix="/anno"
              color="#10b981"
              icon={<SavingsIcon />}
              isHighlighted={true}
            />
            <MetricCard
              title="Riduzione Costi"
              value={economicBenefits.potential_savings_percent || 0}
              suffix="%"
              color="#3b82f6"
              icon={<PercentIcon />}
            />
            <MetricCard
              title="Visite Mensili"
              value={formatNumber(economicBenefits.estimated_monthly_visits || 0)}
              color="#8b5cf6"
              icon={<VisitsIcon />}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Suddivisione Costi e Risparmi
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Costo Attuale</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Risparmio Potenziale</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {economicBenefits.costs_breakdown && economicBenefits.savings_breakdown && Object.entries(economicBenefits.costs_breakdown).map(([key, value]) => {
                    const savingsKey = {
                      'bandwidth': 'bandwidth',
                      'energy': 'energy',
                      'seo_impact': 'seo_conversions',
                      'bounce_impact': 'reduced_bounce',
                      'extra_maintenance': 'maintenance',
                      'extra_infrastructure': 'infrastructure'
                    }[key] || key;

                    const savingValue = economicBenefits.savings_breakdown[savingsKey] || 0;

                    // Formatta i nomi per visualizzazione
                    const categoryNames = {
                      'bandwidth': 'Costi di Banda',
                      'energy': 'Costi Energetici',
                      'seo_impact': 'Impatto SEO',
                      'bounce_impact': 'Utenti Persi',
                      'extra_maintenance': 'Manutenzione Extra',
                      'extra_infrastructure': 'Infrastruttura'
                    };

                    return (
                      <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {categoryNames[key] || key}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          €{value.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                          €{savingValue.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <td className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Totale</td>
                    <td className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      €{economicBenefits.current_monthly_cost?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-3 text-left text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">
                      €{economicBenefits.potential_monthly_savings?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pannello Ottimizzazioni */}
      {activeTab === 'optimizations' && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Opportunità di Ottimizzazione
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {optimizations.map((opt, index) => (
              <div
                key={index}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 ${
                  opt.priority === 'high'
                    ? 'border-red-500'
                    : opt.priority === 'medium'
                    ? 'border-amber-500'
                    : 'border-green-500'
                } hover:shadow-lg transition-shadow duration-300`}
              >
                <div className="flex items-start">
                  <div className={`p-2 rounded-full mr-3 ${
                    opt.priority === 'high'
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      : opt.priority === 'medium'
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    <PriorityIcon priority={opt.priority} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-2">{opt.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{opt.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded">
                        CO₂: {opt.impact}g
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                        Risparmio: €{opt.economic_impact}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                        {opt.resource_type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componenti di utilità
const MetricCard = ({ title, value, prefix = '', suffix = '', color, icon, description = '', isHighlighted = false }) => (
  <div className={`p-4 rounded-lg shadow-md ${isHighlighted ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' : 'bg-white dark:bg-gray-800'} transition-transform hover:transform hover:scale-105`}>
    <div className="flex justify-between items-start mb-3">
      <h3 className={`text-sm font-medium ${isHighlighted ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>{title}</h3>
      <div className={`p-2 rounded-full ${isHighlighted ? 'bg-white/20' : `text-${color.replace('#', '')}`}`}>
        {icon}
      </div>
    </div>
    <div className="flex items-baseline">
      <span className={`text-2xl font-bold ${isHighlighted ? 'text-white' : 'text-gray-800 dark:text-white'}`} style={!isHighlighted ? {color} : {}}>
        {prefix}{typeof value === 'number' ? value.toFixed(2).replace(/\.?0+$/, '') : value}{suffix}
      </span>
    </div>
    {description && (
      <p className={`mt-1 text-xs ${isHighlighted ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>{description}</p>
    )}
  </div>
);

const DetailMetric = ({ title, value, suffix = '' }) => (
  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex justify-between items-center">
    <span className="text-sm text-gray-700 dark:text-gray-300">{title}</span>
    <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">{value}{suffix}</span>
  </div>
);

// Icone
const SustainabilityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const CO2Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const SizeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

const SpeedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LCPIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const FIDIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
  </svg>
);

const CLSIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

const PerformanceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CostIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SavingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const PercentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);

const VisitsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ResourceIcon = ({ type }) => {
  switch (type) {
    case 'html':
      return <span className="w-6 h-6 flex items-center justify-center rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-500"><span className="text-xs font-semibold">HTML</span></span>;
    case 'css':
      return <span className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-500"><span className="text-xs font-semibold">CSS</span></span>;
    case 'javascript':
      return <span className="w-6 h-6 flex items-center justify-center rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500"><span className="text-xs font-semibold">JS</span></span>;
    case 'images':
      return <span className="w-6 h-6 flex items-center justify-center rounded-md bg-green-100 dark:bg-green-900/30 text-green-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></span>;
    case 'fonts':
      return <span className="w-6 h-6 flex items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-500"><span className="text-xs font-semibold">Aa</span></span>;
    default:
      return <span className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></span>;
  }
};

const PriorityIcon = ({ priority }) => {
  switch (priority) {
    case 'high':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'medium':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
  }
};

export default EnhancedDashboard;