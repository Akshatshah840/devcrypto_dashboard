import { TechHubCity } from '../types';

/**
 * Predefined Indian tech hub cities with their metadata
 */
export const TECH_HUB_CITIES: TechHubCity[] = [
  {
    id: 'bangalore',
    name: 'Bangalore',
    country: 'India',
    coordinates: {
      lat: 12.9716,
      lng: 77.5946
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Bangalore" OR location:"Bengaluru"'
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    coordinates: {
      lat: 19.0760,
      lng: 72.8777
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Mumbai" OR location:"Bombay"'
  },
  {
    id: 'delhi',
    name: 'Delhi',
    country: 'India',
    coordinates: {
      lat: 28.6139,
      lng: 77.2090
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Delhi" OR location:"New Delhi"'
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    country: 'India',
    coordinates: {
      lat: 17.3850,
      lng: 78.4867
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Hyderabad"'
  },
  {
    id: 'chennai',
    name: 'Chennai',
    country: 'India',
    coordinates: {
      lat: 13.0827,
      lng: 80.2707
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Chennai" OR location:"Madras"'
  },
  {
    id: 'pune',
    name: 'Pune',
    country: 'India',
    coordinates: {
      lat: 18.5204,
      lng: 73.8567
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Pune"'
  },
  {
    id: 'kolkata',
    name: 'Kolkata',
    country: 'India',
    coordinates: {
      lat: 22.5726,
      lng: 88.3639
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Kolkata" OR location:"Calcutta"'
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    country: 'India',
    coordinates: {
      lat: 23.0225,
      lng: 72.5714
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Ahmedabad"'
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    country: 'India',
    coordinates: {
      lat: 26.9124,
      lng: 75.7873
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Jaipur"'
  },
  {
    id: 'chandigarh',
    name: 'Chandigarh',
    country: 'India',
    coordinates: {
      lat: 30.7333,
      lng: 76.7794
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Chandigarh"'
  },
  {
    id: 'noida',
    name: 'Noida',
    country: 'India',
    coordinates: {
      lat: 28.5355,
      lng: 77.3910
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Noida"'
  },
  {
    id: 'gurgaon',
    name: 'Gurgaon',
    country: 'India',
    coordinates: {
      lat: 28.4595,
      lng: 77.0266
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Gurgaon" OR location:"Gurugram"'
  },
  {
    id: 'kochi',
    name: 'Kochi',
    country: 'India',
    coordinates: {
      lat: 9.9312,
      lng: 76.2673
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Kochi" OR location:"Cochin"'
  },
  {
    id: 'thiruvananthapuram',
    name: 'Thiruvananthapuram',
    country: 'India',
    coordinates: {
      lat: 8.5241,
      lng: 76.9366
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Thiruvananthapuram" OR location:"Trivandrum"'
  },
  {
    id: 'indore',
    name: 'Indore',
    country: 'India',
    coordinates: {
      lat: 22.7196,
      lng: 75.8577
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Indore"'
  },
  {
    id: 'coimbatore',
    name: 'Coimbatore',
    country: 'India',
    coordinates: {
      lat: 11.0168,
      lng: 76.9558
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Coimbatore"'
  },
  {
    id: 'nagpur',
    name: 'Nagpur',
    country: 'India',
    coordinates: {
      lat: 21.1458,
      lng: 79.0882
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Nagpur"'
  },
  {
    id: 'lucknow',
    name: 'Lucknow',
    country: 'India',
    coordinates: {
      lat: 26.8467,
      lng: 80.9462
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Lucknow"'
  },
  {
    id: 'bhubaneswar',
    name: 'Bhubaneswar',
    country: 'India',
    coordinates: {
      lat: 20.2961,
      lng: 85.8245
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Bhubaneswar"'
  },
  {
    id: 'visakhapatnam',
    name: 'Visakhapatnam',
    country: 'India',
    coordinates: {
      lat: 17.6868,
      lng: 83.2185
    },
    timezone: 'Asia/Kolkata',
    githubSearchQuery: 'location:"Visakhapatnam" OR location:"Vizag"'
  }
];

/**
 * Get city by ID
 */
export function getCityById(id: string): TechHubCity | undefined {
  return TECH_HUB_CITIES.find(city => city.id === id);
}

/**
 * Get all supported city IDs
 */
export function getSupportedCityIds(): string[] {
  return TECH_HUB_CITIES.map(city => city.id);
}

/**
 * Check if a city ID is supported
 */
export function isSupportedCity(id: string): boolean {
  return getSupportedCityIds().includes(id);
}