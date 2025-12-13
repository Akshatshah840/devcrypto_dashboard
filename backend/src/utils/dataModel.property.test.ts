/**
 * Property-based tests for data model round-trip serialization
 * **Feature: github-air-quality-dashboard, Property 13: API response parsing round-trip**
 * **Validates: Requirements 7.1, 7.2, 7.5**
 */

import * as fc from 'fast-check';
import { 
  GitHubActivity, 
  AirQualityData, 
  CorrelationResult,
  GitHubAPIResponse,
  WAQIAPIResponse
} from '../types';
import {
  serializeGitHubActivity,
  parseGitHubActivity,
  serializeAirQualityData,
  parseAirQualityData,
  serializeCorrelationResult,
  parseCorrelationResult,
  parseGitHubAPIResponse,
  parseWAQIAPIResponse
} from './serialization';

// Generators for test data
const githubActivityArbitrary = fc.record({
  date: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
  city: fc.stringOf(fc.char().filter(c => c !== '\0'), { minLength: 1, maxLength: 50 }),
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
  city: fc.stringOf(fc.char().filter(c => c !== '\0'), { minLength: 1, maxLength: 50 }),
  aqi: fc.integer({ min: 0, max: 500 }),
  pm25: fc.float({ min: 0, max: 1000, noNaN: true }),
  station: fc.stringOf(fc.char().filter(c => c !== '\0'), { minLength: 1, maxLength: 100 }),
  coordinates: coordinatesArbitrary
});

const correlationResultArbitrary = fc.record({
  city: fc.stringOf(fc.char().filter(c => c !== '\0'), { minLength: 1, maxLength: 50 }),
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

const githubAPIResponseArbitrary = fc.record({
  total_count: fc.integer({ min: 0, max: 1000000 }),
  incomplete_results: fc.boolean(),
  items: fc.array(fc.record({
    id: fc.integer({ min: 1, max: 999999999 }),
    name: fc.stringOf(fc.char().filter(c => c !== '\0'), { minLength: 1, maxLength: 100 }),
    full_name: fc.stringOf(fc.char().filter(c => c !== '\0'), { minLength: 1, maxLength: 200 }),
    stargazers_count: fc.integer({ min: 0, max: 100000 }),
    created_at: fc.date({ min: new Date('2008-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
    updated_at: fc.date({ min: new Date('2008-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
    pushed_at: fc.date({ min: new Date('2008-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
    language: fc.oneof(fc.constant('JavaScript'), fc.constant('TypeScript'), fc.constant('Python'), fc.constant('Java'), fc.constant('Go')),
    owner: fc.record({
      login: fc.stringOf(fc.char().filter(c => c !== '\0'), { minLength: 1, maxLength: 50 }),
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
      name: fc.stringOf(fc.char().filter(c => c !== '\0'), { minLength: 1, maxLength: 100 })
    }), { minLength: 0, maxLength: 5 }),
    city: fc.record({
      geo: fc.tuple(
        fc.float({ min: -90, max: 90, noNaN: true }),
        fc.float({ min: -180, max: 180, noNaN: true })
      ),
      name: fc.stringOf(fc.char().filter(c => c !== '\0'), { minLength: 1, maxLength: 100 }),
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
      tz: fc.stringOf(fc.char().filter(c => c !== '\0'), { minLength: 1, maxLength: 50 }),
      v: fc.integer({ min: 1577836800, max: 1735689600 }) // Unix timestamps for 2020-2025
    })
  })
});

describe('Data Model Round-trip Serialization Properties', () => {
  
  test('GitHubActivity serialization round-trip preserves data', () => {
    fc.assert(fc.property(githubActivityArbitrary, (original: GitHubActivity) => {
      const serialized = serializeGitHubActivity(original);
      const parsed = parseGitHubActivity(serialized);
      
      expect(parsed).toEqual(original);
      expect(parsed.date).toBe(original.date);
      expect(parsed.city).toBe(original.city);
      expect(parsed.commits).toBe(original.commits);
      expect(parsed.stars).toBe(original.stars);
      expect(parsed.repositories).toBe(original.repositories);
      expect(parsed.contributors).toBe(original.contributors);
    }), { numRuns: 100 });
  });

  test('AirQualityData serialization round-trip preserves data', () => {
    fc.assert(fc.property(airQualityDataArbitrary, (original: AirQualityData) => {
      const serialized = serializeAirQualityData(original);
      const parsed = parseAirQualityData(serialized);
      
      // Use custom comparison that handles -0 vs 0 edge case in JSON serialization
      expect(parsed.date).toBe(original.date);
      expect(parsed.city).toBe(original.city);
      expect(parsed.aqi).toBe(original.aqi);
      expect(parsed.pm25).toBe(original.pm25);
      expect(parsed.station).toBe(original.station);
      // Handle -0 vs 0 edge case: JSON serialization converts -0 to 0
      expect(parsed.coordinates.lat === 0 ? 0 : parsed.coordinates.lat).toBe(original.coordinates.lat === 0 ? 0 : original.coordinates.lat);
      expect(parsed.coordinates.lng === 0 ? 0 : parsed.coordinates.lng).toBe(original.coordinates.lng === 0 ? 0 : original.coordinates.lng);
    }), { numRuns: 100 });
  });

  test('CorrelationResult serialization round-trip preserves data', () => {
    fc.assert(fc.property(correlationResultArbitrary, (original: CorrelationResult) => {
      const serialized = serializeCorrelationResult(original);
      const parsed = parseCorrelationResult(serialized);
      
      // Use custom comparison that handles -0 vs 0 edge case in JSON serialization
      expect(parsed.city).toBe(original.city);
      expect(parsed.period).toBe(original.period);
      // Handle -0 vs 0 edge case: JSON serialization converts -0 to 0
      expect(parsed.confidence === 0 ? 0 : parsed.confidence).toBe(original.confidence === 0 ? 0 : original.confidence);
      expect(parsed.dataPoints).toBe(original.dataPoints);
      expect(parsed.correlations.commits_aqi === 0 ? 0 : parsed.correlations.commits_aqi).toBe(original.correlations.commits_aqi === 0 ? 0 : original.correlations.commits_aqi);
      expect(parsed.correlations.stars_aqi === 0 ? 0 : parsed.correlations.stars_aqi).toBe(original.correlations.stars_aqi === 0 ? 0 : original.correlations.stars_aqi);
      expect(parsed.correlations.commits_pm25 === 0 ? 0 : parsed.correlations.commits_pm25).toBe(original.correlations.commits_pm25 === 0 ? 0 : original.correlations.commits_pm25);
      expect(parsed.correlations.stars_pm25 === 0 ? 0 : parsed.correlations.stars_pm25).toBe(original.correlations.stars_pm25 === 0 ? 0 : original.correlations.stars_pm25);
    }), { numRuns: 100 });
  });

  test('GitHub API response parsing produces valid GitHubActivity', () => {
    fc.assert(fc.property(
      githubAPIResponseArbitrary,
      fc.stringOf(fc.char().filter(c => c !== '\0'), { minLength: 1, maxLength: 50 }),
      fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
      (apiResponse: GitHubAPIResponse, city: string, date: Date) => {
        const dateString = date.toISOString();
        const parsed = parseGitHubAPIResponse(apiResponse, city, dateString);
        
        expect(parsed.date).toBe(dateString);
        expect(parsed.city).toBe(city);
        expect(parsed.commits).toBeGreaterThanOrEqual(0);
        expect(parsed.stars).toBeGreaterThanOrEqual(0);
        expect(parsed.repositories).toBe(apiResponse.items.length);
        expect(parsed.contributors).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(parsed.commits)).toBe(true);
        expect(Number.isInteger(parsed.stars)).toBe(true);
        expect(Number.isInteger(parsed.repositories)).toBe(true);
        expect(Number.isInteger(parsed.contributors)).toBe(true);
      }
    ), { numRuns: 100 });
  });

  test('WAQI API response parsing produces valid AirQualityData', () => {
    fc.assert(fc.property(
      waqiAPIResponseArbitrary,
      fc.stringOf(fc.char().filter(c => c !== '\0'), { minLength: 1, maxLength: 50 }),
      (apiResponse: WAQIAPIResponse, city: string) => {
        const parsed = parseWAQIAPIResponse(apiResponse, city);
        
        expect(parsed.city).toBe(city);
        expect(parsed.aqi).toBe(apiResponse.data.aqi);
        expect(parsed.aqi).toBeGreaterThanOrEqual(0);
        expect(parsed.aqi).toBeLessThanOrEqual(500);
        expect(parsed.pm25).toBeGreaterThanOrEqual(0);
        expect(parsed.station).toBe(apiResponse.data.city.name);
        expect(parsed.coordinates.lat).toBe(apiResponse.data.city.geo[0]);
        expect(parsed.coordinates.lng).toBe(apiResponse.data.city.geo[1]);
        expect(parsed.coordinates.lat).toBeGreaterThanOrEqual(-90);
        expect(parsed.coordinates.lat).toBeLessThanOrEqual(90);
        expect(parsed.coordinates.lng).toBeGreaterThanOrEqual(-180);
        expect(parsed.coordinates.lng).toBeLessThanOrEqual(180);
        
        // Validate date is a valid ISO string
        const parsedDate = new Date(parsed.date);
        expect(parsedDate.toISOString()).toBe(parsed.date);
      }
    ), { numRuns: 100 });
  });

});