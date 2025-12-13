import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { GitHubActivity, DataSource } from '../types';
import { useThemeColors } from '../hooks/useThemeColors';

interface GitHubActivityChartProps {
  data: GitHubActivity[];
  loading: boolean;
  error: string | null;
  source?: DataSource;
  lastUpdated?: Date;
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

const CustomTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-base-100 px-3 py-2 border border-base-300 rounded-lg shadow-lg text-sm">
        <p className="font-medium text-base-content mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const GitHubActivityChart: React.FC<GitHubActivityChartProps> = ({
  data,
  loading,
  error,
  height = 300,
  showTooltip = true
}) => {
  const themeColors = useThemeColors();

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
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: themeColors.text }}
          tickLine={false}
          axisLine={{ stroke: themeColors.grid }}
          interval={xAxisInterval}
        />
        <YAxis
          tick={{ fontSize: 10, fill: themeColors.text }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        <Legend
          wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: themeColors.text }}
          iconType="circle"
          iconSize={8}
        />
        <Line
          type="monotone"
          dataKey="commits"
          stroke="#8b5cf6"
          strokeWidth={2.5}
          dot={false}
          name="Commits"
        />
        <Line
          type="monotone"
          dataKey="stars"
          stroke="#10b981"
          strokeWidth={2.5}
          dot={false}
          name="Stars"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
