import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TabType } from '../types';

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
    
    // Check for navigation items by role (now using menuitem role for accessibility)
    expect(screen.getByRole('menuitem', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText('Cities')).toBeInTheDocument();
    expect(screen.getByText('GitHub Stats')).toBeInTheDocument();
    expect(screen.getByText('Air Quality')).toBeInTheDocument();
    expect(screen.getByText('Comparison')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  test('calls onTabChange when navigation item is clicked', () => {
    render(
      <BrowserRouter>
        <Sidebar {...mockProps} />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText('Cities'));
    expect(mockProps.onTabChange).toHaveBeenCalledWith('cities');
  });

  test('calls onToggleCollapse when toggle button is clicked', () => {
    render(
      <BrowserRouter>
        <Sidebar {...mockProps} />
      </BrowserRouter>
    );
    
    const toggleButton = screen.getByLabelText('Collapse sidebar');
    fireEvent.click(toggleButton);
    expect(mockProps.onToggleCollapse).toHaveBeenCalled();
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
});