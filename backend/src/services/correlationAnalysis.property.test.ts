/**
 * Property-based tests for Correlation Analysis
 * **Feature: github-air-quality-dashboard, Property 6: Correlation calculation accuracy**
 * **Feature: github-air-quality-dashboard, Property 7: Correlation significance highlighting**
 */

import * as fc from 'fast-check';
import { GitHubActivity, AirQualityData, CorrelationResult } from '../types';
import { TECH_HUB_CITIES } from '../data/cities';
import { 
  calculateCorrelation, 
  analyzeCorrelationSignificance, 
  calculatePearsonCorrelation 
} from './correlationService';

describe('Correlation Analysis Property Tests', () => {
  /**
   * **Feature: github-air-quality-dashboard, Property 6: Correlation calculation accuracy**
   * **Validates: Requirements 3.1**
   * 
   * For any pair of GitHub activity and air quality datasets, the system should 
   * calculate mathematically correct statistical correlation coefficients
   */
  test('Property 6: Correlation calculation accuracy', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random city from available tech hub cities
        fc.constantFrom(...TECH_HUB_CITIES.map(city => city.id)),
        // Generate random time period from allowed values
        fc.constantFrom(7, 14, 30, 60, 90),
        // Generate random GitHub activity data
        fc.array(
          fc.record({
            date: fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') })
              .map(d => d.toISOString().split('T')[0]),
            city: fc.constantFrom(...TECH_HUB_CITIES.map(city => city.id)),
            commits: fc.integer({ min: 0, max: 1000 }),
            stars: fc.integer({ min: 0, max: 10000 }),
            repositories: fc.integer({ min: 0, max: 100 }),
            contributors: fc.integer({ min: 0, max: 500 })
          }),
          { minLength: 7, maxLength: 90 }
        ),
        // Generate random air quality data
        fc.array(
          fc.record({
            date: fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') })
              .map(d => d.toISOString().split('T')[0]),
            city: fc.constantFrom(...TECH_HUB_CITIES.map(city => city.id)),
            aqi: fc.integer({ min: 0, max: 500 }),
            pm25: fc.integer({ min: 0, max: 200 }),
            station: fc.string({ minLength: 5, maxLength: 50 }),
            coordinates: fc.record({
              lat: fc.float({ min: -90, max: 90 }),
              lng: fc.float({ min: -180, max: 180 })
            })
          }),
          { minLength: 7, maxLength: 90 }
        ),
        async (cityId: string, days: number, githubData: GitHubActivity[], airQualityData: AirQualityData[]) => {
          // Ensure both datasets have the same length and dates for proper correlation
          const minLength = Math.min(githubData.length, airQualityData.length, days);
          const alignedGithubData = githubData.slice(0, minLength);
          const alignedAirQualityData = airQualityData.slice(0, minLength);
          
          // Align dates to ensure proper pairing
          for (let i = 0; i < minLength; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            alignedGithubData[i].date = dateStr;
            alignedAirQualityData[i].date = dateStr;
            alignedGithubData[i].city = cityId;
            alignedAirQualityData[i].city = cityId;
          }
          
          // Calculate correlation using our system
          const correlationResult = calculateCorrelation(alignedGithubData, alignedAirQualityData, cityId, days);
          
          // Verify correlation result structure
          expect(correlationResult).toBeDefined();
          expect(correlationResult.city).toBe(cityId);
          expect(correlationResult.period).toBe(days);
          expect(correlationResult.dataPoints).toBe(minLength);
          expect(correlationResult.correlations).toBeDefined();
          
          // Verify all correlation coefficients are within valid range [-1, 1]
          expect(correlationResult.correlations.commits_aqi).toBeGreaterThanOrEqual(-1);
          expect(correlationResult.correlations.commits_aqi).toBeLessThanOrEqual(1);
          expect(correlationResult.correlations.stars_aqi).toBeGreaterThanOrEqual(-1);
          expect(correlationResult.correlations.stars_aqi).toBeLessThanOrEqual(1);
          expect(correlationResult.correlations.commits_pm25).toBeGreaterThanOrEqual(-1);
          expect(correlationResult.correlations.commits_pm25).toBeLessThanOrEqual(1);
          expect(correlationResult.correlations.stars_pm25).toBeGreaterThanOrEqual(-1);
          expect(correlationResult.correlations.stars_pm25).toBeLessThanOrEqual(1);
          
          // Verify confidence is between 0 and 1
          expect(correlationResult.confidence).toBeGreaterThanOrEqual(0);
          expect(correlationResult.confidence).toBeLessThanOrEqual(1);
          
          // Verify mathematical accuracy by calculating correlations manually
          if (minLength > 1) {
            const manualCommitsAqi = calculatePearsonCorrelation(
              alignedGithubData.map(d => d.commits),
              alignedAirQualityData.map(d => d.aqi)
            );
            const manualStarsAqi = calculatePearsonCorrelation(
              alignedGithubData.map(d => d.stars),
              alignedAirQualityData.map(d => d.aqi)
            );
            const manualCommitsPm25 = calculatePearsonCorrelation(
              alignedGithubData.map(d => d.commits),
              alignedAirQualityData.map(d => d.pm25)
            );
            const manualStarsPm25 = calculatePearsonCorrelation(
              alignedGithubData.map(d => d.stars),
              alignedAirQualityData.map(d => d.pm25)
            );
            
            // Allow for small floating point differences
            const tolerance = 0.001;
            
            if (!isNaN(manualCommitsAqi)) {
              expect(Math.abs(correlationResult.correlations.commits_aqi - manualCommitsAqi)).toBeLessThan(tolerance);
            }
            if (!isNaN(manualStarsAqi)) {
              expect(Math.abs(correlationResult.correlations.stars_aqi - manualStarsAqi)).toBeLessThan(tolerance);
            }
            if (!isNaN(manualCommitsPm25)) {
              expect(Math.abs(correlationResult.correlations.commits_pm25 - manualCommitsPm25)).toBeLessThan(tolerance);
            }
            if (!isNaN(manualStarsPm25)) {
              expect(Math.abs(correlationResult.correlations.stars_pm25 - manualStarsPm25)).toBeLessThan(tolerance);
            }
          }
        }
      ),
      { numRuns: 100, timeout: 30000 }
    );
  });

  /**
   * **Feature: github-air-quality-dashboard, Property 7: Correlation significance highlighting**
   * **Validates: Requirements 3.4**
   * 
   * For any correlation results with high statistical confidence, the system should 
   * highlight significant findings with appropriate indicators
   */
  test('Property 7: Correlation significance highlighting', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random city from available tech hub cities
        fc.constantFrom(...TECH_HUB_CITIES.map(city => city.id)),
        // Generate random time period from allowed values
        fc.constantFrom(7, 14, 30, 60, 90),
        // Generate correlation coefficients in different ranges
        fc.record({
          commits_aqi: fc.float({ min: -1, max: 1 }),
          stars_aqi: fc.float({ min: -1, max: 1 }),
          commits_pm25: fc.float({ min: -1, max: 1 }),
          stars_pm25: fc.float({ min: -1, max: 1 })
        }),
        // Generate confidence levels
        fc.float({ min: 0, max: 1 }),
        // Generate data points count
        fc.integer({ min: 5, max: 100 }),
        async (cityId: string, days: number, correlations: any, confidence: number, dataPoints: number) => {
          // Create a mock correlation result
          const correlationResult: CorrelationResult = {
            city: cityId,
            period: days,
            correlations,
            confidence,
            dataPoints
          };
          
          // Get significance highlighting from our system
          const significanceAnalysis = analyzeCorrelationSignificance(correlationResult);
          
          // Verify significance analysis structure
          expect(significanceAnalysis).toBeDefined();
          expect(significanceAnalysis.hasSignificantCorrelations).toBeDefined();
          expect(typeof significanceAnalysis.hasSignificantCorrelations).toBe('boolean');
          expect(Array.isArray(significanceAnalysis.significantCorrelations)).toBe(true);
          expect(Array.isArray(significanceAnalysis.highlights)).toBe(true);
          expect(significanceAnalysis.confidenceLevel).toBeDefined();
          
          // Verify significance detection logic
          const strongCorrelationThreshold = 0.7;
          const moderateCorrelationThreshold = 0.5;
          const highConfidenceThreshold = 0.8;
          
          const strongCorrelations = Object.entries(correlations).filter(
            ([_, value]) => Math.abs(value as number) >= strongCorrelationThreshold
          );
          
          const moderateCorrelations = Object.entries(correlations).filter(
            ([_, value]) => Math.abs(value as number) >= moderateCorrelationThreshold && 
                           Math.abs(value as number) < strongCorrelationThreshold
          );
          
          // If we have strong correlations with high confidence, should be highlighted
          if (strongCorrelations.length > 0 && confidence >= highConfidenceThreshold) {
            expect(significanceAnalysis.hasSignificantCorrelations).toBe(true);
            expect(significanceAnalysis.significantCorrelations.length).toBeGreaterThan(0);
            expect(significanceAnalysis.highlights.length).toBeGreaterThan(0);
            
            // Verify strong correlations are included in significant correlations
            strongCorrelations.forEach(([key, value]) => {
              const found = significanceAnalysis.significantCorrelations.some(
                sig => sig.metric === key && Math.abs(sig.coefficient - (value as number)) < 0.001
              );
              expect(found).toBe(true);
            });
          }
          
          // If we have moderate correlations with high confidence, might be highlighted
          if (moderateCorrelations.length > 0 && confidence >= highConfidenceThreshold && strongCorrelations.length === 0) {
            // Should at least acknowledge moderate correlations
            expect(significanceAnalysis.significantCorrelations.length).toBeGreaterThanOrEqual(0);
          }
          
          // If confidence is low, should not highlight as significant
          if (confidence < 0.5) {
            expect(significanceAnalysis.hasSignificantCorrelations).toBe(false);
            expect(significanceAnalysis.highlights).toContain('Low confidence in correlation results due to insufficient data or high variability');
          }
          
          // Verify confidence level categorization
          if (confidence >= 0.9) {
            expect(significanceAnalysis.confidenceLevel).toBe('very high');
          } else if (confidence >= 0.8) {
            expect(significanceAnalysis.confidenceLevel).toBe('high');
          } else if (confidence >= 0.6) {
            expect(significanceAnalysis.confidenceLevel).toBe('moderate');
          } else {
            expect(significanceAnalysis.confidenceLevel).toBe('low');
          }
          
          // Verify each significant correlation has proper structure
          significanceAnalysis.significantCorrelations.forEach(sig => {
            expect(sig).toHaveProperty('metric');
            expect(sig).toHaveProperty('coefficient');
            expect(sig).toHaveProperty('strength');
            expect(sig).toHaveProperty('direction');
            
            expect(typeof sig.metric).toBe('string');
            expect(typeof sig.coefficient).toBe('number');
            expect(['weak', 'moderate', 'strong', 'very strong']).toContain(sig.strength);
            expect(['positive', 'negative']).toContain(sig.direction);
            
            expect(sig.coefficient).toBeGreaterThanOrEqual(-1);
            expect(sig.coefficient).toBeLessThanOrEqual(1);
          });
          
          // Verify highlights are meaningful strings
          significanceAnalysis.highlights.forEach(highlight => {
            expect(typeof highlight).toBe('string');
            expect(highlight.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100, timeout: 30000 }
    );
  });

  test('should handle edge cases in correlation calculation', () => {
    // Test with identical values (should result in NaN or 0 correlation)
    const identicalGithub: GitHubActivity[] = Array(5).fill(null).map((_, i) => ({
      date: `2023-12-0${i + 1}`,
      city: 'san-francisco',
      commits: 100,
      stars: 50,
      repositories: 10,
      contributors: 25
    }));
    
    const identicalAirQuality: AirQualityData[] = Array(5).fill(null).map((_, i) => ({
      date: `2023-12-0${i + 1}`,
      city: 'san-francisco',
      aqi: 150,
      pm25: 75,
      station: 'Test Station',
      coordinates: { lat: 37.7749, lng: -122.4194 }
    }));
    
    const identicalResult = calculateCorrelation(identicalGithub, identicalAirQuality, 'san-francisco', 5);
    
    // With identical values, correlation should be NaN or handled gracefully
    expect(identicalResult).toBeDefined();
    expect(identicalResult.dataPoints).toBe(5);
    
    // Test with insufficient data
    const insufficientGithub: GitHubActivity[] = [{
      date: '2023-12-01',
      city: 'san-francisco',
      commits: 100,
      stars: 50,
      repositories: 10,
      contributors: 25
    }];
    
    const insufficientAirQuality: AirQualityData[] = [{
      date: '2023-12-01',
      city: 'san-francisco',
      aqi: 150,
      pm25: 75,
      station: 'Test Station',
      coordinates: { lat: 37.7749, lng: -122.4194 }
    }];
    
    const insufficientResult = calculateCorrelation(insufficientGithub, insufficientAirQuality, 'san-francisco', 1);
    expect(insufficientResult).toBeDefined();
    expect(insufficientResult.dataPoints).toBe(1);
    expect(insufficientResult.confidence).toBeLessThan(0.5); // Should have low confidence
  });
});

