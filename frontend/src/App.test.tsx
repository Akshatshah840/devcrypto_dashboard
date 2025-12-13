import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock data
const mockCitiesData = [
  { id: 'san-francisco', name: 'San Francisco', country: 'USA' },
  { id: 'london', name: 'London', country: 'UK' },
];

const mockGithubData = [
  { date: '2024-01-01', city: 'san-francisco', commits: 100, stars: 50, repositories: 10, contributors: 5 },
];

const mockAirQualityData = [
  { date: '2024-01-01', city: 'san-francisco', aqi: 45, pm25: 12.5, station: 'SF Station', coordinates: { lat: 37.7749, lng: -122.4194 } },
];

const mockCorrelationData = {
  city: 'san-francisco',
  period: 30,
  correlations: { commits_aqi: 0.25, stars_aqi: 0.15, commits_pm25: 0.30, stars_pm25: 0.20 },
  confidence: 85.5,
  dataPoints: 30
};

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios.create to return a mock instance
    const mockAxiosInstance = {
      get: jest.fn((url: string) => {
        if (url === '/cities') {
          return Promise.resolve({ data: { success: true, data: mockCitiesData, source: 'mock' } });
        }
        if (url.includes('/github/')) {
          return Promise.resolve({ data: { success: true, data: mockGithubData, source: 'mock' } });
        }
        if (url.includes('/airquality/')) {
          return Promise.resolve({ data: { success: true, data: mockAirQualityData, source: 'mock' } });
        }
        if (url.includes('/correlation/')) {
          return Promise.resolve({ data: { success: true, data: mockCorrelationData, source: 'mock' } });
        }
        return Promise.reject(new Error('Unknown API endpoint'));
      }),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
  });

  test('renders dashboard title', async () => {
    render(<App />);
    await waitFor(() => {
      const titleElement = screen.getByText(/GitHub Activity \+ Air Quality Dashboard/i);
      expect(titleElement).toBeInTheDocument();
    });
  });

  test('renders skip to main content link', async () => {
    render(<App />);
    await waitFor(() => {
      const skipLink = screen.getByText(/Skip to main content/i);
      expect(skipLink).toBeInTheDocument();
    });
  });
});
