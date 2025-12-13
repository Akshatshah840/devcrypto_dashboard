/**
 * Property-based test for UI state synchronization
 * **Feature: github-air-quality-dashboard, Property 9: UI state synchronization**
 * **Validates: Requirements 4.2**
 * 
 * Property 9: UI state synchronization
 * For any time period selection, all charts and data displays should update simultaneously to reflect the chosen timeframe
 */

import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import { BrowserRouter } from 'react-router-dom';
import { DashboardProvider } from '../contexts/DashboardContext';
import { CitySelector, TimePeriodSelector } from '../components';
import { TimePeriod } from '../types';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Test component that displays current state
const StateDisplayComponent: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<string>('san-francisco');
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(30);

  return (
    <div>
      <div data-testid="current-city">{selectedCity}</div>
      <div data-testid="current-period">{selectedPeriod}</div>
      
      <CitySelector
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      />
      
      <TimePeriodSelector
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />
      
      {/* Mock data displays that should reflect the selected period */}
      <div data-testid="github-display">
        GitHub data for {selectedCity} - {selectedPeriod} days
      </div>
      <div data-testid="airquality-display">
        Air quality data for {selectedCity} - {selectedPeriod} days
      </div>
      <div data-testid="correlation-display">
        Correlation data for {selectedCity} - {selectedPeriod} days
      </div>
    </div>
  );
};

// Wrapper component with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <DashboardProvider>
      {children}
    </DashboardProvider>
  </BrowserRouter>
);

describe('UI State Synchronization Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios.create to return a mock instance
    const mockAxiosInstance = {
      get: jest.fn((url: string) => {
        if (url === '/cities') {
          return Promise.resolve({
            data: {
              success: true,
              data: [
                { id: 'san-francisco', name: 'San Francisco', country: 'USA' },
                { id: 'london', name: 'London', country: 'UK' },
                { id: 'bangalore', name: 'Bangalore', country: 'India' },
                { id: 'tokyo', name: 'Tokyo', country: 'Japan' },
                { id: 'seattle', name: 'Seattle', country: 'USA' },
                { id: 'berlin', name: 'Berlin', country: 'Germany' },
                { id: 'toronto', name: 'Toronto', country: 'Canada' },
                { id: 'singapore', name: 'Singapore', country: 'Singapore' },
                { id: 'sydney', name: 'Sydney', country: 'Australia' },
                { id: 'tel-aviv', name: 'Tel Aviv', country: 'Israel' },
              ],
              source: 'mock'
            }
          });
        }
        if (url.includes('/github/')) {
          return Promise.resolve({ data: { success: true, data: [], source: 'mock' } });
        }
        if (url.includes('/airquality/')) {
          return Promise.resolve({ data: { success: true, data: [], source: 'mock' } });
        }
        if (url.includes('/correlation/')) {
          return Promise.resolve({ data: { success: true, data: null, source: 'mock' } });
        }
        return Promise.reject(new Error('Unknown API endpoint'));
      }),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
  });

  // Generator for valid time periods
  const timePeriodArbitrary = fc.constantFrom(7, 14, 30, 60, 90);
  
  // Generator for valid city IDs
  const cityIdArbitrary = fc.constantFrom(
    'san-francisco', 'london', 'bangalore', 'tokyo', 'seattle',
    'berlin', 'toronto', 'singapore', 'sydney', 'tel-aviv'
  );

  /**
   * Property 9: UI state synchronization
   * For any time period selection, all charts and data displays should update simultaneously to reflect the chosen timeframe
   */
  it('should synchronize all UI elements when time period changes', () => {
    fc.assert(
      fc.property(timePeriodArbitrary, (newPeriod: TimePeriod) => {
        const { unmount } = render(
          <TestWrapper>
            <StateDisplayComponent />
          </TestWrapper>
        );

        try {
          // Get the time period button for the new period
          const periodButton = screen.getByTestId(`time-period-${newPeriod}`);
          
          // Click the time period button
          fireEvent.click(periodButton);

          // Verify that the current period display is updated
          const currentPeriodDisplay = screen.getByTestId('current-period');
          expect(currentPeriodDisplay).toHaveTextContent(newPeriod.toString());

          // Verify that all data displays reflect the new period
          const githubDisplay = screen.getByTestId('github-display');
          const airqualityDisplay = screen.getByTestId('airquality-display');
          const correlationDisplay = screen.getByTestId('correlation-display');

          expect(githubDisplay).toHaveTextContent(`${newPeriod} days`);
          expect(airqualityDisplay).toHaveTextContent(`${newPeriod} days`);
          expect(correlationDisplay).toHaveTextContent(`${newPeriod} days`);

          // Verify that the selected button has the correct styling
          expect(periodButton).toHaveClass('btn-primary');
          expect(periodButton).not.toHaveClass('btn-outline');

          // Verify that other period buttons are not selected
          const allPeriods = [7, 14, 30, 60, 90];
          allPeriods.forEach(period => {
            if (period !== newPeriod) {
              const otherButton = screen.getByTestId(`time-period-${period}`);
              expect(otherButton).toHaveClass('btn-outline');
            }
          });

          return true;
        } finally {
          unmount();
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: City selection should also synchronize across UI elements
   */
  it('should synchronize all UI elements when city changes', () => {
    fc.assert(
      fc.property(cityIdArbitrary, (newCityId: string) => {
        const { unmount } = render(
          <TestWrapper>
            <StateDisplayComponent />
          </TestWrapper>
        );

        try {
          // Get the city selector
          const citySelector = screen.getByTestId('city-selector');
          
          // Change the city selection
          fireEvent.change(citySelector, { target: { value: newCityId } });

          // Verify that the current city display is updated
          const currentCityDisplay = screen.getByTestId('current-city');
          expect(currentCityDisplay).toHaveTextContent(newCityId);

          // Verify that all data displays reflect the new city
          const githubDisplay = screen.getByTestId('github-display');
          const airqualityDisplay = screen.getByTestId('airquality-display');
          const correlationDisplay = screen.getByTestId('correlation-display');

          expect(githubDisplay).toHaveTextContent(`data for ${newCityId}`);
          expect(airqualityDisplay).toHaveTextContent(`data for ${newCityId}`);
          expect(correlationDisplay).toHaveTextContent(`data for ${newCityId}`);

          // Verify that the selector shows the correct value
          expect(citySelector).toHaveValue(newCityId);

          return true;
        } finally {
          unmount();
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Combined city and period changes should maintain synchronization
   */
  it('should maintain synchronization when both city and period change', () => {
    fc.assert(
      fc.property(
        cityIdArbitrary,
        timePeriodArbitrary,
        (newCityId: string, newPeriod: TimePeriod) => {
          const { unmount } = render(
            <TestWrapper>
              <StateDisplayComponent />
            </TestWrapper>
          );

          try {
            // Change city first
            const citySelector = screen.getByTestId('city-selector');
            fireEvent.change(citySelector, { target: { value: newCityId } });

            // Then change period
            const periodButton = screen.getByTestId(`time-period-${newPeriod}`);
            fireEvent.click(periodButton);

            // Verify both values are reflected in all displays
            const githubDisplay = screen.getByTestId('github-display');
            const airqualityDisplay = screen.getByTestId('airquality-display');
            const correlationDisplay = screen.getByTestId('correlation-display');

            const expectedText = `data for ${newCityId} - ${newPeriod} days`;
            expect(githubDisplay).toHaveTextContent(expectedText);
            expect(airqualityDisplay).toHaveTextContent(expectedText);
            expect(correlationDisplay).toHaveTextContent(expectedText);

            // Verify selectors show correct values
            expect(citySelector).toHaveValue(newCityId);
            expect(periodButton).toHaveClass('btn-primary');
            expect(periodButton).not.toHaveClass('btn-outline');

            return true;
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: State changes should be immediate (no async delays)
   */
  it('should update UI elements immediately without delays', () => {
    fc.assert(
      fc.property(timePeriodArbitrary, (newPeriod: TimePeriod) => {
        const { unmount } = render(
          <TestWrapper>
            <StateDisplayComponent />
          </TestWrapper>
        );

        try {
          const periodButton = screen.getByTestId(`time-period-${newPeriod}`);
          
          // Record time before click
          const startTime = Date.now();
          fireEvent.click(periodButton);
          
          // Verify immediate update (should not require waiting)
          const currentPeriodDisplay = screen.getByTestId('current-period');
          expect(currentPeriodDisplay).toHaveTextContent(newPeriod.toString());
          
          // Verify update happened quickly (within reasonable time)
          const updateTime = Date.now() - startTime;
          expect(updateTime).toBeLessThan(100); // Should be nearly instantaneous

          return true;
        } finally {
          unmount();
        }
      }),
      { numRuns: 50 } // Fewer runs for timing-sensitive test
    );
  });
});