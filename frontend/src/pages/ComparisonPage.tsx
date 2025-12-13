import React, { useMemo, useState } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { useCryptoDashboardData } from '../hooks/useDataFetching';
import { CRYPTO_COINS, getCoinColor } from '../data/coins';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ComposedChart,
  Line,
  Bar
} from 'recharts';

/**
 * ComparisonPage - Visualizes correlation between GitHub Activity and Crypto Prices
 *
 * Based on data visualization research, this page uses two complementary chart types:
 *
 * 1. SCATTER PLOT - The classic choice for examining relationships between two variables.
 *    Shows direct correlation, clusters, outliers, and trend patterns.
 *    Reference: https://www.webdatarocks.com/blog/best-charts-to-show-correlation/
 *
 * 2. DUAL-AXIS TIMELINE - Essential for time-series correlation analysis.
 *    Shows how both variables change over time simultaneously.
 *    Helps identify lagged correlations and temporal patterns.
 *    Reference: https://clauswilke.com/dataviz/visualizing-associations.html
 *
 * Best practices applied:
 * - Use scatter plots to show raw data relationships (not just derived statistics)
 * - Include reference lines for average values to highlight deviations
 * - Use dual-axis for different scale variables (commits vs price)
 * - Annotate with correlation coefficients for quick interpretation
 */

type ChartView = 'scatter' | 'timeline';

const ComparisonPage: React.FC = () => {
  const { state } = useDashboard();
  const { selectedPeriod } = state;
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [chartView, setChartView] = useState<ChartView>('timeline');

  const { github, crypto, correlation, loading } = useCryptoDashboardData(selectedCoin, selectedPeriod);
  const selectedCoinData = CRYPTO_COINS.find(c => c.id === selectedCoin);
  const coinColor = getCoinColor(selectedCoin);

  const correlationStats = useMemo(() => {
    if (!correlation?.data?.correlations) return null;
    return correlation.data.correlations;
  }, [correlation.data]);

  // Prepare scatter data - each point represents one day
  const scatterData = useMemo(() => {
    if (!github.data.length || !crypto.data.length) return [];

    return github.data.map((g, i) => ({
      commits: g.commits,
      price: crypto.data[i]?.price || 0,
      pullRequests: g.pullRequests,
      stars: g.stars,
      volume: crypto.data[i]?.volume || 0,
      date: g.date
    }));
  }, [github.data, crypto.data]);

  // Prepare timeline data - sorted by date for line chart
  const timelineData = useMemo(() => {
    if (!github.data.length || !crypto.data.length) return [];

    return github.data.map((g, i) => ({
      date: g.date,
      displayDate: new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      commits: g.commits,
      price: crypto.data[i]?.price || 0,
      pullRequests: g.pullRequests,
      stars: g.stars,
      // Normalized values for visual comparison (0-100 scale)
      commitsNorm: 0,
      priceNorm: 0
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [github.data, crypto.data]);

  // Calculate normalized values for timeline comparison
  const normalizedTimelineData = useMemo(() => {
    if (timelineData.length === 0) return [];

    const maxCommits = Math.max(...timelineData.map(d => d.commits));
    const minCommits = Math.min(...timelineData.map(d => d.commits));
    const maxPrice = Math.max(...timelineData.map(d => d.price));
    const minPrice = Math.min(...timelineData.map(d => d.price));

    return timelineData.map(d => ({
      ...d,
      commitsNorm: maxCommits > minCommits
        ? ((d.commits - minCommits) / (maxCommits - minCommits)) * 100
        : 50,
      priceNorm: maxPrice > minPrice
        ? ((d.price - minPrice) / (maxPrice - minPrice)) * 100
        : 50
    }));
  }, [timelineData]);

  // Calculate averages for reference lines
  const avgCommits = scatterData.length > 0
    ? scatterData.reduce((sum, d) => sum + d.commits, 0) / scatterData.length
    : 0;
  const avgPrice = scatterData.length > 0
    ? scatterData.reduce((sum, d) => sum + d.price, 0) / scatterData.length
    : 0;

  const getCorrelationColor = (value: number) => {
    const abs = Math.abs(value);
    if (abs >= 0.7) return 'text-success';
    if (abs >= 0.5) return 'text-warning';
    if (abs >= 0.3) return 'text-info';
    return 'text-base-content/50';
  };

  const getCorrelationLabel = (value: number) => {
    const abs = Math.abs(value);
    if (abs >= 0.7) return 'Strong';
    if (abs >= 0.5) return 'Moderate';
    if (abs >= 0.3) return 'Weak';
    return 'Very Weak';
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${(price / 1000).toFixed(1)}k`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  // Custom tooltip for timeline chart
  const TimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-base-100/95 backdrop-blur-sm px-4 py-3 border border-base-300 rounded-xl shadow-xl">
          <p className="font-medium text-base-content mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Price' ? formatPrice(entry.value) : entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for scatter plot
  const ScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-base-100/95 backdrop-blur-sm px-4 py-3 border border-base-300 rounded-xl shadow-xl">
          <p className="font-medium text-base-content mb-2">
            {new Date(data.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <p className="text-sm text-primary">Commits: {data.commits?.toLocaleString()}</p>
          <p className="text-sm" style={{ color: coinColor }}>Price: {formatPrice(data.price)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Coin Selector */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold text-base-content mb-3">Select Cryptocurrency to Compare</h3>
        <div className="flex flex-wrap gap-2">
          {CRYPTO_COINS.map((coin) => (
            <button
              key={coin.id}
              onClick={() => setSelectedCoin(coin.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCoin === coin.id
                  ? 'text-white shadow-lg'
                  : 'bg-base-200 hover:bg-base-300 text-base-content'
              }`}
              style={selectedCoin === coin.id ? { backgroundColor: coin.color } : {}}
            >
              {coin.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Correlation Matrix Cards */}
      {correlationStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">
              Commits ↔ Price
            </div>
            <div className={`text-2xl font-bold ${getCorrelationColor(correlationStats.commits_price)}`}>
              {(correlationStats.commits_price * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-base-content/50 mt-1">
              {getCorrelationLabel(correlationStats.commits_price)}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">
              Commits ↔ Volume
            </div>
            <div className={`text-2xl font-bold ${getCorrelationColor(correlationStats.commits_volume)}`}>
              {(correlationStats.commits_volume * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-base-content/50 mt-1">
              {getCorrelationLabel(correlationStats.commits_volume)}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">
              PRs ↔ Price
            </div>
            <div className={`text-2xl font-bold ${getCorrelationColor(correlationStats.pullRequests_price)}`}>
              {(correlationStats.pullRequests_price * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-base-content/50 mt-1">
              {getCorrelationLabel(correlationStats.pullRequests_price)}
            </div>
          </div>

          <div className="glass-card rounded-xl p-4">
            <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">
              Stars ↔ Price
            </div>
            <div className={`text-2xl font-bold ${getCorrelationColor(correlationStats.stars_price)}`}>
              {(correlationStats.stars_price * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-base-content/50 mt-1">
              {getCorrelationLabel(correlationStats.stars_price)}
            </div>
          </div>
        </div>
      )}

      {/* Main Chart with Toggle */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: coinColor }}
            >
              {selectedCoinData?.symbol.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-base-content">
                GitHub Activity vs {selectedCoinData?.name}
              </h3>
              <p className="text-xs text-base-content/50">
                {chartView === 'scatter' ? 'Scatter plot showing direct correlation' : 'Timeline showing changes over time'}
              </p>
            </div>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex gap-1 bg-base-200 rounded-lg p-1">
            <button
              onClick={() => setChartView('timeline')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                chartView === 'timeline'
                  ? 'bg-base-100 text-base-content shadow-sm'
                  : 'text-base-content/60 hover:text-base-content'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setChartView('scatter')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                chartView === 'scatter'
                  ? 'bg-base-100 text-base-content shadow-sm'
                  : 'text-base-content/60 hover:text-base-content'
              }`}
            >
              Scatter Plot
            </button>
          </div>
        </div>

        <div className="h-96">
          {loading.github || loading.crypto ? (
            <div className="h-full flex items-center justify-center">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : chartView === 'timeline' ? (
            /* DUAL-AXIS TIMELINE - Best for time-series correlation analysis
             * Shows how both variables change over time simultaneously
             * Reference: "essential for time-series data to show patterns and lagged correlations"
             * - clauswilke.com/dataviz/visualizing-associations.html
             */
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={normalizedTimelineData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <defs>
                  <linearGradient id="commitsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={coinColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={coinColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                {/* Left Y-axis for Commits */}
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  label={{ value: 'Commits', angle: -90, position: 'insideLeft', fontSize: 11 }}
                />
                {/* Right Y-axis for Price */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={formatPrice}
                  label={{ value: 'Price', angle: 90, position: 'insideRight', fontSize: 11 }}
                />
                <Tooltip content={<TimelineTooltip />} />
                <Legend verticalAlign="top" height={36} />
                {/* Bar chart for commits - shows daily values clearly */}
                <Bar
                  yAxisId="left"
                  dataKey="commits"
                  name="Commits"
                  fill="#6366f1"
                  fillOpacity={0.6}
                  radius={[2, 2, 0, 0]}
                />
                {/* Line chart for price - shows trend over time */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="price"
                  name="Price"
                  stroke={coinColor}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, fill: coinColor }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            /* SCATTER PLOT - Best for showing direct correlation between two variables
             * Reference: "Scatter plots are ideal for displaying correlation between two continuous variables"
             * - webdatarocks.com/blog/best-charts-to-show-correlation
             */
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis
                  type="number"
                  dataKey="commits"
                  name="Commits"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  label={{ value: 'Daily Commits', position: 'bottom', offset: 10, fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="price"
                  name="Price"
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatPrice}
                  label={{ value: `${selectedCoinData?.symbol} Price`, angle: -90, position: 'insideLeft', fontSize: 12 }}
                />
                <Tooltip content={<ScatterTooltip />} />
                <Legend verticalAlign="top" height={36} />
                {/* Reference lines showing averages - helps identify deviations from mean */}
                <ReferenceLine
                  x={avgCommits}
                  stroke="#888"
                  strokeDasharray="5 5"
                  label={{ value: 'Avg', fontSize: 10, position: 'top' }}
                />
                <ReferenceLine
                  y={avgPrice}
                  stroke="#888"
                  strokeDasharray="5 5"
                  label={{ value: 'Avg', fontSize: 10, position: 'right' }}
                />
                <Scatter
                  name={`Commits vs ${selectedCoinData?.symbol}`}
                  data={scatterData}
                  fill={coinColor}
                  fillOpacity={0.7}
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart explanation */}
        <div className="mt-4 pt-4 border-t border-base-200">
          <p className="text-xs text-base-content/50">
            {chartView === 'scatter'
              ? '📊 Scatter Plot: Each dot represents one day. Points clustered along a diagonal line indicate correlation. Vertical spread shows variance.'
              : '📈 Timeline: Shows how commits (bars) and price (line) change over time. Similar patterns indicate temporal correlation.'}
          </p>
        </div>
      </div>

      {/* Interpretation */}
      {correlation.data && (
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-semibold text-base-content mb-3">Analysis</h3>
          <div className="bg-base-200/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-base-content mb-1">AI Interpretation</div>
                <p className="text-sm text-base-content/70">{correlation.data.interpretation}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-base-content/50">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Confidence: {(correlation.data.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    Data points: {correlation.data.dataPoints}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Methodology & Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Correlation Legend */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-semibold text-base-content mb-3">Correlation Strength Guide</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm">Strong (≥70%)</span>
              <span className="text-xs text-base-content/50 ml-auto">Clear relationship</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-sm">Moderate (50-70%)</span>
              <span className="text-xs text-base-content/50 ml-auto">Notable pattern</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-info" />
              <span className="text-sm">Weak (30-50%)</span>
              <span className="text-xs text-base-content/50 ml-auto">Some connection</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-base-300" />
              <span className="text-sm">Very Weak (&lt;30%)</span>
              <span className="text-xs text-base-content/50 ml-auto">Little/no relationship</span>
            </div>
          </div>
        </div>

        {/* Methodology */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-semibold text-base-content mb-3">Visualization Methodology</h3>
          <div className="space-y-2 text-xs text-base-content/70">
            <p>
              <span className="font-medium">Scatter Plot:</span> Shows direct correlation between commits and price.
              Points clustered along a diagonal indicate correlation.
            </p>
            <p>
              <span className="font-medium">Timeline:</span> Dual-axis chart showing both metrics over time.
              Similar wave patterns suggest temporal correlation.
            </p>
            <p className="text-base-content/50 pt-2 border-t border-base-200 mt-2">
              Note: Correlation does not imply causation. These visualizations show statistical relationships, not causal links.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonPage;
