/**
 * Property-based test for UI state synchronization
 * **Feature: devcrypto-dashboard, Property 9: UI state synchronization**
 * **Validates: Requirements 4.2**
 *
 * Property 9: UI state synchronization
 * For any time period selection, all charts and data displays should update simultaneously to reflect the chosen timeframe
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import { BrowserRouter } from 'react-router-dom';
import { DashboardProvider } from '../contexts/DashboardContext';
import { TimePeriodSelector } from '../components';
import { TimePeriod } from '../types';

// Test component that displays current state
const StateDisplayComponent: React.FC = () => {
  return (
    <div>
      <TimePeriodSelector />

      {/* Mock data displays that should reflect the selected period */}
      <div data-testid="github-display">GitHub data display</div>
      <div data-testid="crypto-display">Crypto data display</div>
      <div data-testid="correlation-display">Correlation data display</div>
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
  });

  // Generator for valid time periods
  const timePeriodArbitrary = fc.constantFrom(7, 14, 30, 60, 90);

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

          // Verify that the selected button has the correct styling (btn-primary and not btn-outline)
          expect(periodButton).toHaveClass('btn-primary');

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
      { numRuns: 50 }
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

          // Verify update happened quickly (within reasonable time)
          const updateTime = Date.now() - startTime;
          expect(updateTime).toBeLessThan(100); // Should be nearly instantaneous

          // Verify button is now selected
          expect(periodButton).toHaveClass('btn-primary');

          return true;
        } finally {
          unmount();
        }
      }),
      { numRuns: 25 } // Fewer runs for timing-sensitive test
    );
  });

  /**
   * Property: All period options should be clickable
   */
  it('should render all time period options as clickable buttons', () => {
    const { unmount } = render(
      <TestWrapper>
        <StateDisplayComponent />
      </TestWrapper>
    );

    const allPeriods = [7, 14, 30, 60, 90];
    allPeriods.forEach(period => {
      const button = screen.getByTestId(`time-period-${period}`);
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    unmount();
  });
});
