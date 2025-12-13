/**
 * Property-based tests for DataService
 * **Feature: github-air-quality-dashboard, Property 1: City-based data fetching**
 */

import * as fc from 'fast-check';
import { DataService } from './dataService';
import { TECH_HUB_CITIES } from '../data/cities';
import { getMockDataMessage } from '../utils/mockDataGenerator';

describe('DataService Property Tests', () => {
  let dataService: DataService;

  beforeEach(() => {
    dataService = new DataService();
    // Force mock data for consistent testing
    process.env.FORCE_MOCK_DATA = 'true';
  });

  afterEach(() => {
    delete process.env.FORCE_MOCK_DATA;
  });

  /**
   * **Feature: github-air-quality-dashboard, Property 1: City-based data fetching**
   * **Validates: Requirements 1.1, 2.1**
   * 
   * For any tech hub city selection, the system should successfully fetch both 
   * GitHub activity data and air quality data with the correct structure and content
   */
  test('Property 1: City-based data fetching', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random city from available tech hub cities
        fc.constantFrom(...TECH_HUB_CITIES.map(city => city.id)),
        // Generate random time period from allowed values
        fc.constantFrom(7, 14, 30, 60, 90),
        async (cityId: string, days: number) => {
          // Fetch GitHub data
          const githubResult = await dataService.getGitHubData(cityId, days);
          
          // Fetch Air Quality data
          const airQualityResult = await dataService.getAirQualityData(cityId, days);
          
          // Verify GitHub data structure and content
          expect(githubResult.data).toBeDefined();
          expect(Array.isArray(githubResult.data)).toBe(true);
          expect(githubResult.data.length).toBe(days);
          expect(['live', 'mock']).toContain(githubResult.source);
          
          // Verify each GitHub data point has correct structure
          githubResult.data.forEach(dataPoint => {
            expect(dataPoint).toHaveProperty('date');
            expect(dataPoint).toHaveProperty('city', cityId);
            expect(dataPoint).toHaveProperty('commits');
            expect(dataPoint).toHaveProperty('stars');
            expect(dataPoint).toHaveProperty('repositories');
            expect(dataPoint).toHaveProperty('contributors');
            
            // Verify data types and ranges
            expect(typeof dataPoint.date).toBe('string');
            expect(typeof dataPoint.commits).toBe('number');
            expect(typeof dataPoint.stars).toBe('number');
            expect(typeof dataPoint.repositories).toBe('number');
            expect(typeof dataPoint.contributors).toBe('number');
            
            // Verify non-negative values
            expect(dataPoint.commits).toBeGreaterThanOrEqual(0);
            expect(dataPoint.stars).toBeGreaterThanOrEqual(0);
            expect(dataPoint.repositories).toBeGreaterThanOrEqual(0);
            expect(dataPoint.contributors).toBeGreaterThanOrEqual(0);
            
            // Verify date format (YYYY-MM-DD)
            expect(dataPoint.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          });
          
          // Verify Air Quality data structure and content
          expect(airQualityResult.data).toBeDefined();
          expect(Array.isArray(airQualityResult.data)).toBe(true);
          expect(airQualityResult.data.length).toBe(days);
          expect(['live', 'mock']).toContain(airQualityResult.source);
          
          // Verify each Air Quality data point has correct structure
          airQualityResult.data.forEach(dataPoint => {
            expect(dataPoint).toHaveProperty('date');
            expect(dataPoint).toHaveProperty('city', cityId);
            expect(dataPoint).toHaveProperty('aqi');
            expect(dataPoint).toHaveProperty('pm25');
            expect(dataPoint).toHaveProperty('station');
            expect(dataPoint).toHaveProperty('coordinates');
            
            // Verify data types and ranges
            expect(typeof dataPoint.date).toBe('string');
            expect(typeof dataPoint.aqi).toBe('number');
            expect(typeof dataPoint.pm25).toBe('number');
            expect(typeof dataPoint.station).toBe('string');
            expect(typeof dataPoint.coordinates).toBe('object');
            
            // Verify AQI and PM2.5 ranges
            expect(dataPoint.aqi).toBeGreaterThanOrEqual(0);
            expect(dataPoint.aqi).toBeLessThanOrEqual(500);
            expect(dataPoint.pm25).toBeGreaterThanOrEqual(0);
            
            // Verify coordinates structure
            expect(dataPoint.coordinates).toHaveProperty('lat');
            expect(dataPoint.coordinates).toHaveProperty('lng');
            expect(typeof dataPoint.coordinates.lat).toBe('number');
            expect(typeof dataPoint.coordinates.lng).toBe('number');
            
            // Verify date format (YYYY-MM-DD)
            expect(dataPoint.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          });
          
          // Verify data is returned in chronological order
          for (let i = 1; i < githubResult.data.length; i++) {
            const prevDate = new Date(githubResult.data[i - 1].date);
            const currDate = new Date(githubResult.data[i].date);
            expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
          }
          
          for (let i = 1; i < airQualityResult.data.length; i++) {
            const prevDate = new Date(airQualityResult.data[i - 1].date);
            const currDate = new Date(airQualityResult.data[i].date);
            expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
          }
        }
      ),
      { numRuns: 100, timeout: 30000 }
    );
  });

  test('should handle invalid city gracefully', async () => {
    await expect(dataService.getGitHubData('invalid-city', 7))
      .rejects.toThrow('City not found: invalid-city');
    
    await expect(dataService.getAirQualityData('invalid-city', 7))
      .rejects.toThrow('City not found: invalid-city');
  });

  test('should handle edge case time periods', async () => {
    const cityId = TECH_HUB_CITIES[0].id;
    
    // Test minimum time period
    const result1 = await dataService.getGitHubData(cityId, 1);
    expect(result1.data.length).toBe(1);
    
    // Test maximum time period
    const result90 = await dataService.getGitHubData(cityId, 90);
    expect(result90.data.length).toBe(90);
  });

  /**
   * **Feature: github-air-quality-dashboard, Property 12: Mock data indication**
   * **Validates: Requirements 6.2**
   * 
   * For any system state where mock data is being used, the user interface should 
   * clearly indicate that simulated data is being displayed
   */
  test('Property 12: Mock data indication', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random city from available tech hub cities
        fc.constantFrom(...TECH_HUB_CITIES.map(city => city.id)),
        // Generate random time period from allowed values
        fc.constantFrom(7, 14, 30, 60, 90),
        async (cityId: string, days: number) => {
          // Since we're forcing mock data in test environment, both calls should return mock data
          const githubResult = await dataService.getGitHubData(cityId, days);
          const airQualityResult = await dataService.getAirQualityData(cityId, days);
          
          // Verify that when mock data is used, the system indicates this to the user
          if (githubResult.source === 'mock') {
            expect(githubResult.message).toBeDefined();
            expect(githubResult.message).toContain('simulated data');
            expect(githubResult.message).toContain('GitHub API');
          }
          
          if (airQualityResult.source === 'mock') {
            expect(airQualityResult.message).toBeDefined();
            expect(airQualityResult.message).toContain('simulated data');
            expect(airQualityResult.message).toContain('World Air Quality Index API');
          }
          
          // In test environment with FORCE_MOCK_DATA, both should be mock
          expect(githubResult.source).toBe('mock');
          expect(airQualityResult.source).toBe('mock');
          
          // Both should have appropriate mock data messages
          expect(githubResult.message).toMatch(/⚠️ Using simulated data - GitHub API is currently unavailable/);
          expect(airQualityResult.message).toMatch(/⚠️ Using simulated data - World Air Quality Index API is currently unavailable/);
        }
      ),
      { numRuns: 50, timeout: 10000 }
    );
  });

  test('should provide different mock data messages for different API sources', () => {
    const githubMessage = getMockDataMessage('github');
    const waqiMessage = getMockDataMessage('waqi');
    
    expect(githubMessage).toContain('GitHub API');
    expect(waqiMessage).toContain('World Air Quality Index API');
    expect(githubMessage).not.toEqual(waqiMessage);
    
    // Both should indicate simulated data
    expect(githubMessage).toContain('simulated data');
    expect(waqiMessage).toContain('simulated data');
    
    // Both should have warning indicator
    expect(githubMessage).toContain('⚠️');
    expect(waqiMessage).toContain('⚠️');
  });
});