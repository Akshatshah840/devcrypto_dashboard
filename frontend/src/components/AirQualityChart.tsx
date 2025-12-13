import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { AirQualityData } from '../types';

interface AirQualityChartProps {
  data: AirQualityData[];
  loading: boolean;
  error: string | null;
  height?: number;
  showTooltip?: boolean;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}

const getAQIColor = (aqi: number): string => {
  if (aqi <= 50) return '#10b981';
  if (aqi <= 100) return '#f59e0b';
  if (aqi <= 150) return '#f97316';
  return '#ef4444';
};

const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const aqiValue = payload.find(p => p.name === 'AQI')?.value;
    return (
      <div className="bg-base-100 px-3 py-2 border border-base-300 rounded-lg shadow-lg text-sm">
        <p className="font-medium text-base-content mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value}{entry.name === 'PM2.5' ? ' μg/m³' : ''}
          </p>
        ))}
        {aqiValue && (
          <p className="text-xs mt-1 pt-1 border-t border-base-200" style={{ color: getAQIColor(aqiValue) }}>
            {aqiValue <= 50 ? 'Good' : aqiValue <= 100 ? 'Moderate' : aqiValue <= 150 ? 'Unhealthy (Sensitive)' : 'Unhealthy'}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const AirQualityChart: React.FC<AirQualityChartProps> = ({
  data,
  loading,
  error,
  height = 300,
  showTooltip = true
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-error text-sm">
        Failed to load data
      </div>
    );
  }

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-base-content/50 text-sm">
        No data available
      </div>
    );
  }

  const xAxisInterval = chartData.length > 15 ? Math.floor(chartData.length / 7) : 0;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="pm25Gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'currentColor' }}
          tickLine={false}
          axisLine={false}
          interval={xAxisInterval}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'currentColor' }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        <Legend
          wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          iconType="circle"
          iconSize={8}
        />
        <Area
          type="monotone"
          dataKey="aqi"
          stroke="#8b5cf6"
          strokeWidth={2}
          fill="url(#aqiGradient)"
          name="AQI"
        />
        <Area
          type="monotone"
          dataKey="pm25"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#pm25Gradient)"
          name="PM2.5"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
