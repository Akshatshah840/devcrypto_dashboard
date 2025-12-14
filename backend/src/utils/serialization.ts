import { GitHubActivity, CryptoData, CryptoCorrelationResult, GitHubAPIResponse } from '../types';

/**
 * Serialization utilities for API responses and data models
 * These functions handle parsing and serializing data for round-trip consistency
 */

/**
 * Parse GitHub API response to internal GitHubActivity format
 */
export function parseGitHubAPIResponse(response: GitHubAPIResponse, date: string): GitHubActivity {
  const commits = response.items.reduce((sum, item) => {
    // Estimate commits based on recent activity (simplified for demo)
    return sum + (item.stargazers_count > 0 ? Math.floor(Math.random() * 10) + 1 : 0);
  }, 0);

  const stars = response.items.reduce((sum, item) => sum + item.stargazers_count, 0);
  const contributors = response.items.length; // Simplified - each repo has at least one contributor

  return {
    date,
    commits,
    stars,
    contributors
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
 * Serialize CryptoData to JSON string
 */
export function serializeCryptoData(data: CryptoData): string {
  return JSON.stringify(data);
}

/**
 * Parse JSON string to CryptoData
 */
export function parseCryptoData(json: string): CryptoData {
  return JSON.parse(json);
}

/**
 * Serialize CryptoCorrelationResult to JSON string
 */
export function serializeCorrelationResult(data: CryptoCorrelationResult): string {
  return JSON.stringify(data);
}

/**
 * Parse JSON string to CryptoCorrelationResult
 */
export function parseCorrelationResult(json: string): CryptoCorrelationResult {
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
