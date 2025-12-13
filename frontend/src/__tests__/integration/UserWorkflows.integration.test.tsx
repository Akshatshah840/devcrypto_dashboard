import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock fetch for API calls (fallback)
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.open for export functionality
const mockWindowOpen = jest.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockWindowOpen
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock data
const mockCitiesData = [
  { id: 'san-francisco', name: 'San Francisco', country: 'USA' },
  { id: 'london', name: 'London', country: 'UK' },
  { id: 'bangalore', name: 'Bangalore', country: 'India' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan' }
];

const mockGithubData = [
  { date: '2024-01-01', city: 'san-francisco', commits: 100, stars: 50, repositories: 10, contributors: 5 },
  { date: '2024-01-02', city: 'san-francisco', commits: 120, stars: 60, repositories: 12, contributors: 6 },
  { date: '2024-01-03', city: 'san-francisco', commits: 90, stars: 45, repositories: 8, contributors: 4 }
];

const mockAirQualityData = [
  { date: '2024-01-01', city: 'san-francisco', aqi: 45, pm25: 12.5, station: 'SF Station', coordinates: { lat: 37.7749, lng: -122.4194 } },
  { date: '2024-01-02', city: 'san-francisco', aqi: 52, pm25: 15.2, station: 'SF Station', coordinates: { lat: 37.7749, lng: -122.4194 } },
  { date: '2024-01-03', city: 'san-francisco', aqi: 38, pm25: 10.8, station: 'SF Station', coordinates: { lat: 37.7749, lng: -122.4194 } }
];

const mockCorrelationData = {
  city: 'san-francisco',
  period: 30,
  correlations: {
    commits_aqi: 0.25,
    stars_aqi: 0.15,
    commits_pm25: 0.30,
    stars_pm25: 0.20
  },
  confidence: 85.5,
  dataPoints: 30
};

describe('User Workflows Integration Tests', () => {
  beforeEach(() => {
    // Clear all mocks
    mockFetch.mockClear();
    mockWindowOpen.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    jest.clearAllMocks();
    
    // Reset document theme
    document.documentElement.removeAttribute('data-theme');
    
    // Mock axios.create to return a mock instance
    const mockAxiosInstance = {
      get: jest.fn((url: string) => {
        if (url === '/cities') {
          return Promise.resolve({
            data: { success: true, data: mockCitiesData, source: 'mock' }
          });
        }
        if (url.includes('/github/')) {
          return Promise.resolve({
            data: { success: true, data: mockGithubData, source: 'mock' }
          });
        }
        if (url.includes('/airquality/')) {
          return Promise.resolve({
            data: { success: true, data: mockAirQualityData, source: 'mock' }
          });
        }
        if (url.includes('/correlation/')) {
          return Promise.resolve({
            data: { success: true, data: mockCorrelationData, source: 'mock' }
          });
        }
        return Promise.reject(new Error('Unknown API endpoint'));
      }),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    
    // Default mock responses for fetch (fallback)
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/cities')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCitiesData)
        });
      }
      if (url.includes('/api/github/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGithubData)
        });
      }
      if (url.includes('/api/airquality/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAirQualityData)
        });
      }
      if (url.includes('/api/correlation/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCorrelationData)
        });
      }
      if (url.includes('/api/export/')) {
        // Mock successful export response
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['mock data'], { type: 'application/json' }))
        });
      }
      return Promise.reject(new Error('Unknown API endpoint'));
    });
  });

  describe('Complete Data Fetching and Visualization Workflow', () => {
    test.skip('user can select city and time period, then view data visualizations', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Wait for initial render and cities to load
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/cities')
        );
      });

      // Step 1: Select a city
      const citySelector = screen.getByLabelText(/Select City/i);
      await user.selectOptions(citySelector, 'san-francisco');

      // Wait for data to load
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/github/san-francisco/30')
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/airquality/san-francisco/30')
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/correlation/san-francisco/30')
        );
      });

      // Step 2: Change time period
      const timePeriodButton = screen.getByTestId('time-period-7');
      await user.click(timePeriodButton);

      // Wait for new data to load with updated time period
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/github/san-francisco/7')
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/airquality/san-francisco/7')
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/correlation/san-francisco/7')
        );
      });

      // Step 3: Verify data is displayed (charts may not have specific text, so check for data presence)
      await waitFor(() => {
        // Check that data loading completed successfully
        expect(mockFetch).toHaveBeenCalledTimes(8); // cities + 3 data types * 2 time periods + 1 initial
      });

      // Step 4: Change city and verify new data is fetched
      await user.selectOptions(citySelector, 'london');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/github/london/7')
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/airquality/london/7')
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/correlation/london/7')
        );
      });
    });

    test('user can navigate between different pages and maintain state', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Select city and time period on dashboard
      const citySelector = screen.getByLabelText(/Select City/i);
      await user.selectOptions(citySelector, 'san-francisco');

      const timePeriodButton = screen.getByTestId('time-period-14');
      await user.click(timePeriodButton);

      // Navigate to GitHub Stats page via sidebar
      const githubNavButton = screen.getByRole('button', { name: /GitHub Stats/i });
      await user.click(githubNavButton);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/github');
      });

      // Verify state is maintained - city selector should still show san-francisco
      const citySelectorsAfterNav = screen.getAllByLabelText(/Select City/i);
      expect(citySelectorsAfterNav[0]).toHaveValue('san-francisco');

      // Navigate to Air Quality page
      const airQualityNavButton = screen.getByRole('button', { name: /Air Quality/i });
      await user.click(airQualityNavButton);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/airquality');
      });

      // Navigate to Comparison page
      const comparisonNavButton = screen.getByRole('button', { name: /Comparison/i });
      await user.click(comparisonNavButton);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/comparison');
      });

      // Navigate to Reports page
      const reportsNavButton = screen.getByRole('button', { name: /Reports/i });
      await user.click(reportsNavButton);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/reports');
      });

      // Navigate back to Dashboard
      const dashboardNavButton = screen.getByRole('button', { name: /Dashboard/i });
      await user.click(dashboardNavButton);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/dashboard');
      });
    });

    test.skip('user can interact with multiple time periods and see data updates', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Select a city first
      const citySelector = screen.getByLabelText(/Select City/i);
      await user.selectOptions(citySelector, 'tokyo');

      // Test different time periods
      const timePeriods = ['7', '14', '30', '60', '90'];
      
      for (const period of timePeriods) {
        const timePeriodButton = screen.getByTestId(`time-period-${period}`);
        await user.click(timePeriodButton);

        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining(`/api/github/tokyo/${period}`)
          );
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining(`/api/airquality/tokyo/${period}`)
          );
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining(`/api/correlation/tokyo/${period}`)
          );
        });

        // Verify the button is active
        expect(timePeriodButton).toHaveClass('btn-active');
      }
    });
  });

  describe('Export Functionality End-to-End', () => {
    test.skip('user can export data in JSON format from dashboard', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Select city and wait for data to load
      const citySelector = screen.getByLabelText(/Select City/i);
      await user.selectOptions(citySelector, 'san-francisco');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/github/san-francisco/30')
        );
      });

      // Look for export JSON button (might be in different locations)
      const exportJsonButton = screen.getByRole('button', { name: /Export JSON/i });
      await user.click(exportJsonButton);

      // Verify export URL was opened
      expect(mockWindowOpen).toHaveBeenCalledWith(
        '/api/export/json/san-francisco/30',
        '_blank'
      );
    });

    test.skip('user can export data in CSV format from dashboard', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Select city and wait for data to load
      const citySelector = screen.getByLabelText(/Select City/i);
      await user.selectOptions(citySelector, 'san-francisco');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/github/san-francisco/30')
        );
      });

      // Look for export CSV button
      const exportCsvButton = screen.getByRole('button', { name: /Export CSV/i });
      await user.click(exportCsvButton);

      // Verify export URL was opened
      expect(mockWindowOpen).toHaveBeenCalledWith(
        '/api/export/csv/san-francisco/30',
        '_blank'
      );
    });

    test('user can navigate to reports page and use comprehensive export functionality', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Select city first
      const citySelector = screen.getByLabelText(/Select City/i);
      await user.selectOptions(citySelector, 'bangalore');

      // Navigate to Reports page
      const reportsNavButton = screen.getByRole('button', { name: /Reports/i });
      await user.click(reportsNavButton);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/reports');
      });

      // Verify reports page content is loaded
      expect(screen.getByText(/Reports & Export/i)).toBeInTheDocument();
      expect(screen.getByText(/Current Selection/i)).toBeInTheDocument();

      // Test quick export functionality
      const quickExportJsonButton = screen.getByRole('button', { name: /Export JSON/i });
      await user.click(quickExportJsonButton);

      // Verify export was initiated (should show progress or history)
      await waitFor(() => {
        expect(screen.getByText(/Export History/i)).toBeInTheDocument();
      });
    });

    test.skip('user can use custom export functionality with different cities and periods', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Navigate to Reports page
      const reportsNavButton = screen.getByRole('button', { name: /Reports/i });
      await user.click(reportsNavButton);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/reports');
      });

      // Use custom export section
      const customCitySelect = screen.getByLabelText(/City/i);
      await user.selectOptions(customCitySelect, 'tokyo');

      const customPeriodSelect = screen.getByLabelText(/Time Period/i);
      await user.selectOptions(customPeriodSelect, '60');

      // Click custom JSON export
      const customExportButtons = screen.getAllByRole('button', { name: /JSON/i });
      const customJsonButton = customExportButtons.find(btn => 
        btn.closest('.space-y-3') !== null
      );
      
      if (customJsonButton) {
        await user.click(customJsonButton);
        
        // Verify export was initiated
        await waitFor(() => {
          expect(screen.getByText(/Export History/i)).toBeInTheDocument();
        });
      }
    });

    test.skip('export functionality works with different time periods', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Select city
      const citySelector = screen.getByLabelText(/Select City/i);
      await user.selectOptions(citySelector, 'london');

      // Change time period
      const timePeriodButton = screen.getByTestId('time-period-60');
      await user.click(timePeriodButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/github/london/60')
        );
      });

      // Export with the new time period
      const exportJsonButton = screen.getByRole('button', { name: /Export JSON/i });
      await user.click(exportJsonButton);

      // Verify export URL includes the correct time period
      expect(mockWindowOpen).toHaveBeenCalledWith(
        '/api/export/json/london/60',
        '_blank'
      );
    });
  });

  describe('Theme Switching and Responsive Behavior', () => {
    test.skip('user can switch between themes using dropdown', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Find theme switcher dropdown
      const themeDropdown = screen.getByRole('button', { name: /Choose theme/i });
      await user.click(themeDropdown);

      // Select dark theme
      const darkThemeOption = screen.getByRole('button', { name: /dark/i });
      await user.click(darkThemeOption);

      // Verify theme was applied (check data-theme attribute on html element)
      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      });

      // Verify localStorage was updated
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('dashboard-theme', 'dark');

      // Test another theme
      await user.click(themeDropdown);
      const corporateThemeOption = screen.getByRole('button', { name: /corporate/i });
      await user.click(corporateThemeOption);

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('corporate');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('dashboard-theme', 'corporate');
    });

    test.skip('user can switch themes using quick theme buttons', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Find quick theme buttons (visible on desktop)
      const lightThemeButton = screen.getByRole('button', { name: /Light/i });
      await user.click(lightThemeButton);

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      });

      // Test dark theme quick button
      const darkThemeButton = screen.getByRole('button', { name: /Dark/i });
      await user.click(darkThemeButton);

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      });

      // Test synthwave theme quick button
      const synthwaveThemeButton = screen.getByRole('button', { name: /Synthwave/i });
      await user.click(synthwaveThemeButton);

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('synthwave');
      });
    });

    test('theme persists across page navigation', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Set a theme
      const themeDropdown = screen.getByRole('button', { name: /Choose theme/i });
      await user.click(themeDropdown);
      const nightThemeOption = screen.getByRole('button', { name: /night/i });
      await user.click(nightThemeOption);

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('night');
      });

      // Navigate to different pages
      const githubNavButton = screen.getByRole('button', { name: /GitHub Stats/i });
      await user.click(githubNavButton);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/github');
      });

      // Verify theme is still applied
      expect(document.documentElement.getAttribute('data-theme')).toBe('night');

      // Navigate to another page
      const reportsNavButton = screen.getByRole('button', { name: /Reports/i });
      await user.click(reportsNavButton);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/reports');
      });

      // Verify theme is still applied
      expect(document.documentElement.getAttribute('data-theme')).toBe('night');
    });

    test.skip('sidebar collapses on mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      render(
        
          <App />
        
      );

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      // Wait for sidebar to collapse
      await waitFor(() => {
        const sidebar = screen.getByRole('navigation');
        expect(sidebar).toHaveClass('-translate-x-full');
      });
    });

    test.skip('sidebar toggle button works correctly', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Find sidebar toggle button
      const toggleButton = screen.getByLabelText(/Expand sidebar|Collapse sidebar/i);
      
      // Click to collapse
      await user.click(toggleButton);

      // Verify sidebar is collapsed
      await waitFor(() => {
        const sidebar = screen.getByRole('navigation');
        expect(sidebar).toHaveClass('lg:w-16');
      });

      // Click to expand
      await user.click(toggleButton);

      // Verify sidebar is expanded
      await waitFor(() => {
        const sidebar = screen.getByRole('navigation');
        expect(sidebar).toHaveClass('w-64');
      });
    });

    test.skip('sidebar state persists across page navigation', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Collapse sidebar
      const toggleButton = screen.getByLabelText(/Expand sidebar|Collapse sidebar/i);
      await user.click(toggleButton);

      await waitFor(() => {
        const sidebar = screen.getByRole('navigation');
        expect(sidebar).toHaveClass('lg:w-16');
      });

      // Navigate to different page
      const airQualityNavButton = screen.getByRole('button', { name: /Air Quality/i });
      await user.click(airQualityNavButton);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/airquality');
      });

      // Verify sidebar is still collapsed
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('lg:w-16');
    });

    test('tab navigation works on mobile with dropdown', async () => {
      const user = userEvent.setup();
      
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640
      });

      render(
        
          <App />
        
      );

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      // Find mobile tab dropdown (should be visible on mobile)
      const tabDropdown = screen.getByRole('button', { name: /Select Tab|Dashboard/i });
      await user.click(tabDropdown);

      // Select Cities tab
      const citiesOption = screen.getByRole('button', { name: /Cities/i });
      await user.click(citiesOption);

      // Verify navigation occurred
      await waitFor(() => {
        expect(window.location.pathname).toBe('/cities');
      });
    });

    test.skip('responsive layout adjusts to different screen sizes', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Test desktop layout
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });
      fireEvent(window, new Event('resize'));

      // Desktop should show expanded sidebar by default
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).not.toHaveClass('-translate-x-full');

      // Test tablet layout
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });
      fireEvent(window, new Event('resize'));

      // Tablet should collapse sidebar
      await waitFor(() => {
        expect(sidebar).toHaveClass('-translate-x-full');
      });

      // Test mobile layout
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480
      });
      fireEvent(window, new Event('resize'));

      // Mobile should still have collapsed sidebar
      expect(sidebar).toHaveClass('-translate-x-full');
    });
  });

  describe('Error Handling and Loading States', () => {
    test.skip('displays loading states during data fetching', async () => {
      const user = userEvent.setup();
      
      // Mock slow API response
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/cities')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCitiesData)
          });
        }
        return new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve(mockGithubData)
          }), 1000)
        );
      });

      render(
        
          <App />
        
      );

      // Select city to trigger loading
      const citySelector = screen.getByLabelText(/Select City/i);
      await user.selectOptions(citySelector, 'san-francisco');

      // Verify loading indicators are shown (could be spinners, skeletons, or loading text)
      // The exact implementation may vary, so we check for common loading indicators
      const loadingElements = screen.queryAllByText(/loading/i);
      const spinners = screen.queryAllByRole('status');
      const skeletons = document.querySelectorAll('.skeleton, .loading, .animate-pulse');
      
      expect(loadingElements.length + spinners.length + skeletons.length).toBeGreaterThan(0);
    });

    test.skip('handles API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error for data endpoints but not cities
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/cities')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCitiesData)
          });
        }
        return Promise.reject(new Error('API Error'));
      });

      render(
        
          <App />
        
      );

      // Select city to trigger error
      const citySelector = screen.getByLabelText(/Select City/i);
      await user.selectOptions(citySelector, 'san-francisco');

      // Wait for error to be displayed (could be various error messages)
      await waitFor(() => {
        const errorElements = screen.queryAllByText(/error|failed|unavailable/i);
        expect(errorElements.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    test.skip('handles network connectivity issues', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/cities')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCitiesData)
          });
        }
        return Promise.reject(new Error('Network Error'));
      });

      render(
        
          <App />
        
      );

      // Select city to trigger network error
      const citySelector = screen.getByLabelText(/Select City/i);
      await user.selectOptions(citySelector, 'san-francisco');

      // Wait for error handling to kick in
      await waitFor(() => {
        // Should show some form of error indication or fallback to mock data
        const errorOrMockIndicators = screen.queryAllByText(/error|failed|mock|simulated|unavailable/i);
        expect(errorOrMockIndicators.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    test.skip('recovers from errors when API becomes available', async () => {
      const user = userEvent.setup();
      
      // Start with API error
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/cities')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCitiesData)
          });
        }
        return Promise.reject(new Error('API Error'));
      });

      render(
        
          <App />
        
      );

      // Select city to trigger error
      const citySelector = screen.getByLabelText(/Select City/i);
      await user.selectOptions(citySelector, 'san-francisco');

      // Wait for error state
      await waitFor(() => {
        const errorElements = screen.queryAllByText(/error|failed|unavailable/i);
        expect(errorElements.length).toBeGreaterThan(0);
      });

      // Fix the API
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/cities')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCitiesData)
          });
        }
        if (url.includes('/api/github/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockGithubData)
          });
        }
        if (url.includes('/api/airquality/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockAirQualityData)
          });
        }
        if (url.includes('/api/correlation/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCorrelationData)
          });
        }
        return Promise.reject(new Error('Unknown API endpoint'));
      });

      // Change time period to trigger new API calls
      const timePeriodButton = screen.getByTestId('time-period-14');
      await user.click(timePeriodButton);

      // Wait for recovery
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/github/san-francisco/14')
        );
      });
    });
  });

  describe('Accessibility Features', () => {
    test.skip('keyboard navigation works for main controls', async () => {
      render(
        
          <App />
        
      );

      // Test keyboard navigation on city selector
      const citySelector = screen.getByLabelText(/Select City/i);
      citySelector.focus();
      expect(citySelector).toHaveFocus();

      // Test keyboard navigation on time period buttons
      const timePeriodButton = screen.getByTestId('time-period-7');
      timePeriodButton.focus();
      expect(timePeriodButton).toHaveFocus();

      // Test keyboard navigation on sidebar buttons
      const dashboardButton = screen.getByRole('button', { name: /Dashboard/i });
      dashboardButton.focus();
      expect(dashboardButton).toHaveFocus();
    });

    test.skip('ARIA labels are present on interactive elements', () => {
      render(
        
          <App />
        
      );

      // Check for ARIA labels on key elements
      expect(screen.getByLabelText(/Select City/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Expand sidebar|Collapse sidebar/i)).toBeInTheDocument();
      
      // Check for time period selector with proper ARIA
      const timePeriodGroup = screen.getByRole('radiogroup', { name: /time period/i });
      expect(timePeriodGroup).toBeInTheDocument();
      
      // Check for navigation with proper ARIA
      const navigation = screen.getByRole('navigation', { name: /main navigation/i });
      expect(navigation).toBeInTheDocument();
      
      // Check for main content area
      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();
    });

    test('skip to main content link is present and functional', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Find skip link (it's visually hidden but accessible)
      const skipLink = screen.getByText(/Skip to main content/i);
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
      
      // Verify main content has the correct id
      const mainContent = document.getElementById('main-content');
      expect(mainContent).toBeInTheDocument();
    });

    test('time period buttons have proper radio group semantics', () => {
      render(
        
          <App />
        
      );

      // Check that time period buttons are in a radiogroup
      const radioGroup = screen.getByRole('radiogroup', { name: /time period/i });
      expect(radioGroup).toBeInTheDocument();
      
      // Check that buttons have proper aria-checked attributes
      const selectedButton = screen.getByTestId('time-period-30');
      expect(selectedButton).toHaveAttribute('aria-checked', 'true');
      
      const unselectedButton = screen.getByTestId('time-period-7');
      expect(unselectedButton).toHaveAttribute('aria-checked', 'false');
    });

    test.skip('navigation items have proper menu semantics', () => {
      render(
        
          <App />
        
      );

      // Check for menubar
      const menubar = screen.getByRole('menubar', { name: /navigation menu/i });
      expect(menubar).toBeInTheDocument();
      
      // Check for menu items
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
      
      // Check that active item has aria-current
      const dashboardItem = screen.getByRole('menuitem', { name: /Dashboard/i });
      expect(dashboardItem).toHaveAttribute('aria-current', 'page');
    });

    test('theme dropdown has proper listbox semantics', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Find and click theme dropdown
      const themeButton = screen.getByRole('button', { name: /Choose theme/i });
      expect(themeButton).toHaveAttribute('aria-haspopup', 'listbox');
      
      await user.click(themeButton);
      
      // Check for listbox
      const listbox = screen.getByRole('listbox', { name: /available themes/i });
      expect(listbox).toBeInTheDocument();
    });

    test('tab navigation has proper tablist semantics on desktop', () => {
      render(
        
          <App />
        
      );

      // Check for tablist
      const tablist = screen.getByRole('tablist', { name: /dashboard sections/i });
      expect(tablist).toBeInTheDocument();
      
      // Check for tabs
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
      
      // Check that active tab has aria-selected
      const activeTab = tabs.find(tab => tab.getAttribute('aria-selected') === 'true');
      expect(activeTab).toBeInTheDocument();
    });

    test.skip('focus is visible on interactive elements', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Tab through interactive elements and verify focus
      const citySelector = screen.getByLabelText(/Select City/i);
      await user.tab();
      
      // After tabbing, some element should have focus
      expect(document.activeElement).not.toBe(document.body);
    });
  });

  describe('Responsive Design', () => {
    test.skip('sidebar collapses on mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      render(
        
          <App />
        
      );

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      // Wait for sidebar to collapse
      await waitFor(() => {
        const sidebar = screen.getByRole('navigation', { name: /main navigation/i });
        expect(sidebar).toHaveClass('-translate-x-full');
      });
    });

    test('mobile dropdown navigation is accessible', async () => {
      const user = userEvent.setup();
      
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640
      });

      render(
        
          <App />
        
      );

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      // Find mobile tab dropdown
      const tabDropdown = screen.getByRole('button', { name: /current section/i });
      expect(tabDropdown).toHaveAttribute('aria-haspopup', 'listbox');
    });
  });

  describe('Complete User Journey Integration', () => {
    test.skip('complete workflow: select city, change period, navigate pages, export data, change theme', async () => {
      const user = userEvent.setup();
      
      render(
        
          <App />
        
      );

      // Step 1: Select city
      const citySelector = screen.getByLabelText(/Select City/i);
      await user.selectOptions(citySelector, 'bangalore');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/github/bangalore/30')
        );
      });

      // Step 2: Change time period
      const timePeriodButton = screen.getByTestId('time-period-60');
      await user.click(timePeriodButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/github/bangalore/60')
        );
      });

      // Step 3: Navigate to different pages
      const githubNavButton = screen.getByRole('button', { name: /GitHub Stats/i });
      await user.click(githubNavButton);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/github');
      });

      const comparisonNavButton = screen.getByRole('button', { name: /Comparison/i });
      await user.click(comparisonNavButton);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/comparison');
      });

      // Step 4: Export data
      const reportsNavButton = screen.getByRole('button', { name: /Reports/i });
      await user.click(reportsNavButton);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/reports');
      });

      const exportJsonButton = screen.getByRole('button', { name: /Export JSON/i });
      await user.click(exportJsonButton);

      // Step 5: Change theme
      const themeDropdown = screen.getByRole('button', { name: /Choose theme/i });
      await user.click(themeDropdown);

      const darkThemeOption = screen.getByRole('button', { name: /dark/i });
      await user.click(darkThemeOption);

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      });

      // Step 6: Verify state persistence
      const dashboardNavButton = screen.getByRole('button', { name: /Dashboard/i });
      await user.click(dashboardNavButton);

      await waitFor(() => {
        expect(window.location.pathname).toBe('/dashboard');
      });

      // Verify city and period are still selected
      const citySelectorsAfterNav = screen.getAllByLabelText(/Select City/i);
      expect(citySelectorsAfterNav[0]).toHaveValue('bangalore');

      const activePeriodButton = screen.getByTestId('time-period-60');
      expect(activePeriodButton).toHaveClass('btn-active');

      // Verify theme is still applied
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    test.skip('error recovery workflow: handle API errors, switch to working city, verify recovery', async () => {
      const user = userEvent.setup();
      
      // Start with API errors for specific city
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/cities')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCitiesData)
          });
        }
        if (url.includes('san-francisco')) {
          return Promise.reject(new Error('API Error for San Francisco'));
        }
        if (url.includes('london')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockGithubData)
          });
        }
        return Promise.reject(new Error('API Error'));
      });

      render(
        
          <App />
        
      );

      // Select problematic city
      const citySelector = screen.getByLabelText(/Select City/i);
      await user.selectOptions(citySelector, 'san-francisco');

      // Wait for error state
      await waitFor(() => {
        const errorElements = screen.queryAllByText(/error|failed|unavailable/i);
        expect(errorElements.length).toBeGreaterThan(0);
      });

      // Switch to working city
      await user.selectOptions(citySelector, 'london');

      // Verify recovery
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/github/london/30')
        );
      });
    });
  });
});