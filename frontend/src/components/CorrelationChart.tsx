import React, { useMemo, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Line,
  Bar,
  Legend
} from 'recharts';
import { GitHubActivity, CryptoData, CorrelationResult } from '../types';
import { useThemeColors } from '../hooks/useThemeColors';

interface CorrelationChartProps {
  githubData: GitHubActivity[];
  cryptoData: CryptoData[];
  correlationResult: CorrelationResult | null;
  loading: boolean;
  error: string | null;
  height?: number;
  coinColor?: string;
}

interface ScatterDataPoint {
  x: number;
  y: number;
  date: string;
}

interface TimelineDataPoint {
  date: string;
  displayDate: string;
  commits: number;
  price: number;
}

type ChartType = 'timeline' | 'scatter';

const TimelineTooltip: React.FC<{ active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }> = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="bg-base-100 px-3 py-2 border border-base-300 rounded-lg shadow-lg text-sm">
        <p className="font-medium text-base-content mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.dataKey === 'commits' ? 'Commits' : 'Price'}: {entry.dataKey === 'price' ? `$${entry.value?.toLocaleString()}` : entry.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ScatterTooltip: React.FC<{ active?: boolean; payload?: Array<{ payload: ScatterDataPoint }> }> = ({ active, payload }) => {
  if (active && payload && payload.length > 0 && payload[0]?.payload) {
    const data = payload[0].payload;
    if (data.x === undefined || data.y === undefined) return null;
    return (
      <div className="bg-base-100 px-3 py-2 border border-base-300 rounded-lg shadow-lg text-sm">
        <p className="font-medium text-base-content mb-1">{data.date}</p>
        <p className="text-xs text-primary">Commits: {data.y?.toLocaleString()}</p>
        <p className="text-xs text-secondary">Price: ${data.x?.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export const CorrelationChart: React.FC<CorrelationChartProps> = ({
  githubData,
  cryptoData,
  correlationResult,
  loading,
  error,
  height = 300,
  coinColor = '#F7931A'
}) => {
  const [chartType, setChartType] = useState<ChartType>('timeline');
  const themeColors = useThemeColors();

  const scatterData = useMemo(() => {
    if (!githubData?.length || !cryptoData?.length) return [];

    const points: ScatterDataPoint[] = [];
    githubData.forEach(github => {
      const crypto = cryptoData.find(c => c.date === github.date);
      if (crypto) {
        points.push({
          x: crypto.price,
          y: github.commits,
          date: new Date(github.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })
        });
      }
    });
    return points;
  }, [githubData, cryptoData]);

  const timelineData = useMemo(() => {
    if (!githubData?.length || !cryptoData?.length) return [];

    const points: TimelineDataPoint[] = [];
    githubData.forEach(github => {
      const crypto = cryptoData.find(c => c.date === github.date);
      if (crypto) {
        points.push({
          date: github.date,
          displayDate: new Date(github.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }),
          commits: github.commits,
          price: crypto.price
        });
      }
    });
    return points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [githubData, cryptoData]);

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

  if (scatterData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-base-content/50 text-sm">
        No matching data points
      </div>
    );
  }

  const correlationCoeff = correlationResult?.correlations?.commits_price ?? 0;
  const getPointColor = () => {
    const abs = Math.abs(correlationCoeff);
    if (abs >= 0.7) return '#10b981';
    if (abs >= 0.5) return '#f59e0b';
    if (abs >= 0.3) return '#f97316';
    return '#8b5cf6';
  };

  return (
    <div className="h-full">
      {/* Header with chart type toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-base-content/60">Correlation:</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            Math.abs(correlationCoeff) >= 0.5
              ? 'bg-success/10 text-success'
              : 'bg-base-200 text-base-content/70'
          }`}>
            {(correlationCoeff * 100).toFixed(0)}%
            {correlationCoeff > 0 ? ' positive' : correlationCoeff < 0 ? ' negative' : ''}
          </span>
        </div>

        {/* Chart type toggle */}
        <div className="flex gap-1 bg-base-200 rounded-lg p-0.5">
          <button
            onClick={() => setChartType('timeline')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              chartType === 'timeline'
                ? 'bg-base-100 text-base-content shadow-sm'
                : 'text-base-content/60 hover:text-base-content'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setChartType('scatter')}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              chartType === 'scatter'
                ? 'bg-base-100 text-base-content shadow-sm'
                : 'text-base-content/60 hover:text-base-content'
            }`}
          >
            Scatter
          </button>
        </div>
      </div>

      {chartType === 'timeline' ? (
        <ResponsiveContainer width="100%" height={height - 40}>
          <ComposedChart data={timelineData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} vertical={false} />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 10, fill: themeColors.text }}
              tickLine={false}
              axisLine={{ stroke: themeColors.grid }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: themeColors.text }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: themeColors.text }}
              tickLine={false}
              axisLine={false}
              width={50}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<TimelineTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: themeColors.text }}
              iconSize={8}
            />
            <Bar
              yAxisId="left"
              dataKey="commits"
              fill="#8b5cf6"
              fillOpacity={0.7}
              radius={[3, 3, 0, 0]}
              name="Commits"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="price"
              stroke={coinColor}
              strokeWidth={2.5}
              dot={false}
              name="Price"
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={height - 40}>
          <ScatterChart margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeColors.grid} />
            <XAxis
              type="number"
              dataKey="x"
              name="Price"
              tick={{ fontSize: 10, fill: themeColors.text }}
              tickLine={false}
              axisLine={{ stroke: themeColors.grid }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              label={{ value: 'Price', position: 'bottom', fontSize: 10, fill: themeColors.text, offset: -5 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Commits"
              tick={{ fontSize: 10, fill: themeColors.text }}
              tickLine={false}
              axisLine={{ stroke: themeColors.grid }}
              width={40}
              label={{ value: 'Commits', angle: -90, position: 'insideLeft', fontSize: 10, fill: themeColors.text }}
            />
            <Tooltip content={<ScatterTooltip />} />
            <Scatter name="Data Points" data={scatterData}>
              {scatterData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={getPointColor()} fillOpacity={0.8} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
