/**
 * Enhanced Dashboard component with improved theme compatibility
 */

// Ensure we have access to React
const React = window.React || (typeof React !== 'undefined' ? React : null);

// Enhanced Dashboard component with better theme handling
const EnhancedDashboard = ({ data }) => {
  // State for active tab
  const [activeTab, setActiveTab] = React.useState('sustainability');

  // State to track theme changes
  const [theme, setTheme] = React.useState(
    document.documentElement.getAttribute('data-theme') || 'light'
  );

  // Effect to listen for theme changes
  React.useEffect(() => {
    // Function to handle theme changes
    const handleThemeChange = () => {
      const newTheme = document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(newTheme);
    };

    // Set up event listener
    window.addEventListener('themechange', handleThemeChange);

    // Observe data-theme attribute changes using MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          handleThemeChange();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Clean up
    return () => {
      window.removeEventListener('themechange', handleThemeChange);
      observer.disconnect();
    };
  }, []);

  // Extract necessary data
  const metrics = data?.metrics || {};
  const webVitals = metrics?.web_vitals || {};
  const resources = data?.resources || {};
  const optimizations = data?.optimizations || [];
  const economicBenefits = metrics?.economic_benefits || {};
  const carbonFootprint = metrics?.carbon_footprint || {};

  // Colors for scores
  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 50) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  // Format large numbers
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Check if enhanced data is available
  const hasEnhancedData = metrics.energy || carbonFootprint || metrics.performance_details;

  return (
    <div className={`p-6 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-xl shadow-lg`}>
      {/* Banner indicating the use of the enhanced dashboard */}
      <div className={`mb-6 p-4 ${theme === 'dark' ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'} rounded-lg border`}>
        <div className="flex items-center">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-green-200' : 'text-green-800'}`}>Dashboard Avanzata</h3>
            <p className={theme === 'dark' ? 'text-green-300' : 'text-green-700'}>
              {hasEnhancedData
                ? "Visualizzazione con dati avanzati di Lighthouse attiva"
                : "Dashboard avanzata attiva, ma dati estesi non disponibili"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs for navigation */}
      <div className={`flex flex-wrap border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} mb-6`}>
        <button
          className={`px-4 py-2 font-medium rounded-t-lg text-sm mr-2 ${
            activeTab === 'sustainability'
              ? 'bg-green-500 text-white'
              : theme === 'dark'
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-100 text-gray-700'
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
              : theme === 'dark'
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-100 text-gray-700'
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
              : theme === 'dark'
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-100 text-gray-700'
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
              : theme === 'dark'
                ? 'bg-gray-700 text-gray-300'
                : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => setActiveTab('optimizations')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Ottimizzazioni
        </button>
      </div>

      {/* Sustainability Panel */}
      {activeTab === 'sustainability' && (
        <div className="animate-fade-in">
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4`}>
            Sostenibilità Digitale
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Punteggio Sostenibilità"
              value={metrics.sustainability_score || 0}
              suffix="/100"
              color={getScoreColor(metrics.sustainability_score || 0)}
              icon={<SustainabilityIcon />}
              theme={theme}
            />
            <MetricCard
              title="Emissioni CO₂"
              value={metrics.co2_emissions || 0}
              suffix="g/view"
              color="#3b82f6"
              icon={<CO2Icon />}
              theme={theme}
            />
            <MetricCard
              title="Dimensione Totale"
              value={metrics.total_size || "0 KB"}
              color="#8b5cf6"
              icon={<SizeIcon />}
              theme={theme}
            />
            <MetricCard
              title="Tempo di Caricamento"
              value={metrics.load_time || 0}
              suffix="s"
              color={metrics.load_time > 3 ? "#ef4444" : "#10b981"}
              icon={<SpeedIcon />}
              theme={theme}
            />
          </div>

          {carbonFootprint && (
            <div className={`${theme === 'dark' ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200'} rounded-lg p-4 mb-6 border`}>
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-green-200' : 'text-green-800'} mb-4`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Impronta di Carbonio Annuale
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-3 rounded-lg shadow text-center`}>
                  <div className={`text-xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                    {carbonFootprint.kg_co2 || 0} kg
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>CO₂ all'anno</div>
                </div>
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-3 rounded-lg shadow text-center`}>
                  <div className={`text-xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                    {carbonFootprint.equivalent_trees || 0}
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Alberi equivalenti</div>
                </div>
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-3 rounded-lg shadow text-center`}>
                  <div className={`text-xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                    {formatNumber(carbonFootprint.comparison?.car_km || 0)} km
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Equivalenti in auto</div>
                </div>
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-3 rounded-lg shadow text-center`}>
                  <div className={`text-xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                    {formatNumber(carbonFootprint.comparison?.smartphone_charges || 0)}
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Ricariche smartphone</div>
                </div>
              </div>
            </div>
          )}

          <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-md p-4 border`}>
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Ripartizione Risorse
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Tipo</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Quantità</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Dimensione</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Impatto CO₂</th>
                  </tr>
                </thead>
                <tbody className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {Object.entries(resources).map(([type, data]) => (
                    <tr key={type} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ResourceIcon type={type} theme={theme} />
                          <span className={`ml-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{data.count}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{data.size}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{data.co2}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Performance Panel */}
      {activeTab === 'performance' && (
        <div className="animate-fade-in">
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4`}>
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
              theme={theme}
            />
            <MetricCard
              title="FID"
              value={webVitals.fid || 0}
              suffix="ms"
              color={webVitals.fid > 300 ? "#ef4444" : webVitals.fid > 100 ? "#f59e0b" : "#10b981"}
              icon={<FIDIcon />}
              description="First Input Delay"
              theme={theme}
            />
            <MetricCard
              title="CLS"
              value={webVitals.cls || 0}
              color={webVitals.cls > 0.25 ? "#ef4444" : webVitals.cls > 0.1 ? "#f59e0b" : "#10b981"}
              icon={<CLSIcon />}
              description="Cumulative Layout Shift"
              theme={theme}
            />
            <MetricCard
              title="Performance"
              value={webVitals.lighthouse_score || 0}
              suffix="/100"
              color={getScoreColor(webVitals.lighthouse_score || 0)}
              icon={<PerformanceIcon />}
              isHighlighted={true}
              theme={theme}
            />
          </div>

          <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-md p-4 border mb-6`}>
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4`}>
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
                theme={theme}
              />
              <DetailMetric
                title="Speed Index"
                value={(webVitals.speed_index/1000).toFixed(2) || "N/A"}
                suffix="s"
                theme={theme}
              />
              <DetailMetric
                title="Time to Interactive"
                value={(webVitals.time_to_interactive/1000).toFixed(2) || "N/A"}
                suffix="s"
                theme={theme}
              />
              <DetailMetric
                title="Total Blocking Time"
                value={webVitals.total_blocking_time || "N/A"}
                suffix="ms"
                theme={theme}
              />
              <DetailMetric
                title="Caricamento Server"
                value={(webVitals.ttfb/1000).toFixed(2) || "N/A"}
                suffix="s"
                theme={theme}
              />
              <DetailMetric
                title="Browser Connection"
                value={metrics.performance_details?.network_rtt || "N/A"}
                suffix="ms"
                theme={theme}
              />
            </div>
          </div>
        </div>
      )}

      {/* Economic Panel */}
      {activeTab === 'economics' && (
        <div className="animate-fade-in">
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4`}>
            Benefici Economici
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Costo Mensile"
              value={economicBenefits.current_monthly_cost || 0}
              prefix="€"
              color="#ef4444"
              icon={<CostIcon />}
              theme={theme}
            />
            <MetricCard
              title="Risparmio Potenziale"
              value={economicBenefits.potential_annual_savings || 0}
              prefix="€"
              suffix="/anno"
              color="#10b981"
              icon={<SavingsIcon />}
              isHighlighted={true}
              theme={theme}
            />
            <MetricCard
              title="Riduzione Costi"
              value={economicBenefits.potential_savings_percent || 0}
              suffix="%"
              color="#3b82f6"
              icon={<PercentIcon />}
              theme={theme}
            />
            <MetricCard
              title="Visite Mensili"
              value={formatNumber(economicBenefits.estimated_monthly_visits || 0)}
              color="#8b5cf6"
              icon={<VisitsIcon />}
              theme={theme}
            />
          </div>
        </div>
      )}

      {/* Optimizations Panel */}
      {activeTab === 'optimizations' && (
        <div className="animate-fade-in">
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-4`}>
            Opportunità di Ottimizzazione
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {optimizations.map((opt, index) => (
              <div
                key={index}
                className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 border-l-4 ${
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
                      ? theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'
                      : opt.priority === 'medium'
                      ? theme === 'dark' ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600'
                      : theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
                  }`}>
                    <PriorityIcon priority={opt.priority} />
                  </div>
                  <div>
                    <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-2`}>{opt.title}</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-3`}>{opt.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`px-2 py-1 ${theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'} rounded`}>
                        CO₂: {opt.impact}g
                      </span>
                      <span className={`px-2 py-1 ${theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'} rounded`}>
                        Risparmio: €{opt.economic_impact}
                      </span>
                      <span className={`px-2 py-1 ${theme === 'dark' ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'} rounded`}>
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

// Utility components
const MetricCard = ({ title, value, prefix = '', suffix = '', color, icon, description = '', isHighlighted = false, theme }) => (
  <div className={`p-4 rounded-lg shadow-md ${isHighlighted
    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
    : theme === 'dark' ? 'bg-gray-800' : 'bg-white'} transition-transform hover:transform hover:scale-105`}>
    <div className="flex justify-between items-start mb-3">
      <h3 className={`text-sm font-medium ${isHighlighted
        ? 'text-green-100'
        : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{title}</h3>
      <div className={`p-2 rounded-full ${isHighlighted ? 'bg-white/20' : ''}`} style={!isHighlighted ? {color} : {}}>
        {icon}
      </div>
    </div>
    <div className="flex items-baseline">
      <span className={`text-2xl font-bold ${isHighlighted
        ? 'text-white'
        : theme === 'dark' ? 'text-white' : 'text-gray-800'}`} style={!isHighlighted ? {color} : {}}>
        {prefix}{typeof value === 'number' ? value.toFixed(2).replace(/\.?0+$/, '') : value}{suffix}
      </span>
    </div>
    {description && (
      <p className={`mt-1 text-xs ${isHighlighted
        ? 'text-green-100'
        : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
    )}
  </div>
);

const DetailMetric = ({ title, value, suffix = '', theme }) => (
  <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 flex justify-between items-center`}>
    <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{title}</span>
    <span className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{value}{suffix}</span>
  </div>
);

// Icons
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

const ResourceIcon = ({ type, theme }) => {
  const bgClass = theme === 'dark' ? 'dark:bg-opacity-30' : '';

  switch (type) {
    case 'html':
      return <span className={`w-6 h-6 flex items-center justify-center rounded-md ${theme === 'dark' ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-500'}`}><span className="text-xs font-semibold">HTML</span></span>;
    case 'css':
      return <span className={`w-6 h-6 flex items-center justify-center rounded-md ${theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-500'}`}><span className="text-xs font-semibold">CSS</span></span>;
    case 'javascript':
      return <span className={`w-6 h-6 flex items-center justify-center rounded-md ${theme === 'dark' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-500'}`}><span className="text-xs font-semibold">JS</span></span>;
    case 'images':
      return <span className={`w-6 h-6 flex items-center justify-center rounded-md ${theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-500'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </span>;
    case 'fonts':
      return <span className={`w-6 h-6 flex items-center justify-center rounded-md ${theme === 'dark' ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-500'}`}><span className="text-xs font-semibold">Aa</span></span>;
    default:
      return <span className={`w-6 h-6 flex items-center justify-center rounded-md ${theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </span>;
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

// Make component available globally
if (typeof window !== 'undefined') {
  window.EnhancedDashboard = EnhancedDashboard;
}

// Export for ES Modules
export default EnhancedDashboard;