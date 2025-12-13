import React, { useMemo, useState } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { useCryptoData } from '../hooks/useDataFetching';
import { useThemeColors } from '../hooks/useThemeColors';
import { CRYPTO_COINS, getCoinColor } from '../data/coins';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

const CryptoPage: React.FC = () => {
  const { state } = useDashboard();
  const { selectedPeriod } = state;
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const themeColors = useThemeColors();

  const { data: cryptoData, loading, error } = useCryptoData(selectedCoin, selectedPeriod);

  const selectedCoinData = CRYPTO_COINS.find(c => c.id === selectedCoin);
  const coinColor = getCoinColor(selectedCoin);

  const stats = useMemo(() => {
    if (cryptoData.length === 0) return null;

    const prices = cryptoData.map(d => d.price);
    const volumes = cryptoData.map(d => d.volume);

    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

    const latestData = cryptoData[cryptoData.length - 1];
    const firstData = cryptoData[0];
    const priceChange = latestData.price - firstData.price;
    const priceChangePercent = (priceChange / firstData.price) * 100;

    const bestDay = cryptoData.reduce((max, d) => d.price > max.price ? d : max);
    const worstDay = cryptoData.reduce((min, d) => d.price < min.price ? d : min);

    // Volatility (standard deviation)
    const mean = avgPrice;
    const squaredDiffs = prices.map(p => Math.pow(p - mean, 2));
    const volatility = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / prices.length);
    const volatilityPercent = (volatility / avgPrice) * 100;

    return {
      avgPrice,
      minPrice,
      maxPrice,
      avgVolume,
      priceChange,
      priceChangePercent,
      bestDay,
      worstDay,
      volatility,
      volatilityPercent,
      latestPrice: latestData.price,
      latestChange: latestData.priceChangePercentage24h
    };
  }, [cryptoData]);

  // Insight-led descriptions
  const priceTrend = stats ? (stats.priceChangePercent >= 5 ? 'Surging' : stats.priceChangePercent >= 0 ? 'Rising' : stats.priceChangePercent >= -5 ? 'Declining' : 'Falling') : '';
  const volatilityLevel = stats ? (stats.volatilityPercent > 10 ? 'High' : stats.volatilityPercent > 5 ? 'Moderate' : 'Low') : '';

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e12) return `$${(volume / 1e12).toFixed(2)}T`;
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    return `$${volume.toLocaleString()}`;
  };

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-base-content mb-2">Error Loading Data</h2>
          <p className="text-base-content/60">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Coin Selector */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-base-content">Select Asset</h3>
          <span className="text-xs text-base-content/40 font-medium">{CRYPTO_COINS.length} available</span>
        </div>
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
              title={`View ${coin.name} analytics`}
            >
              {coin.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 cursor-default" title="Latest trading price from exchange">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Price</span>
            {loading && <span className="loading loading-spinner loading-xs" />}
          </div>
          <div className="text-2xl font-bold tracking-tight" style={{ color: coinColor }}>
            {stats ? formatPrice(stats.latestPrice) : '$0'}
          </div>
          <div className={`flex items-center gap-1.5 mt-1.5 ${stats && stats.latestChange >= 0 ? 'text-success' : 'text-error'}`}>
            <svg className={`w-3 h-3 ${stats && stats.latestChange >= 0 ? '' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold">{stats ? `${Math.abs(stats.latestChange).toFixed(1)}%` : 'N/A'}</span>
            <span className="text-xs text-base-content/40 font-medium">24h</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 cursor-default" title="Price change over selected timeframe">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">{selectedPeriod}D Change</span>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${stats && stats.priceChangePercent >= 0 ? 'text-success' : 'text-error'}`}>
            {stats ? `${stats.priceChangePercent >= 0 ? '+' : ''}${stats.priceChangePercent.toFixed(1)}%` : '0%'}
          </div>
          <div className="text-xs text-base-content/50 mt-1.5 font-medium">{priceTrend}</div>
        </div>

        <div className="glass-card rounded-xl p-4 cursor-default" title="Average daily trading volume">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Avg Volume</span>
          </div>
          <div className="text-2xl font-bold text-base-content tracking-tight">
            {stats ? formatVolume(stats.avgVolume) : '$0'}
          </div>
          <div className="text-xs text-base-content/50 mt-1.5 font-medium">Per day</div>
        </div>

        <div className="glass-card rounded-xl p-4 cursor-default" title="Price volatility - higher means more risk">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Volatility</span>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${volatilityLevel === 'High' ? 'text-error' : volatilityLevel === 'Moderate' ? 'text-warning' : 'text-success'}`}>
            {stats ? `${stats.volatilityPercent.toFixed(1)}%` : '0%'}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${volatilityLevel === 'High' ? 'bg-error' : volatilityLevel === 'Moderate' ? 'bg-warning' : 'bg-success'}`} />
            <span className="text-xs text-base-content/50 font-medium">{volatilityLevel} risk</span>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: coinColor }}
            >
              {selectedCoinData?.symbol.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-base-content">{selectedCoinData?.symbol} {priceTrend}</h3>
              <p className="text-xs text-base-content/40">{selectedCoinData?.name}/USD</p>
            </div>
          </div>
          <span className={`text-sm font-semibold ${stats && stats.priceChangePercent >= 0 ? 'text-success' : 'text-error'}`}>
            {stats ? `${stats.priceChangePercent >= 0 ? '+' : ''}${stats.priceChangePercent.toFixed(1)}%` : ''}
          </span>
        </div>
        <p className="text-xs text-base-content/50 mb-4 leading-relaxed">Hover for exact values · {selectedPeriod} day history</p>
        <div className="h-72">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cryptoData}>
                <defs>
                  <linearGradient id={`gradient-${selectedCoin}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={coinColor} stopOpacity={0.4} />
                    <stop offset="50%" stopColor={coinColor} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={coinColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  tick={{ fontSize: 11, fill: themeColors.text }}
                  tickLine={false}
                  axisLine={{ stroke: themeColors.grid }}
                />
                <YAxis
                  tickFormatter={(value) => formatPrice(value)}
                  tick={{ fontSize: 11, fill: themeColors.text }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: themeColors.tooltipBg,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px',
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
                  fill={`url(#gradient-${selectedCoin})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Range */}
        {stats && (
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-base-content">Price Range</h3>
              <span className="text-xs text-base-content/40 font-medium">{selectedPeriod}D</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20 hover:bg-success/10 transition-colors cursor-default" title="Peak price during this period">
                <div>
                  <div className="text-[10px] text-base-content/50 uppercase tracking-wider font-semibold mb-0.5">Peak</div>
                  <div className="font-bold text-success tracking-tight">{formatPrice(stats.maxPrice)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-base-content/50 font-medium">
                    {new Date(stats.bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-error/5 rounded-lg border border-error/20 hover:bg-error/10 transition-colors cursor-default" title="Lowest price during this period">
                <div>
                  <div className="text-[10px] text-base-content/50 uppercase tracking-wider font-semibold mb-0.5">Low</div>
                  <div className="font-bold text-error tracking-tight">{formatPrice(stats.minPrice)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-base-content/50 font-medium">
                    {new Date(stats.worstDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg hover:bg-base-200/70 transition-colors cursor-default" title="Average price over the period">
                <div>
                  <div className="text-[10px] text-base-content/50 uppercase tracking-wider font-semibold mb-0.5">Average</div>
                  <div className="font-bold text-base-content tracking-tight">{formatPrice(stats.avgPrice)}</div>
                </div>
                <div className="text-xs text-base-content/40 font-medium">
                  {selectedPeriod}D mean
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Market Info */}
        {stats && cryptoData.length > 0 && (
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-base-content">Market Data</h3>
              <span className="text-xs text-base-content/40 font-medium">Live</span>
            </div>
            <div className="space-y-0">
              <div className="flex items-center justify-between py-3 border-b border-base-200/50 hover:bg-base-200/30 -mx-1 px-1 rounded transition-colors cursor-default" title="Total market value of all coins">
                <span className="text-xs text-base-content/60 font-medium">Market Cap</span>
                <span className="text-sm font-semibold text-base-content tracking-tight">
                  {formatVolume(cryptoData[cryptoData.length - 1].marketCap)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-base-200/50 hover:bg-base-200/30 -mx-1 px-1 rounded transition-colors cursor-default" title="Total value traded in last 24 hours">
                <span className="text-xs text-base-content/60 font-medium">24h Volume</span>
                <span className="text-sm font-semibold text-base-content tracking-tight">
                  {formatVolume(cryptoData[cryptoData.length - 1].volume)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-base-200/50 hover:bg-base-200/30 -mx-1 px-1 rounded transition-colors cursor-default" title="Difference between highest and lowest price">
                <span className="text-xs text-base-content/60 font-medium">Price Spread</span>
                <span className="text-sm font-semibold text-base-content tracking-tight">
                  {formatPrice(stats.maxPrice - stats.minPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 hover:bg-base-200/30 -mx-1 px-1 rounded transition-colors cursor-default" title="Number of data points analyzed">
                <span className="text-xs text-base-content/60 font-medium">Data Points</span>
                <span className="text-sm font-semibold text-base-content tracking-tight">
                  {cryptoData.length} days
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoPage;
