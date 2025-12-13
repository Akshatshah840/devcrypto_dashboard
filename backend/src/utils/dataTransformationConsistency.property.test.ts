/**
 * Property-based tests for data transformation consistency
 * **Feature: github-air-quality-dashboard, Property 15: Data transformation consistency**
 * **Validates: Requirements 7.4, 8.3, 8.5**
 */

import * as fc from 'fast-check';
import { 
  GitHubActivity, 
  AirQualityData, 
  CorrelationResult,
  GitHubAPIResponse,
  WAQIAPIResponse,
  ExportData,
  ExportFormat
} from '../types';
import {
  serializeGitHubActivity,
  parseGitHubActivity,
  serializeAirQualityData,
  parseAirQualityData,
  parseGitHubAPIResponse,
  parseWAQIAPIResponse
} from './serialization';
import {
  createExportData,
  serializeExportDataToJSON,
  parseExportDataFromJSON,
  serializeExportDataToCSV,
  parseExportDataFromCSV
} from './export';

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

const githubAPIResponseArbitrary = fc.record({
  total_count: fc.integer({ min: 0, max: 1000000 }),
  incomplete_results: fc.boolean(),
  items: fc.array(fc.record({
    id: fc.integer({ min: 1, max: 999999999 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    full_name: fc.string({ minLength: 1, maxLength: 200 }),
    stargazers_count: fc.integer({ min: 0, max: 100000 }),
    created_at: fc.date({ min: new Date('2008-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
    updated_at: fc.date({ min: new Date('2008-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
    pushed_at: fc.date({ min: new Date('2008-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
    language: fc.oneof(fc.constant('JavaScript'), fc.constant('TypeScript'), fc.constant('Python'), fc.constant('Java'), fc.constant('Go')),
    owner: fc.record({
      login: fc.string({ minLength: 1, maxLength: 50 }),
      type: fc.oneof(fc.constant('User'), fc.constant('Organization'))
    })
  }), { minLength: 0, maxLength: 100 })
});

const waqiAPIResponseArbitrary = fc.record({
  status: fc.constant('ok'),
  data: fc.record({
    aqi: fc.integer({ min: 0, max: 500 }),
    idx: fc.integer({ min: 1, max: 999999 }),
    attributions: fc.array(fc.record({
      url: fc.webUrl(),
      name: fc.string({ minLength: 1, maxLength: 100 })
    }), { minLength: 0, maxLength: 5 }),
    city: fc.record({
      geo: fc.tuple(
        fc.float({ min: -90, max: 90, noNaN: true }),
        fc.float({ min: -180, max: 180, noNaN: true })
      ),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      url: fc.webUrl()
    }),
    dominentpol: fc.oneof(fc.constant('pm25'), fc.constant('pm10'), fc.constant('o3'), fc.constant('no2')),
    iaqi: fc.record({
      pm25: fc.option(fc.record({ v: fc.float({ min: 0, max: 1000, noNaN: true }) }), { nil: undefined }),
      pm10: fc.option(fc.record({ v: fc.float({ min: 0, max: 1000, noNaN: true }) }), { nil: undefined }),
      o3: fc.option(fc.record({ v: fc.float({ min: 0, max: 500, noNaN: true }) }), { nil: undefined }),
      no2: fc.option(fc.record({ v: fc.float({ min: 0, max: 500, noNaN: true }) }), { nil: undefined }),
      so2: fc.option(fc.record({ v: fc.float({ min: 0, max: 500, noNaN: true }) }), { nil: undefined }),
      co: fc.option(fc.record({ v: fc.float({ min: 0, max: 50, noNaN: true }) }), { nil: undefined })
    }),
    time: fc.record({
      s: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
      tz: fc.string({ minLength: 1, maxLength: 50 }),
      v: fc.integer({ min: 1577836800, max: 1735689600 }) // Unix timestamps for 2020-2025
    })
  })
});

describe('Data Transformation Consistency Properties', () => {
  
  test('Internal data format transformations preserve accuracy', () => {
    fc.assert(fc.property(
      githubActivityArbitrary,
      airQualityDataArbitrary,
      correlationResultArbitrary,
      (githubData: GitHubActivity, airQualityData: AirQualityData, correlationData: CorrelationResult) => {
        // Test GitHub data transformation consistency
        const githubSerialized = serializeGitHubActivity(githubData);
        const githubParsed = parseGitHubActivity(githubSerialized);
        
        expect(githubParsed.date).toBe(githubData.date);
        expect(githubParsed.city).toBe(githubData.city);
        expect(githubParsed.commits).toBe(githubData.commits);
        expect(githubParsed.stars).toBe(githubData.stars);
        expect(githubParsed.repositories).toBe(githubData.repositories);
        expect(githubParsed.contributors).toBe(githubData.contributors);
        
        // Test air quality data transformation consistency
        const airQualitySerialized = serializeAirQualityData(airQualityData);
        const airQualityParsed = parseAirQualityData(airQualitySerialized);
        
        expect(airQualityParsed.date).toBe(airQualityData.date);
        expect(airQualityParsed.city).toBe(airQualityData.city);
        expect(airQualityParsed.aqi).toBe(airQualityData.aqi);
        expect(airQualityParsed.pm25).toBe(airQualityData.pm25);
        expect(airQualityParsed.station).toBe(airQualityData.station);
        // Handle -0 vs 0 edge case in JSON serialization
        expect(airQualityParsed.coordinates.lat === 0 ? 0 : airQualityParsed.coordinates.lat)
          .toBe(airQualityData.coordinates.lat === 0 ? 0 : airQualityData.coordinates.lat);
        expect(airQualityParsed.coordinates.lng === 0 ? 0 : airQualityParsed.coordinates.lng)
          .toBe(airQualityData.coordinates.lng === 0 ? 0 : airQualityData.coordinates.lng);
      }
    ), { numRuns: 100 });
  });

  test('External API response transformations maintain data structure consistency', () => {
    fc.assert(fc.property(
      githubAPIResponseArbitrary,
      fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
      fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
      (apiResponse: GitHubAPIResponse, city: string, date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        const transformed = parseGitHubAPIResponse(apiResponse, city, dateString);
        
        // Verify transformation maintains consistent structure
        expect(transformed.date).toBe(dateString);
        expect(transformed.city).toBe(city);
        expect(typeof transformed.commits).toBe('number');
        expect(typeof transformed.stars).toBe('number');
        expect(typeof transformed.repositories).toBe('number');
        expect(typeof transformed.contributors).toBe('number');
        
        // Verify data integrity constraints
        expect(transformed.commits).toBeGreaterThanOrEqual(0);
        expect(transformed.stars).toBeGreaterThanOrEqual(0);
        expect(transformed.repositories).toBe(apiResponse.items.length);
        expect(transformed.contributors).toBeGreaterThanOrEqual(0);
        
        // Verify all values are integers (no precision loss)
        expect(Number.isInteger(transformed.commits)).toBe(true);
        expect(Number.isInteger(transformed.stars)).toBe(true);
        expect(Number.isInteger(transformed.repositories)).toBe(true);
        expect(Number.isInteger(transformed.contributors)).toBe(true);
      }
    ), { numRuns: 100 });
  });

  test('WAQI API response transformations maintain data structure consistency', () => {
    fc.assert(fc.property(
      waqiAPIResponseArbitrary,
      fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
      (apiResponse: WAQIAPIResponse, city: string) => {
        const transformed = parseWAQIAPIResponse(apiResponse, city);
        
        // Verify transformation maintains consistent structure
        expect(transformed.city).toBe(city);
        expect(typeof transformed.aqi).toBe('number');
        expect(typeof transformed.pm25).toBe('number');
        expect(typeof transformed.station).toBe('string');
        expect(typeof transformed.coordinates.lat).toBe('number');
        expect(typeof transformed.coordinates.lng).toBe('number');
        
        // Verify data integrity constraints
        expect(transformed.aqi).toBe(apiResponse.data.aqi);
        expect(transformed.aqi).toBeGreaterThanOrEqual(0);
        expect(transformed.aqi).toBeLessThanOrEqual(500);
        expect(transformed.pm25).toBeGreaterThanOrEqual(0);
        expect(transformed.station).toBe(apiResponse.data.city.name);
        expect(transformed.coordinates.lat).toBe(apiResponse.data.city.geo[0]);
        expect(transformed.coordinates.lng).toBe(apiResponse.data.city.geo[1]);
        
        // Verify coordinate bounds
        expect(transformed.coordinates.lat).toBeGreaterThanOrEqual(-90);
        expect(transformed.coordinates.lat).toBeLessThanOrEqual(90);
        expect(transformed.coordinates.lng).toBeGreaterThanOrEqual(-180);
        expect(transformed.coordinates.lng).toBeLessThanOrEqual(180);
        
        // Verify date is valid ISO string
        const parsedDate = new Date(transformed.date);
        expect(parsedDate.toISOString()).toBe(transformed.date);
      }
    ), { numRuns: 100 });
  });

  test('Export data transformations preserve structure across formats', () => {
    fc.assert(fc.property(
      fc.constantFrom('san-francisco', 'london', 'bangalore', 'tokyo', 'seattle'),
      fc.integer({ min: 7, max: 90 }),
      fc.oneof(fc.constant('json' as ExportFormat), fc.constant('csv' as ExportFormat)),
      fc.array(githubActivityArbitrary, { minLength: 0, maxLength: 5 }),
      fc.array(airQualityDataArbitrary, { minLength: 0, maxLength: 5 }),
      fc.option(correlationResultArbitrary, { nil: undefined }),
      fc.constantFrom('live', 'mock'),
      (city, period, format, githubData, airQualityData, correlationData, dataSource) => {
        // Create export data structure
        const exportData = createExportData(
          city, 
          period, 
          format, 
          githubData, 
          airQualityData, 
          correlationData, 
          dataSource as 'live' | 'mock'
        );
        
        // Verify export data structure consistency
        expect(exportData.metadata.city).toBe(city);
        expect(exportData.metadata.period).toBe(period);
        expect(exportData.metadata.exportFormat).toBe(format);
        expect(exportData.metadata.dataSource).toBe(dataSource);
        expect(exportData.githubData).toEqual(githubData);
        expect(exportData.airQualityData).toEqual(airQualityData);
        expect(exportData.correlationData).toEqual(correlationData);
        
        // Test JSON transformation consistency
        if (format === 'json') {
          const jsonSerialized = serializeExportDataToJSON(exportData);
          const jsonParsed = parseExportDataFromJSON(jsonSerialized);
          
          // Verify metadata consistency
          expect(jsonParsed.metadata.city).toBe(exportData.metadata.city);
          expect(jsonParsed.metadata.period).toBe(exportData.metadata.period);
          expect(jsonParsed.metadata.exportFormat).toBe(exportData.metadata.exportFormat);
          expect(jsonParsed.metadata.dataSource).toBe(exportData.metadata.dataSource);
          
          // Verify data array lengths are preserved
          expect(jsonParsed.githubData.length).toBe(exportData.githubData.length);
          expect(jsonParsed.airQualityData.length).toBe(exportData.airQualityData.length);
          
          // Verify correlation data consistency
          if (exportData.correlationData) {
            expect(jsonParsed.correlationData).toBeDefined();
            expect(jsonParsed.correlationData!.city).toBe(exportData.correlationData.city);
            expect(jsonParsed.correlationData!.period).toBe(exportData.correlationData.period);
            expect(jsonParsed.correlationData!.dataPoints).toBe(exportData.correlationData.dataPoints);
          } else {
            expect(jsonParsed.correlationData).toBeUndefined();
          }
        }
        
        // Test CSV transformation consistency (metadata only due to simplified parsing)
        if (format === 'csv') {
          const csvSerialized = serializeExportDataToCSV(exportData);
          const csvParsed = parseExportDataFromCSV(csvSerialized);
          
          // Verify metadata is preserved in CSV format
          expect(csvParsed.metadata?.city).toBe(exportData.metadata.city);
          expect(csvParsed.metadata?.period).toBe(exportData.metadata.period);
          expect(csvParsed.metadata?.exportFormat).toBe('csv');
          expect(csvParsed.metadata?.dataSource).toBe(exportData.metadata.dataSource);
          
          // Verify CSV contains expected data sections
          expect(csvSerialized).toContain('# Export Metadata');
          expect(csvSerialized).toContain(`# City: ${city}`);
          expect(csvSerialized).toContain(`# Period: ${period} days`);
          expect(csvSerialized).toContain(`# Data Source: ${dataSource}`);
          
          if (githubData.length > 0) {
            expect(csvSerialized).toContain('# GitHub Activity Data');
            expect(csvSerialized).toContain('date,city,commits,stars,repositories,contributors');
          }
          
          if (airQualityData.length > 0) {
            expect(csvSerialized).toContain('# Air Quality Data');
            expect(csvSerialized).toContain('date,city,aqi,pm25,station,lat,lng');
          }
          
          if (correlationData) {
            expect(csvSerialized).toContain('# Correlation Analysis');
            expect(csvSerialized).toContain('metric,correlation_value');
          }
        }
      }
    ), { numRuns: 100 });
  });

  test('Backend to frontend data communication maintains consistency', () => {
    fc.assert(fc.property(
      fc.array(githubActivityArbitrary, { minLength: 1, maxLength: 10 }),
      fc.array(airQualityDataArbitrary, { minLength: 1, maxLength: 10 }),
      correlationResultArbitrary,
      (githubData: GitHubActivity[], airQualityData: AirQualityData[], correlationData: CorrelationResult) => {
        // Simulate backend API response structure
        const backendResponse = {
          success: true,
          data: {
            githubData,
            airQualityData,
            correlationData
          },
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'live' as const,
            recordCount: githubData.length + airQualityData.length
          }
        };
        
        // Simulate JSON serialization/deserialization that occurs in HTTP communication
        const serialized = JSON.stringify(backendResponse);
        const deserialized = JSON.parse(serialized);
        
        // Verify data structure consistency after HTTP transport
        expect(deserialized.success).toBe(backendResponse.success);
        expect(deserialized.data.githubData.length).toBe(githubData.length);
        expect(deserialized.data.airQualityData.length).toBe(airQualityData.length);
        
        // Verify individual data items maintain structure
        deserialized.data.githubData.forEach((item: GitHubActivity, index: number) => {
          const original = githubData[index];
          expect(item.date).toBe(original.date);
          expect(item.city).toBe(original.city);
          expect(item.commits).toBe(original.commits);
          expect(item.stars).toBe(original.stars);
          expect(item.repositories).toBe(original.repositories);
          expect(item.contributors).toBe(original.contributors);
        });
        
        deserialized.data.airQualityData.forEach((item: AirQualityData, index: number) => {
          const original = airQualityData[index];
          expect(item.date).toBe(original.date);
          expect(item.city).toBe(original.city);
          expect(item.aqi).toBe(original.aqi);
          expect(item.pm25).toBe(original.pm25);
          expect(item.station).toBe(original.station);
          // Handle -0 vs 0 edge case in JSON serialization
          expect(item.coordinates.lat === 0 ? 0 : item.coordinates.lat).toBe(original.coordinates.lat === 0 ? 0 : original.coordinates.lat);
          expect(item.coordinates.lng === 0 ? 0 : item.coordinates.lng).toBe(original.coordinates.lng === 0 ? 0 : original.coordinates.lng);
        });
        
        // Verify correlation data consistency (handle -0 vs 0 edge case)
        const deserializedCorr = deserialized.data.correlationData;
        expect(deserializedCorr.city).toBe(correlationData.city);
        expect(deserializedCorr.period).toBe(correlationData.period);
        expect(deserializedCorr.confidence === 0 ? 0 : deserializedCorr.confidence).toBe(correlationData.confidence === 0 ? 0 : correlationData.confidence);
        expect(deserializedCorr.dataPoints).toBe(correlationData.dataPoints);
        expect(deserializedCorr.correlations.commits_aqi === 0 ? 0 : deserializedCorr.correlations.commits_aqi).toBe(correlationData.correlations.commits_aqi === 0 ? 0 : correlationData.correlations.commits_aqi);
        expect(deserializedCorr.correlations.stars_aqi === 0 ? 0 : deserializedCorr.correlations.stars_aqi).toBe(correlationData.correlations.stars_aqi === 0 ? 0 : correlationData.correlations.stars_aqi);
        expect(deserializedCorr.correlations.commits_pm25 === 0 ? 0 : deserializedCorr.correlations.commits_pm25).toBe(correlationData.correlations.commits_pm25 === 0 ? 0 : correlationData.correlations.commits_pm25);
        expect(deserializedCorr.correlations.stars_pm25 === 0 ? 0 : deserializedCorr.correlations.stars_pm25).toBe(correlationData.correlations.stars_pm25 === 0 ? 0 : correlationData.correlations.stars_pm25);
      }
    ), { numRuns: 100 });
  });

});