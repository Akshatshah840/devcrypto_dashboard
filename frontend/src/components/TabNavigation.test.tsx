import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TabNavigation } from './TabNavigation';
import { TabType } from '../types';

describe('TabNavigation Component', () => {
  const mockProps = {
    activeTab: 'dashboard' as TabType,
    onTabChange: jest.fn(),
    sidebarCollapsed: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders desktop tabs', () => {
    render(
      <BrowserRouter>
        <TabNavigation {...mockProps} />
      </BrowserRouter>
    );
    
    // Check for tab elements (now using tab role for accessibility)
    const tabs = screen.getAllByRole('tab');
    const tabTexts = tabs.map(tab => tab.textContent);
    
    expect(tabTexts.some(text => text?.includes('Dashboard'))).toBe(true);
    expect(tabTexts.some(text => text?.includes('Cities'))).toBe(true);
    expect(tabTexts.some(text => text?.includes('GitHub Stats'))).toBe(true);
    expect(tabTexts.some(text => text?.includes('Air Quality'))).toBe(true);
    expect(tabTexts.some(text => text?.includes('Comparison'))).toBe(true);
    expect(tabTexts.some(text => text?.includes('Reports'))).toBe(true);
  });

  test('calls onTabChange when tab is clicked', () => {
    render(
      <BrowserRouter>
        <TabNavigation {...mockProps} />
      </BrowserRouter>
    );
    
    // Find the Cities tab in the desktop tabs
    const tabs = screen.getAllByRole('tab');
    const citiesTab = tabs.find(tab => tab.textContent?.includes('Cities'));
    
    expect(citiesTab).toBeDefined();
    fireEvent.click(citiesTab!);
    expect(mockProps.onTabChange).toHaveBeenCalledWith('cities');
  });

  test('shows active tab correctly', () => {
    render(
      <BrowserRouter>
        <TabNavigation {...mockProps} />
      </BrowserRouter>
    );
    
    // Find the active Dashboard tab in desktop tabs
    const tabs = screen.getAllByRole('tab');
    const dashboardTab = tabs.find(tab => 
      tab.textContent?.includes('Dashboard') && 
      tab.getAttribute('aria-selected') === 'true'
    );
    
    expect(dashboardTab).toBeDefined();
    expect(dashboardTab).toHaveClass('border-primary');
    expect(dashboardTab).toHaveClass('text-primary');
  });

  test('renders breadcrumb with current tab', () => {
    render(
      <BrowserRouter>
        <TabNavigation {...mockProps} />
      </BrowserRouter>
    );
    
    // Look for breadcrumb specifically
    const breadcrumbElements = screen.getAllByText('Dashboard');
    expect(breadcrumbElements.length).toBeGreaterThan(0);
  });

  test('handles different active tabs', () => {
    const propsWithGithubTab = {
      ...mockProps,
      activeTab: 'github' as TabType,
    };
    
    render(
      <BrowserRouter>
        <TabNavigation {...propsWithGithubTab} />
      </BrowserRouter>
    );
    
    // Find the active GitHub Stats tab in desktop tabs
    const tabs = screen.getAllByRole('tab');
    const githubTab = tabs.find(tab => 
      tab.textContent?.includes('GitHub Stats') && 
      tab.getAttribute('aria-selected') === 'true'
    );
    
    expect(githubTab).toBeDefined();
    expect(githubTab).toHaveClass('border-primary');
    expect(githubTab).toHaveClass('text-primary');
  });
});