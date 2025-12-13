import request from 'supertest';
import app from './server';

describe('Server API', () => {
  test('GET /api/health should return OK status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('service', 'GitHub Air Quality Dashboard API');
    expect(response.body).toHaveProperty('timestamp');
  });

  describe('GET /api/cities', () => {
    test('should return all tech hub cities with correct structure', async () => {
      const response = await request(app)
        .get('/api/cities')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('timestamp');
      
      // Verify we have the expected number of cities
      expect(response.body.count).toBe(10);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(10);
    });

    test('should return cities with required fields', async () => {
      const response = await request(app)
        .get('/api/cities')
        .expect(200);

      const cities = response.body.data;
      
      // Test first city has all required fields
      const firstCity = cities[0];
      expect(firstCity).toHaveProperty('id');
      expect(firstCity).toHaveProperty('name');
      expect(firstCity).toHaveProperty('country');
      expect(firstCity).toHaveProperty('coordinates');
      expect(firstCity).toHaveProperty('timezone');
      expect(firstCity).toHaveProperty('githubSearchQuery');
      
      // Verify coordinates structure
      expect(firstCity.coordinates).toHaveProperty('lat');
      expect(firstCity.coordinates).toHaveProperty('lng');
      expect(typeof firstCity.coordinates.lat).toBe('number');
      expect(typeof firstCity.coordinates.lng).toBe('number');
    });

    test('should return specific expected cities', async () => {
      const response = await request(app)
        .get('/api/cities')
        .expect(200);

      const cities = response.body.data;
      const cityIds = cities.map((city: any) => city.id);
      
      // Verify we have all expected tech hub cities
      const expectedCities = [
        'san-francisco', 'london', 'bangalore', 'tokyo', 'seattle',
        'berlin', 'toronto', 'singapore', 'sydney', 'tel-aviv'
      ];
      
      expectedCities.forEach(expectedId => {
        expect(cityIds).toContain(expectedId);
      });
    });

    test('should return valid data types for all fields', async () => {
      const response = await request(app)
        .get('/api/cities')
        .expect(200);

      const cities = response.body.data;
      
      cities.forEach((city: any) => {
        expect(typeof city.id).toBe('string');
        expect(typeof city.name).toBe('string');
        expect(typeof city.country).toBe('string');
        expect(typeof city.timezone).toBe('string');
        expect(typeof city.githubSearchQuery).toBe('string');
        
        expect(typeof city.coordinates).toBe('object');
        expect(typeof city.coordinates.lat).toBe('number');
        expect(typeof city.coordinates.lng).toBe('number');
        
        // Validate coordinate ranges
        expect(city.coordinates.lat).toBeGreaterThanOrEqual(-90);
        expect(city.coordinates.lat).toBeLessThanOrEqual(90);
        expect(city.coordinates.lng).toBeGreaterThanOrEqual(-180);
        expect(city.coordinates.lng).toBeLessThanOrEqual(180);
      });
    });
  });

  describe('GET /api/airquality/:city/:days', () => {
    test('should return air quality data with correct structure', async () => {
      // Force mock data for consistent testing
      process.env.FORCE_MOCK_DATA = 'true';
      
      const response = await request(app)
        .get('/api/airquality/san-francisco/7')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('metadata');
      
      // Verify metadata structure
      const metadata = response.body.metadata;
      expect(metadata).toHaveProperty('city', 'san-francisco');
      expect(metadata).toHaveProperty('days', 7);
      expect(metadata).toHaveProperty('source');
      expect(metadata).toHaveProperty('timestamp');
      expect(metadata).toHaveProperty('recordCount', 7);
      expect(['live', 'mock']).toContain(metadata.source);
      
      // Verify data structure
      const data = response.body.data;
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(7);
      
      // Verify each data point has correct structure
      data.forEach((dataPoint: any) => {
        expect(dataPoint).toHaveProperty('date');
        expect(dataPoint).toHaveProperty('city', 'san-francisco');
        expect(dataPoint).toHaveProperty('aqi');
        expect(dataPoint).toHaveProperty('pm25');
        expect(dataPoint).toHaveProperty('station');
        expect(dataPoint).toHaveProperty('coordinates');
        
        // Verify data types
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
      
      delete process.env.FORCE_MOCK_DATA;
    });

    test('should handle different time periods', async () => {
      process.env.FORCE_MOCK_DATA = 'true';
      
      const response30 = await request(app)
        .get('/api/airquality/london/30')
        .expect(200);

      expect(response30.body.data).toHaveLength(30);
      expect(response30.body.metadata.days).toBe(30);
      expect(response30.body.metadata.recordCount).toBe(30);
      
      delete process.env.FORCE_MOCK_DATA;
    });

    test('should indicate when using mock data', async () => {
      process.env.FORCE_MOCK_DATA = 'true';
      
      const response = await request(app)
        .get('/api/airquality/tokyo/14')
        .expect(200);

      expect(response.body.metadata.source).toBe('mock');
      expect(response.body.metadata.message).toContain('simulated data');
      
      delete process.env.FORCE_MOCK_DATA;
    });

    test('should validate city parameter', async () => {
      const response = await request(app)
        .get('/api/airquality/invalid-city/30')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid city parameter');
      expect(response.body.message).toContain('invalid-city');
    });

    test('should validate days parameter', async () => {
      const response = await request(app)
        .get('/api/airquality/san-francisco/invalid-days')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid days parameter');
    });
  });

  describe('GET /api/github/:city/:days', () => {
    test('should return GitHub data with correct structure', async () => {
      // Force mock data for consistent testing
      process.env.FORCE_MOCK_DATA = 'true';
      
      const response = await request(app)
        .get('/api/github/san-francisco/7')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('metadata');
      
      // Verify metadata structure
      const metadata = response.body.metadata;
      expect(metadata).toHaveProperty('city', 'san-francisco');
      expect(metadata).toHaveProperty('days', 7);
      expect(metadata).toHaveProperty('source');
      expect(metadata).toHaveProperty('timestamp');
      expect(metadata).toHaveProperty('recordCount', 7);
      expect(['live', 'mock']).toContain(metadata.source);
      
      // Verify data structure
      const data = response.body.data;
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(7);
      
      // Verify each data point has correct structure
      data.forEach((dataPoint: any) => {
        expect(dataPoint).toHaveProperty('date');
        expect(dataPoint).toHaveProperty('city', 'san-francisco');
        expect(dataPoint).toHaveProperty('commits');
        expect(dataPoint).toHaveProperty('stars');
        expect(dataPoint).toHaveProperty('repositories');
        expect(dataPoint).toHaveProperty('contributors');
        
        // Verify data types
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
      
      delete process.env.FORCE_MOCK_DATA;
    });

    test('should handle different time periods', async () => {
      process.env.FORCE_MOCK_DATA = 'true';
      
      const response30 = await request(app)
        .get('/api/github/london/30')
        .expect(200);

      expect(response30.body.data).toHaveLength(30);
      expect(response30.body.metadata.days).toBe(30);
      expect(response30.body.metadata.recordCount).toBe(30);
      
      delete process.env.FORCE_MOCK_DATA;
    });

    test('should indicate when using mock data', async () => {
      process.env.FORCE_MOCK_DATA = 'true';
      
      const response = await request(app)
        .get('/api/github/tokyo/14')
        .expect(200);

      expect(response.body.metadata.source).toBe('mock');
      expect(response.body.metadata.message).toContain('simulated data');
      
      delete process.env.FORCE_MOCK_DATA;
    });
  });

  describe('GET /api/correlation/:city/:days', () => {
    test('should return correlation analysis with correct structure', async () => {
      // Force mock data for consistent testing
      process.env.FORCE_MOCK_DATA = 'true';
      
      const response = await request(app)
        .get('/api/correlation/san-francisco/14')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('metadata');
      
      // Verify metadata structure
      const metadata = response.body.metadata;
      expect(metadata).toHaveProperty('city', 'san-francisco');
      expect(metadata).toHaveProperty('days', 14);
      expect(metadata).toHaveProperty('source');
      expect(metadata).toHaveProperty('timestamp');
      expect(metadata).toHaveProperty('dataPoints');
      expect(metadata).toHaveProperty('confidence');
      expect(metadata).toHaveProperty('hasSignificantCorrelations');
      expect(['live', 'mock']).toContain(metadata.source);
      
      // Verify data structure
      const data = response.body.data;
      expect(data).toHaveProperty('correlation');
      expect(data).toHaveProperty('significance');
      
      // Verify correlation structure
      const correlation = data.correlation;
      expect(correlation).toHaveProperty('city', 'san-francisco');
      expect(correlation).toHaveProperty('period', 14);
      expect(correlation).toHaveProperty('correlations');
      expect(correlation).toHaveProperty('confidence');
      expect(correlation).toHaveProperty('dataPoints');
      
      // Verify correlations structure
      const correlations = correlation.correlations;
      expect(correlations).toHaveProperty('commits_aqi');
      expect(correlations).toHaveProperty('stars_aqi');
      expect(correlations).toHaveProperty('commits_pm25');
      expect(correlations).toHaveProperty('stars_pm25');
      
      // Verify correlation coefficients are in valid range [-1, 1] or NaN
      Object.values(correlations).forEach((coeff: any) => {
        if (!isNaN(coeff)) {
          expect(coeff).toBeGreaterThanOrEqual(-1);
          expect(coeff).toBeLessThanOrEqual(1);
        }
      });
      
      // Verify confidence is between 0 and 1
      expect(correlation.confidence).toBeGreaterThanOrEqual(0);
      expect(correlation.confidence).toBeLessThanOrEqual(1);
      
      // Verify significance structure
      const significance = data.significance;
      expect(significance).toHaveProperty('hasSignificantCorrelations');
      expect(significance).toHaveProperty('significantCorrelations');
      expect(significance).toHaveProperty('highlights');
      expect(significance).toHaveProperty('confidenceLevel');
      
      expect(typeof significance.hasSignificantCorrelations).toBe('boolean');
      expect(Array.isArray(significance.significantCorrelations)).toBe(true);
      expect(Array.isArray(significance.highlights)).toBe(true);
      expect(['very high', 'high', 'moderate', 'low']).toContain(significance.confidenceLevel);
      
      delete process.env.FORCE_MOCK_DATA;
    });

    test('should validate city parameter', async () => {
      const response = await request(app)
        .get('/api/correlation/invalid-city/30')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid city parameter');
      expect(response.body.message).toContain('invalid-city');
    });

    test('should validate days parameter', async () => {
      const response = await request(app)
        .get('/api/correlation/san-francisco/invalid-days')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid days parameter');
    });
  });

  describe('Error handling and validation', () => {
    test('GET /nonexistent should return 404 with enhanced error format', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Route not found');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should validate city parameter in routes', async () => {
      const response = await request(app)
        .get('/api/github/invalid-city/30')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid city parameter');
      expect(response.body.message).toContain('invalid-city');
    });

    test('should validate days parameter in routes', async () => {
      const response = await request(app)
        .get('/api/github/san-francisco/invalid-days')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid days parameter');
    });

    test('should reject days parameter outside valid range', async () => {
      const response = await request(app)
        .get('/api/github/san-francisco/100')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid days parameter');
      expect(response.body.message).toContain('between 1 and 90');
    });
  });
});