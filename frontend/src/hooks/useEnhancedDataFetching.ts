import { useEffect, useCallback } from 'react';
import { useToastHelpers } from '../components/Toast';
import { useOnlineStatus } from '../components/DataSourceIndicator';
import {
  useCryptoData,
  useCryptoGitHubData,
  useCryptoCorrelationData,
  useCoins
} from './useDataFetching';
import { TimePeriod } from '../types';

// Enhanced hook that adds toast notifications for crypto data fetching
export const useEnhancedCryptoData = (coinId: string, period: TimePeriod) => {
  const result = useCryptoData(coinId, period);
  const { showError, showWarning } = useToastHelpers();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (result.error) {
      showError(
        'Crypto Data Error',
        `Failed to fetch crypto data for ${coinId}: ${result.error}`,
        { duration: 8000 }
      );
    }
  }, [result.error, coinId, showError]);

  useEffect(() => {
    if (result.source === 'mock' && isOnline) {
      showWarning(
        'Using Simulated Data',
        'CoinGecko API is unavailable. Showing simulated data for demonstration.',
        { duration: 6000 }
      );
    }
  }, [result.source, isOnline, showWarning]);

  return result;
};

// Enhanced hook for crypto GitHub data
export const useEnhancedCryptoGitHubData = (coinId: string, period: TimePeriod) => {
  const result = useCryptoGitHubData(coinId, period);
  const { showError, showWarning } = useToastHelpers();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (result.error) {
      showError(
        'GitHub Data Error',
        `Failed to fetch GitHub data for ${coinId}: ${result.error}`,
        { duration: 8000 }
      );
    }
  }, [result.error, coinId, showError]);

  useEffect(() => {
    if (result.source === 'mock' && isOnline) {
      showWarning(
        'Using Simulated Data',
        'GitHub API is unavailable. Showing simulated data for demonstration.',
        { duration: 6000 }
      );
    }
  }, [result.source, isOnline, showWarning]);

  return result;
};

// Enhanced hook for correlation data
export const useEnhancedCryptoCorrelationData = (coinId: string, period: TimePeriod) => {
  const result = useCryptoCorrelationData(coinId, period);
  const { showError, showInfo } = useToastHelpers();

  useEffect(() => {
    if (result.error) {
      showError(
        'Correlation Analysis Error',
        `Failed to calculate correlations for ${coinId}: ${result.error}`,
        { duration: 8000 }
      );
    }
  }, [result.error, coinId, showError]);

  useEffect(() => {
    if (result.data && result.data.confidence > 0.95) {
      showInfo(
        'High Confidence Correlation',
        `Strong statistical correlation found for ${coinId} (${Math.round(result.data.confidence * 100)}% confidence)`,
        { duration: 10000 }
      );
    }
  }, [result.data, coinId, showInfo]);

  return result;
};

// Enhanced hook for coins list
export const useEnhancedCoins = () => {
  const result = useCoins();
  const { showError } = useToastHelpers();

  useEffect(() => {
    if (result.error) {
      showError(
        'Coins Data Error',
        `Failed to load coin list: ${result.error}`,
        { duration: 8000, persistent: true }
      );
    }
  }, [result.error, showError]);

  return result;
};

// Combined enhanced hook for crypto dashboard
export const useEnhancedCryptoDashboardData = (coinId: string, period: TimePeriod) => {
  const githubData = useEnhancedCryptoGitHubData(coinId, period);
  const cryptoData = useEnhancedCryptoData(coinId, period);
  const correlationData = useEnhancedCryptoCorrelationData(coinId, period);

  const loading = {
    github: githubData.loading,
    crypto: cryptoData.loading,
    correlation: correlationData.loading,
    export: false
  };

  const error = {
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
