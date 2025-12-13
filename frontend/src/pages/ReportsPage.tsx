import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSelectedCity, useSelectedPeriod } from '../contexts/DashboardContext';
import { ExportFormat, TimePeriod } from '../types';
import { TECH_HUB_CITIES } from '../data/cities';

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
];

interface ExportRequest {
  id: string;
  city: string;
  period: TimePeriod;
  format: ExportFormat;
  timestamp: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
}

const ReportsPage: React.FC = () => {
  const { selectedCity } = useSelectedCity();
  const { selectedPeriod } = useSelectedPeriod();
  const [exportHistory, setExportHistory] = useState<ExportRequest[]>([]);
  const [currentExport, setCurrentExport] = useState<ExportRequest | null>(null);
  const [exportCity, setExportCity] = useState<string>('bangalore');
  const [exportPeriod, setExportPeriod] = useState<TimePeriod>(30);

  const cityDropdownRef = useRef<HTMLDetailsElement>(null);
  const periodDropdownRef = useRef<HTMLDetailsElement>(null);

  // Close other dropdown when one opens
  const handleCityDropdownToggle = () => {
    if (periodDropdownRef.current) periodDropdownRef.current.open = false;
  };

  const handlePeriodDropdownToggle = () => {
    if (cityDropdownRef.current) cityDropdownRef.current.open = false;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is inside city dropdown
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(target)) {
        cityDropdownRef.current.open = false;
      }

      // Check if click is inside period dropdown
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(target)) {
        periodDropdownRef.current.open = false;
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const generateExportId = () => {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const simulateExportProgress = useCallback((exportId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20 + 5;

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        setExportHistory(prev => prev.map(exp =>
          exp.id === exportId
            ? {
                ...exp,
                status: 'completed',
                progress: 100,
                downloadUrl: `/api/export/${exp.format}/${exp.city}/${exp.period}`
              }
            : exp
        ));
        setCurrentExport(null);
      } else {
        setExportHistory(prev => prev.map(exp =>
          exp.id === exportId
            ? { ...exp, progress: Math.min(progress, 100) }
            : exp
        ));
        setCurrentExport(prev =>
          prev?.id === exportId
            ? { ...prev, progress: Math.min(progress, 100) }
            : prev
        );
      }
    }, 200 + Math.random() * 300);

    return interval;
  }, []);

  const handleExport = useCallback(async (format: ExportFormat, customCity?: string, customPeriod?: TimePeriod) => {
    const exportCity = customCity || selectedCity;
    const exportPeriod = customPeriod || selectedPeriod;

    if (!exportCity) {
      alert('Please select a city first');
      return;
    }

    const exportRequest: ExportRequest = {
      id: generateExportId(),
      city: exportCity,
      period: exportPeriod,
      format,
      timestamp: new Date().toISOString(),
      status: 'pending',
      progress: 0
    };

    setExportHistory(prev => [exportRequest, ...prev]);
    setCurrentExport(exportRequest);

    setTimeout(() => {
      setExportHistory(prev => prev.map(exp =>
        exp.id === exportRequest.id
          ? { ...exp, status: 'in-progress' }
          : exp
      ));
      setCurrentExport(prev =>
        prev?.id === exportRequest.id
          ? { ...prev, status: 'in-progress' }
          : prev
      );

      simulateExportProgress(exportRequest.id);
    }, 500);

  }, [selectedCity, selectedPeriod, simulateExportProgress]);

  const handleDownload = useCallback((exportRequest: ExportRequest) => {
    if (exportRequest.downloadUrl) {
      const link = document.createElement('a');
      link.href = exportRequest.downloadUrl;
      link.download = `github-air-quality-${exportRequest.city}-${exportRequest.period}days-${new Date(exportRequest.timestamp).toISOString().split('T')[0]}.${exportRequest.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setExportHistory([]);
  }, []);

  const cancelExport = useCallback(() => {
    if (currentExport) {
      setExportHistory(prev => prev.map(exp =>
        exp.id === currentExport.id
          ? { ...exp, status: 'failed', error: 'Cancelled by user' }
          : exp
      ));
      setCurrentExport(null);
    }
  }, [currentExport]);

  if (!selectedCity) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-base-content mb-2">Select a City</h2>
          <p className="text-base-content/60">Choose a city from the header to export data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Export */}
      <div className="glass-card rounded-xl p-4 relative z-20">
        <h3 className="text-sm font-semibold text-base-content mb-4">Export Data</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
          {/* City Dropdown */}
          <div className="relative">
            <details ref={cityDropdownRef} className="dropdown w-full">
              <summary
                className="btn btn-sm w-full justify-between bg-base-200 border-base-300 hover:bg-base-300 font-normal"
                onClick={handleCityDropdownToggle}
              >
                <span className="truncate">
                  {TECH_HUB_CITIES.find(c => c.id === exportCity)?.name || 'Select City'}
                </span>
                <svg className="w-4 h-4 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </summary>
              <ul className="dropdown-content absolute left-0 z-[100] mt-1 p-2 shadow-xl bg-base-100/90 backdrop-blur-lg rounded-xl border border-base-200/50 w-full max-h-60 overflow-y-auto">
              {TECH_HUB_CITIES.map((city) => (
                <li key={city.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setExportCity(city.id);
                      if (cityDropdownRef.current) cityDropdownRef.current.open = false;
                    }}
                    className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-left text-sm transition-colors ${
                      exportCity === city.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-base-300 text-base-content'
                    }`}
                  >
                    <span className="flex-1">{city.name}</span>
                    {exportCity === city.id && (
                      <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                      </button>
                </li>
              ))}
              </ul>
            </details>
          </div>

          {/* Period Dropdown */}
          <div className="relative">
            <details ref={periodDropdownRef} className="dropdown w-full">
              <summary
                className="btn btn-sm w-full justify-between bg-base-200 border-base-300 hover:bg-base-300 font-normal"
                onClick={handlePeriodDropdownToggle}
              >
                <span>{TIME_PERIODS.find(p => p.value === exportPeriod)?.label || '30 days'}</span>
                <svg className="w-4 h-4 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </summary>
              <ul className="dropdown-content absolute left-0 z-[100] mt-1 p-2 shadow-xl bg-base-100/90 backdrop-blur-lg rounded-xl border border-base-200/50 w-full">
                {TIME_PERIODS.map((period) => (
                  <li key={period.value}>
                    <button
                      type="button"
                      onClick={() => {
                        setExportPeriod(period.value);
                        if (periodDropdownRef.current) periodDropdownRef.current.open = false;
                      }}
                      className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-left text-sm transition-colors ${
                        exportPeriod === period.value
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-base-300 text-base-content'
                      }`}
                    >
                      <span className="flex-1">{period.label}</span>
                      {exportPeriod === period.value && (
                        <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              className="btn btn-primary btn-sm flex-1"
              onClick={() => handleExport('json', exportCity, exportPeriod)}
              disabled={!!currentExport}
            >
              JSON
            </button>
            <button
              className="btn btn-secondary btn-sm flex-1"
              onClick={() => handleExport('csv', exportCity, exportPeriod)}
              disabled={!!currentExport}
            >
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Current Export Progress */}
      {currentExport && (
        <div className="glass-card rounded-xl p-4 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">
              Exporting {currentExport.city.replace('-', ' ')} ({currentExport.format.toUpperCase()})
            </span>
            <button className="btn btn-xs btn-ghost text-error" onClick={cancelExport}>
              Cancel
            </button>
          </div>
          <div className="flex items-center gap-3">
            <progress
              className="progress progress-primary flex-1"
              value={currentExport.progress}
              max="100"
            />
            <span className="text-xs font-medium w-10 text-right">{Math.round(currentExport.progress)}%</span>
          </div>
        </div>
      )}

      {/* Export History */}
      <div className="glass-card rounded-xl p-4 relative z-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-base-content">History</h3>
          {exportHistory.length > 0 && (
            <button className="btn btn-xs btn-ghost" onClick={clearHistory}>
              Clear
            </button>
          )}
        </div>

        {exportHistory.length === 0 ? (
          <div className="text-center py-8 text-base-content/40 text-sm">
            No exports yet
          </div>
        ) : (
          <div className="space-y-2">
            {exportHistory.map((exportReq) => (
              <div key={exportReq.id} className="flex items-center justify-between p-3 bg-base-200/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="badge badge-sm badge-outline">
                    {exportReq.format.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium">
                    {exportReq.city.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                  <span className="text-xs text-base-content/50">
                    {exportReq.period}d
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {exportReq.status === 'completed' && (
                    <span className="badge badge-success badge-sm">Done</span>
                  )}
                  {exportReq.status === 'failed' && (
                    <span className="badge badge-error badge-sm">Failed</span>
                  )}
                  {exportReq.status === 'in-progress' && (
                    <span className="badge badge-warning badge-sm">{Math.round(exportReq.progress)}%</span>
                  )}
                  {exportReq.status === 'pending' && (
                    <span className="badge badge-info badge-sm">Pending</span>
                  )}

                  {exportReq.status === 'completed' && exportReq.downloadUrl && (
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={() => handleDownload(exportReq)}
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
