import React, { useState } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { useMockGitHubData, useCryptoData, useCryptoCorrelationData } from '../hooks/useDataFetching';
import { useThemeColors } from '../hooks/useThemeColors';
import { CRYPTO_COINS, getCoinColor } from '../data/coins';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';

const Dashboard: React.FC = () => {
  const { state } = useDashboard();
  const { selectedPeriod } = state;
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const themeColors = useThemeColors();

  const { data: githubData, loading: githubLoading } = useMockGitHubData(selectedPeriod);
  const { data: cryptoData, loading: cryptoLoading } = useCryptoData(selectedCoin, selectedPeriod);
  const { data: correlationData, loading: correlationLoading } = useCryptoCorrelationData(selectedCoin, selectedPeriod);

  const selectedCoinData = CRYPTO_COINS.find(c => c.id === selectedCoin);
  const coinColor = getCoinColor(selectedCoin);

  // Calculate summary metrics
  const totalCommits = githubData.reduce((sum, day) => sum + day.commits, 0);
  const totalStars = githubData.reduce((sum, day) => sum + day.stars, 0);

  const latestPrice = cryptoData.length > 0 ? cryptoData[cryptoData.length - 1].price : 0;
  const priceChange = cryptoData.length > 1
    ? ((cryptoData[cryptoData.length - 1].price - cryptoData[0].price) / cryptoData[0].price) * 100
    : 0;

  const correlationValue = correlationData?.correlations?.commits_price ?? 0;

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${price.toFixed(4)}`;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Coin Quick Selector */}
      <div className="flex flex-wrap gap-2">
        {CRYPTO_COINS.map((coin) => (
          <button
            key={coin.id}
            onClick={() => setSelectedCoin(coin.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedCoin === coin.id
                ? 'text-white shadow-md'
                : 'bg-base-200 hover:bg-base-300 text-base-content'
            }`}
            style={selectedCoin === coin.id ? { backgroundColor: coin.color } : {}}
          >
            {coin.symbol}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Commits */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-base-content/60 uppercase tracking-wide">Dev Commits</span>
            {githubLoading && <span className="loading loading-spinner loading-xs" />}
          </div>
          <div className="text-2xl font-bold text-base-content">
            {totalCommits.toLocaleString()}
          </div>
          <div className="text-xs text-base-content/50 mt-1">
            Last {selectedPeriod} days
          </div>
        </div>

        {/* Stars */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-base-content/60 uppercase tracking-wide">GitHub Stars</span>
          </div>
          <div className="text-2xl font-bold text-base-content">
            {totalStars.toLocaleString()}
          </div>
          <div className="text-xs text-base-content/50 mt-1">
            Total earned
          </div>
        </div>

        {/* Crypto Price */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-base-content/60 uppercase tracking-wide">{selectedCoinData?.symbol} Price</span>
            {cryptoLoading && <span className="loading loading-spinner loading-xs" />}
          </div>
          <div className="text-2xl font-bold" style={{ color: coinColor }}>
            {formatPrice(latestPrice)}
          </div>
          <div className={`text-xs mt-1 ${priceChange >= 0 ? 'text-success' : 'text-error'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </div>
        </div>

        {/* Correlation */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-base-content/60 uppercase tracking-wide">Correlation</span>
            {correlationLoading && <span className="loading loading-spinner loading-xs" />}
          </div>
          <div className={`text-2xl font-bold ${correlationValue >= 0 ? 'text-success' : 'text-error'}`}>
            {(correlationValue * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-base-content/50 mt-1">
            Commits vs {selectedCoinData?.symbol}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GitHub Activity */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-semibold text-base-content mb-4">Developer Activity</h3>
          <div className="h-64">
            {githubLoading ? (
              <div className="h-full flex items-center justify-center">
                <span className="loading loading-spinner loading-lg" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={githubData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { day: 'numeric' })}
                    tick={{ fontSize: 10, fill: themeColors.text }}
                    tickLine={false}
                    axisLine={{ stroke: themeColors.grid }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: themeColors.text }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: themeColors.tooltipBg,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                    }}
                    labelStyle={{ color: themeColors.tooltipText, fontWeight: 600, marginBottom: '4px' }}
                    itemStyle={{ color: themeColors.tooltipSubtext }}
                    labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    formatter={(value: number) => [value.toLocaleString(), 'Commits']}
                    cursor={{ fill: 'rgba(99, 102, 241, 0.2)' }}
                  />
                  <Bar dataKey="commits" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Crypto Price */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: coinColor }}
            >
              {selectedCoinData?.symbol.charAt(0)}
            </div>
            <h3 className="text-sm font-semibold text-base-content">{selectedCoinData?.name} Price</h3>
          </div>
          <div className="h-64">
            {cryptoLoading ? (
              <div className="h-full flex items-center justify-center">
                <span className="loading loading-spinner loading-lg" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cryptoData}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={coinColor} stopOpacity={0.4} />
                      <stop offset="50%" stopColor={coinColor} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={coinColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { day: 'numeric' })}
                    tick={{ fontSize: 10, fill: themeColors.text }}
                    tickLine={false}
                    axisLine={{ stroke: themeColors.grid }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: themeColors.text }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatPrice(v)}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: themeColors.tooltipBg,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                    }}
                    labelStyle={{ color: themeColors.tooltipText, fontWeight: 600, marginBottom: '4px' }}
                    itemStyle={{ color: themeColors.tooltipSubtext }}
                    labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    formatter={(value: number) => [formatPrice(value), 'Price']}
                    cursor={{ stroke: coinColor, strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={coinColor}
                    strokeWidth={2.5}
                    fill="url(#priceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Correlation Analysis */}
      {correlationData && (
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-semibold text-base-content mb-4">Correlation Analysis: GitHub Activity vs {selectedCoinData?.name}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-base-200/50 rounded-lg p-3">
              <div className="text-xs text-base-content/60 mb-1">Commits ↔ Price</div>
              <div className={`text-lg font-bold ${correlationData.correlations.commits_price >= 0 ? 'text-success' : 'text-error'}`}>
                {(correlationData.correlations.commits_price * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-base-200/50 rounded-lg p-3">
              <div className="text-xs text-base-content/60 mb-1">Commits ↔ Volume</div>
              <div className={`text-lg font-bold ${correlationData.correlations.commits_volume >= 0 ? 'text-success' : 'text-error'}`}>
                {(correlationData.correlations.commits_volume * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-base-200/50 rounded-lg p-3">
              <div className="text-xs text-base-content/60 mb-1">PRs ↔ Price</div>
              <div className={`text-lg font-bold ${correlationData.correlations.pullRequests_price >= 0 ? 'text-success' : 'text-error'}`}>
                {(correlationData.correlations.pullRequests_price * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-base-200/50 rounded-lg p-3">
              <div className="text-xs text-base-content/60 mb-1">Stars ↔ Price</div>
              <div className={`text-lg font-bold ${correlationData.correlations.stars_price >= 0 ? 'text-success' : 'text-error'}`}>
                {(correlationData.correlations.stars_price * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="bg-base-200/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-base-content mb-1">AI Interpretation</div>
                <p className="text-sm text-base-content/70">{correlationData.interpretation}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-base-content/50">
                  <span>Confidence: {(correlationData.confidence * 100).toFixed(0)}%</span>
                  <span>Data points: {correlationData.dataPoints}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
