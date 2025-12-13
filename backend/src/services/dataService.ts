/**
 * Data service that integrates external APIs with mock data fallback
 */

import { GitHubActivity, AirQualityData, TechHubCity, DataSource, CorrelationResult } from '../types';
import { githubClient, waqiClient, createAPIError } from '../utils/apiClients';
import { 
  generateMockGitHubData, 
  generateMockAirQualityData, 
  shouldUseMockData,
  getMockDataMessage 
} from '../utils/mockDataGenerator';
import { TECH_HUB_CITIES } from '../data/cities';
import { 
  calculateCorrelation, 
  analyzeCorrelationSignificance, 
  handleCorrelationEdgeCases,
  CorrelationSignificance 
} from './correlationService';

export interface DataServiceResult<T> {
  data: T;
  source: DataSource;
  message?: string;
  error?: string;
}

/**
 * Data service class that handles fetching from APIs with fallback to mock data
 */
export class DataService {
  private githubErrors: Map<string, Error> = new Map();
  private waqiErrors: Map<string, Error> = new Map();
  
  // Simple in-memory cache with TTL
  private githubCache: Map<string, { data: GitHubActivity[]; timestamp: number }> = new Map();
  private airQualityCache: Map<string, { data: AirQualityData[]; timestamp: number }> = new Map();
  private correlationCache: Map<string, { data: CorrelationResult; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  /**
   * Get GitHub activity data for a city and time period
   */
  async getGitHubData(cityId: string, days: number): Promise<DataServiceResult<GitHubActivity[]>> {
    const city = TECH_HUB_CITIES.find(c => c.id === cityId);
    if (!city) {
      throw new Error(`City not found: ${cityId}`);
    }

    const cacheKey = `${cityId}-${days}`;
    
    // Check cache first
    const cachedData = this.githubCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < this.CACHE_TTL) {
      console.log(`[DataService] Returning cached GitHub data for ${cityId}`);
      return {
        data: cachedData.data,
        source: 'live', // Assume cached data was originally live
        message: 'Data from cache'
      };
    }
    
    const lastError = this.githubErrors.get(cacheKey);

    // Check if we should use mock data
    if (shouldUseMockData('github', lastError)) {
      const mockData = generateMockGitHubData(cityId, days);
      return {
        data: mockData,
        source: 'mock',
        message: getMockDataMessage('github')
      };
    }

    try {
      // Attempt to fetch from GitHub API
      const apiResponse = await githubClient.searchRepositories(city, days);
      
      // Transform API response to our internal format
      const githubData = this.transformGitHubResponse(apiResponse, cityId, days);
      
      // Cache the result
      this.githubCache.set(cacheKey, {
        data: githubData,
        timestamp: Date.now()
      });
      
      // Clear any previous errors
      this.githubErrors.delete(cacheKey);
      
      return {
        data: githubData,
        source: 'live'
      };

    } catch (error) {
      console.error(`GitHub API error for ${cityId}:`, error);
      
      // Store the error for future reference
      this.githubErrors.set(cacheKey, error as Error);
      
      // Fall back to mock data
      const mockData = generateMockGitHubData(cityId, days);
      
      return {
        data: mockData,
        source: 'mock',
        message: getMockDataMessage('github'),
        error: `GitHub API unavailable: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get air quality data for a city and time period
   */
  async getAirQualityData(cityId: string, days: number): Promise<DataServiceResult<AirQualityData[]>> {
    const city = TECH_HUB_CITIES.find(c => c.id === cityId);
    if (!city) {
      throw new Error(`City not found: ${cityId}`);
    }

    const cacheKey = `${cityId}-${days}`;
    
    // Check cache first
    const cachedData = this.airQualityCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < this.CACHE_TTL) {
      console.log(`[DataService] Returning cached air quality data for ${cityId}`);
      return {
        data: cachedData.data,
        source: 'live', // Assume cached data was originally live
        message: 'Data from cache'
      };
    }
    
    const lastError = this.waqiErrors.get(cacheKey);

    // Check if we should use mock data
    if (shouldUseMockData('waqi', lastError)) {
      const mockData = generateMockAirQualityData(cityId, city, days);
      return {
        data: mockData,
        source: 'mock',
        message: getMockDataMessage('waqi')
      };
    }

    try {
      // Attempt to fetch from WAQI API
      const apiResponse = await waqiClient.getCurrentAirQuality(city);
      
      // Transform API response to our internal format
      const airQualityData = this.transformWAQIResponse(apiResponse, cityId, days);
      
      // Cache the result
      this.airQualityCache.set(cacheKey, {
        data: airQualityData,
        timestamp: Date.now()
      });
      
      // Clear any previous errors
      this.waqiErrors.delete(cacheKey);
      
      return {
        data: airQualityData,
        source: 'live'
      };

    } catch (error) {
      console.error(`WAQI API error for ${cityId}:`, error);
      
      // Store the error for future reference
      this.waqiErrors.set(cacheKey, error as Error);
      
      // Fall back to mock data
      const mockData = generateMockAirQualityData(cityId, city, days);
      
      return {
        data: mockData,
        source: 'mock',
        message: getMockDataMessage('waqi'),
        error: `WAQI API unavailable: ${(error as Error).message}`
      };
    }
  }

  /**
   * Transform GitHub API response to internal format
   */
  private transformGitHubResponse(apiResponse: any, cityId: string, days: number): GitHubActivity[] {
    const data: GitHubActivity[] = [];
    const now = new Date();
    
    // Group repositories by date
    const reposByDate: Map<string, any[]> = new Map();
    
    apiResponse.items.forEach((repo: any) => {
      const createdDate = new Date(repo.created_at).toISOString().split('T')[0];
      if (!reposByDate.has(createdDate)) {
        reposByDate.set(createdDate, []);
      }
      reposByDate.get(createdDate)!.push(repo);
    });

    // Generate data for each day
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRepos = reposByDate.get(dateStr) || [];
      
      // Calculate metrics from repositories
      const commits = dayRepos.length * Math.floor(Math.random() * 10 + 5); // Estimate commits
      const stars = dayRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
      const repositories = dayRepos.length;
      const contributors = Math.floor(repositories * 2.5); // Estimate contributors
      
      data.push({
        date: dateStr,
        city: cityId,
        commits,
        stars,
        repositories,
        contributors
      });
    }
    
    return data.reverse(); // Return in chronological order
  }

  /**
   * Transform WAQI API response to internal format
   */
  private transformWAQIResponse(apiResponse: any, cityId: string, days: number): AirQualityData[] {
    const data: AirQualityData[] = [];
    const now = new Date();
    
    // Since WAQI typically returns current data, we'll simulate historical data
    // by using the current reading as a baseline and adding some variation
    const baseAQI = apiResponse.data.aqi;
    const basePM25 = apiResponse.data.iaqi.pm25?.v || Math.floor(baseAQI * 0.4);
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Add some realistic variation to the baseline
      const aqiVariation = (Math.random() - 0.5) * 30;
      const pm25Variation = (Math.random() - 0.5) * 15;
      
      data.push({
        date: dateStr,
        city: cityId,
        aqi: Math.max(0, Math.min(500, Math.floor(baseAQI + aqiVariation))),
        pm25: Math.max(0, Math.floor(basePM25 + pm25Variation)),
        station: apiResponse.data.city.name,
        coordinates: {
          lat: apiResponse.data.city.geo[0],
          lng: apiResponse.data.city.geo[1]
        }
      });
    }
    
    return data.reverse(); // Return in chronological order
  }

  /**
   * Clear error cache for a specific API
   */
  clearErrorCache(apiSource: 'github' | 'waqi', cityId?: string): void {
    const errorMap = apiSource === 'github' ? this.githubErrors : this.waqiErrors;
    
    if (cityId) {
      // Clear errors for specific city
      const keysToDelete = Array.from(errorMap.keys()).filter(key => key.startsWith(cityId));
      keysToDelete.forEach(key => errorMap.delete(key));
    } else {
      // Clear all errors
      errorMap.clear();
    }
  }

  /**
   * Get current error status
   */
  getErrorStatus(): { github: number; waqi: number } {
    return {
      github: this.githubErrors.size,
      waqi: this.waqiErrors.size
    };
  }

  /**
   * Clear cache for specific API or all caches
   */
  clearCache(apiSource?: 'github' | 'waqi' | 'correlation', cityId?: string): void {
    if (!apiSource) {
      // Clear all caches
      this.githubCache.clear();
      this.airQualityCache.clear();
      this.correlationCache.clear();
      return;
    }

    let cache: Map<string, any>;
    if (apiSource === 'github') cache = this.githubCache;
    else if (apiSource === 'waqi') cache = this.airQualityCache;
    else cache = this.correlationCache;
    
    if (cityId) {
      // Clear cache for specific city
      const keysToDelete = Array.from(cache.keys()).filter(key => key.startsWith(cityId));
      keysToDelete.forEach(key => cache.delete(key));
    } else {
      // Clear all cache for the API
      cache.clear();
    }
  }

  /**
   * Get correlation analysis for GitHub activity and air quality data
   */
  async getCorrelationAnalysis(cityId: string, days: number): Promise<DataServiceResult<{
    correlation: CorrelationResult;
    significance: CorrelationSignificance;
  }>> {
    const city = TECH_HUB_CITIES.find(c => c.id === cityId);
    if (!city) {
      throw new Error(`City not found: ${cityId}`);
    }

    const cacheKey = `${cityId}-${days}`;
    
    // Check cache first
    const cachedData = this.correlationCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < this.CACHE_TTL) {
      console.log(`[DataService] Returning cached correlation data for ${cityId}`);
      const significance = analyzeCorrelationSignificance(cachedData.data);
      return {
        data: {
          correlation: cachedData.data,
          significance
        },
        source: 'live', // Assume cached data was originally live
        message: 'Data from cache'
      };
    }

    try {
      // Fetch both GitHub and air quality data
      const [githubResult, airQualityResult] = await Promise.all([
        this.getGitHubData(cityId, days),
        this.getAirQualityData(cityId, days)
      ]);

      // Check if we can calculate correlation
      const edgeCheck = handleCorrelationEdgeCases(githubResult.data, airQualityResult.data);
      if (!edgeCheck.canCalculate) {
        throw new Error(edgeCheck.reason || 'Cannot calculate correlation');
      }

      // Calculate correlation
      const correlation = calculateCorrelation(
        githubResult.data, 
        airQualityResult.data, 
        cityId, 
        days
      );

      // Analyze significance
      const significance = analyzeCorrelationSignificance(correlation);

      // Cache the result
      this.correlationCache.set(cacheKey, {
        data: correlation,
        timestamp: Date.now()
      });

      // Determine data source based on input data sources
      const dataSource: DataSource = (githubResult.source === 'mock' || airQualityResult.source === 'mock') 
        ? 'mock' 
        : 'live';

      const messages: string[] = [];
      if (githubResult.message) messages.push(`GitHub: ${githubResult.message}`);
      if (airQualityResult.message) messages.push(`Air Quality: ${airQualityResult.message}`);

      return {
        data: {
          correlation,
          significance
        },
        source: dataSource,
        message: messages.length > 0 ? messages.join('; ') : undefined,
        error: githubResult.error || airQualityResult.error
      };

    } catch (error) {
      console.error(`Correlation analysis error for ${cityId}:`, error);
      
      throw new Error(`Failed to calculate correlation analysis: ${(error as Error).message}`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { github: number; waqi: number; correlation: number } {
    return {
      github: this.githubCache.size,
      waqi: this.airQualityCache.size,
      correlation: this.correlationCache.size
    };
  }
}

// Export singleton instance
export const dataService = new DataService();