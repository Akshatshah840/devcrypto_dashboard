import React from 'react';
import { TimePeriod } from '../types';
import { useDashboard } from '../contexts/DashboardContext';

interface TimePeriodSelectorProps {
  selectedPeriod?: TimePeriod;
  onPeriodChange?: (period: TimePeriod) => void;
  disabled?: boolean;
  className?: string;
}

const TIME_PERIOD_OPTIONS: Array<{ value: TimePeriod; label: string; description: string }> = [
  { value: 7, label: '7 Days', description: 'Last week' },
  { value: 14, label: '14 Days', description: 'Last 2 weeks' },
  { value: 30, label: '30 Days', description: 'Last month' },
  { value: 60, label: '60 Days', description: 'Last 2 months' },
  { value: 90, label: '90 Days', description: 'Last 3 months' }
];

export const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
  selectedPeriod: propSelectedPeriod,
  onPeriodChange: propOnPeriodChange,
  disabled = false,
  className = ''
}) => {
  // Always call hooks unconditionally (React Rules of Hooks)
  const { state, actions } = useDashboard();

  // Use props if provided, otherwise use context values
  const selectedPeriod = propSelectedPeriod ?? state.selectedPeriod;
  const onPeriodChange = propOnPeriodChange ?? actions.setSelectedPeriod;
  
  const handlePeriodClick = (period: TimePeriod) => {
    if (!disabled) {
      onPeriodChange(period);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, period: TimePeriod) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlePeriodClick(period);
    }
  };

  return (
    <div className={`form-control w-full ${className}`}>
      <label className="label" id="time-period-label" htmlFor="time-period-selector">
        <span className="label-text font-medium">Time Period</span>
      </label>
      <div 
        id="time-period-selector"
        className="flex flex-wrap gap-2" 
        data-testid="time-period-selector"
        role="radiogroup"
        aria-labelledby="time-period-label"
        aria-describedby="time-period-description"
      >
        <span id="time-period-description" className="sr-only">
          Select a time period to filter the data
        </span>
        {TIME_PERIOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selectedPeriod === option.value}
            className={`btn btn-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              selectedPeriod === option.value
                ? 'btn-primary btn-active'
                : 'btn-outline btn-primary'
            } ${disabled ? 'btn-disabled' : ''}`}
            onClick={() => handlePeriodClick(option.value)}
            onKeyDown={(e) => handleKeyDown(e, option.value)}
            disabled={disabled}
            data-testid={`time-period-${option.value}`}
            aria-label={`${option.label} - ${option.description}`}
            tabIndex={selectedPeriod === option.value ? 0 : -1}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimePeriodSelector;