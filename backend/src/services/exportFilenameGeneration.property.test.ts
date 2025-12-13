/**
 * Property-based tests for export filename generation
 * **Feature: github-air-quality-dashboard, Property 11: Export filename generation**
 * **Validates: Requirements 5.5**
 */

import * as fc from 'fast-check';
import request from 'supertest';
import app from '../server';
import { dataService } from './dataService';
import { generateExportFilename } from '../utils/export';

// Mock the dataService to provide controlled test data
jest.mock('./dataService');
const mockedDataService = dataService as jest.Mocked<typeof dataService>;

describe('Export Filename Generation Properties', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock minimal data service responses for endpoint testing
    mockedDataService.getGitHubData.mockResolvedValue({
      data: [],
      source: 'mock',
      message: 'Mock data'
    });

    mockedDataService.getAirQualityData.mockResolvedValue({
      data: [],
      source: 'mock',
      message: 'Mock data'
    });

    mockedDataService.getCorrelationAnalysis.mockResolvedValue({
      data: {
        correlation: {
          city: 'test',
          period: 7,
          correlations: { commits_aqi: 0, stars_aqi: 0, commits_pm25: 0, stars_pm25: 0 },
          confidence: 0,
          dataPoints: 0
        },
        significance: {
          hasSignificantCorrelations: false,
          significantCorrelations: [],
          highlights: [],
          confidenceLevel: 'low'
        }
      },
      source: 'mock',
      message: 'Mock data'
    });
  });

  test('Export filename follows correct naming convention format', () => {
    fc.assert(fc.property(
      fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
      fc.constantFrom(7, 14, 30, 60, 90),
      fc.constantFrom('json', 'csv'),
      fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()), { nil: undefined }),
      (city, period, format, timestamp) => {
        const filename = generateExportFilename(city, period, format as 'json' | 'csv', timestamp);
        
        // Verify filename starts with expected prefix
        expect(filename).toMatch(/^github-air-quality-/);
        
        // Verify filename contains city (sanitized)
        const sanitizedCity = city.replace(/[/\\:*?"<>|]/g, '-').trim();
        expect(filename).toContain(sanitizedCity);
        
        // Verify filename contains period
        expect(filename).toContain(`${period}days`);
        
        // Verify filename ends with correct extension
        expect(filename).toMatch(new RegExp(`\\.${format}$`));
        
        // Verify filename contains date component
        expect(filename).toMatch(/\d{4}-\d{2}-\d{2}/);
        
        // Verify filename doesn't contain invalid characters
        expect(filename).not.toMatch(/[/\\:*?"<>|]/);
        
        // Verify filename has reasonable length
        expect(filename.length).toBeGreaterThan(20);
        expect(filename.length).toBeLessThan(200);
        
        // Verify complete format: github-air-quality-{city}-{period}days-{date}.{format}
        const expectedPattern = new RegExp(`^github-air-quality-${sanitizedCity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-${period}days-\\d{4}-\\d{2}-\\d{2}\\.${format}$`);
        expect(filename).toMatch(expectedPattern);
      }
    ), { numRuns: 100 });
  });

  test('Export endpoint returns correct filename in Content-Disposition header', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
      fc.constantFrom(7, 14, 30, 60, 90),
      fc.constantFrom('json', 'csv'),
      async (city, days, format) => {
        const response = await request(app)
          .get(`/api/export/${format}/${city}/${days}`)
          .expect(200);

        // Verify Content-Disposition header is present
        expect(response.headers['content-disposition']).toBeDefined();
        
        const contentDisposition = response.headers['content-disposition'];
        expect(contentDisposition).toMatch(/^attachment; filename="/);
        
        // Extract filename from header
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        expect(filenameMatch).toBeTruthy();
        
        const filename = filenameMatch![1];
        
        // Verify filename follows correct format
        expect(filename).toMatch(/^github-air-quality-/);
        expect(filename).toContain(city);
        expect(filename).toContain(`${days}days`);
        expect(filename).toMatch(new RegExp(`\\.${format}$`));
        expect(filename).toMatch(/\d{4}-\d{2}-\d{2}/);
        
        // Verify filename doesn't contain invalid characters
        expect(filename).not.toMatch(/[/\\:*?"<>|]/);
      }
    ), { numRuns: 20 }); // Reduced runs for integration test
  });

  test('Filename generation handles city name sanitization correctly', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
      fc.constantFrom(7, 14, 30, 60, 90),
      fc.constantFrom('json', 'csv'),
      (rawCityName, period, format) => {
        const filename = generateExportFilename(rawCityName, period, format as 'json' | 'csv');
        
        // Verify filename doesn't contain any invalid filesystem characters
        expect(filename).not.toMatch(/[/\\:*?"<>|]/);
        
        // Verify sanitized city name is present in filename
        const sanitizedCity = rawCityName.replace(/[/\\:*?"<>|]/g, '-').trim();
        if (sanitizedCity.length > 0) {
          expect(filename).toContain(sanitizedCity);
        }
        
        // Verify filename still follows the expected pattern
        expect(filename).toMatch(/^github-air-quality-.*-\d+days-\d{4}-\d{2}-\d{2}\.(json|csv)$/);
      }
    ), { numRuns: 100 });
  });

  test('Filename generation produces unique names for different parameters', () => {
    fc.assert(fc.property(
      fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
      fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
      fc.constantFrom(7, 14, 30, 60, 90),
      fc.constantFrom(7, 14, 30, 60, 90),
      fc.constantFrom('json', 'csv'),
      fc.constantFrom('json', 'csv'),
      (city1, city2, period1, period2, format1, format2) => {
        // Only test when parameters are actually different
        fc.pre(city1 !== city2 || period1 !== period2 || format1 !== format2);
        
        const filename1 = generateExportFilename(city1, period1, format1 as 'json' | 'csv');
        const filename2 = generateExportFilename(city2, period2, format2 as 'json' | 'csv');
        
        // Filenames should be different when parameters are different
        expect(filename1).not.toBe(filename2);
      }
    ), { numRuns: 100 });
  });

  test('Filename generation with custom timestamp produces consistent results', () => {
    fc.assert(fc.property(
      fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
      fc.constantFrom(7, 14, 30, 60, 90),
      fc.constantFrom('json', 'csv'),
      fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
      (city, period, format, timestamp) => {
        const filename1 = generateExportFilename(city, period, format as 'json' | 'csv', timestamp);
        const filename2 = generateExportFilename(city, period, format as 'json' | 'csv', timestamp);
        
        // Same parameters should produce identical filenames
        expect(filename1).toBe(filename2);
        
        // Verify timestamp is properly incorporated
        const expectedDatePart = timestamp.replace(/[:.]/g, '-').split('T')[0];
        expect(filename1).toContain(expectedDatePart);
      }
    ), { numRuns: 100 });
  });

  test('Filename generation handles edge cases gracefully', () => {
    fc.assert(fc.property(
      fc.oneof(
        fc.constant(''),
        fc.constant('   '),
        fc.string({ minLength: 1, maxLength: 3 }),
        fc.string({ minLength: 100, maxLength: 200 })
      ),
      fc.constantFrom(1, 365, 1000),
      fc.constantFrom('json', 'csv'),
      (edgeCaseCity, edgeCasePeriod, format) => {
        // Should not throw an error
        expect(() => {
          const filename = generateExportFilename(edgeCaseCity, edgeCasePeriod, format as 'json' | 'csv');
          
          // Verify basic structure is maintained even with edge cases
          expect(filename).toMatch(/^github-air-quality-.*\.(json|csv)$/);
          expect(filename).toContain(`${edgeCasePeriod}days`);
          
          // Verify no invalid characters
          expect(filename).not.toMatch(/[/\\:*?"<>|]/);
          
        }).not.toThrow();
      }
    ), { numRuns: 50 });
  });

});