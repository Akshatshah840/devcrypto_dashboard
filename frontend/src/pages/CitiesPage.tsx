import React from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { useCities } from '../hooks/useDataFetching';
import { TECH_HUB_CITIES } from '../data/cities';

const CitiesPage: React.FC = () => {
  const { state, actions } = useDashboard();
  const { selectedCity } = state;
  const { setSelectedCity } = actions;
  const { loading: citiesLoading } = useCities();

  const selectedCityData = TECH_HUB_CITIES.find(city => city.id === selectedCity);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Cities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {citiesLoading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-base-100 rounded-xl p-4 border border-base-200">
              <div className="skeleton h-5 w-3/4 mb-2" />
              <div className="skeleton h-4 w-1/2 mb-3" />
              <div className="skeleton h-3 w-full" />
            </div>
          ))
        ) : (
          TECH_HUB_CITIES.map(city => (
            <button
              key={city.id}
              onClick={() => setSelectedCity(city.id)}
              className={`glass-card rounded-xl p-4 text-left ${
                city.id === selectedCity
                  ? 'border-primary ring-2 ring-primary/20'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-base-content">{city.name}</h3>
                  <p className="text-xs text-base-content/60">{city.country}</p>
                </div>
                {city.id === selectedCity && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-xs text-base-content/50 line-clamp-2">
                Tech hub in {city.country}
              </p>
            </button>
          ))
        )}
      </div>

      {/* Selected City Info */}
      {selectedCityData && (
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-base-200 rounded-xl border border-primary/30 shadow-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-base-content">
                {selectedCityData.name}
              </h3>
              <p className="text-xs text-base-content/60">Selected City Details</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-base-100/50 rounded-lg p-3">
              <div className="text-xs text-base-content/60 mb-1">Country</div>
              <div className="text-sm font-medium">{selectedCityData.country}</div>
            </div>
            <div className="bg-base-100/50 rounded-lg p-3">
              <div className="text-xs text-base-content/60 mb-1">Timezone</div>
              <div className="text-sm font-medium">{selectedCityData.timezone || 'UTC'}</div>
            </div>
            <div className="bg-base-100/50 rounded-lg p-3">
              <div className="text-xs text-base-content/60 mb-1">Coordinates</div>
              <div className="text-sm font-medium">
                {selectedCityData.coordinates?.lat?.toFixed(2) || 'N/A'}, {selectedCityData.coordinates?.lng?.toFixed(2) || 'N/A'}
              </div>
            </div>
            <div className="bg-base-100/50 rounded-lg p-3">
              <div className="text-xs text-base-content/60 mb-1">Status</div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-success">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitiesPage;
