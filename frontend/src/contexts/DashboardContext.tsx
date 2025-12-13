import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { TimePeriod, TabType, DataSource, LoadingState, ErrorState } from '../types';

// State interface
interface DashboardState {
  selectedCity: string;
  selectedPeriod: TimePeriod;
  activeTab: TabType;
  currentTheme: string;
  sidebarCollapsed: boolean;
  loading: LoadingState;
  error: ErrorState;
  dataSource: {
    github: DataSource;
    crypto: DataSource;
    correlation: DataSource;
  };
}

// Action types
type DashboardAction =
  | { type: 'SET_SELECTED_CITY'; payload: string }
  | { type: 'SET_SELECTED_PERIOD'; payload: TimePeriod }
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }
  | { type: 'SET_CURRENT_THEME'; payload: string }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: Partial<LoadingState> }
  | { type: 'SET_ERROR'; payload: Partial<ErrorState> }
  | { type: 'SET_DATA_SOURCE'; payload: Partial<DashboardState['dataSource']> }
  | { type: 'RESET_ERRORS' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: DashboardState = {
  selectedCity: '',
  selectedPeriod: 30,
  activeTab: 'dashboard',
  currentTheme: 'light',
  sidebarCollapsed: false,
  loading: {
    github: false,
    crypto: false,
    correlation: false,
    export: false
  },
  error: {
    github: null,
    crypto: null,
    correlation: null,
    export: null
  },
  dataSource: {
    github: 'live',
    crypto: 'mock',
    correlation: 'mock'
  }
};

// Reducer function
const dashboardReducer = (state: DashboardState, action: DashboardAction): DashboardState => {
  switch (action.type) {
    case 'SET_SELECTED_CITY':
      return {
        ...state,
        selectedCity: action.payload,
        // Reset errors when city changes
        error: initialState.error
      };
    
    case 'SET_SELECTED_PERIOD':
      return {
        ...state,
        selectedPeriod: action.payload,
        // Reset errors when period changes
        error: initialState.error
      };
    
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload
      };
    
    case 'SET_CURRENT_THEME':
      return {
        ...state,
        currentTheme: action.payload
      };
    
    case 'SET_SIDEBAR_COLLAPSED':
      return {
        ...state,
        sidebarCollapsed: action.payload
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          ...action.payload
        }
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: {
          ...state.error,
          ...action.payload
        }
      };
    
    case 'SET_DATA_SOURCE':
      return {
        ...state,
        dataSource: {
          ...state.dataSource,
          ...action.payload
        }
      };
    
    case 'RESET_ERRORS':
      return {
        ...state,
        error: initialState.error
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
};

// Context interface
interface DashboardContextType {
  state: DashboardState;
  actions: {
    setSelectedCity: (city: string) => void;
    setSelectedPeriod: (period: TimePeriod) => void;
    setActiveTab: (tab: TabType) => void;
    setCurrentTheme: (theme: string) => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setLoading: (loading: Partial<LoadingState>) => void;
    setError: (error: Partial<ErrorState>) => void;
    setDataSource: (source: Partial<DashboardState['dataSource']>) => void;
    resetErrors: () => void;
    resetState: () => void;
  };
}

// Create context
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Provider component
interface DashboardProviderProps {
  children: ReactNode;
  initialCity?: string;
  initialPeriod?: TimePeriod;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  children,
  initialCity = '',
  initialPeriod = 30
}) => {
  const [state, dispatch] = useReducer(dashboardReducer, {
    ...initialState,
    selectedCity: initialCity,
    selectedPeriod: initialPeriod
  });

  // Action creators
  const actions = {
    setSelectedCity: useCallback((city: string) => {
      dispatch({ type: 'SET_SELECTED_CITY', payload: city });
    }, []),

    setSelectedPeriod: useCallback((period: TimePeriod) => {
      dispatch({ type: 'SET_SELECTED_PERIOD', payload: period });
    }, []),

    setActiveTab: useCallback((tab: TabType) => {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
    }, []),

    setCurrentTheme: useCallback((theme: string) => {
      dispatch({ type: 'SET_CURRENT_THEME', payload: theme });
      // Persist theme to localStorage
      localStorage.setItem('dashboard-theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }, []),

    setSidebarCollapsed: useCallback((collapsed: boolean) => {
      dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: collapsed });
    }, []),

    setLoading: useCallback((loading: Partial<LoadingState>) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    }, []),

    setError: useCallback((error: Partial<ErrorState>) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    }, []),

    setDataSource: useCallback((source: Partial<DashboardState['dataSource']>) => {
      dispatch({ type: 'SET_DATA_SOURCE', payload: source });
    }, []),

    resetErrors: useCallback(() => {
      dispatch({ type: 'RESET_ERRORS' });
    }, []),

    resetState: useCallback(() => {
      dispatch({ type: 'RESET_STATE' });
    }, [])
  };

  const contextValue: DashboardContextType = {
    state,
    actions
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

// Custom hook to use the dashboard context
export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

// Selector hooks for specific state slices
export const useSelectedCity = () => {
  const { state, actions } = useDashboard();
  return {
    selectedCity: state.selectedCity,
    setSelectedCity: actions.setSelectedCity
  };
};

export const useSelectedPeriod = () => {
  const { state, actions } = useDashboard();
  return {
    selectedPeriod: state.selectedPeriod,
    setSelectedPeriod: actions.setSelectedPeriod
  };
};

export const useActiveTab = () => {
  const { state, actions } = useDashboard();
  return {
    activeTab: state.activeTab,
    setActiveTab: actions.setActiveTab
  };
};

export const useTheme = () => {
  const { state, actions } = useDashboard();
  return {
    currentTheme: state.currentTheme,
    setCurrentTheme: actions.setCurrentTheme
  };
};

export const useSidebar = () => {
  const { state, actions } = useDashboard();
  return {
    sidebarCollapsed: state.sidebarCollapsed,
    setSidebarCollapsed: actions.setSidebarCollapsed
  };
};

export const useLoadingState = () => {
  const { state, actions } = useDashboard();
  return {
    loading: state.loading,
    setLoading: actions.setLoading
  };
};

export const useErrorState = () => {
  const { state, actions } = useDashboard();
  return {
    error: state.error,
    setError: actions.setError,
    resetErrors: actions.resetErrors
  };
};

export const useDataSource = () => {
  const { state, actions } = useDashboard();
  return {
    dataSource: state.dataSource,
    setDataSource: actions.setDataSource
  };
};