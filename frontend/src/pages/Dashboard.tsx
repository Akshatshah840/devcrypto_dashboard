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
  const avgCommitsPerDay = githubData.length > 0 ? Math.round(totalCommits / githubData.length) : 0;

  const latestPrice = cryptoData.length > 0 ? cryptoData[cryptoData.length - 1].price : 0;
  const priceChange = cryptoData.length > 1
    ? ((cryptoData[cryptoData.length - 1].price - cryptoData[0].price) / cryptoData[0].price) * 100
    : 0;

  // Determine trend descriptions for insight-led titles
  const commitTrend = avgCommitsPerDay > 1000 ? 'High' : avgCommitsPerDay > 500 ? 'Moderate' : 'Low';
  const priceTrendText = priceChange >= 5 ? 'Surging' : priceChange >= 0 ? 'Rising' : priceChange >= -5 ? 'Declining' : 'Falling';

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

      {/* KPI Cards - Key metrics at a glance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Commits */}
        <div className="glass-card rounded-xl p-4 group cursor-default" title="Total code changes submitted by developers">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Commits</span>
            {githubLoading && <span className="loading loading-spinner loading-xs" />}
          </div>
          <div className="text-2xl font-bold text-base-content tracking-tight">
            {totalCommits.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${commitTrend === 'High' ? 'bg-success' : commitTrend === 'Moderate' ? 'bg-warning' : 'bg-base-content/30'}`} />
            <span className="text-xs text-base-content/50 font-medium">{commitTrend} activity · {avgCommitsPerDay.toLocaleString()}/day</span>
          </div>
        </div>

        {/* Stars */}
        <div className="glass-card rounded-xl p-4 group cursor-default" title="Community interest - users who bookmarked the project">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Stars</span>
            {githubLoading && <span className="loading loading-spinner loading-xs" />}
          </div>
          <div className="text-2xl font-bold text-base-content tracking-tight">
            {totalStars.toLocaleString()}
          </div>
          <div className="text-xs text-base-content/50 mt-1.5 font-medium">
            Community interest
          </div>
        </div>

        {/* Crypto Price */}
        <div className="glass-card rounded-xl p-4 group cursor-default" title="Current trading price in USD">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">{selectedCoinData?.symbol} Price</span>
            {cryptoLoading && <span className="loading loading-spinner loading-xs" />}
          </div>
          <div className="text-2xl font-bold tracking-tight" style={{ color: coinColor }}>
            {formatPrice(latestPrice)}
          </div>
          <div className={`flex items-center gap-1.5 mt-1.5 ${priceChange >= 0 ? 'text-success' : 'text-error'}`}>
            <svg className={`w-3 h-3 ${priceChange >= 0 ? '' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold">{Math.abs(priceChange).toFixed(1)}%</span>
            <span className="text-xs text-base-content/40 font-medium">{priceTrendText}</span>
          </div>
        </div>

        {/* Correlation */}
        <div className="glass-card rounded-xl p-4 group cursor-default" title="Statistical relationship between development activity and price movement">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Dev↔Price</span>
            {correlationLoading && <span className="loading loading-spinner loading-xs" />}
          </div>
          <div className={`text-2xl font-bold tracking-tight ${Math.abs(correlationValue) > 0.5 ? (correlationValue >= 0 ? 'text-success' : 'text-error') : 'text-base-content'}`}>
            {correlationValue >= 0 ? '+' : ''}{(correlationValue * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-base-content/50 mt-1.5 font-medium">
            {Math.abs(correlationValue) > 0.7 ? 'Strong' : Math.abs(correlationValue) > 0.4 ? 'Moderate' : 'Weak'} link
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GitHub Activity */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-base-content">Developer Activity</h3>
            <span className="text-xs font-medium text-base-content/40">{selectedPeriod}D</span>
          </div>
          <p className="text-xs text-base-content/50 mb-4 leading-relaxed">Daily commits · Hover for details</p>
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
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: coinColor }}
              >
                {selectedCoinData?.symbol.charAt(0)}
              </div>
              <h3 className="text-sm font-semibold text-base-content">{selectedCoinData?.symbol} {priceTrendText}</h3>
            </div>
            <span className={`text-xs font-semibold ${priceChange >= 0 ? 'text-success' : 'text-error'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-base-content/50 mb-4 leading-relaxed">Price in USD · Hover for exact values</p>
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
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-base-content">
              {Math.abs(correlationData.correlations.commits_price) > 0.5 ? 'Strong' : 'Moderate'} Dev-Price Relationship
            </h3>
            <span className="text-xs font-medium text-base-content/40">{correlationData.dataPoints} samples</span>
          </div>
          <p className="text-xs text-base-content/50 mb-4 leading-relaxed">
            {correlationData.correlations.commits_price >= 0 ? 'Positive' : 'Negative'}: More commits tend to {correlationData.correlations.commits_price >= 0 ? 'increase' : 'decrease'} price
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-base-200/50 rounded-lg p-3 hover:bg-base-200/70 transition-colors cursor-default" title="How code commits relate to price changes">
              <div className="text-[10px] text-base-content/50 uppercase tracking-wider mb-1 font-semibold">Commits → Price</div>
              <div className={`text-lg font-bold tracking-tight ${Math.abs(correlationData.correlations.commits_price) > 0.5 ? (correlationData.correlations.commits_price >= 0 ? 'text-success' : 'text-error') : 'text-base-content'}`}>
                {correlationData.correlations.commits_price >= 0 ? '+' : ''}{(correlationData.correlations.commits_price * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-base-200/50 rounded-lg p-3 hover:bg-base-200/70 transition-colors cursor-default" title="How code commits relate to trading volume">
              <div className="text-[10px] text-base-content/50 uppercase tracking-wider mb-1 font-semibold">Commits → Volume</div>
              <div className={`text-lg font-bold tracking-tight ${Math.abs(correlationData.correlations.commits_volume) > 0.5 ? (correlationData.correlations.commits_volume >= 0 ? 'text-success' : 'text-error') : 'text-base-content'}`}>
                {correlationData.correlations.commits_volume >= 0 ? '+' : ''}{(correlationData.correlations.commits_volume * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-base-200/50 rounded-lg p-3 hover:bg-base-200/70 transition-colors cursor-default" title="How pull requests relate to price changes">
              <div className="text-[10px] text-base-content/50 uppercase tracking-wider mb-1 font-semibold">PRs → Price</div>
              <div className={`text-lg font-bold tracking-tight ${Math.abs(correlationData.correlations.pullRequests_price) > 0.5 ? (correlationData.correlations.pullRequests_price >= 0 ? 'text-success' : 'text-error') : 'text-base-content'}`}>
                {correlationData.correlations.pullRequests_price >= 0 ? '+' : ''}{(correlationData.correlations.pullRequests_price * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-base-200/50 rounded-lg p-3 hover:bg-base-200/70 transition-colors cursor-default" title="How GitHub stars relate to price changes">
              <div className="text-[10px] text-base-content/50 uppercase tracking-wider mb-1 font-semibold">Stars → Price</div>
              <div className={`text-lg font-bold tracking-tight ${Math.abs(correlationData.correlations.stars_price) > 0.5 ? (correlationData.correlations.stars_price >= 0 ? 'text-success' : 'text-error') : 'text-base-content'}`}>
                {correlationData.correlations.stars_price >= 0 ? '+' : ''}{(correlationData.correlations.stars_price * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          <div className="bg-base-200/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-base-content uppercase tracking-wider mb-1.5">Insight</div>
                <p className="text-sm text-base-content/70 leading-relaxed">{correlationData.interpretation}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-base-content/40 font-medium uppercase tracking-wider">
                    Confidence: {(correlationData.confidence * 100).toFixed(0)}%
                  </span>
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
