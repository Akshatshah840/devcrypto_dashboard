import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CitySelector } from './CitySelector';

describe('CitySelector', () => {
  const mockOnCityChange = jest.fn();

  beforeEach(() => {
    mockOnCityChange.mockClear();
  });

  it('renders with default placeholder', () => {
    render(
      <CitySelector
        selectedCity=""
        onCityChange={mockOnCityChange}
      />
    );

    expect(screen.getByDisplayValue('Choose a tech hub city')).toBeInTheDocument();
    expect(screen.getByTestId('city-selector')).toBeInTheDocument();
  });

  it('displays all tech hub cities as options', () => {
    render(
      <CitySelector
        selectedCity=""
        onCityChange={mockOnCityChange}
      />
    );

    const select = screen.getByTestId('city-selector');
    const options = select.querySelectorAll('option');
    
    // Should have placeholder + 10 cities
    expect(options).toHaveLength(11);
    
    // Check for some specific cities
    expect(screen.getByText('San Francisco, United States')).toBeInTheDocument();
    expect(screen.getByText('London, United Kingdom')).toBeInTheDocument();
    expect(screen.getByText('Tokyo, Japan')).toBeInTheDocument();
  });

  it('shows selected city when provided', () => {
    render(
      <CitySelector
        selectedCity="san-francisco"
        onCityChange={mockOnCityChange}
      />
    );

    const select = screen.getByTestId('city-selector') as HTMLSelectElement;
    expect(select.value).toBe('san-francisco');
  });

  it('calls onCityChange when selection changes', () => {
    render(
      <CitySelector
        selectedCity=""
        onCityChange={mockOnCityChange}
      />
    );

    const select = screen.getByTestId('city-selector');
    fireEvent.change(select, { target: { value: 'london' } });

    expect(mockOnCityChange).toHaveBeenCalledWith('london');
    expect(mockOnCityChange).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(
      <CitySelector
        selectedCity=""
        onCityChange={mockOnCityChange}
        disabled={true}
      />
    );

    const select = screen.getByTestId('city-selector');
    expect(select).toBeDisabled();
  });

  it('applies custom className', () => {
    render(
      <CitySelector
        selectedCity=""
        onCityChange={mockOnCityChange}
        className="custom-class"
      />
    );

    const container = screen.getByTestId('city-selector').closest('.form-control');
    expect(container).toHaveClass('custom-class');
  });
});