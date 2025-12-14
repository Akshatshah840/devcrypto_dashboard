import {
  GitHubActivity,
  CryptoData,
  CorrelationResult,
  TimePeriod,
  ExportFormat
} from '../types';
import { CRYPTO_COINS } from '../data/coins';

// Helper to check if a coin ID is supported
const isSupportedCoin = (coinId: string): boolean => {
  return CRYPTO_COINS.some(coin => coin.id === coinId);
};

/**
 * Validation result interface
 */
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: string[];
}

/**
 * Validates GitHubActivity data structure and values
 */
export function validateGitHubActivity(data: any): ValidationResult<GitHubActivity> {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Data must be an object'] };
  }

  // Validate required fields
  if (typeof data.date !== 'string' || !isValidDateString(data.date)) {
    errors.push('Date must be a valid ISO 8601 date string');
  }

  if (!Number.isInteger(data.commits) || data.commits < 0) {
    errors.push('Commits must be a non-negative integer');
  }

  if (!Number.isInteger(data.stars) || data.stars < 0) {
    errors.push('Stars must be a non-negative integer');
  }

  if (!Number.isInteger(data.contributors) || data.contributors < 0) {
    errors.push('Contributors must be a non-negative integer');
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? data as GitHubActivity : undefined,
    errors
  };
}

/**
 * Validates CryptoData data structure and values
 */
export function validateCryptoData(data: any): ValidationResult<CryptoData> {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Data must be an object'] };
  }

  // Validate required fields
  if (typeof data.date !== 'string' || !isValidDateString(data.date)) {
    errors.push('Date must be a valid ISO 8601 date string');
  }

  if (typeof data.coin !== 'string' || data.coin.trim().length === 0) {
    errors.push('Coin must be a non-empty string');
  }

  if (typeof data.price !== 'number' || data.price < 0) {
    errors.push('Price must be a non-negative number');
  }

  if (typeof data.volume !== 'number' || data.volume < 0) {
    errors.push('Volume must be a non-negative number');
  }

  if (typeof data.marketCap !== 'number' || data.marketCap < 0) {
    errors.push('MarketCap must be a non-negative number');
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? data as CryptoData : undefined,
    errors
  };
}

/**
 * Validates CorrelationResult data structure and values
 */
export function validateCorrelationResult(data: any): ValidationResult<CorrelationResult> {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Data must be an object'] };
  }

  if (typeof data.coin !== 'string' || data.coin.trim().length === 0) {
    errors.push('Coin must be a non-empty string');
  }

  if (!Number.isInteger(data.period) || data.period <= 0) {
    errors.push('Period must be a positive integer');
  }

  if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
    errors.push('Confidence must be a number between 0 and 1');
  }

  if (!Number.isInteger(data.dataPoints) || data.dataPoints < 0) {
    errors.push('DataPoints must be a non-negative integer');
  }

  // Validate correlations object
  if (!data.correlations || typeof data.correlations !== 'object') {
    errors.push('Correlations must be an object');
  } else {
    const correlationKeys = ['commits_price', 'commits_volume', 'pullRequests_price', 'stars_price'];
    for (const key of correlationKeys) {
      const value = data.correlations[key];
      if (typeof value !== 'number' || value < -1 || value > 1) {
        errors.push(`Correlation ${key} must be a number between -1 and 1`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? data as CorrelationResult : undefined,
    errors
  };
}

/**
 * Validates request parameters for frontend use
 */
export function validateCoinParam(coinId: string): ValidationResult<string> {
  const errors: string[] = [];

  if (typeof coinId !== 'string' || coinId.trim().length === 0) {
    errors.push('Coin ID parameter must be a non-empty string');
  } else if (!isSupportedCoin(coinId)) {
    errors.push(`Coin '${coinId}' is not supported`);
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? coinId : undefined,
    errors
  };
}

export function validateTimePeriod(days: number | string): ValidationResult<TimePeriod> {
  const errors: string[] = [];
  const numDays = typeof days === 'string' ? parseInt(days, 10) : days;

  if (isNaN(numDays)) {
    errors.push('Days parameter must be a valid number');
  } else if (![7, 14, 30, 60, 90].includes(numDays)) {
    errors.push('Days parameter must be one of: 7, 14, 30, 60, 90');
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? numDays as TimePeriod : undefined,
    errors
  };
}

export function validateExportFormat(format: string): ValidationResult<ExportFormat> {
  const errors: string[] = [];

  if (typeof format !== 'string' || format.trim().length === 0) {
    errors.push('Format parameter must be a non-empty string');
  } else if (!['json', 'csv'].includes(format.toLowerCase())) {
    errors.push('Format parameter must be either "json" or "csv"');
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? format.toLowerCase() as ExportFormat : undefined,
    errors
  };
}

/**
 * Helper function to validate ISO 8601 date strings
 */
function isValidDateString(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validates an array of data items using a validator function
 */
export function validateArray<T>(
  data: any[],
  validator: (item: any) => ValidationResult<T>
): ValidationResult<T[]> {
  const errors: string[] = [];
  const validItems: T[] = [];

  if (!Array.isArray(data)) {
    return { isValid: false, errors: ['Data must be an array'] };
  }

  data.forEach((item, index) => {
    const result = validator(item);
    if (result.isValid && result.data) {
      validItems.push(result.data);
    } else {
      errors.push(`Item ${index}: ${result.errors.join(', ')}`);
    }
  });

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? validItems : undefined,
    errors
  };
}
