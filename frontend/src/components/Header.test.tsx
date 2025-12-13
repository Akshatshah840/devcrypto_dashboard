import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';

describe('Header Component', () => {
  const mockProps = {
    currentTheme: 'light',
    onThemeChange: jest.fn(),
    sidebarCollapsed: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders header title', () => {
    render(<Header {...mockProps} />);
    
    expect(screen.getByText('GitHub Activity + Air Quality Dashboard')).toBeInTheDocument();
  });

  test('renders theme switcher', () => {
    render(<Header {...mockProps} />);
    
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  test('calls onThemeChange when theme button is clicked', () => {
    render(<Header {...mockProps} />);
    
    const darkButton = screen.getByLabelText('Switch to Dark theme');
    fireEvent.click(darkButton);
    expect(mockProps.onThemeChange).toHaveBeenCalledWith('dark');
  });

  test('shows active theme correctly', () => {
    render(<Header {...mockProps} />);
    
    const lightButton = screen.getByLabelText('Switch to Light theme');
    expect(lightButton).toHaveClass('btn-active');
    expect(lightButton).toHaveAttribute('aria-pressed', 'true');
  });
});