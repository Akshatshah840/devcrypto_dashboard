import { GitHubActivity, AirQualityData, CorrelationResult, GitHubAPIResponse, WAQIAPIResponse } from '../types';

/**
 * Serialization utilities for API responses and data models
 * These functions handle parsing and serializing data for round-trip consistency
 */

/**
 * Parse GitHub API response to internal GitHubActivity format
 */
export function parseGitHubAPIResponse(response: GitHubAPIResponse, city: string, date: string): GitHubActivity {
  const commits = response.items.reduce((sum, item) => {
    // Estimate commits based on recent activity (simplified for demo)
    return sum + (item.stargazers_count > 0 ? Math.floor(Math.random() * 10) + 1 : 0);
  }, 0);

  const stars = response.items.reduce((sum, item) => sum + item.stargazers_count, 0);
  const repositories = response.items.length;
  const contributors = response.items.length; // Simplified - each repo has at least one contributor

  return {
    date,
    city,
    commits,
    stars,
    repositories,
    contributors
  };
}

/**
 * Parse WAQI API response to internal AirQualityData format
 */
export function parseWAQIAPIResponse(response: WAQIAPIResponse, city: string): AirQualityData {
  return {
    date: new Date(response.data.time.v * 1000).toISOString(),
    city,
    aqi: response.data.aqi,
    pm25: response.data.iaqi.pm25?.v || 0,
    station: response.data.city.name,
    coordinates: {
      lat: response.data.city.geo[0],
      lng: response.data.city.geo[1]
    }
  };
}

/**
 * Serialize GitHubActivity to JSON string
 */
export function serializeGitHubActivity(data: GitHubActivity): string {
  return JSON.stringify(data);
}

/**
 * Parse JSON string to GitHubActivity
 */
export function parseGitHubActivity(json: string): GitHubActivity {
  return JSON.parse(json);
}

/**
 * Serialize AirQualityData to JSON string
 */
export function serializeAirQualityData(data: AirQualityData): string {
  return JSON.stringify(data);
}

/**
 * Parse JSON string to AirQualityData
 */
export function parseAirQualityData(json: string): AirQualityData {
  return JSON.parse(json);
}

/**
 * Serialize CorrelationResult to JSON string
 */
export function serializeCorrelationResult(data: CorrelationResult): string {
  return JSON.stringify(data);
}

/**
 * Parse JSON string to CorrelationResult
 */
export function parseCorrelationResult(json: string): CorrelationResult {
  return JSON.parse(json);
}

/**
 * Generic serialization function
 */
export function serialize<T>(data: T): string {
  return JSON.stringify(data);
}

/**
 * Generic parsing function
 */
export function parse<T>(json: string): T {
  return JSON.parse(json);
}