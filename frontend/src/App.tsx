import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar, Header, ErrorBoundary, ToastProvider, OfflineBanner, useOnlineStatus, ProtectedRoute } from './components';
import { CustomCursor } from './components/CustomCursor';
import { DashboardProvider, useDashboard } from './contexts/DashboardContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import {
  Dashboard,
  GitHubStatsPage,
  CryptoPage,
  ComparisonPage,
  ReportsPage,
  LoginPage,
  SignupPage,
  ForgotPasswordPage
} from './pages';
import { TabType } from './types';
import { configureAmplify } from './config/amplify';

// Configure AWS Amplify
configureAmplify();

// Dashboard Layout component (for authenticated users)
function DashboardLayout() {
  const { state, actions } = useDashboard();
  const { logout } = useAuth();
  const {
    activeTab,
    currentTheme,
    sidebarCollapsed,
    selectedPeriod
  } = state;
  const {
    setActiveTab,
    setCurrentTheme,
    setSidebarCollapsed,
    setSelectedPeriod
  } = actions;

  const isOnline = useOnlineStatus();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme');
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDark ? 'dark' : 'light';
      setCurrentTheme(defaultTheme);
    }
  }, [setCurrentTheme]);

  // Handle sidebar collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarCollapsed]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Custom Cursor */}
      <CustomCursor />

      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-primary-content focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-focus"
      >
        Skip to main content
      </a>

      {/* Offline Banner */}
      <OfflineBanner isOnline={isOnline} />

      {/* Header - Fixed at top, full width */}
      <ErrorBoundary>
        <header role="banner" className="sticky top-0 z-50">
          <Header
            currentTheme={currentTheme}
            onThemeChange={setCurrentTheme}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            sidebarCollapsed={sidebarCollapsed}
            onLogout={logout}
          />
        </header>
      </ErrorBoundary>

      {/* Sidebar */}
      <ErrorBoundary>
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </ErrorBoundary>

      {/* Main content area */}
      <div className={`
        transition-all duration-300
        ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
      `}>
        {/* Main Content with Routes */}
        <main
          id="main-content"
          className="min-h-[calc(100vh-57px)]"
          role="main"
          aria-label="Dashboard content"
        >
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/github" element={<GitHubStatsPage />} />
              <Route path="/crypto" element={<CryptoPage />} />
              <Route path="/comparison" element={<ComparisonPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

// Auth pages wrapper with theme support
function AuthLayout({ children }: { children: React.ReactNode }) {
  // Initialize theme for auth pages
  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }, []);

  return (
    <>
      <CustomCursor />
      {children}
    </>
  );
}

// Main App component with routing
function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes (public) */}
      <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
      <Route path="/signup" element={<AuthLayout><SignupPage /></AuthLayout>} />
      <Route path="/forgot-password" element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />

      {/* Protected Dashboard Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardProvider initialCity="bangalore" initialPeriod={30}>
              <DashboardLayout />
            </DashboardProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

// Main App component with providers
function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
