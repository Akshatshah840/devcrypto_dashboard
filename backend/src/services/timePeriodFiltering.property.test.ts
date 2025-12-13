/**
 * Property-based tests for Time Period Filtering
 * **Feature: github-air-quality-dashboard, Property 3: Time period filtering**
 */

import * as fc from 'fast-check';
import { dataService } from './dataService';
import { TECH_HUB_CITIES } from '../data/cities';

describe('Time Period Filtering Property Tests', () => {
  beforeEach(() => {
    // Force mock data for consistent testing
    process.env.FORCE_MOCK_DATA = 'true';
  });

  afterEach(() => {
    delete process.env.FORCE_MOCK_DATA;
  });

  /**
   * **Feature: github-air-quality-dashboard, Property 3: Time period filtering**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * For any time period selection (7, 14, 30, 60, or 90 days), the system should 
   * filter all displayed data to show only records within that timeframe
   */
  test('Property 3: Time period filtering', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random city from available tech hub cities
        fc.constantFrom(...TECH_HUB_CITIES.map(city => city.id)),
        // Generate random time period from allowed values
        fc.constantFrom(7, 14, 30, 60, 90),
        async (cityId: string, days: number) => {
          // Fetch GitHub data for the specified time period
          const githubResult = await dataService.getGitHubData(cityId, days);
          const githubData = githubResult.data;
          
          // Fetch Air Quality data for the specified time period
          const airQualityResult = await dataService.getAirQualityData(cityId, days);
          const airQualityData = airQualityResult.data;
          
          // Verify that the returned data matches the requested time period exactly
          expect(githubData.length).toBe(days);
          expect(airQualityData.length).toBe(days);
          
          // Calculate the expected date range
          const now = new Date();
          const startDate = new Date(now);
          startDate.setDate(startDate.getDate() - (days - 1));
          
          const endDate = new Date(now);
          
          // Verify GitHub data is within the correct time period
          githubData.forEach((dataPoint, index) => {
            const dataDate = new Date(dataPoint.date);
            
            // Verify date is within the expected range
            expect(dataDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime() - 24 * 60 * 60 * 1000); // Allow 1 day buffer
            expect(dataDate.getTime()).toBeLessThanOrEqual(endDate.getTime() + 24 * 60 * 60 * 1000); // Allow 1 day buffer
            
            // Verify date format is correct (YYYY-MM-DD)
            expect(dataPoint.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            
            // Verify city matches the requested city
            expect(dataPoint.city).toBe(cityId);
          });
          
          // Verify Air Quality data is within the correct time period
          airQualityData.forEach((dataPoint, index) => {
            const dataDate = new Date(dataPoint.date);
            
            // Verify date is within the expected range
            expect(dataDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime() - 24 * 60 * 60 * 1000); // Allow 1 day buffer
            expect(dataDate.getTime()).toBeLessThanOrEqual(endDate.getTime() + 24 * 60 * 60 * 1000); // Allow 1 day buffer
            
            // Verify date format is correct (YYYY-MM-DD)
            expect(dataPoint.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            
            // Verify city matches the requested city
            expect(dataPoint.city).toBe(cityId);
          });
          
          // Verify data is returned in chronological order (oldest to newest)
          for (let i = 1; i < githubData.length; i++) {
            const prevDate = new Date(githubData[i - 1].date);
            const currDate = new Date(githubData[i].date);
            expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
          }
          
          for (let i = 1; i < airQualityData.length; i++) {
            const prevDate = new Date(airQualityData[i - 1].date);
            const currDate = new Date(airQualityData[i].date);
            expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
          }
          
          // Verify that the time period filtering is consistent between GitHub and Air Quality data
          // Both should cover the same date range
          if (githubData.length > 0 && airQualityData.length > 0) {
            const githubStartDate = githubData[0].date;
            const githubEndDate = githubData[githubData.length - 1].date;
            const airQualityStartDate = airQualityData[0].date;
            const airQualityEndDate = airQualityData[airQualityData.length - 1].date;
            
            // The date ranges should be very similar (within 1 day)
            const githubStart = new Date(githubStartDate);
            const airQualityStart = new Date(airQualityStartDate);
            const githubEnd = new Date(githubEndDate);
            const airQualityEnd = new Date(airQualityEndDate);
            
            const startDiff = Math.abs(githubStart.getTime() - airQualityStart.getTime());
            const endDiff = Math.abs(githubEnd.getTime() - airQualityEnd.getTime());
            
            // Allow up to 1 day difference (86400000 ms)
            expect(startDiff).toBeLessThanOrEqual(86400000);
            expect(endDiff).toBeLessThanOrEqual(86400000);
          }
          
          // Verify that no data points are outside the requested time period
          const allDates = [
            ...githubData.map(d => d.date),
            ...airQualityData.map(d => d.date)
          ];
          
          const uniqueDates = [...new Set(allDates)];
          expect(uniqueDates.length).toBeLessThanOrEqual(days);
          
          // Verify that each date in the range appears at most once per dataset
          const githubDates = githubData.map(d => d.date);
          const airQualityDates = airQualityData.map(d => d.date);
          
          expect(new Set(githubDates).size).toBe(githubDates.length); // No duplicate dates
          expect(new Set(airQualityDates).size).toBe(airQualityDates.length); // No duplicate dates
        }
      ),
      { numRuns: 100, timeout: 30000 }
    );
  });

  test('should handle different time periods consistently', async () => {
    const cityId = TECH_HUB_CITIES[0].id;
    const timePeriods = [7, 14, 30, 60, 90];
    
    for (const days of timePeriods) {
      const githubResult = await dataService.getGitHubData(cityId, days);
      const airQualityResult = await dataService.getAirQualityData(cityId, days);
      
      // Verify exact count matches requested period
      expect(githubResult.data.length).toBe(days);
      expect(airQualityResult.data.length).toBe(days);
      
      // Verify all dates are unique within each dataset
      const githubDates = githubResult.data.map(d => d.date);
      const airQualityDates = airQualityResult.data.map(d => d.date);
      
      expect(new Set(githubDates).size).toBe(days);
      expect(new Set(airQualityDates).size).toBe(days);
    }
  });

  test('should filter data correctly for edge case time periods', async () => {
    const cityId = TECH_HUB_CITIES[0].id;
    
    // Test minimum time period (1 day would be outside allowed range, so test 7)
    const minResult = await dataService.getGitHubData(cityId, 7);
    expect(minResult.data.length).toBe(7);
    
    // Test maximum time period
    const maxResult = await dataService.getGitHubData(cityId, 90);
    expect(maxResult.data.length).toBe(90);
    
    // Verify that longer periods contain more historical data
    const shortPeriod = await dataService.getGitHubData(cityId, 7);
    const longPeriod = await dataService.getGitHubData(cityId, 30);
    
    // The longer period should include all dates from the shorter period
    const shortDates = new Set(shortPeriod.data.map(d => d.date));
    const longDates = new Set(longPeriod.data.map(d => d.date));
    
    // All dates from short period should be present in long period
    shortDates.forEach(date => {
      expect(longDates.has(date)).toBe(true);
    });
  });

  test('should maintain data structure consistency across different time periods', async () => {
    const cityId = TECH_HUB_CITIES[0].id;
    
    // Get data for different periods
    const period7 = await dataService.getGitHubData(cityId, 7);
    const period14 = await dataService.getGitHubData(cityId, 14);
    
    // Find overlapping dates
    const dates7 = period7.data.map(d => d.date);
    const dates14 = period14.data.map(d => d.date);
    const overlappingDates = dates7.filter(date => dates14.includes(date));
    
    // For overlapping dates, the data structure should be consistent (same fields, valid values)
    overlappingDates.forEach(date => {
      const data7 = period7.data.find(d => d.date === date);
      const data14 = period14.data.find(d => d.date === date);
      
      // Both should have the same structure and valid data
      expect(data7).toHaveProperty('date', date);
      expect(data14).toHaveProperty('date', date);
      expect(data7).toHaveProperty('city', cityId);
      expect(data14).toHaveProperty('city', cityId);
      
      // Both should have valid numeric values
      expect(typeof data7!.commits).toBe('number');
      expect(typeof data14!.commits).toBe('number');
      expect(data7!.commits).toBeGreaterThanOrEqual(0);
      expect(data14!.commits).toBeGreaterThanOrEqual(0);
      
      expect(typeof data7!.stars).toBe('number');
      expect(typeof data14!.stars).toBe('number');
      expect(data7!.stars).toBeGreaterThanOrEqual(0);
      expect(data14!.stars).toBeGreaterThanOrEqual(0);
      
      expect(typeof data7!.repositories).toBe('number');
      expect(typeof data14!.repositories).toBe('number');
      expect(data7!.repositories).toBeGreaterThanOrEqual(0);
      expect(data14!.repositories).toBeGreaterThanOrEqual(0);
      
      expect(typeof data7!.contributors).toBe('number');
      expect(typeof data14!.contributors).toBe('number');
      expect(data7!.contributors).toBeGreaterThanOrEqual(0);
      expect(data14!.contributors).toBeGreaterThanOrEqual(0);
    });
  });
});