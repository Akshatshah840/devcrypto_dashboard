/**
 * Core layout components for DevCrypto Analytics Dashboard
 * These components provide the main navigation and layout structure
 */

export { Sidebar } from './Sidebar';
export { Header } from './Header';
export { TabNavigation } from './TabNavigation';
export { TimePeriodSelector } from './TimePeriodSelector';

/**
 * Data visualization components for charts and graphs
 */
export { GitHubActivityChart } from './GitHubActivityChart';
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