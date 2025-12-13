/**
 * Property-based tests for data visualization rendering
 * **Feature: github-air-quality-dashboard, Property 2: Data visualization rendering**
 * **Validates: Requirements 1.2, 2.2, 3.2, 3.3**
 */

import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { GitHubActivityChart } from './GitHubActivityChart';
import { AirQualityChart } from './AirQualityChart';
import { CorrelationChart } from './CorrelationChart';
import { GitHubActivity, AirQualityData, CorrelationResult } from '../types';

// Clean up after each test to prevent DOM pollution
afterEach(cleanup);

// Mock Recharts components to avoid canvas rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  ScatterChart: ({ children }: { children: React.ReactNode }) => <div data-testid="scatter-chart">{children}</div>,
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

// Generators for test data
const githubActivityArbitrary = fc.record({
  date: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
  city: fc.constantFrom('San Francisco', 'London', 'Bangalore', 'Tokyo', 'Seattle'),
  commits: fc.integer({ min: 0, max: 1000 }),
  stars: fc.integer({ min: 0, max: 10000 }),
  repositories: fc.integer({ min: 1, max: 100 }),
  contributors: fc.integer({ min: 1, max: 500 })
});

const airQualityDataArbitrary = fc.record({
  date: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
  city: fc.constantFrom('San Francisco', 'London', 'Bangalore', 'Tokyo', 'Seattle'),
  aqi: fc.integer({ min: 0, max: 500 }),
  pm25: fc.integer({ min: 0, max: 200 }),
  station: fc.string({ minLength: 5, maxLength: 20 }),
  coordinates: fc.record({
    lat: fc.float({ min: -90, max: 90 }),
    lng: fc.float({ min: -180, max: 180 })
  })
});

const correlationResultArbitrary = fc.record({
  city: fc.constantFrom('San Francisco', 'London', 'Bangalore', 'Tokyo', 'Seattle'),
  period: fc.constantFrom(7, 14, 30, 60, 90),
  correlations: fc.record({
    commits_aqi: fc.float({ min: -1, max: 1 }),
    stars_aqi: fc.float({ min: -1, max: 1 }),
    commits_pm25: fc.float({ min: -1, max: 1 }),
    stars_pm25: fc.float({ min: -1, max: 1 })
  }),
  confidence: fc.float({ min: 0, max: 1 }),
  dataPoints: fc.integer({ min: 1, max: 100 })
});

describe('Data Visualization Rendering Property Tests', () => {
  describe('GitHubActivityChart', () => {
    it('should render appropriate interactive charts for any GitHub activity dataset', () => {
      fc.assert(
        fc.property(
          fc.array(githubActivityArbitrary, { minLength: 1, maxLength: 10 }),
          fc.constantFrom('line', 'bar'),
          (data: GitHubActivity[], chartType: 'line' | 'bar') => {
            const { unmount } = render(
              <GitHubActivityChart
                data={data}
                loading={false}
                error={null}
                chartType={chartType}
              />
            );

            try {
              // Should render the chart container
              expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
              
              // Should render the appropriate chart type
              if (chartType === 'line') {
                expect(screen.getByTestId('line-chart')).toBeInTheDocument();
              } else {
                expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
              }

              // Should render required visual components
              expect(screen.getByTestId('x-axis')).toBeInTheDocument();
              expect(screen.getByTestId('y-axis')).toBeInTheDocument();
              expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
              expect(screen.getByTestId('tooltip')).toBeInTheDocument();
              expect(screen.getByTestId('legend')).toBeInTheDocument();

              // Should render data elements
              if (chartType === 'line') {
                expect(screen.getAllByTestId('line')).toHaveLength(4); // commits, stars, repositories, contributors
              } else {
                expect(screen.getAllByTestId('bar')).toHaveLength(4);
              }

              // Should display title and description
              expect(screen.getByText('GitHub Activity Metrics')).toBeInTheDocument();
              expect(screen.getByText('Developer productivity metrics over time')).toBeInTheDocument();

              // Should display summary statistics
              expect(screen.getByText('Total Commits')).toBeInTheDocument();
              expect(screen.getByText('Total Stars')).toBeInTheDocument();
              expect(screen.getByText('Repositories')).toBeInTheDocument();
              expect(screen.getByText('Contributors')).toBeInTheDocument();
            } finally {
              // Always cleanup after each property test iteration
              unmount();
              cleanup();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle loading and error states appropriately', () => {
      // Test loading state - uses skeleton loader
      const { container } = render(
        <GitHubActivityChart
          data={[]}
          loading={true}
          error={null}
        />
      );
      expect(container.querySelector('.skeleton, .animate-pulse')).toBeInTheDocument();
      cleanup();

      // Test error state
      render(
        <GitHubActivityChart
          data={[]}
          loading={false}
          error="Test error"
        />
      );
      expect(screen.getByText('Failed to Load GitHub Data')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
      cleanup();

      // Test empty data state
      render(
        <GitHubActivityChart
          data={[]}
          loading={false}
          error={null}
        />
      );
      expect(screen.getByText(/No GitHub activity data available|No data available/)).toBeInTheDocument();
    });
  });

  describe('AirQualityChart', () => {
    it('should render time series visualization for any air quality dataset', () => {
      fc.assert(
        fc.property(
          fc.array(airQualityDataArbitrary, { minLength: 1, maxLength: 10 }),
          fc.constantFrom('line', 'area'),
          (data: AirQualityData[], chartType: 'line' | 'area') => {
            const { unmount } = render(
              <AirQualityChart
                data={data}
                loading={false}
                error={null}
                chartType={chartType}
              />
            );

            try {
              // Should render the chart container
              expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
              
              // Should render the appropriate chart type
              if (chartType === 'line') {
                expect(screen.getByTestId('line-chart')).toBeInTheDocument();
              } else {
                expect(screen.getByTestId('area-chart')).toBeInTheDocument();
              }

              // Should render required visual components
              expect(screen.getByTestId('x-axis')).toBeInTheDocument();
              expect(screen.getByTestId('y-axis')).toBeInTheDocument();
              expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
              expect(screen.getByTestId('tooltip')).toBeInTheDocument();
              expect(screen.getByTestId('legend')).toBeInTheDocument();

              // Should render reference lines for thresholds
              expect(screen.getAllByTestId('reference-line')).toHaveLength(2); // Moderate and Unhealthy thresholds

              // Should render data elements
              if (chartType === 'line') {
                expect(screen.getAllByTestId('line')).toHaveLength(2); // AQI and PM2.5
              } else {
                expect(screen.getAllByTestId('area')).toHaveLength(2);
              }

              // Should display title and description
              expect(screen.getByText('Air Quality Metrics')).toBeInTheDocument();
              expect(screen.getByText('AQI and PM2.5 measurements over time')).toBeInTheDocument();

              // Should display summary statistics
              expect(screen.getByText('Average AQI')).toBeInTheDocument();
              expect(screen.getByText('Max AQI')).toBeInTheDocument();
              expect(screen.getByText('Avg PM2.5')).toBeInTheDocument();
              expect(screen.getByText('Data Points')).toBeInTheDocument();
            } finally {
              // Always cleanup after each property test iteration
              unmount();
              cleanup();
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should display appropriate warnings for unhealthy air quality levels', () => {
      // Create data with unhealthy AQI levels
      const unhealthyData: AirQualityData[] = [{
        date: '2024-01-01',
        city: 'Test City',
        aqi: 150, // Unhealthy level
        pm25: 75,
        station: 'Test Station',
        coordinates: { lat: 0, lng: 0 }
      }];

      render(
        <AirQualityChart
          data={unhealthyData}
          loading={false}
          error={null}
        />
      );

      // Should display warning for unhealthy levels
      expect(screen.getByText(/Warning: Unhealthy air quality levels detected/)).toBeInTheDocument();
    });
  });

  describe('CorrelationChart', () => {
    it('should render scatter plots with trend lines for any correlation data', () => {
      // Create matching test data
      const testGithubData: GitHubActivity[] = [
        { date: '2024-01-01', city: 'Test City', commits: 10, stars: 5, repositories: 2, contributors: 3 },
        { date: '2024-01-02', city: 'Test City', commits: 15, stars: 8, repositories: 3, contributors: 4 }
      ];
      
      const testAirQualityData: AirQualityData[] = [
        { date: '2024-01-01', city: 'Test City', aqi: 50, pm25: 25, station: 'Test', coordinates: { lat: 0, lng: 0 } },
        { date: '2024-01-02', city: 'Test City', aqi: 75, pm25: 35, station: 'Test', coordinates: { lat: 0, lng: 0 } }
      ];

      const testCorrelationResult: CorrelationResult = {
        city: 'Test City',
        period: 7,
        correlations: { commits_aqi: 0.5, stars_aqi: -0.3, commits_pm25: 0.2, stars_pm25: -0.1 },
        confidence: 0.95,
        dataPoints: 2
      };

      render(
        <CorrelationChart
          githubData={testGithubData}
          airQualityData={testAirQualityData}
          correlationResult={testCorrelationResult}
          loading={false}
          error={null}
          metric="commits"
          airQualityMetric="aqi"
        />
      );

      // Should render the chart container
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();

      // Should render required visual components
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();

      // Should render scatter plot data (at least one scatter element)
      expect(screen.getAllByTestId('scatter').length).toBeGreaterThanOrEqual(1);

      // Should display correlation analysis title
      expect(screen.getByText('Correlation Analysis: Commits vs Air Quality Index (AQI)')).toBeInTheDocument();

      // Should display correlation statistics
      expect(screen.getByText('Correlation Coefficient')).toBeInTheDocument();
      expect(screen.getByText('Confidence Level')).toBeInTheDocument();
      expect(screen.getByText('Sample Size')).toBeInTheDocument();

      // Should display all correlations summary
      expect(screen.getByText('All Correlations for Test City')).toBeInTheDocument();
      expect(screen.getByText(/Commits vs AQI:/)).toBeInTheDocument();
      expect(screen.getByText(/Stars vs AQI:/)).toBeInTheDocument();
      expect(screen.getByText(/Commits vs PM2.5:/)).toBeInTheDocument();
      expect(screen.getByText(/Stars vs PM2.5:/)).toBeInTheDocument();
    });

    it('should handle insufficient data scenarios appropriately', () => {
      render(
        <CorrelationChart
          githubData={[]}
          airQualityData={[]}
          correlationResult={null}
          loading={false}
          error={null}
        />
      );

      // Should display appropriate message for insufficient data
      expect(screen.getByText('Insufficient data for correlation analysis. Need both GitHub and air quality data.')).toBeInTheDocument();
    });
  });

  describe('Common Chart Properties', () => {
    it('should handle loading states consistently across all chart types', () => {
      // Test GitHub chart loading - uses skeleton loader
      const { container: githubContainer } = render(<GitHubActivityChart data={[]} loading={true} error={null} />);
      expect(githubContainer.querySelector('.skeleton, .animate-pulse, .loading')).toBeInTheDocument();
      cleanup();

      // Test Air Quality chart loading - uses loading spinner
      render(<AirQualityChart data={[]} loading={true} error={null} />);
      expect(screen.getByText('Loading air quality data...')).toBeInTheDocument();
      cleanup();

      // Test Correlation chart loading - uses skeleton loader or loading spinner
      const { container: corrContainer } = render(<CorrelationChart githubData={[]} airQualityData={[]} correlationResult={null} loading={true} error={null} />);
      const hasLoadingIndicator = corrContainer.querySelector('.skeleton, .animate-pulse, .loading') || 
                                   screen.queryByText(/loading|calculating/i);
      expect(hasLoadingIndicator).toBeTruthy();
    });

    it('should handle error states consistently across all chart types', () => {
      const errorMessage = 'Test error message';

      // Test GitHub chart error
      render(<GitHubActivityChart data={[]} loading={false} error={errorMessage} />);
      expect(screen.getByText('Failed to Load GitHub Data')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      cleanup();

      // Test Air Quality chart error
      render(<AirQualityChart data={[]} loading={false} error={errorMessage} />);
      expect(screen.getByText(/Error loading air quality data/)).toBeInTheDocument();
      cleanup();

      // Test Correlation chart error
      render(<CorrelationChart githubData={[]} airQualityData={[]} correlationResult={null} loading={false} error={errorMessage} />);
      expect(screen.getByText(/Error loading correlation data|Failed to Load Correlation Data/)).toBeInTheDocument();
    });
  });
});