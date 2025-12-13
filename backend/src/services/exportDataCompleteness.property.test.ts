/**
 * Property-based tests for export data completeness and integrity
 * **Feature: github-air-quality-dashboard, Property 10: Export data completeness and integrity**
 * **Validates: Requirements 5.2, 5.3**
 */

import * as fc from 'fast-check';
import request from 'supertest';
import app from '../server';
import { dataService } from './dataService';
import { GitHubActivity, AirQualityData } from '../types';

// Mock the dataService to provide controlled test data
jest.mock('./dataService');
const mockedDataService = dataService as jest.Mocked<typeof dataService>;

// Generators for test data
const githubActivityArbitrary = fc.record({
  date: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString().split('T')[0]),
  city: fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
  commits: fc.integer({ min: 0, max: 10000 }),
  stars: fc.integer({ min: 0, max: 100000 }),
  repositories: fc.integer({ min: 0, max: 1000 }),
  contributors: fc.integer({ min: 0, max: 10000 })
});

const coordinatesArbitrary = fc.record({
  lat: fc.float({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
  lng: fc.float({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true })
});

const airQualityDataArbitrary = fc.record({
  date: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString().split('T')[0]),
  city: fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
  aqi: fc.integer({ min: 0, max: 500 }),
  pm25: fc.float({ min: 0, max: 1000, noNaN: true }),
  station: fc.string({ minLength: 1, maxLength: 100 }),
  coordinates: coordinatesArbitrary
});

const correlationResultArbitrary = fc.record({
  city: fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
  period: fc.integer({ min: 7, max: 90 }),
  correlations: fc.record({
    commits_aqi: fc.float({ min: -1, max: 1, noNaN: true }),
    stars_aqi: fc.float({ min: -1, max: 1, noNaN: true }),
    commits_pm25: fc.float({ min: -1, max: 1, noNaN: true }),
    stars_pm25: fc.float({ min: -1, max: 1, noNaN: true })
  }),
  confidence: fc.float({ min: 0, max: 1, noNaN: true }),
  dataPoints: fc.integer({ min: 1, max: 10000 })
});

describe('Export Data Completeness Properties', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('JSON export includes all currently displayed data with metadata', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
      fc.constantFrom(7, 14, 30, 60, 90),
      fc.array(githubActivityArbitrary, { minLength: 1, maxLength: 10 }),
      fc.array(airQualityDataArbitrary, { minLength: 1, maxLength: 10 }),
      correlationResultArbitrary,
      fc.constantFrom('live', 'mock'),
      async (city, days, githubData, airQualityData, correlationData, dataSource) => {
        // Mock the data service responses
        mockedDataService.getGitHubData.mockResolvedValue({
          data: githubData,
          source: dataSource as 'live' | 'mock',
          message: dataSource === 'mock' ? 'Using mock data' : undefined
        });

        mockedDataService.getAirQualityData.mockResolvedValue({
          data: airQualityData,
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
          .get(`/api/export/json/${city}/${days}`)
          .expect(200);

        // Verify response has correct structure
        expect(response.body).toHaveProperty('metadata');
        expect(response.body).toHaveProperty('githubData');
        expect(response.body).toHaveProperty('airQualityData');
        expect(response.body).toHaveProperty('correlationData');

        // Verify metadata completeness
        const metadata = response.body.metadata;
        expect(metadata.city).toBe(city);
        expect(metadata.period).toBe(days);
        expect(metadata.exportFormat).toBe('json');
        expect(metadata.dataSource).toBe(dataSource);
        expect(metadata.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

        // Verify all GitHub data is included
        expect(response.body.githubData).toHaveLength(githubData.length);
        response.body.githubData.forEach((item: GitHubActivity, index: number) => {
          const original = githubData[index];
          expect(item.date).toBe(original.date);
          expect(item.city).toBe(original.city);
          expect(item.commits).toBe(original.commits);
          expect(item.stars).toBe(original.stars);
          expect(item.repositories).toBe(original.repositories);
          expect(item.contributors).toBe(original.contributors);
        });

        // Verify all air quality data is included
        expect(response.body.airQualityData).toHaveLength(airQualityData.length);
        response.body.airQualityData.forEach((item: AirQualityData, index: number) => {
          const original = airQualityData[index];
          expect(item.date).toBe(original.date);
          expect(item.city).toBe(original.city);
          expect(item.aqi).toBe(original.aqi);
          expect(item.pm25).toBe(original.pm25);
          expect(item.station).toBe(original.station);
          expect(item.coordinates.lat).toBeCloseTo(original.coordinates.lat, 10);
          expect(item.coordinates.lng).toBeCloseTo(original.coordinates.lng, 10);
        });

        // Verify correlation data is included
        const exportedCorrelation = response.body.correlationData;
        expect(exportedCorrelation.city).toBe(correlationData.city);
        expect(exportedCorrelation.period).toBe(correlationData.period);
        expect(exportedCorrelation.confidence).toBe(correlationData.confidence);
        expect(exportedCorrelation.dataPoints).toBe(correlationData.dataPoints);
        expect(exportedCorrelation.correlations.commits_aqi).toBe(correlationData.correlations.commits_aqi);
        expect(exportedCorrelation.correlations.stars_aqi).toBe(correlationData.correlations.stars_aqi);
        expect(exportedCorrelation.correlations.commits_pm25).toBe(correlationData.correlations.commits_pm25);
        expect(exportedCorrelation.correlations.stars_pm25).toBe(correlationData.correlations.stars_pm25);
      }
    ), { numRuns: 5 }); // Reduced runs for integration test
  });

  test('CSV export includes all currently displayed data with metadata', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
      fc.constantFrom(7, 14, 30, 60, 90),
      fc.array(githubActivityArbitrary, { minLength: 1, maxLength: 5 }),
      fc.array(airQualityDataArbitrary, { minLength: 1, maxLength: 5 }),
      correlationResultArbitrary,
      fc.constantFrom('live', 'mock'),
      async (city, days, githubData, airQualityData, correlationData, dataSource) => {
        // Mock the data service responses
        mockedDataService.getGitHubData.mockResolvedValue({
          data: githubData,
          source: dataSource as 'live' | 'mock',
          message: dataSource === 'mock' ? 'Using mock data' : undefined
        });

        mockedDataService.getAirQualityData.mockResolvedValue({
          data: airQualityData,
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
          .get(`/api/export/csv/${city}/${days}`)
          .expect(200);

        const csvContent = response.text;

        // Verify metadata is present
        expect(csvContent).toContain('# Export Metadata');
        expect(csvContent).toContain(`# City: ${city}`);
        expect(csvContent).toContain(`# Period: ${days} days`);
        expect(csvContent).toContain(`# Data Source: ${dataSource}`);
        expect(csvContent).toMatch(/# Generated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);

        // Verify GitHub data section is present
        expect(csvContent).toContain('# GitHub Activity Data');
        expect(csvContent).toContain('date,city,commits,stars,repositories,contributors');
        
        // Verify all GitHub data rows are present
        githubData.forEach(item => {
          const expectedRow = `${item.date},${item.city},${item.commits},${item.stars},${item.repositories},${item.contributors}`;
          expect(csvContent).toContain(expectedRow);
        });

        // Verify air quality data section is present
        expect(csvContent).toContain('# Air Quality Data');
        expect(csvContent).toContain('date,city,aqi,pm25,station,lat,lng');
        
        // Verify all air quality data rows are present
        airQualityData.forEach(item => {
          const expectedRow = `${item.date},${item.city},${item.aqi},${item.pm25},${item.station},${item.coordinates.lat},${item.coordinates.lng}`;
          expect(csvContent).toContain(expectedRow);
        });

        // Verify correlation data section is present
        expect(csvContent).toContain('# Correlation Analysis');
        expect(csvContent).toContain('metric,correlation_value');
        expect(csvContent).toContain(`commits_aqi,${correlationData.correlations.commits_aqi}`);
        expect(csvContent).toContain(`stars_aqi,${correlationData.correlations.stars_aqi}`);
        expect(csvContent).toContain(`commits_pm25,${correlationData.correlations.commits_pm25}`);
        expect(csvContent).toContain(`stars_pm25,${correlationData.correlations.stars_pm25}`);
        expect(csvContent).toContain(`confidence,${correlationData.confidence}`);
        expect(csvContent).toContain(`data_points,${correlationData.dataPoints}`);
      }
    ), { numRuns: 5 }); // Reduced runs for integration test
  });

  test('Export preserves data integrity across different data sources', async () => {
    await fc.assert(fc.asyncProperty(
      fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
      fc.constantFrom(7, 14, 30, 60, 90),
      fc.constantFrom('json', 'csv'),
      fc.array(githubActivityArbitrary, { minLength: 1, maxLength: 3 }),
      fc.array(airQualityDataArbitrary, { minLength: 1, maxLength: 3 }),
      correlationResultArbitrary,
      fc.record({
        github: fc.constantFrom('live', 'mock'),
        airQuality: fc.constantFrom('live', 'mock'),
        correlation: fc.constantFrom('live', 'mock')
      }),
      async (city, days, format, githubData, airQualityData, correlationData, dataSources) => {
        // Mock the data service responses with different sources
        mockedDataService.getGitHubData.mockResolvedValue({
          data: githubData,
          source: dataSources.github as 'live' | 'mock',
          message: dataSources.github === 'mock' ? 'Using mock data' : undefined
        });

        mockedDataService.getAirQualityData.mockResolvedValue({
          data: airQualityData,
          source: dataSources.airQuality as 'live' | 'mock',
          message: dataSources.airQuality === 'mock' ? 'Using mock data' : undefined
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
          source: dataSources.correlation as 'live' | 'mock',
          message: dataSources.correlation === 'mock' ? 'Using mock data' : undefined
        });

        const response = await request(app)
          .get(`/api/export/${format}/${city}/${days}`)
          .expect(200);

        // Determine expected overall data source
        // If any data source is 'mock', the overall source should be 'mock'
        const expectedDataSource = (dataSources.github === 'mock' || dataSources.airQuality === 'mock' || dataSources.correlation === 'mock') 
          ? 'mock' 
          : 'live';

        if (format === 'json') {
          // Verify JSON response maintains data integrity
          expect(response.body.metadata.dataSource).toBe(expectedDataSource);
          expect(response.body.metadata.dataSources).toEqual({
            github: dataSources.github,
            airQuality: dataSources.airQuality,
            correlation: dataSources.correlation
          });
          
          // Verify data arrays maintain original structure and values
          expect(response.body.githubData).toHaveLength(githubData.length);
          expect(response.body.airQualityData).toHaveLength(airQualityData.length);
          expect(response.body.correlationData).toBeDefined();
        } else {
          // Verify CSV response maintains data integrity
          const csvContent = response.text;
          expect(csvContent).toContain(`# Data Source: ${expectedDataSource}`);
          
          // Verify all data sections are present
          expect(csvContent).toContain('# GitHub Activity Data');
          expect(csvContent).toContain('# Air Quality Data');
          expect(csvContent).toContain('# Correlation Analysis');
        }
      }
    ), { numRuns: 3 }); // Reduced runs for integration test
  });

});