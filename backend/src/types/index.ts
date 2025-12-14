/**
 * Core data models and types for DevCrypto Analytics Dashboard
 * GitHub Activity vs Cryptocurrency Prices
 */

// GitHub Activity Data for crypto repositories
export interface GitHubActivity {
  date: string;
  commits: number;
  stars: number;
  contributors: number;
  pullRequests?: number;
  issues?: number;
  forks?: number;
}

// Cryptocurrency Price Data
export interface CryptoData {
  date: string;
  coinId: string;
  price: number;
  volume: number;
  marketCap: number;
  priceChangePercentage24h: number;
}

// Correlation Result (GitHub Activity vs Crypto Prices)
export interface CryptoCorrelationResult {
  coinId: string;
  period: number;
  correlations: {
    commits_price: number;
    commits_volume: number;
    pullRequests_price: number;
    stars_price: number;
  };
  confidence: number;
  dataPoints: number;
  interpretation: string;
}

// Supported Cryptocurrency
export interface CryptoCoin {
  id: string;
  symbol: string;
  name: string;
  color: string;
  githubRepo: string;
}

// CoinGecko API Response types
export interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  last_updated: string;
}

export interface CoinGeckoHistoricalData {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][]; // [timestamp, market_cap]
  total_volumes: [number, number][]; // [timestamp, volume]
}

// GitHub API Response types
export interface GitHubAPIResponse {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{
    id: number;
    name: string;
    full_name: string;
    stargazers_count: number;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    language: string;
    owner: {
      login: string;
      type: string;
    };
  }>;
}

// GitHub Events API Response
export interface GitHubEventResponse {
  id: string;
  type: string;
  actor: {
    login: string;
  };
  repo: {
    name: string;
  };
  created_at: string;
  payload?: {
    commits?: Array<{ sha: string }>;
    action?: string;
  };
}

// Export data interface
export interface ExportData {
  metadata: {
    coinId: string;
    period: number;
    exportFormat: 'json' | 'csv';
    generatedAt: string;
    dataSource: 'live' | 'mock';
  };
  githubData: GitHubActivity[];
  cryptoData: CryptoData[];
  correlationData?: CryptoCorrelationResult;
}

// Validation result types
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: string[];
}

// API Error
export interface APIError {
  code: number;
  message: string;
  source: 'github' | 'coingecko' | 'internal';
  timestamp: string;
}

// Time period type
export type TimePeriod = 7 | 14 | 30 | 60 | 90;

// Export format type
export type ExportFormat = 'json' | 'csv';

// Data source type
export type DataSource = 'live' | 'mock';
