import { useEffect } from 'react';
import { useToastHelpers } from '../components/Toast';
import { useOnlineStatus } from '../components/DataSourceIndicator';
import { 
  useGitHubData, 
  useAirQualityData, 
  useCorrelationData, 
  useCities 
} from './useDataFetching';
import { TimePeriod } from '../types';

// Enhanced hook that adds toast notifications for data fetching
export const useEnhancedGitHubData = (city: string, period: TimePeriod) => {
  const result = useGitHubData(city, period);
  const { showError, showWarning } = useToastHelpers();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (result.error) {
      showError(
        'GitHub Data Error',
        `Failed to fetch GitHub data for ${city}: ${result.error}`,
        { duration: 8000 }
      );
    }
  }, [result.error, city, showError]);

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

export const useEnhancedAirQualityData = (city: string, period: TimePeriod) => {
  const result = useAirQualityData(city, period);
  const { showError, showWarning } = useToastHelpers();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (result.error) {
      showError(
        'Air Quality Data Error',
        `Failed to fetch air quality data for ${city}: ${result.error}`,
        { duration: 8000 }
      );
    }
  }, [result.error, city, showError]);

  useEffect(() => {
    if (result.source === 'mock' && isOnline) {
      showWarning(
        'Using Simulated Data',
        'Air quality API is unavailable. Showing simulated data for demonstration.',
        { duration: 6000 }
      );
    }
  }, [result.source, isOnline, showWarning]);

  return result;
};

export const useEnhancedCorrelationData = (city: string, period: TimePeriod) => {
  const result = useCorrelationData(city, period);
  const { showError, showInfo } = useToastHelpers();

  useEffect(() => {
    if (result.error) {
      showError(
        'Correlation Analysis Error',
        `Failed to calculate correlations for ${city}: ${result.error}`,
        { duration: 8000 }
      );
    }
  }, [result.error, city, showError]);

  useEffect(() => {
    if (result.data && result.data.confidence > 0.95) {
      showInfo(
        'High Confidence Correlation',
        `Strong statistical correlation found for ${city} (${Math.round(result.data.confidence * 100)}% confidence)`,
        { duration: 10000 }
      );
    }
  }, [result.data, city, showInfo]);

  return result;
};

export const useEnhancedCities = () => {
  const result = useCities();
  const { showError } = useToastHelpers();

  useEffect(() => {
    if (result.error) {
      showError(
        'Cities Data Error',
        `Failed to load city list: ${result.error}`,
        { duration: 8000, persistent: true }
      );
    }
  }, [result.error, showError]);

  return result;
};

// Combined enhanced hook
export const useEnhancedAllData = (city: string, period: TimePeriod) => {
  const githubData = useEnhancedGitHubData(city, period);
  const airQualityData = useEnhancedAirQualityData(city, period);
  const correlationData = useEnhancedCorrelationData(city, period);

  const loading = {
    github: githubData.loading,
    airQuality: airQualityData.loading,
    correlation: correlationData.loading,
    export: false
  };

  const error = {
    github: githubData.error,
    airQuality: airQualityData.error,
    correlation: correlationData.error,
    export: null
  };

  const refetchAll = () => {
    githubData.refetch();
    airQualityData.refetch();
    correlationData.refetch();
  };

  return {
    github: {
      data: githubData.data,
      loading: githubData.loading,
      error: githubData.error,
      source: githubData.source
    },
    airQuality: {
      data: airQualityData.data,
      loading: airQualityData.loading,
      error: airQualityData.error,
      source: airQualityData.source
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