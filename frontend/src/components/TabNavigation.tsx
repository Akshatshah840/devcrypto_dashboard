import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TabType } from '../types';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  sidebarCollapsed: boolean;
}

interface Tab {
  id: TabType;
  label: string;
  description: string;
  path: string;
}

const tabs: Tab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Overview with key metrics and mini-charts',
    path: '/dashboard'
  },
  {
    id: 'github',
    label: 'GitHub Stats',
    description: 'Comprehensive GitHub activity analysis',
    path: '/github'
  },
  {
    id: 'crypto',
    label: 'Crypto Prices',
    description: 'Cryptocurrency price analysis',
    path: '/crypto'
  },
  {
    id: 'comparison',
    label: 'Comparison',
    description: 'Correlation analysis and statistical views',
    path: '/comparison'
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'Data export and report generation',
    path: '/reports'
  },
];

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  sidebarCollapsed,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const mobileDropdownRef = useRef<HTMLDetailsElement>(null);

  // Update active tab based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const currentTab = tabs.find(tab => tab.path === currentPath);
    if (currentTab && currentTab.id !== activeTab) {
      onTabChange(currentTab.id);
    }
  }, [location.pathname, activeTab, onTabChange]);

  const handleTabChange = (tab: Tab) => {
    onTabChange(tab.id);
    navigate(tab.path);
    // Close mobile dropdown
    if (mobileDropdownRef.current) {
      mobileDropdownRef.current.open = false;
    }
  };
  return (
    <div className={`
      bg-base-100 border-b border-base-300 transition-all duration-300
      ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
    `}>
      {/* Desktop tabs */}
      <div className="hidden md:block">
        <div 
          className="flex overflow-x-auto" 
          role="tablist" 
          aria-label="Dashboard sections"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-tab`}
              onClick={() => handleTabChange(tab)}
              className={`
                flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset
                ${activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-base-content hover:text-primary hover:border-base-300'
                }
              `}
              tabIndex={activeTab === tab.id ? 0 : -1}
            >
              <div className="text-left">
                <div className="font-semibold">{tab.label}</div>
                <div className="text-xs opacity-60 mt-1 hidden lg:block">
                  {tab.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile dropdown */}
      <div className="md:hidden p-4">
        <details ref={mobileDropdownRef} className="dropdown dropdown-end w-full">
          <summary
            className="btn btn-outline w-full justify-between focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={`Current section: ${tabs.find(tab => tab.id === activeTab)?.label || 'Select Tab'}. Click to change section.`}
            aria-haspopup="listbox"
          >
            <span>
              {tabs.find(tab => tab.id === activeTab)?.label || 'Select Tab'}
            </span>
            <svg
              className="w-4 h-4 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </summary>
          <ul
            role="listbox"
            aria-label="Dashboard sections"
            className="dropdown-content z-[100] menu menu-vertical bg-base-200 rounded-box shadow-2xl border border-base-300 p-2 w-full mt-1 max-h-80 overflow-y-auto"
            style={{ overflowX: 'hidden' }}
          >
            {tabs.map((tab) => (
              <li key={tab.id} role="option" aria-selected={activeTab === tab.id}>
                <button
                  type="button"
                  onClick={() => handleTabChange(tab)}
                  className={`
                    text-left w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset
                    ${activeTab === tab.id ? 'active' : ''}
                  `}
                  aria-label={`${tab.label}: ${tab.description}${activeTab === tab.id ? ' (selected)' : ''}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className="font-semibold">{tab.label}</div>
                      <div className="text-xs opacity-60 mt-1">
                        {tab.description}
                      </div>
                    </div>
                    {activeTab === tab.id && (
                      <svg className="w-4 h-4 fill-current flex-shrink-0 ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </details>
      </div>

      {/* Breadcrumb for current tab */}
      <nav 
        className="px-4 py-2 bg-base-50 border-t border-base-200 hidden lg:block"
        aria-label="Breadcrumb"
      >
        <ol className="text-sm text-base-content opacity-60 flex items-center">
          <li>
            <span>Dashboard</span>
          </li>
          <li aria-hidden="true" className="mx-2">›</li>
          <li aria-current="page">
            <span className="text-primary font-medium">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </span>
          </li>
        </ol>
      </nav>
    </div>
  );
};