import {
  GitHubActivity,
  CryptoData,
  CryptoCorrelationResult,
  CryptoCoin,
  ValidationResult,
  TimePeriod,
  ExportFormat,
  GitHubAPIResponse
} from '../types';

// Supported cryptocurrencies
const SUPPORTED_COINS = [
  'bitcoin', 'ethereum', 'solana', 'cardano',
  'dogecoin', 'ripple', 'polkadot', 'avalanche-2'
];

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

  if (typeof data.coinId !== 'string' || data.coinId.trim().length === 0) {
    errors.push('CoinId must be a non-empty string');
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

  if (typeof data.priceChangePercentage24h !== 'number') {
    errors.push('PriceChangePercentage24h must be a number');
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? data as CryptoData : undefined,
    errors
  };
}

/**
 * Validates CryptoCorrelationResult data structure and values
 */
export function validateCryptoCorrelationResult(data: any): ValidationResult<CryptoCorrelationResult> {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Data must be an object'] };
  }

  if (typeof data.coinId !== 'string' || data.coinId.trim().length === 0) {
    errors.push('CoinId must be a non-empty string');
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

  if (typeof data.interpretation !== 'string') {
    errors.push('Interpretation must be a string');
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? data as CryptoCorrelationResult : undefined,
    errors
  };
}

/**
 * Validates CryptoCoin data structure
 */
export function validateCryptoCoin(data: any): ValidationResult<CryptoCoin> {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Data must be an object'] };
  }

  if (typeof data.id !== 'string' || data.id.trim().length === 0) {
    errors.push('ID must be a non-empty string');
  }

  if (typeof data.symbol !== 'string' || data.symbol.trim().length === 0) {
    errors.push('Symbol must be a non-empty string');
  }

  if (typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name must be a non-empty string');
  }

  if (typeof data.color !== 'string' || data.color.trim().length === 0) {
    errors.push('Color must be a non-empty string');
  }

  if (typeof data.githubRepo !== 'string' || data.githubRepo.trim().length === 0) {
    errors.push('GitHub repo must be a non-empty string');
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? data as CryptoCoin : undefined,
    errors
  };
}

/**
 * Validates GitHub API response structure
 */
export function validateGitHubAPIResponse(data: any): ValidationResult<GitHubAPIResponse> {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Data must be an object'] };
  }

  if (typeof data.total_count !== 'number' || data.total_count < 0) {
    errors.push('total_count must be a non-negative number');
  }

  if (typeof data.incomplete_results !== 'boolean') {
    errors.push('incomplete_results must be a boolean');
  }

  if (!Array.isArray(data.items)) {
    errors.push('items must be an array');
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? data as GitHubAPIResponse : undefined,
    errors
  };
}

/**
 * Validates coin parameter
 */
export function validateCoinParam(coinId: string): ValidationResult<string> {
  const errors: string[] = [];

  if (typeof coinId !== 'string' || coinId.trim().length === 0) {
    errors.push('Coin ID parameter must be a non-empty string');
  } else if (!SUPPORTED_COINS.includes(coinId)) {
    errors.push(`Coin '${coinId}' is not supported. Supported coins: ${SUPPORTED_COINS.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? coinId : undefined,
    errors
  };
}

/**
 * Validates time period parameter
 */
export function validateTimePeriod(days: string | number): ValidationResult<TimePeriod> {
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

/**
 * Validates export format parameter
 */
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
