import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TabType } from '../types';

// Mock the auth context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      username: 'testuser',
      email: 'test@example.com',
      name: 'Test User'
    }
  })
}));

describe('Sidebar Component', () => {
  const mockProps = {
    activeTab: 'dashboard' as TabType,
    onTabChange: jest.fn(),
    collapsed: false,
    onToggleCollapse: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders navigation items', () => {
    render(
      <BrowserRouter>
        <Sidebar {...mockProps} />
      </BrowserRouter>
    );

    // Check for navigation items
    expect(screen.getByRole('menuitem', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText('GitHub Stats')).toBeInTheDocument();
    expect(screen.getByText('Crypto Prices')).toBeInTheDocument();
    expect(screen.getByText('Comparison')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  test('calls onTabChange when navigation item is clicked', () => {
    render(
      <BrowserRouter>
        <Sidebar {...mockProps} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('GitHub Stats'));
    expect(mockProps.onTabChange).toHaveBeenCalledWith('github');
  });

  test('shows correct active state', () => {
    render(
      <BrowserRouter>
        <Sidebar {...mockProps} />
      </BrowserRouter>
    );

    const dashboardButton = screen.getByRole('menuitem', { name: /dashboard/i });
    expect(dashboardButton).toHaveClass('bg-primary');
  });

  test('calls onToggleCollapse when collapse button is clicked', () => {
    render(
      <BrowserRouter>
        <Sidebar {...mockProps} />
      </BrowserRouter>
    );

    const collapseButton = screen.getByLabelText('Collapse sidebar');
    fireEvent.click(collapseButton);
    expect(mockProps.onToggleCollapse).toHaveBeenCalled();
  });

  test('displays user information', () => {
    render(
      <BrowserRouter>
        <Sidebar {...mockProps} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
});
