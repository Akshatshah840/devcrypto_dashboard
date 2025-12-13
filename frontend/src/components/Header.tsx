import React, { useRef, useEffect, useCallback } from 'react';
import { THEMES, getThemeDisplayName, ThemeName, THEME_COLORS } from '../constants/themes';
import { TimePeriod } from '../types';

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
];

interface HeaderProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  selectedCity?: string;
  onCityChange?: (city: string) => void;
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  sidebarCollapsed: boolean;
  onLogout?: () => void;
}

// Theme preview dots component
const ThemePreviewDots: React.FC<{ theme: ThemeName }> = ({ theme }) => {
  const colors = THEME_COLORS[theme];
  return (
    <div
      className="grid grid-cols-2 gap-0.5 shrink-0"
      style={{
        backgroundColor: colors.base,
        padding: '3px',
        borderRadius: '4px',
        width: '20px',
        height: '20px'
      }}
    >
      <span className="rounded-sm" style={{ backgroundColor: colors.primary, width: '6px', height: '6px' }} />
      <span className="rounded-sm" style={{ backgroundColor: colors.secondary, width: '6px', height: '6px' }} />
      <span className="rounded-sm" style={{ backgroundColor: colors.accent, width: '6px', height: '6px' }} />
      <span className="rounded-sm" style={{ backgroundColor: colors.neutral, width: '6px', height: '6px' }} />
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({
  currentTheme,
  onThemeChange,
  selectedPeriod,
  onPeriodChange,
  sidebarCollapsed,
  onLogout,
}) => {
  const themeDropdownRef = useRef<HTMLDetailsElement>(null);
  const periodDropdownRef = useRef<HTMLDetailsElement>(null);

  const handlePeriodDropdownToggle = useCallback(() => {
    if (themeDropdownRef.current) themeDropdownRef.current.open = false;
  }, []);

  const handleThemeDropdownToggle = useCallback(() => {
    if (periodDropdownRef.current) periodDropdownRef.current.open = false;
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (themeDropdownRef.current && !themeDropdownRef.current.contains(target)) {
        themeDropdownRef.current.open = false;
      }
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(target)) {
        periodDropdownRef.current.open = false;
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleThemeChange = (theme: string) => {
    onThemeChange(theme);
    if (themeDropdownRef.current) {
      themeDropdownRef.current.open = false;
    }
  };

  const handlePeriodChange = (period: TimePeriod) => {
    onPeriodChange(period);
    if (periodDropdownRef.current) {
      periodDropdownRef.current.open = false;
    }
  };

  const selectedPeriodData = TIME_PERIODS.find(p => p.value === selectedPeriod);

  return (
    <header className="bg-base-100/80 backdrop-blur-md border-b border-base-200/50 shadow-sm">
      <div className="flex items-center justify-between py-3 pr-4">
        {/* Left side - Logo area (fixed width to match sidebar) */}
        <div className={`flex items-center transition-all duration-300 ${sidebarCollapsed ? 'lg:w-16 justify-center' : 'lg:w-64 px-4'}`}>
          <div className={`flex items-center gap-3`}>
            <div className="w-9 h-9 rounded-lg bg-primary/90 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20 transition-transform hover:scale-105">
              <svg className="w-5 h-5 text-primary-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <h1 className="text-base font-semibold text-base-content hidden lg:block whitespace-nowrap">DevCrypto Analytics</h1>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <details ref={periodDropdownRef} className="dropdown dropdown-end">
            <summary className="btn btn-ghost btn-sm gap-2 font-normal" onClick={handlePeriodDropdownToggle}>
              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">
                {selectedPeriodData?.label || '30 days'}
              </span>
              <svg className="w-3 h-3 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </summary>
            <ul className="dropdown-content z-[100] mt-2 p-2 shadow-xl bg-base-100/90 backdrop-blur-lg rounded-xl border border-base-200/50 w-36">
              {TIME_PERIODS.map((period) => (
                <li key={period.value}>
                  <button
                    type="button"
                    onClick={() => handlePeriodChange(period.value)}
                    className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                      selectedPeriod === period.value
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-base-300 text-base-content'
                    }`}
                  >
                    <span className="flex-1">{period.label}</span>
                    {selectedPeriod === period.value && (
                      <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </details>

          {/* Divider */}
          <div className="w-px h-6 bg-base-300 hidden sm:block" />

          {/* Theme Selector */}
          <details ref={themeDropdownRef} className="dropdown dropdown-end">
            <summary className="btn btn-ghost btn-sm gap-2 font-normal" onClick={handleThemeDropdownToggle}>
              <ThemePreviewDots theme={currentTheme as ThemeName} />
              <svg className="w-3 h-3 opacity-60" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </summary>
            <ul className="dropdown-content z-[100] mt-2 p-2 shadow-xl bg-base-100/90 backdrop-blur-lg rounded-xl border border-base-200/50 w-56 max-h-80 overflow-y-auto">
              {THEMES.map((theme) => (
                <li key={theme}>
                  <button
                    type="button"
                    onClick={() => handleThemeChange(theme)}
                    className={`flex items-center gap-3 w-full px-2 py-2 rounded-lg text-left text-sm transition-colors ${
                      currentTheme === theme
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-base-300 text-base-content'
                    }`}
                  >
                    <ThemePreviewDots theme={theme as ThemeName} />
                    <span className="flex-1 truncate">{getThemeDisplayName(theme as ThemeName)}</span>
                    {currentTheme === theme && (
                      <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </details>

          {/* Logout Button */}
          {onLogout && (
            <>
              <div className="w-px h-6 bg-base-300 hidden sm:block" />
              <button
                onClick={onLogout}
                className="btn btn-ghost btn-sm gap-2 font-normal text-error hover:bg-error/10"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
