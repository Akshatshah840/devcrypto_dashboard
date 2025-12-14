/**
 * Core data models and types for DevCrypto Analytics Dashboard
 * GitHub Activity vs Cryptocurrency Prices
 */

// GitHub Activity Data for crypto repositories
export interface GitHubActivity {
  date: string;
  commits: number;
  pullRequests: number;
  issues: number;
  stars: number;
  forks: number;
  contributors: number;
}

// Cryptocurrency Data
export interface CryptoData {
  date: string;
  coin: string;
  price: number;
  volume: number;
  marketCap: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
}

// Supported Cryptocurrencies
export interface CryptoCoin {
  id: string;
  symbol: string;
  name: string;
  color: string;
}

// Correlation Result (GitHub vs Crypto)
export interface CorrelationResult {
  coin: string;
  period: number;
  correlations: {
    commits_price: number;
    commits_volume: number;
    pullRequests_price: number;
    stars_price: number;
  };
  interpretation: string;
  confidence: number;
  dataPoints: number;
}

// Frontend-specific types
export interface UIState {
  selectedCoin: string;
  selectedPeriod: TimePeriod;
  currentTheme: string;
  sidebarCollapsed: boolean;
  activeTab: TabType;
}

export interface LoadingState {
  github: boolean;
  crypto: boolean;
  correlation: boolean;
  export: boolean;
}

export interface ErrorState {
  github: string | null;
  crypto: string | null;
  correlation: string | null;
  export: string | null;
}

export interface ChartData {
  github: GitHubActivity[];
  crypto: CryptoData[];
  correlation: CorrelationResult | null;
}

// Component prop types
export interface ChartProps {
  data: GitHubActivity[] | CryptoData[];
  loading: boolean;
  error: string | null;
  height?: number;
  showTooltip?: boolean;
}

export interface SelectorProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: Array<{ value: string | number; label: string }>;
  disabled?: boolean;
}

// Export data interface
export interface ExportData {
  metadata: {
    coin: string;
    period: number;
    exportFormat: 'csv' | 'pdf';
    generatedAt: string;
    dataSource: 'live' | 'mock';
  };
  githubData: GitHubActivity[];
  cryptoData: CryptoData[];
  correlationData?: CorrelationResult;
}

// Utility types
export type TimePeriod = 7 | 14 | 30 | 60 | 90;
export type ExportFormat = 'csv' | 'pdf';
export type DataSource = 'live' | 'mock';
export type TabType = 'dashboard' | 'github' | 'crypto' | 'comparison' | 'reports';
export type CoinType = 'bitcoin' | 'ethereum' | 'solana' | 'cardano' | 'dogecoin' | 'ripple' | 'polkadot' | 'avalanche-2';

// API response wrapper
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: DataSource;
}

// Crypto API Response types
export interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
    usd_24h_vol: number;
    usd_24h_change: number;
    usd_market_cap: number;
  };
}

export interface CoinGeckoHistorical {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}
