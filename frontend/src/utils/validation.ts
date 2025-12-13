import { 
  GitHubActivity, 
  AirQualityData, 
  CorrelationResult, 
  TimePeriod,
  ExportFormat
} from '../types';
import { isSupportedCity } from '../data/cities';

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

  if (typeof data.city !== 'string' || data.city.trim().length === 0) {
    errors.push('City must be a non-empty string');
  }

  if (!Number.isInteger(data.commits) || data.commits < 0) {
    errors.push('Commits must be a non-negative integer');
  }

  if (!Number.isInteger(data.stars) || data.stars < 0) {
    errors.push('Stars must be a non-negative integer');
  }

  if (!Number.isInteger(data.repositories) || data.repositories < 0) {
    errors.push('Repositories must be a non-negative integer');
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
 * Validates AirQualityData data structure and values
 */
export function validateAirQualityData(data: any): ValidationResult<AirQualityData> {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Data must be an object'] };
  }

  // Validate required fields
  if (typeof data.date !== 'string' || !isValidDateString(data.date)) {
    errors.push('Date must be a valid ISO 8601 date string');
  }

  if (typeof data.city !== 'string' || data.city.trim().length === 0) {
    errors.push('City must be a non-empty string');
  }

  if (typeof data.aqi !== 'number' || data.aqi < 0 || data.aqi > 500) {
    errors.push('AQI must be a number between 0 and 500');
  }

  if (typeof data.pm25 !== 'number' || data.pm25 < 0 || data.pm25 > 1000) {
    errors.push('PM2.5 must be a number between 0 and 1000');
  }

  if (typeof data.station !== 'string' || data.station.trim().length === 0) {
    errors.push('Station must be a non-empty string');
  }

  // Validate coordinates
  if (!data.coordinates || typeof data.coordinates !== 'object') {
    errors.push('Coordinates must be an object');
  } else {
    if (typeof data.coordinates.lat !== 'number' || data.coordinates.lat < -90 || data.coordinates.lat > 90) {
      errors.push('Latitude must be a number between -90 and 90');
    }
    if (typeof data.coordinates.lng !== 'number' || data.coordinates.lng < -180 || data.coordinates.lng > 180) {
      errors.push('Longitude must be a number between -180 and 180');
    }
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? data as AirQualityData : undefined,
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

  if (typeof data.city !== 'string' || data.city.trim().length === 0) {
    errors.push('City must be a non-empty string');
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
    const correlationKeys = ['commits_aqi', 'stars_aqi', 'commits_pm25', 'stars_pm25'];
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
export function validateCityParam(city: string): ValidationResult<string> {
  const errors: string[] = [];

  if (typeof city !== 'string' || city.trim().length === 0) {
    errors.push('City parameter must be a non-empty string');
  } else if (!isSupportedCity(city)) {
    errors.push(`City '${city}' is not supported`);
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? city : undefined,
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
  return !isNaN(date.getTime()) && dateString === date.toISOString();
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