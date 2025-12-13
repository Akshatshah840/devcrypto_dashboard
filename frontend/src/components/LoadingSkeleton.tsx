import React from 'react';

// Base skeleton component
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width, 
  height, 
  rounded = false 
}) => {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`
        bg-base-300 animate-pulse
        ${rounded ? 'rounded-full' : 'rounded'}
        ${className}
      `}
      style={style}
    />
  );
};

// Chart skeleton component
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => {
  return (
    <div className="w-full p-4 bg-base-100 rounded-lg border border-base-300">
      {/* Chart title skeleton */}
      <div className="mb-4">
        <Skeleton width="40%" height={20} className="mb-2" />
        <Skeleton width="60%" height={14} />
      </div>
      
      {/* Chart area skeleton */}
      <div className="relative" style={{ height }}>
        <Skeleton width="100%" height="100%" />
        
        {/* Simulate chart elements */}
        <div className="absolute inset-4 flex items-end justify-between">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              width={20}
              height={Math.random() * 60 + 20}
              className="bg-base-200"
            />
          ))}
        </div>
      </div>
      
      {/* Legend skeleton */}
      <div className="flex justify-center mt-4 space-x-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton width={12} height={12} rounded />
            <Skeleton width={60} height={14} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Card skeleton component
export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-base-100 rounded-lg border border-base-300 p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width="50%" height={20} />
        <Skeleton width={24} height={24} rounded />
      </div>
      
      <div className="space-y-3">
        <Skeleton width="100%" height={16} />
        <Skeleton width="80%" height={16} />
        <Skeleton width="60%" height={16} />
      </div>
      
      <div className="mt-6 flex justify-between items-center">
        <Skeleton width="30%" height={14} />
        <Skeleton width={80} height={32} />
      </div>
    </div>
  );
};

// Table skeleton component
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="w-full bg-base-100 rounded-lg border border-base-300 overflow-hidden">
      {/* Table header */}
      <div className="bg-base-200 p-4 border-b border-base-300">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width="80%" height={16} />
          ))}
        </div>
      </div>
      
      {/* Table rows */}
      <div className="divide-y divide-base-300">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  width={`${60 + Math.random() * 30}%`} 
                  height={14} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Dashboard skeleton component
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton width="40%" height={32} className="mb-2" />
        <Skeleton width="60%" height={16} />
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-base-100 rounded-lg border border-base-300 p-6">
            <div className="flex items-center justify-between mb-2">
              <Skeleton width={24} height={24} rounded />
              <Skeleton width="30%" height={14} />
            </div>
            <Skeleton width="60%" height={28} className="mb-1" />
            <Skeleton width="40%" height={14} />
          </div>
        ))}
      </div>
      
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton height={250} />
        <ChartSkeleton height={250} />
      </div>
    </div>
  );
};

// List skeleton component
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-base-100 rounded-lg border border-base-300">
          <Skeleton width={40} height={40} rounded />
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" height={16} />
            <Skeleton width="50%" height={14} />
          </div>
          <Skeleton width={80} height={32} />
        </div>
      ))}
    </div>
  );
};

// Text skeleton component
export const TextSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          width={i === lines - 1 ? "60%" : "100%"} 
          height={16} 
        />
      ))}
    </div>
  );
};

export default Skeleton;