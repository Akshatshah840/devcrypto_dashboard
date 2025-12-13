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
      latestPrice: latestData.price,
      latestChange: latestData.priceChangePercentage24h
    };
  }, [cryptoData]);

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
        <h3 className="text-sm font-semibold text-base-content mb-3">Select Cryptocurrency</h3>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-base-content/60 uppercase tracking-wide">Current Price</span>
            {loading && <span className="loading loading-spinner loading-xs" />}
          </div>
          <div className="text-2xl font-bold" style={{ color: coinColor }}>
            {stats ? formatPrice(stats.latestPrice) : '$0'}
          </div>
          <div className={`text-xs mt-1 ${stats && stats.latestChange >= 0 ? 'text-success' : 'text-error'}`}>
            {stats ? `${stats.latestChange >= 0 ? '+' : ''}${stats.latestChange.toFixed(2)}% (24h)` : 'N/A'}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">Period Change</div>
          <div className={`text-2xl font-bold ${stats && stats.priceChangePercent >= 0 ? 'text-success' : 'text-error'}`}>
            {stats ? `${stats.priceChangePercent >= 0 ? '+' : ''}${stats.priceChangePercent.toFixed(2)}%` : '0%'}
          </div>
          <div className="text-xs text-base-content/50 mt-1">Last {selectedPeriod} days</div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">Avg Volume</div>
          <div className="text-2xl font-bold text-base-content">
            {stats ? formatVolume(stats.avgVolume) : '$0'}
          </div>
          <div className="text-xs text-base-content/50 mt-1">Daily average</div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">Volatility</div>
          <div className="text-2xl font-bold text-warning">
            {stats ? formatPrice(stats.volatility) : '$0'}
          </div>
          <div className="text-xs text-base-content/50 mt-1">Std deviation</div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: coinColor }}
          >
            {selectedCoinData?.symbol.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-base-content">{selectedCoinData?.name} Price Chart</h3>
            <p className="text-xs text-base-content/50">{selectedCoinData?.symbol}/USD</p>
          </div>
        </div>
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
            <h3 className="text-sm font-semibold text-base-content mb-4">Price Range</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20">
                <div>
                  <div className="text-xs text-base-content/60">Highest Price</div>
                  <div className="font-semibold text-success">{formatPrice(stats.maxPrice)}</div>
                </div>
                <div className="text-xs text-base-content/50">
                  {new Date(stats.bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-error/5 rounded-lg border border-error/20">
                <div>
                  <div className="text-xs text-base-content/60">Lowest Price</div>
                  <div className="font-semibold text-error">{formatPrice(stats.minPrice)}</div>
                </div>
                <div className="text-xs text-base-content/50">
                  {new Date(stats.worstDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
                <div>
                  <div className="text-xs text-base-content/60">Average Price</div>
                  <div className="font-semibold text-base-content">{formatPrice(stats.avgPrice)}</div>
                </div>
                <div className="text-xs text-base-content/50">
                  {selectedPeriod} day avg
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Market Info */}
        {stats && cryptoData.length > 0 && (
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold text-base-content mb-4">Market Statistics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-base-200">
                <span className="text-sm text-base-content/60">Market Cap</span>
                <span className="text-sm font-medium text-base-content">
                  {formatVolume(cryptoData[cryptoData.length - 1].marketCap)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-base-200">
                <span className="text-sm text-base-content/60">24h Volume</span>
                <span className="text-sm font-medium text-base-content">
                  {formatVolume(cryptoData[cryptoData.length - 1].volume)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-base-200">
                <span className="text-sm text-base-content/60">Price Spread</span>
                <span className="text-sm font-medium text-base-content">
                  {formatPrice(stats.maxPrice - stats.minPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-base-content/60">Data Points</span>
                <span className="text-sm font-medium text-base-content">
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
