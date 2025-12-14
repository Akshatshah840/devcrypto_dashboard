import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';

describe('Header Component', () => {
  const mockProps = {
    currentTheme: 'light',
    onThemeChange: jest.fn(),
    selectedPeriod: 30 as const,
    onPeriodChange: jest.fn(),
    sidebarCollapsed: false,
    onLogout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders header with logo', () => {
    render(<Header {...mockProps} />);

    // Header should exist
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  test('renders header title when sidebar is not collapsed', () => {
    render(<Header {...mockProps} sidebarCollapsed={false} />);

    expect(screen.getByText('DevCrypto Analytics')).toBeInTheDocument();
  });

  test('hides title when sidebar is collapsed', () => {
    render(<Header {...mockProps} sidebarCollapsed={true} />);

    // Title should still exist but be hidden on large screens
    const title = screen.queryByText('DevCrypto Analytics');
    // When sidebar is collapsed, title is hidden via CSS class
    if (title) {
      expect(title).toHaveClass('hidden');
    }
  });

  test('displays current period', () => {
    render(<Header {...mockProps} selectedPeriod={30} />);

    // The period is shown in the dropdown summary - should have at least one "30 days" text
    const periodTexts = screen.getAllByText('30 days');
    expect(periodTexts.length).toBeGreaterThan(0);
  });

  test('renders logout button when onLogout is provided', () => {
    render(<Header {...mockProps} />);

    const logoutButton = screen.getByTitle('Logout');
    expect(logoutButton).toBeInTheDocument();
  });

  test('calls onLogout when logout button is clicked', () => {
    render(<Header {...mockProps} />);

    const logoutButton = screen.getByTitle('Logout');
    fireEvent.click(logoutButton);

    expect(mockProps.onLogout).toHaveBeenCalledTimes(1);
  });

  test('does not render logout button when onLogout is not provided', () => {
    const propsWithoutLogout = { ...mockProps, onLogout: undefined };
    render(<Header {...propsWithoutLogout} />);

    const logoutButton = screen.queryByTitle('Logout');
    expect(logoutButton).not.toBeInTheDocument();
  });
});
