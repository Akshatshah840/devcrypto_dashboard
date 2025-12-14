/**
 * Property-based tests for data visualization rendering
 * **Feature: devcrypto-dashboard, Property 2: Data visualization rendering**
 * **Validates: Requirements 1.2, 2.2, 3.2, 3.3**
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { GitHubActivityChart } from './GitHubActivityChart';
import { CorrelationChart } from './CorrelationChart';

// Clean up after each test to prevent DOM pollution
afterEach(cleanup);

// Mock Recharts components to avoid canvas rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  ScatterChart: ({ children }: { children: React.ReactNode }) => <div data-testid="scatter-chart">{children}</div>,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div data-testid="composed-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Area: () => <div data-testid="area" />,
  Scatter: () => <div data-testid="scatter" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
  Cell: () => <div data-testid="cell" />
}));

// Generators for GitHub activity test data
const githubActivityArbitrary = fc.record({
  date: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString().split('T')[0]),
  commits: fc.integer({ min: 0, max: 1000 }),
  stars: fc.integer({ min: 0, max: 10000 }),
  pullRequests: fc.integer({ min: 0, max: 100 }),
  contributors: fc.integer({ min: 1, max: 500 })
});

describe('Data Visualization Rendering Property Tests', () => {
  describe('GitHubActivityChart', () => {
    it('should render chart for any valid GitHub activity dataset', () => {
      fc.assert(
        fc.property(
          fc.array(githubActivityArbitrary, { minLength: 1, maxLength: 10 }),
          (data) => {
            const { unmount } = render(
              <GitHubActivityChart
                data={data}
                loading={false}
                error={null}
              />
            );

            try {
              // Should render the chart container
              expect(screen.getByTestId('responsive-container')).toBeInTheDocument();

              // Should render a line chart
              expect(screen.getByTestId('line-chart')).toBeInTheDocument();

              // Should render required visual components
              expect(screen.getByTestId('x-axis')).toBeInTheDocument();
              expect(screen.getByTestId('y-axis')).toBeInTheDocument();
              expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();

              return true;
            } finally {
              unmount();
              cleanup();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle loading state appropriately', () => {
      render(
        <GitHubActivityChart
          data={[]}
          loading={true}
          error={null}
        />
      );
      // Should show loading state (skeleton or spinner)
      const container = document.querySelector('.animate-pulse, .skeleton, .loading');
      expect(container).toBeTruthy();
      cleanup();
    });

    it('should handle error state appropriately', () => {
      render(
        <GitHubActivityChart
          data={[]}
          loading={false}
          error="Test error"
        />
      );
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      cleanup();
    });

    it('should handle empty data state appropriately', () => {
      render(
        <GitHubActivityChart
          data={[]}
          loading={false}
          error={null}
        />
      );
      expect(screen.getByText(/no.*data/i)).toBeInTheDocument();
    });
  });

  describe('CorrelationChart', () => {
    it('should render chart for valid correlation data', () => {
      const testGithubData = [
        { date: '2024-01-01', commits: 10, stars: 5, pullRequests: 2, contributors: 3 },
        { date: '2024-01-02', commits: 15, stars: 8, pullRequests: 3, contributors: 4 }
      ];

      const testCryptoData = [
        { date: '2024-01-01', price: 45000, volume: 1000000, marketCap: 800000000000, change24h: 2.5 },
        { date: '2024-01-02', date: '2024-01-02', price: 46000, volume: 1100000, marketCap: 850000000000, change24h: 3.0 }
      ];

      render(
        <CorrelationChart
          githubData={testGithubData}
          cryptoData={testCryptoData}
          correlationData={{
            coefficient: 0.75,
            dataPoints: 2,
            period: 7
          }}
          loading={false}
          error={null}
        />
      );

      // Should render the chart container
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should handle loading state appropriately', () => {
      render(
        <CorrelationChart
          githubData={[]}
          cryptoData={[]}
          correlationData={null}
          loading={true}
          error={null}
        />
      );
      // Should show loading state
      const container = document.querySelector('.animate-pulse, .skeleton, .loading');
      expect(container).toBeTruthy();
      cleanup();
    });

    it('should handle error state appropriately', () => {
      render(
        <CorrelationChart
          githubData={[]}
          cryptoData={[]}
          correlationData={null}
          loading={false}
          error="Test error"
        />
      );
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });
  });
});
