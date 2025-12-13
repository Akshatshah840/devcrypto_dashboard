/**
 * Core data models and types for DevCrypto Analytics Dashboard
 * These interfaces define the structure of data used throughout the application
 */

// Core data interfaces
export interface GitHubActivity {
  date: string;
  commits: number;
  stars: number;
  contributors: number;
  pullRequests?: number; // Optional for backward compatibility
  city?: string; // Optional for backward compatibility
  repositories?: number; // Optional for backward compatibility
}

export interface CryptoData {
  date: string;
  coinId: string;
  price: number;
  volume: number;
  marketCap: number;
  priceChangePercentage24h: number;
}

export interface AirQualityData {
  date: string;
  city: string;
  aqi: number;
  pm25: number;
  station: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface CorrelationResult {
  city: string;
  period: number;
  correlations: {
    commits_aqi: number;
    stars_aqi: number;
    commits_pm25: number;
    stars_pm25: number;
  };
  confidence: number;
  dataPoints: number;
}

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

export interface TechHubCity {
  id: string;
  name: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timezone: string;
  githubSearchQuery: string;
}

// API Response types
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

export interface WAQIAPIResponse {
  status: string;
  data: {
    aqi: number;
    idx: number;
    attributions: Array<{
      url: string;
      name: string;
    }>;
    city: {
      geo: [number, number];
      name: string;
      url: string;
    };
    dominentpol: string;
    iaqi: {
      pm25?: { v: number };
      pm10?: { v: number };
      o3?: { v: number };
      no2?: { v: number };
      so2?: { v: number };
      co?: { v: number };
    };
    time: {
      s: string;
      tz: string;
      v: number;
    };
  };
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

// Utility types for internal data structures
export interface DataStore {
  githubCache: Map<string, GitHubActivity[]>;
  airQualityCache: Map<string, AirQualityData[]>;
  correlationCache: Map<string, CorrelationResult>;
  lastUpdated: Map<string, Date>;
}

export interface APIError {
  code: number;
  message: string;
  source: 'github' | 'waqi' | 'coingecko' | 'internal';
  timestamp: string;
}

export interface ExportData {
  metadata: {
    city: string;
    period: number;
    exportFormat: 'json' | 'csv';
    generatedAt: string;
    dataSource: 'live' | 'mock';
  };
  githubData: GitHubActivity[];
  airQualityData: AirQualityData[];
  correlationData?: CorrelationResult;
}

// Validation result types
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: string[];
}

// Time period type
export type TimePeriod = 7 | 14 | 30 | 60 | 90;

// Export format type
export type ExportFormat = 'json' | 'csv';

// Data source type
export type DataSource = 'live' | 'mock';