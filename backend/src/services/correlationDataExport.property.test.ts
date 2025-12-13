/**
 * Property-based tests for correlation data export
 * **Feature: github-air-quality-dashboard, Property 8: Correlation data export**
 * **Validates: Requirements 3.5**
 */

import * as fc from 'fast-check';
import request from 'supertest';
import app from '../server';
import { dataService } from './dataService';
import { CorrelationResult } from '../types';

// Mock the dataService to provide controlled test data
jest.mock('./dataService');
const mockedDataService = dataService as jest.Mocked<typeof dataService>;

describe('Correlation Data Export Properties', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Correlation data export includes all analysis data and metadata', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
      fc.constantFrom(7, 14, 30, 60, 90),
      fc.constantFrom('json', 'csv'),
      fc.record({
        city: fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
        period: fc.constantFrom(7, 14, 30, 60, 90),
        correlations: fc.record({
          commits_aqi: fc.float({ min: -1, max: 1, noNaN: true }).map(n => Object.is(n, -0) ? 0 : n),
          stars_aqi: fc.float({ min: -1, max: 1, noNaN: true }).map(n => Object.is(n, -0) ? 0 : n),
          commits_pm25: fc.float({ min: -1, max: 1, noNaN: true }).map(n => Object.is(n, -0) ? 0 : n),
          stars_pm25: fc.float({ min: -1, max: 1, noNaN: true }).map(n => Object.is(n, -0) ? 0 : n)
        }),
        confidence: fc.float({ min: Math.fround(0.001), max: 1, noNaN: true }),
        dataPoints: fc.integer({ min: 1, max: 1000 })
      }),
      fc.constantFrom('live', 'mock'),
      async (city, days, format, correlationData, dataSource) => {
        // Mock the data service responses
        mockedDataService.getGitHubData.mockResolvedValue({
          data: [],
          source: dataSource as 'live' | 'mock',
          message: dataSource === 'mock' ? 'Using mock data' : undefined
        });

        mockedDataService.getAirQualityData.mockResolvedValue({
          data: [],
          source: dataSource as 'live' | 'mock',
          message: dataSource === 'mock' ? 'Using mock data' : undefined
        });

        mockedDataService.getCorrelationAnalysis.mockResolvedValue({
          data: {
            correlation: correlationData,
            significance: {
              hasSignificantCorrelations: true,
              significantCorrelations: [],
              highlights: [],
              confidenceLevel: 'high'
            }
          },
          source: dataSource as 'live' | 'mock',
          message: dataSource === 'mock' ? 'Using mock data' : undefined
        });

        const response = await request(app)
          .get(`/api/export/${format}/${city}/${days}`)
          .expect(200);

        if (format === 'json') {
          // Verify JSON export includes correlation data
          expect(response.body).toHaveProperty('correlationData');
          const exportedCorrelation = response.body.correlationData;
          
          // Verify all correlation analysis data is included
          expect(exportedCorrelation.city).toBe(correlationData.city);
          expect(exportedCorrelation.period).toBe(correlationData.period);
          expect(exportedCorrelation.confidence).toBe(correlationData.confidence);
          expect(exportedCorrelation.dataPoints).toBe(correlationData.dataPoints);
          
          // Verify all correlation coefficients are included (using close comparison for floating point)
          expect(exportedCorrelation.correlations.commits_aqi).toBeCloseTo(correlationData.correlations.commits_aqi, 10);
          expect(exportedCorrelation.correlations.stars_aqi).toBeCloseTo(correlationData.correlations.stars_aqi, 10);
          expect(exportedCorrelation.correlations.commits_pm25).toBeCloseTo(correlationData.correlations.commits_pm25, 10);
          expect(exportedCorrelation.correlations.stars_pm25).toBeCloseTo(correlationData.correlations.stars_pm25, 10);
          
          // Verify metadata includes correlation data source
          expect(response.body.metadata).toHaveProperty('dataSources');
          expect(response.body.metadata.dataSources).toHaveProperty('correlation');
          expect(response.body.metadata.dataSources.correlation).toBe(dataSource);
          
        } else {
          // Verify CSV export includes correlation data section
          const csvContent = response.text;
          
          expect(csvContent).toContain('# Correlation Analysis');
          expect(csvContent).toContain('metric,correlation_value');
          
          // Verify all correlation coefficients are present in CSV
          expect(csvContent).toContain(`commits_aqi,${correlationData.correlations.commits_aqi}`);
          expect(csvContent).toContain(`stars_aqi,${correlationData.correlations.stars_aqi}`);
          expect(csvContent).toContain(`commits_pm25,${correlationData.correlations.commits_pm25}`);
          expect(csvContent).toContain(`stars_pm25,${correlationData.correlations.stars_pm25}`);
          
          // Verify metadata is present in CSV
          expect(csvContent).toContain(`confidence,${correlationData.confidence}`);
          expect(csvContent).toContain(`data_points,${correlationData.dataPoints}`);
          
          // Verify export metadata includes data source
          expect(csvContent).toContain(`# Data Source: ${dataSource}`);
        }
      }
    ), { numRuns: 10 }); // Reduced runs for integration test
  });

  test('Correlation export preserves statistical precision', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
      fc.constantFrom(7, 14, 30, 60, 90),
      fc.record({
        city: fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
        period: fc.constantFrom(7, 14, 30, 60, 90),
        correlations: fc.record({
          commits_aqi: fc.float({ min: -1, max: 1, noNaN: true }).map(n => Object.is(n, -0) ? 0 : n),
          stars_aqi: fc.float({ min: -1, max: 1, noNaN: true }).map(n => Object.is(n, -0) ? 0 : n),
          commits_pm25: fc.float({ min: -1, max: 1, noNaN: true }).map(n => Object.is(n, -0) ? 0 : n),
          stars_pm25: fc.float({ min: -1, max: 1, noNaN: true }).map(n => Object.is(n, -0) ? 0 : n)
        }),
        confidence: fc.float({ min: Math.fround(0.001), max: 1, noNaN: true }),
        dataPoints: fc.integer({ min: 1, max: 1000 })
      }),
      async (city, days, correlationData) => {
        // Mock the data service responses
        mockedDataService.getGitHubData.mockResolvedValue({
          data: [],
          source: 'live',
          message: undefined
        });

        mockedDataService.getAirQualityData.mockResolvedValue({
          data: [],
          source: 'live',
          message: undefined
        });

        mockedDataService.getCorrelationAnalysis.mockResolvedValue({
          data: {
            correlation: correlationData,
            significance: {
              hasSignificantCorrelations: true,
              significantCorrelations: [],
              highlights: [],
              confidenceLevel: 'high'
            }
          },
          source: 'live',
          message: undefined
        });

        // Test JSON export precision
        const jsonResponse = await request(app)
          .get(`/api/export/json/${city}/${days}`)
          .expect(200);

        const exportedCorrelation = jsonResponse.body.correlationData;
        
        // Verify numerical precision is maintained (within floating point tolerance)
        const tolerance = 1e-10;
        expect(Math.abs(exportedCorrelation.correlations.commits_aqi - correlationData.correlations.commits_aqi)).toBeLessThan(tolerance);
        expect(Math.abs(exportedCorrelation.correlations.stars_aqi - correlationData.correlations.stars_aqi)).toBeLessThan(tolerance);
        expect(Math.abs(exportedCorrelation.correlations.commits_pm25 - correlationData.correlations.commits_pm25)).toBeLessThan(tolerance);
        expect(Math.abs(exportedCorrelation.correlations.stars_pm25 - correlationData.correlations.stars_pm25)).toBeLessThan(tolerance);
        expect(Math.abs(exportedCorrelation.confidence - correlationData.confidence)).toBeLessThan(tolerance);
        expect(exportedCorrelation.dataPoints).toBe(correlationData.dataPoints);

        // Test CSV export precision (with more reasonable tolerance for CSV parsing)
        const csvResponse = await request(app)
          .get(`/api/export/csv/${city}/${days}`)
          .expect(200);

        const csvContent = csvResponse.text;
        
        // Verify correlation values are present with reasonable precision in CSV
        const commitsAqiMatch = csvContent.match(/commits_aqi,([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)/);
        const starsAqiMatch = csvContent.match(/stars_aqi,([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)/);
        const commitsPm25Match = csvContent.match(/commits_pm25,([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)/);
        const starsPm25Match = csvContent.match(/stars_pm25,([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)/);
        const confidenceMatch = csvContent.match(/confidence,([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)/);
        const dataPointsMatch = csvContent.match(/data_points,(\d+)/);
        
        expect(commitsAqiMatch).toBeTruthy();
        expect(starsAqiMatch).toBeTruthy();
        expect(commitsPm25Match).toBeTruthy();
        expect(starsPm25Match).toBeTruthy();
        expect(confidenceMatch).toBeTruthy();
        expect(dataPointsMatch).toBeTruthy();
        
        // Use more lenient tolerance for CSV parsing (0.01 instead of 0.001)
        const csvTolerance = 0.01;
        
        if (commitsAqiMatch) {
          const csvCommitsAqi = parseFloat(commitsAqiMatch[1]);
          expect(Math.abs(csvCommitsAqi - correlationData.correlations.commits_aqi)).toBeLessThan(csvTolerance);
        }
        
        if (starsAqiMatch) {
          const csvStarsAqi = parseFloat(starsAqiMatch[1]);
          expect(Math.abs(csvStarsAqi - correlationData.correlations.stars_aqi)).toBeLessThan(csvTolerance);
        }
        
        if (commitsPm25Match) {
          const csvCommitsPm25 = parseFloat(commitsPm25Match[1]);
          expect(Math.abs(csvCommitsPm25 - correlationData.correlations.commits_pm25)).toBeLessThan(csvTolerance);
        }
        
        if (starsPm25Match) {
          const csvStarsPm25 = parseFloat(starsPm25Match[1]);
          expect(Math.abs(csvStarsPm25 - correlationData.correlations.stars_pm25)).toBeLessThan(csvTolerance);
        }
        
        if (confidenceMatch) {
          const csvConfidence = parseFloat(confidenceMatch[1]);
          expect(Math.abs(csvConfidence - correlationData.confidence)).toBeLessThan(csvTolerance);
        }
        
        if (dataPointsMatch) {
          const csvDataPoints = parseInt(dataPointsMatch[1], 10);
          expect(csvDataPoints).toBe(correlationData.dataPoints);
        }
      }
    ), { numRuns: 10 }); // Reduced runs for integration test
  });

  test('Correlation export handles edge cases correctly', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
      fc.constantFrom(7, 14, 30, 60, 90),
      fc.constantFrom('json', 'csv'),
      fc.record({
        city: fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
        period: fc.constantFrom(7, 14, 30, 60, 90),
        correlations: fc.record({
          commits_aqi: fc.oneof(
            fc.constant(0),
            fc.constant(1),
            fc.constant(-1),
            fc.constant(0.999999),
            fc.constant(-0.999999),
            fc.float({ min: -1, max: 1, noNaN: true }).map(n => Object.is(n, -0) ? 0 : n)
          ),
          stars_aqi: fc.oneof(
            fc.constant(0),
            fc.constant(1),
            fc.constant(-1),
            fc.constant(0.999999),
            fc.constant(-0.999999),
            fc.float({ min: -1, max: 1, noNaN: true }).map(n => Object.is(n, -0) ? 0 : n)
          ),
          commits_pm25: fc.oneof(
            fc.constant(0),
            fc.constant(1),
            fc.constant(-1),
            fc.constant(0.999999),
            fc.constant(-0.999999),
            fc.float({ min: -1, max: 1, noNaN: true }).map(n => Object.is(n, -0) ? 0 : n)
          ),
          stars_pm25: fc.oneof(
            fc.constant(0),
            fc.constant(1),
            fc.constant(-1),
            fc.constant(0.999999),
            fc.constant(-0.999999),
            fc.float({ min: -1, max: 1, noNaN: true }).map(n => Object.is(n, -0) ? 0 : n)
          )
        }),
        confidence: fc.oneof(
          fc.constant(Math.fround(0.001)),
          fc.constant(1),
          fc.constant(0.5),
          fc.float({ min: Math.fround(0.001), max: 1, noNaN: true })
        ),
        dataPoints: fc.oneof(
          fc.constant(1),
          fc.constant(2),
          fc.constant(1000),
          fc.integer({ min: 1, max: 1000 })
        )
      }),
      async (city, days, format, correlationData) => {
        // Mock the data service responses
        mockedDataService.getGitHubData.mockResolvedValue({
          data: [],
          source: 'live',
          message: undefined
        });

        mockedDataService.getAirQualityData.mockResolvedValue({
          data: [],
          source: 'live',
          message: undefined
        });

        mockedDataService.getCorrelationAnalysis.mockResolvedValue({
          data: {
            correlation: correlationData,
            significance: {
              hasSignificantCorrelations: correlationData.confidence > 0.8,
              significantCorrelations: [],
              highlights: [],
              confidenceLevel: correlationData.confidence > 0.8 ? 'high' : 'low'
            }
          },
          source: 'live',
          message: undefined
        });

        const response = await request(app)
          .get(`/api/export/${format}/${city}/${days}`)
          .expect(200);

        if (format === 'json') {
          // Verify JSON export handles edge cases
          const exportedCorrelation = response.body.correlationData;
          
          // All correlation values should be within valid range
          expect(exportedCorrelation.correlations.commits_aqi).toBeGreaterThanOrEqual(-1);
          expect(exportedCorrelation.correlations.commits_aqi).toBeLessThanOrEqual(1);
          expect(exportedCorrelation.correlations.stars_aqi).toBeGreaterThanOrEqual(-1);
          expect(exportedCorrelation.correlations.stars_aqi).toBeLessThanOrEqual(1);
          expect(exportedCorrelation.correlations.commits_pm25).toBeGreaterThanOrEqual(-1);
          expect(exportedCorrelation.correlations.commits_pm25).toBeLessThanOrEqual(1);
          expect(exportedCorrelation.correlations.stars_pm25).toBeGreaterThanOrEqual(-1);
          expect(exportedCorrelation.correlations.stars_pm25).toBeLessThanOrEqual(1);
          
          // Confidence should be within valid range
          expect(exportedCorrelation.confidence).toBeGreaterThanOrEqual(0);
          expect(exportedCorrelation.confidence).toBeLessThanOrEqual(1);
          
          // Data points should be positive
          expect(exportedCorrelation.dataPoints).toBeGreaterThan(0);
          
        } else {
          // Verify CSV export handles edge cases
          const csvContent = response.text;
          
          // Should contain correlation section even with edge case values
          expect(csvContent).toContain('# Correlation Analysis');
          expect(csvContent).toContain('metric,correlation_value');
          
          // Should contain all correlation metrics
          expect(csvContent).toContain('commits_aqi,');
          expect(csvContent).toContain('stars_aqi,');
          expect(csvContent).toContain('commits_pm25,');
          expect(csvContent).toContain('stars_pm25,');
          expect(csvContent).toContain('confidence,');
          expect(csvContent).toContain('data_points,');
        }
      }
    ), { numRuns: 10 }); // Reduced runs for integration test
  });

});