/**
 * Property-based tests for export serialization round-trip
 * **Feature: github-air-quality-dashboard, Property 14: Export serialization round-trip**
 * **Validates: Requirements 7.3**
 */

import * as fc from 'fast-check';
import { ExportData, GitHubActivity, AirQualityData, CorrelationResult, ExportFormat } from '../types';
import {
  createExportData,
  serializeExportDataToJSON,
  parseExportDataFromJSON,
  serializeExportDataToCSV,
  parseExportDataFromCSV,
  generateExportFilename
} from './export';

// Generators for test data (reusing from previous test)
const githubActivityArbitrary = fc.record({
  date: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
  city: fc.stringOf(fc.char().filter(c => c !== '\0' && c !== ',' && c !== '\n'), { minLength: 1, maxLength: 50 }),
  commits: fc.integer({ min: 0, max: 10000 }),
  stars: fc.integer({ min: 0, max: 100000 }),
  repositories: fc.integer({ min: 0, max: 1000 }),
  contributors: fc.integer({ min: 0, max: 10000 })
});

const coordinatesArbitrary = fc.record({
  lat: fc.float({ min: -90, max: 90, noNaN: true }),
  lng: fc.float({ min: -180, max: 180, noNaN: true })
});

const airQualityDataArbitrary = fc.record({
  date: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
  city: fc.stringOf(fc.char().filter(c => c !== '\0' && c !== ',' && c !== '\n'), { minLength: 1, maxLength: 50 }),
  aqi: fc.integer({ min: 0, max: 500 }),
  pm25: fc.float({ min: 0, max: 1000, noNaN: true }),
  station: fc.stringOf(fc.char().filter(c => c !== '\0' && c !== ',' && c !== '\n'), { minLength: 1, maxLength: 100 }),
  coordinates: coordinatesArbitrary
});

const correlationResultArbitrary = fc.record({
  city: fc.stringOf(fc.char().filter(c => c !== '\0' && c !== ',' && c !== '\n'), { minLength: 1, maxLength: 50 }),
  period: fc.integer({ min: 1, max: 365 }),
  correlations: fc.record({
    commits_aqi: fc.float({ min: -1, max: 1, noNaN: true }),
    stars_aqi: fc.float({ min: -1, max: 1, noNaN: true }),
    commits_pm25: fc.float({ min: -1, max: 1, noNaN: true }),
    stars_pm25: fc.float({ min: -1, max: 1, noNaN: true })
  }),
  confidence: fc.float({ min: 0, max: 1, noNaN: true }),
  dataPoints: fc.integer({ min: 0, max: 10000 })
});

const exportDataArbitrary = fc.record({
  metadata: fc.record({
    city: fc.stringOf(fc.char().filter(c => c !== '\0' && c !== ',' && c !== '\n'), { minLength: 1, maxLength: 50 }),
    period: fc.integer({ min: 1, max: 365 }),
    exportFormat: fc.oneof(fc.constant('json' as ExportFormat), fc.constant('csv' as ExportFormat)),
    generatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
    dataSource: fc.oneof(fc.constant('live' as const), fc.constant('mock' as const))
  }),
  githubData: fc.array(githubActivityArbitrary, { minLength: 0, maxLength: 10 }),
  airQualityData: fc.array(airQualityDataArbitrary, { minLength: 0, maxLength: 10 }),
  correlationData: fc.option(correlationResultArbitrary, { nil: undefined })
});

describe('Export Serialization Round-trip Properties', () => {
  
  test('JSON export serialization round-trip preserves data', () => {
    fc.assert(fc.property(exportDataArbitrary, (original: ExportData) => {
      const serialized = serializeExportDataToJSON(original);
      const parsed = parseExportDataFromJSON(serialized);
      
      // Handle -0 vs 0 edge case in JSON serialization
      expect(parsed.metadata.city).toBe(original.metadata.city);
      expect(parsed.metadata.period).toBe(original.metadata.period);
      expect(parsed.metadata.exportFormat).toBe(original.metadata.exportFormat);
      expect(parsed.metadata.generatedAt).toBe(original.metadata.generatedAt);
      expect(parsed.metadata.dataSource).toBe(original.metadata.dataSource);
      
      expect(parsed.githubData.length).toBe(original.githubData.length);
      expect(parsed.airQualityData.length).toBe(original.airQualityData.length);
      
      // Check GitHub data
      parsed.githubData.forEach((item, index) => {
        const originalItem = original.githubData[index];
        expect(item.date).toBe(originalItem.date);
        expect(item.city).toBe(originalItem.city);
        expect(item.commits).toBe(originalItem.commits);
        expect(item.stars).toBe(originalItem.stars);
        expect(item.repositories).toBe(originalItem.repositories);
        expect(item.contributors).toBe(originalItem.contributors);
      });
      
      // Check air quality data
      parsed.airQualityData.forEach((item, index) => {
        const originalItem = original.airQualityData[index];
        expect(item.date).toBe(originalItem.date);
        expect(item.city).toBe(originalItem.city);
        expect(item.aqi).toBe(originalItem.aqi);
        expect(item.pm25 === 0 ? 0 : item.pm25).toBe(originalItem.pm25 === 0 ? 0 : originalItem.pm25);
        expect(item.station).toBe(originalItem.station);
        expect(item.coordinates.lat === 0 ? 0 : item.coordinates.lat).toBe(originalItem.coordinates.lat === 0 ? 0 : originalItem.coordinates.lat);
        expect(item.coordinates.lng === 0 ? 0 : item.coordinates.lng).toBe(originalItem.coordinates.lng === 0 ? 0 : originalItem.coordinates.lng);
      });
      
      // Check correlation data
      if (original.correlationData) {
        expect(parsed.correlationData).toBeDefined();
        const parsedCorr = parsed.correlationData!;
        const originalCorr = original.correlationData;
        
        expect(parsedCorr.city).toBe(originalCorr.city);
        expect(parsedCorr.period).toBe(originalCorr.period);
        expect(parsedCorr.confidence === 0 ? 0 : parsedCorr.confidence).toBe(originalCorr.confidence === 0 ? 0 : originalCorr.confidence);
        expect(parsedCorr.dataPoints).toBe(originalCorr.dataPoints);
        expect(parsedCorr.correlations.commits_aqi === 0 ? 0 : parsedCorr.correlations.commits_aqi).toBe(originalCorr.correlations.commits_aqi === 0 ? 0 : originalCorr.correlations.commits_aqi);
        expect(parsedCorr.correlations.stars_aqi === 0 ? 0 : parsedCorr.correlations.stars_aqi).toBe(originalCorr.correlations.stars_aqi === 0 ? 0 : originalCorr.correlations.stars_aqi);
        expect(parsedCorr.correlations.commits_pm25 === 0 ? 0 : parsedCorr.correlations.commits_pm25).toBe(originalCorr.correlations.commits_pm25 === 0 ? 0 : originalCorr.correlations.commits_pm25);
        expect(parsedCorr.correlations.stars_pm25 === 0 ? 0 : parsedCorr.correlations.stars_pm25).toBe(originalCorr.correlations.stars_pm25 === 0 ? 0 : originalCorr.correlations.stars_pm25);
      } else {
        expect(parsed.correlationData).toBeUndefined();
      }
    }), { numRuns: 100 });
  });

  test('CSV export serialization preserves metadata', () => {
    fc.assert(fc.property(exportDataArbitrary, (original: ExportData) => {
      const serialized = serializeExportDataToCSV(original);
      const parsed = parseExportDataFromCSV(serialized);
      
      // CSV parsing only preserves metadata in our simplified implementation
      expect(parsed.metadata?.city).toBe(original.metadata.city);
      expect(parsed.metadata?.period).toBe(original.metadata.period);
      expect(parsed.metadata?.exportFormat).toBe('csv');
      expect(parsed.metadata?.generatedAt).toBe(original.metadata.generatedAt);
      expect(parsed.metadata?.dataSource).toBe(original.metadata.dataSource);
      
      // Verify CSV contains expected sections
      expect(serialized).toContain('# Export Metadata');
      expect(serialized).toContain(`# City: ${original.metadata.city}`);
      expect(serialized).toContain(`# Period: ${original.metadata.period} days`);
      expect(serialized).toContain(`# Data Source: ${original.metadata.dataSource}`);
      
      if (original.githubData.length > 0) {
        expect(serialized).toContain('# GitHub Activity Data');
        expect(serialized).toContain('date,city,commits,stars,repositories,contributors');
      }
      
      if (original.airQualityData.length > 0) {
        expect(serialized).toContain('# Air Quality Data');
        expect(serialized).toContain('date,city,aqi,pm25,station,lat,lng');
      }
      
      if (original.correlationData) {
        expect(serialized).toContain('# Correlation Analysis');
        expect(serialized).toContain('metric,correlation_value');
      }
    }), { numRuns: 100 });
  });

  test('Export data creation produces valid structure', () => {
    fc.assert(fc.property(
      fc.stringOf(fc.char().filter(c => c !== '\0'), { minLength: 1, maxLength: 50 }),
      fc.integer({ min: 1, max: 365 }),
      fc.oneof(fc.constant('json' as ExportFormat), fc.constant('csv' as ExportFormat)),
      fc.array(githubActivityArbitrary, { minLength: 0, maxLength: 10 }),
      fc.array(airQualityDataArbitrary, { minLength: 0, maxLength: 10 }),
      fc.option(correlationResultArbitrary, { nil: undefined }),
      fc.oneof(fc.constant('live' as const), fc.constant('mock' as const)),
      (city, period, format, githubData, airQualityData, correlationData, dataSource) => {
        const exportData = createExportData(city, period, format, githubData, airQualityData, correlationData, dataSource);
        
        expect(exportData.metadata.city).toBe(city);
        expect(exportData.metadata.period).toBe(period);
        expect(exportData.metadata.exportFormat).toBe(format);
        expect(exportData.metadata.dataSource).toBe(dataSource);
        expect(exportData.githubData).toEqual(githubData);
        expect(exportData.airQualityData).toEqual(airQualityData);
        expect(exportData.correlationData).toEqual(correlationData);
        
        // Validate generated timestamp is a valid ISO string
        const generatedDate = new Date(exportData.metadata.generatedAt);
        expect(generatedDate.toISOString()).toBe(exportData.metadata.generatedAt);
        
        // Validate timestamp is recent (within last minute)
        const now = new Date();
        const timeDiff = now.getTime() - generatedDate.getTime();
        expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
      }
    ), { numRuns: 100 });
  });

  test('Export filename generation follows correct format', () => {
    fc.assert(fc.property(
      fc.stringOf(fc.char().filter(c => c !== '\0' && c !== '/' && c !== '\\' && c !== ':'), { minLength: 1, maxLength: 20 }),
      fc.integer({ min: 1, max: 365 }),
      fc.oneof(fc.constant('json' as ExportFormat), fc.constant('csv' as ExportFormat)),
      fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()), { nil: undefined }),
      (city, period, format, timestamp) => {
        const filename = generateExportFilename(city, period, format, timestamp);
        
        // Account for city name sanitization in filename
        const sanitizedCity = city.replace(/[/\\:*?"<>|]/g, '-').trim();
        expect(filename).toContain(`github-air-quality-${sanitizedCity}-${period}days`);
        expect(filename.endsWith(`.${format}`)).toBe(true);
        
        // Validate filename doesn't contain invalid characters
        expect(filename).not.toContain('/');
        expect(filename).not.toContain('\\');
        expect(filename).not.toContain(':');
        
        // Validate filename has reasonable length
        expect(filename.length).toBeGreaterThan(10);
        expect(filename.length).toBeLessThan(200);
      }
    ), { numRuns: 100 });
  });

});