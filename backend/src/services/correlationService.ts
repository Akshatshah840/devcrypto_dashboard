/**
 * Correlation analysis service for GitHub activity and air quality data
 */

import { GitHubActivity, AirQualityData, CorrelationResult } from '../types';

export interface AlignedDataPoint {
  date: string;
  github: GitHubActivity;
  airQuality: AirQualityData;
}

export interface CorrelationSignificance {
  hasSignificantCorrelations: boolean;
  significantCorrelations: Array<{
    metric: string;
    coefficient: number;
    strength: string;
    direction: string;
  }>;
  highlights: string[];
  confidenceLevel: string;
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 */
export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) {
    return NaN;
  }
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) {
    return NaN;
  }
  
  return numerator / denominator;
}

/**
 * Align GitHub and air quality data by date
 */
export function alignDataByDate(githubData: GitHubActivity[], airQualityData: AirQualityData[]): AlignedDataPoint[] {
  const aligned: AlignedDataPoint[] = [];
  
  for (const github of githubData) {
    const airQuality = airQualityData.find(aq => aq.date === github.date && aq.city === github.city);
    if (airQuality) {
      aligned.push({ date: github.date, github, airQuality });
    }
  }
  
  return aligned.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate confidence level based on data points and correlation strength
 */
export function calculateConfidence(dataPoints: number, correlations: CorrelationResult['correlations']): number {
  // Base confidence on sample size
  let baseConfidence: number;
  if (dataPoints < 5) baseConfidence = 0.1;
  else if (dataPoints < 10) baseConfidence = 0.3;
  else if (dataPoints < 20) baseConfidence = 0.5;
  else if (dataPoints < 30) baseConfidence = 0.7;
  else baseConfidence = 0.8;
  
  // Adjust confidence based on correlation strength
  const validCorrelations = Object.values(correlations)
    .filter((c): c is number => typeof c === 'number' && !isNaN(c));
  
  if (validCorrelations.length === 0) {
    return 0.1;
  }
  
  const avgAbsCorrelation = validCorrelations
    .reduce((sum, c) => sum + Math.abs(c), 0) / validCorrelations.length;
  
  // Boost confidence for strong correlations
  if (avgAbsCorrelation > 0.7) baseConfidence = Math.min(baseConfidence + 0.15, 0.95);
  else if (avgAbsCorrelation > 0.5) baseConfidence = Math.min(baseConfidence + 0.05, 0.85);
  else if (avgAbsCorrelation < 0.2) baseConfidence = Math.max(baseConfidence - 0.1, 0.1);
  
  return Math.min(baseConfidence, 1.0);
}

/**
 * Calculate correlation between GitHub activity and air quality data
 */
export function calculateCorrelation(
  githubData: GitHubActivity[], 
  airQualityData: AirQualityData[], 
  cityId: string, 
  days: number
): CorrelationResult {
  // Align data by date
  const alignedData = alignDataByDate(githubData, airQualityData);
  
  if (alignedData.length < 2) {
    return {
      city: cityId,
      period: days,
      correlations: {
        commits_aqi: NaN,
        stars_aqi: NaN,
        commits_pm25: NaN,
        stars_pm25: NaN
      },
      confidence: 0,
      dataPoints: alignedData.length
    };
  }
  
  // Extract arrays for correlation calculation
  const commits = alignedData.map(d => d.github.commits);
  const stars = alignedData.map(d => d.github.stars);
  const aqi = alignedData.map(d => d.airQuality.aqi);
  const pm25 = alignedData.map(d => d.airQuality.pm25);
  
  // Calculate correlations
  const correlations = {
    commits_aqi: calculatePearsonCorrelation(commits, aqi),
    stars_aqi: calculatePearsonCorrelation(stars, aqi),
    commits_pm25: calculatePearsonCorrelation(commits, pm25),
    stars_pm25: calculatePearsonCorrelation(stars, pm25)
  };
  
  // Calculate confidence based on data points and correlation strength
  const confidence = calculateConfidence(alignedData.length, correlations);
  
  return {
    city: cityId,
    period: days,
    correlations,
    confidence,
    dataPoints: alignedData.length
  };
}

/**
 * Analyze correlation significance and provide highlighting
 */
export function analyzeCorrelationSignificance(result: CorrelationResult): CorrelationSignificance {
  const significantCorrelations: Array<{
    metric: string;
    coefficient: number;
    strength: string;
    direction: string;
  }> = [];
  
  const highlights: string[] = [];
  
  // Define thresholds
  const strongThreshold = 0.7;
  const moderateThreshold = 0.5;
  const weakThreshold = 0.3;
  const highConfidenceThreshold = 0.8;
  
  // Analyze each correlation
  Object.entries(result.correlations).forEach(([metric, coefficient]) => {
    if (isNaN(coefficient)) return;
    
    const absCoeff = Math.abs(coefficient);
    let strength: string;
    
    if (absCoeff >= strongThreshold) strength = 'strong';
    else if (absCoeff >= moderateThreshold) strength = 'moderate';
    else if (absCoeff >= weakThreshold) strength = 'weak';
    else return; // Too weak to be significant
    
    const direction = coefficient > 0 ? 'positive' : 'negative';
    
    significantCorrelations.push({
      metric,
      coefficient,
      strength,
      direction
    });
  });
  
  // Generate highlights based on findings
  const hasSignificantCorrelations = significantCorrelations.length > 0 && result.confidence >= highConfidenceThreshold;
  
  if (hasSignificantCorrelations) {
    const strongCorrelations = significantCorrelations.filter(c => c.strength === 'strong');
    if (strongCorrelations.length > 0) {
      highlights.push(`Strong correlations detected with high confidence (${Math.round(result.confidence * 100)}%)`);
    }
    
    const positiveCorrelations = significantCorrelations.filter(c => c.direction === 'positive');
    const negativeCorrelations = significantCorrelations.filter(c => c.direction === 'negative');
    
    if (positiveCorrelations.length > 0) {
      highlights.push('Positive correlations suggest higher air pollution may coincide with increased GitHub activity');
    }
    
    if (negativeCorrelations.length > 0) {
      highlights.push('Negative correlations suggest higher air pollution may coincide with decreased GitHub activity');
    }
  } else if (result.confidence < 0.5) {
    highlights.push('Low confidence in correlation results due to insufficient data or high variability');
  } else {
    highlights.push('No statistically significant correlations detected');
  }
  
  // Determine confidence level
  let confidenceLevel: string;
  if (result.confidence >= 0.9) confidenceLevel = 'very high';
  else if (result.confidence >= 0.8) confidenceLevel = 'high';
  else if (result.confidence >= 0.6) confidenceLevel = 'moderate';
  else confidenceLevel = 'low';
  
  return {
    hasSignificantCorrelations,
    significantCorrelations,
    highlights,
    confidenceLevel
  };
}

/**
 * Calculate confidence intervals for correlation coefficients
 * Uses Fisher's z-transformation for confidence interval calculation
 */
export function calculateConfidenceIntervals(
  correlation: number, 
  sampleSize: number, 
  confidenceLevel: number = 0.95
): { lower: number; upper: number } | null {
  if (isNaN(correlation) || sampleSize < 4) {
    return null;
  }
  
  // Fisher's z-transformation
  const fisherZ = 0.5 * Math.log((1 + correlation) / (1 - correlation));
  
  // Standard error of Fisher's z
  const standardError = 1 / Math.sqrt(sampleSize - 3);
  
  // Critical value for confidence level (approximation for normal distribution)
  const alpha = 1 - confidenceLevel;
  const zCritical = getZCritical(alpha / 2);
  
  // Confidence interval in Fisher's z space
  const zLower = fisherZ - zCritical * standardError;
  const zUpper = fisherZ + zCritical * standardError;
  
  // Transform back to correlation space
  const lower = (Math.exp(2 * zLower) - 1) / (Math.exp(2 * zLower) + 1);
  const upper = (Math.exp(2 * zUpper) - 1) / (Math.exp(2 * zUpper) + 1);
  
  return {
    lower: Math.max(-1, Math.min(1, lower)),
    upper: Math.max(-1, Math.min(1, upper))
  };
}

/**
 * Get critical z-value for given alpha level (approximation)
 */
function getZCritical(alpha: number): number {
  // Common critical values
  if (alpha <= 0.005) return 2.576; // 99% confidence
  if (alpha <= 0.01) return 2.326;  // 98% confidence
  if (alpha <= 0.025) return 1.96;  // 95% confidence
  if (alpha <= 0.05) return 1.645;  // 90% confidence
  if (alpha <= 0.1) return 1.282;   // 80% confidence
  
  // Approximation for other values
  return 1.96; // Default to 95% confidence
}

/**
 * Handle edge cases in correlation calculation
 */
export function handleCorrelationEdgeCases(
  githubData: GitHubActivity[], 
  airQualityData: AirQualityData[]
): { canCalculate: boolean; reason?: string } {
  if (githubData.length === 0 || airQualityData.length === 0) {
    return { canCalculate: false, reason: 'No data available for correlation analysis' };
  }
  
  const alignedData = alignDataByDate(githubData, airQualityData);
  
  if (alignedData.length < 2) {
    return { canCalculate: false, reason: 'Insufficient overlapping data points for correlation analysis' };
  }
  
  // Check for identical values (would result in NaN correlation)
  const commits = alignedData.map(d => d.github.commits);
  const stars = alignedData.map(d => d.github.stars);
  const aqi = alignedData.map(d => d.airQuality.aqi);
  const pm25 = alignedData.map(d => d.airQuality.pm25);
  
  const hasVariation = (arr: number[]) => {
    const first = arr[0];
    return arr.some(val => val !== first);
  };
  
  if (!hasVariation(commits) && !hasVariation(stars)) {
    return { canCalculate: false, reason: 'GitHub activity data shows no variation' };
  }
  
  if (!hasVariation(aqi) && !hasVariation(pm25)) {
    return { canCalculate: false, reason: 'Air quality data shows no variation' };
  }
  
  return { canCalculate: true };
}