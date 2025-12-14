import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock AWS Amplify
jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn()
  }
}));

// Mock the auth context
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    signIn: jest.fn(),
    signOut: jest.fn()
  })
}));

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders app without crashing', () => {
    render(<App />);
    // The app should render without throwing an error
    expect(document.body).toBeInTheDocument();
  });

  test('renders login page for unauthenticated users', () => {
    render(<App />);
    // Should show login page - check for "Sign up" link which is always visible
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });
});
