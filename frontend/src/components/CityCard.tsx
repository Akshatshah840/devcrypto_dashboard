import React, { memo } from 'react';
import { TechHubCity } from '../types';

interface CityCardProps {
  city: TechHubCity;
  isSelected: boolean;
  onSelect: (cityId: string) => void;
}

export const CityCard: React.FC<CityCardProps> = memo(({ city, isSelected, onSelect }) => (
  <div
    className={`card bg-base-100 shadow-xl cursor-pointer transition-all hover:shadow-2xl ${
      isSelected ? 'ring-2 ring-primary' : ''
    }`}
    onClick={() => onSelect(city.id)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(city.id);
      }
    }}
    aria-pressed={isSelected}
    aria-label={`${city.name}, ${city.country}${isSelected ? ' (selected)' : ''}`}
  >
    <div className="card-body">
      <h3 className="card-title">
        {city.name}
        {isSelected && <div className="badge badge-primary">Selected</div>}
      </h3>
      <p className="text-base-content/70">{city.country}</p>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-base-content/70">Timezone:</span>
          <span>{city.timezone}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-base-content/70">Coordinates:</span>
          <span>{city.coordinates.lat.toFixed(2)}, {city.coordinates.lng.toFixed(2)}</span>
        </div>
      </div>

      <div className="card-actions justify-end mt-4">
        <button
          className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(city.id);
          }}
        >
          {isSelected ? 'Selected' : 'Select City'}
        </button>
      </div>
    </div>
  </div>
));

CityCard.displayName = 'CityCard';

export default CityCard;
