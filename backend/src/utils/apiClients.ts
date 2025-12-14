/**
 * External API clients for GitHub and CoinGecko with rate limiting and error handling
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  GitHubAPIResponse,
  APIError,
  CoinGeckoMarketData,
  CoinGeckoHistoricalData,
  GitHubEventResponse
} from '../types';

// Rate limiting configuration
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryAfter: number;
}

interface RequestTracker {
  requests: number[];
  lastReset: number;
}

class APIClient {
  private requestTracker: RequestTracker = {
    requests: [],
    lastReset: Date.now()
  };

  constructor(
    protected client: AxiosInstance,
    private rateLimitConfig: RateLimitConfig,
    private name: string
  ) {}

  /**
   * Check if we're within rate limits
   */
  private checkRateLimit(): boolean {
    const now = Date.now();

    // Reset window if needed
    if (now - this.requestTracker.lastReset > this.rateLimitConfig.windowMs) {
      this.requestTracker.requests = [];
      this.requestTracker.lastReset = now;
    }

    // Remove old requests outside the window
    this.requestTracker.requests = this.requestTracker.requests.filter(
      timestamp => now - timestamp < this.rateLimitConfig.windowMs
    );

    return this.requestTracker.requests.length < this.rateLimitConfig.maxRequests;
  }

  /**
   * Record a request for rate limiting
   */
  private recordRequest(): void {
    this.requestTracker.requests.push(Date.now());
  }

  /**
   * Exponential backoff retry logic
   */
  async makeRequestWithRetry<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check rate limits before making request
        if (!this.checkRateLimit()) {
          const waitTime = this.rateLimitConfig.retryAfter;
          console.log(`[${this.name}] Rate limit reached, waiting ${waitTime}ms`);
          await this.sleep(waitTime);
        }

        this.recordRequest();
        const result = await requestFn();

        // Log successful request
        console.log(`[${this.name}] Request successful on attempt ${attempt + 1}`);
        return result;

      } catch (error) {
        lastError = error as Error;
        const axiosError = error as AxiosError;

        // Log the error
        console.error(`[${this.name}] Request failed on attempt ${attempt + 1}:`, {
          status: axiosError.response?.status,
          message: axiosError.message,
          url: axiosError.config?.url
        });

        // Don't retry on certain errors
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          console.error(`[${this.name}] Authentication/authorization error, not retrying`);
          break;
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff: 1s, 2s, 4s, 8s
        const backoffTime = Math.pow(2, attempt) * 1000;
        console.log(`[${this.name}] Retrying in ${backoffTime}ms...`);
        await this.sleep(backoffTime);
      }
    }

    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * CoinGecko API Client for cryptocurrency data
 */
class CoinGeckoAPIClient extends APIClient {
  constructor() {
    const client = axios.create({
      baseURL: 'https://api.coingecko.com/api/v3',
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DevCrypto-Analytics/1.0'
      }
    });

    // CoinGecko free tier: 10-30 requests/minute
    const rateLimitConfig: RateLimitConfig = {
      maxRequests: 25,
      windowMs: 60 * 1000, // 1 minute
      retryAfter: 30 * 1000 // 30 seconds
    };

    super(client, rateLimitConfig, 'CoinGecko API');
  }

  /**
   * Get current market data for a coin
   */
  async getCurrentPrice(coinId: string): Promise<CoinGeckoMarketData> {
    return this.makeRequestWithRetry(async () => {
      const response = await this.client.get<CoinGeckoMarketData[]>('/coins/markets', {
        params: {
          vs_currency: 'usd',
          ids: coinId,
          order: 'market_cap_desc',
          sparkline: false
        }
      });

      if (!response.data || response.data.length === 0) {
        throw new Error(`No data found for coin: ${coinId}`);
      }

      console.log(`[CoinGecko API] Retrieved current price for ${coinId}: $${response.data[0].current_price}`);
      return response.data[0];
    });
  }

  /**
   * Get historical market data for a coin
   */
  async getHistoricalData(coinId: string, days: number): Promise<CoinGeckoHistoricalData> {
    return this.makeRequestWithRetry(async () => {
      const response = await this.client.get<CoinGeckoHistoricalData>(`/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: 'daily'
        }
      });

      console.log(`[CoinGecko API] Retrieved ${response.data.prices.length} days of historical data for ${coinId}`);
      return response.data;
    });
  }

  /**
   * Get list of supported coins
   */
  async getSupportedCoins(): Promise<Array<{ id: string; symbol: string; name: string }>> {
    return this.makeRequestWithRetry(async () => {
      const response = await this.client.get('/coins/list');
      return response.data;
    });
  }
}

/**
 * Enhanced GitHub API Client with repository activity fetching
 */
class EnhancedGitHubAPIClient extends APIClient {
  constructor() {
    const client = axios.create({
      baseURL: 'https://api.github.com',
      timeout: 15000,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevCrypto-Analytics/1.0'
      }
    });

    // Add GitHub token if available
    if (process.env.GITHUB_TOKEN) {
      client.defaults.headers.common['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    // Rate limiting: 5000 requests/hour for authenticated, 60/hour for unauthenticated
    const rateLimitConfig: RateLimitConfig = {
      maxRequests: process.env.GITHUB_TOKEN ? 4500 : 50,
      windowMs: 60 * 60 * 1000, // 1 hour
      retryAfter: 60 * 1000 // 1 minute
    };

    super(client, rateLimitConfig, 'Enhanced GitHub API');
  }

  /**
   * Get public events for cryptocurrency-related repositories
   */
  async getCryptoRepoEvents(repos: string[]): Promise<GitHubEventResponse[]> {
    const allEvents: GitHubEventResponse[] = [];

    for (const repo of repos) {
      try {
        const events = await this.makeRequestWithRetry(async () => {
          const response = await this.client.get<GitHubEventResponse[]>(`/repos/${repo}/events`, {
            params: { per_page: 100 }
          });
          return response.data;
        });
        allEvents.push(...events);
      } catch (error) {
        console.error(`[Enhanced GitHub API] Failed to fetch events for ${repo}:`, error);
      }
    }

    return allEvents;
  }

  /**
   * Get repository statistics
   */
  async getRepoStats(repo: string): Promise<{
    stars: number;
    forks: number;
    openIssues: number;
    watchers: number;
  }> {
    return this.makeRequestWithRetry(async () => {
      const response = await this.client.get(`/repos/${repo}`);
      return {
        stars: response.data.stargazers_count,
        forks: response.data.forks_count,
        openIssues: response.data.open_issues_count,
        watchers: response.data.watchers_count
      };
    });
  }

  /**
   * Get commit activity for a repository (last year, weekly)
   */
  async getCommitActivity(repo: string): Promise<Array<{ week: number; total: number }>> {
    return this.makeRequestWithRetry(async () => {
      const response = await this.client.get(`/repos/${repo}/stats/commit_activity`);
      return response.data || [];
    });
  }
}

/**
 * Create API error object
 */
export function createAPIError(
  error: AxiosError,
  source: 'github' | 'coingecko'
): APIError {
  return {
    code: error.response?.status || 500,
    message: error.message || 'Unknown API error',
    source,
    timestamp: new Date().toISOString()
  };
}

// Export singleton instances
export const coinGeckoClient = new CoinGeckoAPIClient();
export const enhancedGitHubClient = new EnhancedGitHubAPIClient();

// Export classes for testing
export { CoinGeckoAPIClient, EnhancedGitHubAPIClient };
