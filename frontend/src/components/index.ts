/**
 * Core layout components for the GitHub Air Quality Dashboard
 * These components provide the main navigation and layout structure
 */

export { Sidebar } from './Sidebar';
export { Header } from './Header';
export { TabNavigation } from './TabNavigation';
export { CitySelector } from './CitySelector';
export { TimePeriodSelector } from './TimePeriodSelector';
export { CityCard } from './CityCard';

/**
 * Data visualization components for charts and graphs
 */
export { GitHubActivityChart } from './GitHubActivityChart';
export { AirQualityChart } from './AirQualityChart';
export { CorrelationChart } from './CorrelationChart';

/**
 * Error handling and user feedback components
 */
export { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';
export { ToastProvider, useToast, useToastHelpers } from './Toast';
export { 
  Skeleton, 
  ChartSkeleton, 
  CardSkeleton, 
  TableSkeleton, 
  DashboardSkeleton, 
  ListSkeleton, 
  TextSkeleton 
} from './LoadingSkeleton';
export {
  DataSourceIndicator,
  OfflineBanner,
  useOnlineStatus
} from './DataSourceIndicator';

/**
 * Authentication components
 */
export { ProtectedRoute } from './ProtectedRoute';