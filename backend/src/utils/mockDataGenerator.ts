/**
 * Mock data generators for GitHub Activity and Air Quality data
 * Used as fallback when external APIs are unavailable or rate-limited
 */

import { GitHubActivity, AirQualityData, TechHubCity } from '../types';

/**
 * Generates realistic GitHub activity data for a given city and time period
 */
export function generateMockGitHubData(city: string, days: number): GitHubActivity[] {
  const data: GitHubActivity[] = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate realistic values with some randomness and trends
    const baseCommits = Math.floor(Math.random() * 500) + 100; // 100-600 commits
    const baseStars = Math.floor(Math.random() * 200) + 50; // 50-250 stars
    const baseRepos = Math.floor(Math.random() * 50) + 10; // 10-60 repositories
    const baseContributors = Math.floor(Math.random() * 100) + 20; // 20-120 contributors
    
    // Add some weekly patterns (lower activity on weekends)
    const dayOfWeek = date.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.6 : 1.0;
    
    data.push({
      date: date.toISOString().split('T')[0],
      city,
      commits: Math.floor(baseCommits * weekendFactor),
      stars: Math.floor(baseStars * weekendFactor),
      repositories: Math.floor(baseRepos * weekendFactor),
      contributors: Math.floor(baseContributors * weekendFactor)
    });
  }
  
  return data.reverse(); // Return in chronological order
}

/**
 * Generates realistic air quality data for a given city and time period
 */
export function generateMockAirQualityData(city: string, cityData: TechHubCity, days: number): AirQualityData[] {
  const data: AirQualityData[] = [];
  const now = new Date();
  
  // Base AQI values vary by city (some cities are more polluted)
  const cityAQIBase = getCityAQIBase(city);
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate AQI with some randomness and seasonal patterns
    const seasonalFactor = getSeasonalFactor(date);
    const randomVariation = (Math.random() - 0.5) * 40; // ±20 AQI variation
    const aqi = Math.max(0, Math.min(500, Math.floor(cityAQIBase * seasonalFactor + randomVariation)));
    
    // PM2.5 is roughly correlated with AQI but not perfectly
    const pm25Base = aqi * 0.4; // Rough conversion factor
    const pm25Variation = (Math.random() - 0.5) * 20;
    const pm25 = Math.max(0, Math.floor(pm25Base + pm25Variation));
    
    data.push({
      date: date.toISOString().split('T')[0],
      city,
      aqi,
      pm25,
      station: `${cityData.name} Central Station`,
      coordinates: {
        lat: cityData.coordinates.lat + (Math.random() - 0.5) * 0.1, // Small variation
        lng: cityData.coordinates.lng + (Math.random() - 0.5) * 0.1
      }
    });
  }
  
  return data.reverse(); // Return in chronological order
}

/**
 * Get base AQI values for different cities (some are more polluted than others)
 */
function getCityAQIBase(city: string): number {
  const cityAQIMap: Record<string, number> = {
    'san-francisco': 45,
    'london': 55,
    'bangalore': 120,
    'tokyo': 65,
    'berlin': 50,
    'singapore': 75,
    'sydney': 40,
    'toronto': 45,
    'tel-aviv': 70,
    'amsterdam': 48
  };
  
  return cityAQIMap[city] || 60; // Default to moderate AQI
}

/**
 * Get seasonal factor for air quality (winter tends to be worse in many cities)
 */
function getSeasonalFactor(date: Date): number {
  const month = date.getMonth(); // 0-11
  
  // Winter months (Dec, Jan, Feb) tend to have worse air quality
  if (month === 11 || month === 0 || month === 1) {
    return 1.3;
  }
  // Summer months (Jun, Jul, Aug) tend to have better air quality
  else if (month >= 5 && month <= 7) {
    return 0.8;
  }
  // Spring and fall are moderate
  else {
    return 1.0;
  }
}

/**
 * Check if mock data should be used based on API availability
 */
export function shouldUseMockData(apiSource: 'github' | 'waqi', lastError?: Error): boolean {
  // Always use mock data if there was a recent API error
  if (lastError) {
    return true;
  }
  
  // For development/testing, you might want to force mock data
  if (process.env.NODE_ENV === 'test' || process.env.FORCE_MOCK_DATA === 'true') {
    return true;
  }
  
  return false;
}

/**
 * Get mock data indicator message for UI display
 */
export function getMockDataMessage(apiSource: 'github' | 'waqi'): string {
  const sourceNames = {
    github: 'GitHub API',
    waqi: 'World Air Quality Index API'
  };
  
  return `⚠️ Using simulated data - ${sourceNames[apiSource]} is currently unavailable`;
}