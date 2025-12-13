import React, { useRef } from 'react';
import { TechHubCity } from '../types';
import { TECH_HUB_CITIES } from '../data/cities';
import { useDashboard } from '../contexts/DashboardContext';

interface CitySelectorProps {
  selectedCity?: string;
  onCityChange?: (cityId: string) => void;
  disabled?: boolean;
  className?: string;
  excludeCity?: string;
  value?: string;
  onChange?: (cityId: string) => void;
}

export const CitySelector: React.FC<CitySelectorProps> = ({
  selectedCity: propSelectedCity,
  onCityChange: propOnCityChange,
  disabled = false,
  className = '',
  excludeCity,
  value: propValue,
  onChange: propOnChange
}) => {
  // Always call hooks unconditionally (React Rules of Hooks)
  const { state, actions } = useDashboard();
  const dropdownRef = useRef<HTMLDetailsElement>(null);

  // Use props if provided, otherwise use context values
  const selectedCity = propSelectedCity ?? propValue ?? state.selectedCity;
  const onCityChange = propOnCityChange ?? propOnChange ?? actions.setSelectedCity;

  const selectedCityData = TECH_HUB_CITIES.find(city => city.id === selectedCity);
  const filteredCities = TECH_HUB_CITIES.filter((city: TechHubCity) => !excludeCity || city.id !== excludeCity);

  // Handle city selection and close dropdown
  const handleCitySelect = (cityId: string) => {
    if (!disabled) {
      onCityChange(cityId);
      // Close the dropdown
      if (dropdownRef.current) {
        dropdownRef.current.open = false;
      }
    }
  };

  return (
    <div className={`form-control w-full max-w-xs ${className}`}>
      <label className="label" id="city-selector-label">
        <span className="label-text font-medium">Select City</span>
      </label>
      <details ref={dropdownRef} className="dropdown dropdown-end w-full">
        <summary
          className={`btn btn-sm btn-primary gap-2 w-full justify-between focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-2 ${disabled ? 'btn-disabled' : ''}`}
          aria-label="Select city"
          aria-haspopup="listbox"
          data-testid="city-selector"
        >
          <span className="truncate">
            {selectedCityData ? `${selectedCityData.name}, ${selectedCityData.country}` : 'Choose a tech hub city'}
          </span>
          <svg
            className="w-4 h-4 fill-current flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </summary>
        <ul
          role="listbox"
          aria-label="Available cities"
          aria-labelledby="city-selector-label"
          aria-describedby="city-selector-description"
          className="dropdown-content z-[100] menu menu-vertical bg-base-100 rounded-box shadow-2xl border border-base-300 p-2 w-64 max-h-80 overflow-y-auto"
          style={{ overflowX: 'hidden' }}
        >
          <li className="menu-title px-2 py-1">
            <span className="text-sm font-bold">Tech Hub Cities</span>
          </li>
          <li className="h-px bg-base-300 my-1 mx-2"></li>
          {filteredCities.map((city: TechHubCity) => (
            <li key={city.id} role="option" aria-selected={selectedCity === city.id}>
              <button
                type="button"
                onClick={() => handleCitySelect(city.id)}
                className={`flex items-center justify-between w-full text-left ${selectedCity === city.id ? 'active' : ''}`}
                aria-label={`${city.name}, ${city.country}${selectedCity === city.id ? ' (selected)' : ''}`}
              >
                <span className="truncate">{city.name}, {city.country}</span>
                {selectedCity === city.id && (
                  <svg className="w-4 h-4 fill-current flex-shrink-0 ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      </details>
      <span id="city-selector-description" className="sr-only">
        Select a tech hub city to view GitHub activity and air quality data
      </span>
    </div>
  );
};

export default CitySelector;