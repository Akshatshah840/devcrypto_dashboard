import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  GitHubActivity,
  CryptoData,
  CorrelationResult,
  TimePeriod,
  APIResponse,
  LoadingState,
  ErrorState,
  DataSource
} from '../types';
import {
  generateMockGitHubData,
  generateMockCryptoData,
  generateMockCorrelation
} from '../services/mockData';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Data cache interface
interface DataCache {
  [key: string]: {
    data: any;
    timestamp: number;
    source: DataSource;
  };
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Global cache instance
const dataCache: DataCache = {};

// Helper function to generate cache key
const getCacheKey = (endpoint: string, identifier: string, period: TimePeriod): string => {
  return `${endpoint}-${identifier}-${period}`;
};

// Helper function to check if cached data is still valid
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

// Custom hook for fetching supported coins
export const useCoins = () => {
  const [coins, setCoins] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoins = async () => {
      const cacheKey = 'coins-all';

      // Check cache first
      if (dataCache[cacheKey] && isCacheValid(dataCache[cacheKey].timestamp)) {
        setCoins(dataCache[cacheKey].data);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get<APIResponse<string[]>>('/crypto/coins');

        if (response.data.success && response.data.data) {
          const fetchedData = response.data.data;
          setCoins(fetchedData);

          // Cache the data
          dataCache[cacheKey] = {
            data: fetchedData,
            timestamp: Date.now(),
            source: 'live'
          };
        } else {
          throw new Error(response.data.error || 'Failed to fetch coins');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch coins';
        setError(errorMessage);
        console.error('Error fetching coins:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
  }, []);

  return { coins, loading, error };
};

// Custom hook for fetching crypto data from real API
export const useCryptoData = (coinId: string, period: TimePeriod) => {
  const [data, setData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<DataSource>('live');

  const fetchData = useCallback(async () => {
    if (!coinId) return;

    const cacheKey = getCacheKey('crypto', coinId, period);

    // Check cache first
    if (dataCache[cacheKey] && isCacheValid(dataCache[cacheKey].timestamp)) {
      setData(dataCache[cacheKey].data);
      setSource(dataCache[cacheKey].source);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to fetch from real API
      const response = await apiClient.get<APIResponse<CryptoData[]>>(`/crypto/${coinId}/${period}`);

      if (response.data.success && response.data.data) {
        setData(response.data.data);
        setSource('live');

        // Cache the data
        dataCache[cacheKey] = {
          data: response.data.data,
          timestamp: Date.now(),
          source: 'live'
        };
      } else {
        throw new Error(response.data.error || 'Failed to fetch crypto data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch crypto data';

      // In production, show error instead of mock data
      if (import.meta.env.PROD) {
        setError(errorMessage);
        setData([]);
        setSource('live');
      } else {
        // In development, fallback to mock data
        console.warn('API fetch failed, falling back to mock data:', err);
        const mockData = generateMockCryptoData(coinId, period);
        setData(mockData);
        setSource('mock');

        dataCache[cacheKey] = {
          data: mockData,
          timestamp: Date.now(),
          source: 'mock'
        };
      }
    } finally {
      setLoading(false);
    }
  }, [coinId, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, source, refetch: fetchData };
};

// Custom hook for GitHub + Crypto correlation from real API
export const useCryptoCorrelationData = (coinId: string, period: TimePeriod) => {
  const [data, setData] = useState<CorrelationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<DataSource>('live');

  const fetchData = useCallback(async () => {
    if (!coinId) return;

    const cacheKey = getCacheKey('crypto-correlation', coinId, period);

    // Check cache first
    if (dataCache[cacheKey] && isCacheValid(dataCache[cacheKey].timestamp)) {
      setData(dataCache[cacheKey].data);
      setSource(dataCache[cacheKey].source);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to fetch from real API
      const response = await apiClient.get<APIResponse<CorrelationResult>>(`/crypto/correlation/${coinId}/${period}`);

      if (response.data.success && response.data.data) {
        setData(response.data.data);
        setSource('live');

        dataCache[cacheKey] = {
          data: response.data.data,
          timestamp: Date.now(),
          source: 'live'
        };
      } else {
        throw new Error(response.data.error || 'Failed to fetch correlation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch correlation data';

      // In production, show error instead of mock data
      if (import.meta.env.PROD) {
        setError(errorMessage);
        setData(null);
        setSource('live');
      } else {
        // In development, fallback to mock data
        console.warn('API fetch failed, falling back to mock data:', err);
        const githubData = generateMockGitHubData(period);
        const cryptoData = generateMockCryptoData(coinId, period);
        const correlationData = generateMockCorrelation(coinId, period, githubData, cryptoData);

        setData(correlationData);
        setSource('mock');

        dataCache[cacheKey] = {
          data: correlationData,
          timestamp: Date.now(),
          source: 'mock'
        };
      }
    } finally {
      setLoading(false);
    }
  }, [coinId, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, source, refetch: fetchData };
};

// Hook for GitHub data for crypto repositories from real API
export const useCryptoGitHubData = (coinId: string, period: TimePeriod) => {
  const [data, setData] = useState<GitHubActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<DataSource>('live');

  const fetchData = useCallback(async () => {
    if (!coinId) return;

    const cacheKey = getCacheKey('crypto-github', coinId, period);

    // Check cache first
    if (dataCache[cacheKey] && isCacheValid(dataCache[cacheKey].timestamp)) {
      setData(dataCache[cacheKey].data);
      setSource(dataCache[cacheKey].source);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to fetch from real API
      const response = await apiClient.get<APIResponse<GitHubActivity[]>>(`/crypto/github/${coinId}/${period}`);

      if (response.data.success && response.data.data) {
        setData(response.data.data);
        setSource('live');

        dataCache[cacheKey] = {
          data: response.data.data,
          timestamp: Date.now(),
          source: 'live'
        };
      } else {
        throw new Error(response.data.error || 'Failed to fetch GitHub data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch GitHub data';

      // In production, show error instead of mock data
      if (import.meta.env.PROD) {
        setError(errorMessage);
        setData([]);
        setSource('live');
      } else {
        // In development, fallback to mock data
        console.warn('API fetch failed, falling back to mock data:', err);
        const mockData = generateMockGitHubData(period);
        setData(mockData);
        setSource('mock');

        dataCache[cacheKey] = {
          data: mockData,
          timestamp: Date.now(),
          source: 'mock'
        };
      }
    } finally {
      setLoading(false);
    }
  }, [coinId, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, source, refetch: fetchData };
};

// Hook for GitHub data using mock data
export const useMockGitHubData = (period: TimePeriod) => {
  const [data, setData] = useState<GitHubActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<DataSource>('mock');

  const fetchData = useCallback(async () => {
    const cacheKey = getCacheKey('github-mock', 'global', period);

    // Check cache first
    if (dataCache[cacheKey] && isCacheValid(dataCache[cacheKey].timestamp)) {
      setData(dataCache[cacheKey].data);
      setSource(dataCache[cacheKey].source);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const mockData = generateMockGitHubData(period);
      setData(mockData);
      setSource('mock');

      // Cache the data
      dataCache[cacheKey] = {
        data: mockData,
        timestamp: Date.now(),
        source: 'mock'
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch GitHub data';
      setError(errorMessage);
      console.error('Error fetching GitHub data:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, source, refetch: fetchData };
};

// Combined hook for crypto dashboard
export const useCryptoDashboardData = (coinId: string, period: TimePeriod) => {
  const githubData = useCryptoGitHubData(coinId, period);
  const cryptoData = useCryptoData(coinId, period);
  const correlationData = useCryptoCorrelationData(coinId, period);

  const loading: LoadingState = {
    github: githubData.loading,
    crypto: cryptoData.loading,
    correlation: correlationData.loading,
    export: false
  };

  const error: ErrorState = {
    github: githubData.error,
    crypto: cryptoData.error,
    correlation: correlationData.error,
    export: null
  };

  const refetchAll = useCallback(() => {
    githubData.refetch();
    cryptoData.refetch();
    correlationData.refetch();
  }, [githubData.refetch, cryptoData.refetch, correlationData.refetch]);

  return {
    github: {
      data: githubData.data,
      loading: githubData.loading,
      error: githubData.error,
      source: githubData.source
    },
    crypto: {
      data: cryptoData.data,
      loading: cryptoData.loading,
      error: cryptoData.error,
      source: cryptoData.source
    },
    correlation: {
      data: correlationData.data,
      loading: correlationData.loading,
      error: correlationData.error,
      source: correlationData.source
    },
    loading,
    error,
    refetchAll
  };
};
