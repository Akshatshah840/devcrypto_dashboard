import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { TimePeriodSelector } from './TimePeriodSelector';
import { DashboardProvider } from '../contexts/DashboardContext';

// Wrapper component with required providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <DashboardProvider>
      {children}
    </DashboardProvider>
  </BrowserRouter>
);

describe('TimePeriodSelector', () => {
  const mockOnPeriodChange = jest.fn();

  beforeEach(() => {
    mockOnPeriodChange.mockClear();
  });

  it('renders all time period options', () => {
    render(
      <TestWrapper>
        <TimePeriodSelector
          selectedPeriod={30}
          onPeriodChange={mockOnPeriodChange}
        />
      </TestWrapper>
    );

    expect(screen.getByTestId('time-period-selector')).toBeInTheDocument();
    expect(screen.getByTestId('time-period-7')).toBeInTheDocument();
    expect(screen.getByTestId('time-period-14')).toBeInTheDocument();
    expect(screen.getByTestId('time-period-30')).toBeInTheDocument();
    expect(screen.getByTestId('time-period-60')).toBeInTheDocument();
    expect(screen.getByTestId('time-period-90')).toBeInTheDocument();
  });

  it('highlights the selected period', () => {
    render(
      <TestWrapper>
        <TimePeriodSelector
          selectedPeriod={30}
          onPeriodChange={mockOnPeriodChange}
        />
      </TestWrapper>
    );

    const selectedButton = screen.getByTestId('time-period-30');
    const unselectedButton = screen.getByTestId('time-period-7');

    expect(selectedButton).toHaveClass('btn-primary');
    expect(selectedButton).toHaveAttribute('aria-checked', 'true');
    expect(unselectedButton).toHaveClass('btn-outline');
    expect(unselectedButton).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onPeriodChange when a period is clicked', () => {
    render(
      <TestWrapper>
        <TimePeriodSelector
          selectedPeriod={30}
          onPeriodChange={mockOnPeriodChange}
        />
      </TestWrapper>
    );

    const button7Days = screen.getByTestId('time-period-7');
    fireEvent.click(button7Days);

    expect(mockOnPeriodChange).toHaveBeenCalledWith(7);
    expect(mockOnPeriodChange).toHaveBeenCalledTimes(1);
  });

  it('does not call onPeriodChange when disabled', () => {
    render(
      <TestWrapper>
        <TimePeriodSelector
          selectedPeriod={30}
          onPeriodChange={mockOnPeriodChange}
          disabled={true}
        />
      </TestWrapper>
    );

    const button7Days = screen.getByTestId('time-period-7');
    fireEvent.click(button7Days);

    expect(mockOnPeriodChange).not.toHaveBeenCalled();
  });

  it('disables all buttons when disabled prop is true', () => {
    render(
      <TestWrapper>
        <TimePeriodSelector
          selectedPeriod={30}
          onPeriodChange={mockOnPeriodChange}
          disabled={true}
        />
      </TestWrapper>
    );

    const radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('shows correct button text', () => {
    render(
      <TestWrapper>
        <TimePeriodSelector
          selectedPeriod={30}
          onPeriodChange={mockOnPeriodChange}
        />
      </TestWrapper>
    );

    expect(screen.getByText('7 Days')).toBeInTheDocument();
    expect(screen.getByText('14 Days')).toBeInTheDocument();
    expect(screen.getByText('30 Days')).toBeInTheDocument();
    expect(screen.getByText('60 Days')).toBeInTheDocument();
    expect(screen.getByText('90 Days')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <TestWrapper>
        <TimePeriodSelector
          selectedPeriod={30}
          onPeriodChange={mockOnPeriodChange}
          className="custom-class"
        />
      </TestWrapper>
    );

    const container = screen.getByTestId('time-period-selector').closest('.form-control');
    expect(container).toHaveClass('custom-class');
  });
});
