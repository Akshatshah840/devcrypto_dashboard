import React, { useMemo } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { useAirQualityData } from '../hooks/useDataFetching';
import { AirQualityChart } from '../components';

const AirQualityPage: React.FC = () => {
  const { state } = useDashboard();
  const { selectedCity, selectedPeriod } = state;

  const { data: airQualityData, loading, error } = useAirQualityData(selectedCity, selectedPeriod);

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { label: 'Good', color: 'text-success', bg: 'bg-success/10' };
    if (aqi <= 100) return { label: 'Moderate', color: 'text-warning', bg: 'bg-warning/10' };
    if (aqi <= 150) return { label: 'Unhealthy (Sensitive)', color: 'text-orange-500', bg: 'bg-orange-500/10' };
    if (aqi <= 200) return { label: 'Unhealthy', color: 'text-error', bg: 'bg-error/10' };
    return { label: 'Very Unhealthy', color: 'text-purple-500', bg: 'bg-purple-500/10' };
  };

  const stats = useMemo(() => {
    if (airQualityData.length === 0) return null;

    const aqiValues = airQualityData.map(d => d.aqi);
    const pm25Values = airQualityData.map(d => d.pm25);

    const avgAQI = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);
    const avgPM25 = Math.round(pm25Values.reduce((a, b) => a + b, 0) / pm25Values.length);
    const minAQI = Math.min(...aqiValues);
    const maxAQI = Math.max(...aqiValues);

    const bestDay = airQualityData.reduce((min, d) => d.aqi < min.aqi ? d : min);
    const worstDay = airQualityData.reduce((max, d) => d.aqi > max.aqi ? d : max);

    // Days by category
    const goodDays = aqiValues.filter(a => a <= 50).length;
    const moderateDays = aqiValues.filter(a => a > 50 && a <= 100).length;
    const unhealthyDays = aqiValues.filter(a => a > 100).length;

    return { avgAQI, avgPM25, minAQI, maxAQI, bestDay, worstDay, goodDays, moderateDays, unhealthyDays };
  }, [airQualityData]);

  if (!selectedCity) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-base-content mb-2">Select a City</h2>
          <p className="text-base-content/60">Choose a city from the header to view air quality data</p>
        </div>
      </div>
    );
  }

  const aqiStatus = stats ? getAQIStatus(stats.avgAQI) : null;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-base-content/60 uppercase tracking-wide">Avg AQI</span>
            {loading && <span className="loading loading-spinner loading-xs" />}
          </div>
          <div className={`text-2xl font-bold ${aqiStatus?.color || 'text-base-content'}`}>
            {stats?.avgAQI || '0'}
          </div>
          <div className="text-xs text-base-content/50 mt-1">
            {aqiStatus?.label || 'N/A'}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">PM2.5</div>
          <div className="text-2xl font-bold text-base-content">
            {stats?.avgPM25 || '0'}
          </div>
          <div className="text-xs text-base-content/50 mt-1">μg/m³ avg</div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">Good Days</div>
          <div className="text-2xl font-bold text-success">
            {stats?.goodDays || '0'}
          </div>
          <div className="text-xs text-base-content/50 mt-1">AQI ≤ 50</div>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">Unhealthy</div>
          <div className="text-2xl font-bold text-error">
            {stats?.unhealthyDays || '0'}
          </div>
          <div className="text-xs text-base-content/50 mt-1">AQI &gt; 100</div>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold text-base-content mb-4">Air Quality Timeline</h3>
        <div className="h-72">
          <AirQualityChart
            data={airQualityData}
            loading={loading}
            error={error}
            height={270}
          />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best & Worst Days */}
        {stats && (
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold text-base-content mb-4">Extremes</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20">
                <div>
                  <div className="text-xs text-base-content/60">Best Day</div>
                  <div className="font-semibold text-success">AQI {stats.minAQI}</div>
                </div>
                <div className="text-xs text-base-content/50">
                  {new Date(stats.bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-error/5 rounded-lg border border-error/20">
                <div>
                  <div className="text-xs text-base-content/60">Worst Day</div>
                  <div className="font-semibold text-error">AQI {stats.maxAQI}</div>
                </div>
                <div className="text-xs text-base-content/50">
                  {new Date(stats.worstDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Distribution */}
        {stats && (
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold text-base-content mb-4">Distribution</h3>
            <div className="space-y-3">
              {[
                { label: 'Good', count: stats.goodDays, color: 'bg-success', total: airQualityData.length },
                { label: 'Moderate', count: stats.moderateDays, color: 'bg-warning', total: airQualityData.length },
                { label: 'Unhealthy', count: stats.unhealthyDays, color: 'bg-error', total: airQualityData.length },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-base-content/60">{item.label}</div>
                  <div className="flex-1 bg-base-200 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all`}
                      style={{ width: `${(item.count / item.total) * 100}%` }}
                    />
                  </div>
                  <div className="w-16 text-xs text-right text-base-content/50">
                    {item.count} days
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AirQualityPage;
