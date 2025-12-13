import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Database, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { DataSource } from '../types';

interface DataSourceIndicatorProps {
  source: DataSource;
  isOnline?: boolean;
  lastUpdated?: Date;
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export const DataSourceIndicator: React.FC<DataSourceIndicatorProps> = ({
  source,
  isOnline = true,
  lastUpdated,
  className = '',
  showLabel = true,
  compact = false
}) => {
  const getSourceInfo = () => {
    switch (source) {
      case 'live':
        return {
          icon: isOnline ? CheckCircle : WifiOff,
          label: isOnline ? 'Live Data' : 'Offline',
          color: isOnline ? 'text-success' : 'text-error',
          bgColor: isOnline ? 'bg-success/10' : 'bg-error/10',
          borderColor: isOnline ? 'border-success/20' : 'border-error/20'
        };
      case 'mock':
        return {
          icon: Database,
          label: 'Simulated Data',
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/20'
        };
      default:
        return {
          icon: AlertTriangle,
          label: 'Unknown Source',
          color: 'text-base-content/50',
          bgColor: 'bg-base-200',
          borderColor: 'border-base-300'
        };
    }
  };

  const sourceInfo = getSourceInfo();
  const Icon = sourceInfo.icon;

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <Icon className={`h-3 w-3 ${sourceInfo.color}`} />
        {showLabel && (
          <span className={`text-xs ${sourceInfo.color}`}>
            {sourceInfo.label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`
      inline-flex items-center gap-2 px-2 py-1 rounded-full border
      ${sourceInfo.bgColor} ${sourceInfo.borderColor}
      ${className}
    `}>
      <Icon className={`h-4 w-4 ${sourceInfo.color}`} />
      
      {showLabel && (
        <span className={`text-sm font-medium ${sourceInfo.color}`}>
          {sourceInfo.label}
        </span>
      )}
      
      {lastUpdated && (
        <>
          <div className={`w-1 h-1 rounded-full ${sourceInfo.color} opacity-50`} />
          <div className="flex items-center gap-1">
            <Clock className={`h-3 w-3 ${sourceInfo.color} opacity-70`} />
            <span className={`text-xs ${sourceInfo.color} opacity-70`}>
              {formatLastUpdated(lastUpdated)}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

// Offline banner component
interface OfflineBannerProps {
  isOnline: boolean;
  onRetry?: () => void;
  className?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  onRetry,
  className = ''
}) => {
  if (isOnline) return null;

  return (
    <div className={`
      bg-warning text-warning-content px-4 py-3 border-b border-warning/20
      ${className}
    `}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <WifiOff className="h-5 w-5" />
          <div>
            <p className="font-medium text-sm">
              You're currently offline
            </p>
            <p className="text-xs opacity-90">
              Showing cached data. Some features may be limited.
            </p>
          </div>
        </div>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn btn-sm btn-outline border-warning-content/20 hover:bg-warning-content/10"
          >
            <Wifi className="h-4 w-4 mr-1" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

// Connection status hook
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

export default DataSourceIndicator;