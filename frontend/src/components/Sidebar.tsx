import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiGithub,
  FiBarChart,
  FiDownload,
  FiChevronLeft,
  FiTrendingUp
} from 'react-icons/fi';
import { TabType } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <FiHome size={20} />, path: '/dashboard' },
  { id: 'github', label: 'GitHub Stats', icon: <FiGithub size={20} />, path: '/github' },
  { id: 'crypto', label: 'Crypto Prices', icon: <FiTrendingUp size={20} />, path: '/crypto' },
  { id: 'comparison', label: 'Comparison', icon: <FiBarChart size={20} />, path: '/comparison' },
  { id: 'reports', label: 'Reports', icon: <FiDownload size={20} />, path: '/reports' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Update active tab based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const currentItem = navItems.find(item => item.path === currentPath);
    if (currentItem && currentItem.id !== activeTab) {
      onTabChange(currentItem.id);
    }
  }, [location.pathname, activeTab, onTabChange]);

  const handleNavigation = (item: NavItem) => {
    onTabChange(item.id);
    navigate(item.path);
  };
  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggleCollapse}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        className={`
          fixed top-[57px] left-0 h-[calc(100vh-57px)] bg-base-100/70 backdrop-blur-xl border-r border-base-200/50 shadow-xl z-40 transition-all duration-300 ease-in-out flex flex-col
          ${collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
          ${collapsed ? 'lg:w-16' : 'w-64'}
        `}
      >
        {/* Navigation */}
        <div id="sidebar-navigation" className="p-2 flex-1">
          <ul className="space-y-1" role="menubar" aria-label="Navigation menu">
            {navItems.map((item) => (
              <li key={item.id} role="none">
                <button
                  role="menuitem"
                  onClick={() => handleNavigation(item)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-base-200
                    ${activeTab === item.id 
                      ? 'bg-primary text-primary-content' 
                      : 'hover:bg-base-300 text-base-content'
                    }
                    ${collapsed ? 'justify-center' : 'justify-start'}
                  `}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                  aria-current={activeTab === item.id ? 'page' : undefined}
                >
                  <span className="flex-shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="truncate">
                      {item.label}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* User Profile & Collapse Section */}
        <div className="mt-auto border-t border-base-300">
          {user && (
            <div
              className={`p-3 hover:bg-base-200/50 transition-colors ${collapsed ? 'flex justify-center cursor-pointer' : ''}`}
              title={collapsed ? `${user.name || user.username}\n${user.email}` : undefined}
              onClick={collapsed ? onToggleCollapse : undefined}
            >
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                {/* Avatar with first letter */}
                <div className="avatar placeholder flex-shrink-0">
                  <div className="bg-gradient-to-br from-primary to-secondary text-primary-content rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold uppercase">
                    {(user.name || user.username || 'U').charAt(0)}
                  </div>
                </div>
                {/* User Info & Collapse */}
                {!collapsed && (
                  <>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-medium text-base-content truncate">
                        {user.name || user.username || 'User'}
                      </span>
                      <span className="text-xs text-base-content/50 truncate">
                        {user.email || ''}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCollapse();
                      }}
                      className="btn btn-ghost btn-xs btn-square opacity-60 hover:opacity-100"
                      aria-label="Collapse sidebar"
                    >
                      <FiChevronLeft size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};