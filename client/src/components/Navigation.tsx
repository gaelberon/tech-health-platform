import React, { useState } from 'react';
import { useSession } from '../session/SessionContext';

type TabType = 'collector' | 'admin' | 'dashboard';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useSession();

  const tabs = [
    { id: 'collector' as TabType, label: 'Collecteur P1', icon: '📋', available: true },
    { id: 'admin' as TabType, label: 'Administration', icon: '⚙️', available: user?.role === 'Admin' },
    { id: 'dashboard' as TabType, label: 'Tableau de bord', icon: '📊', available: false }, // Pour plus tard
  ];

  const availableTabs = tabs.filter(tab => tab.available);

  return (
    <>
      {/* Navigation Desktop - Barre horizontale en haut */}
      <nav className="hidden md:flex bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Titre */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Tech Health Platform
              </h1>
            </div>

            {/* Onglets de navigation */}
            <div className="flex items-center space-x-1">
              {availableTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* User info & Logout */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user?.email}</span>
                <span className="ml-2 text-xs text-gray-500">({user?.role})</span>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Navigation Mobile - Menu burger */}
      <nav className="md:hidden bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-lg font-bold text-gray-900">Tech Health Platform</h1>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        {isMenuOpen && (
          <div className="border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {availableTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="px-4 py-2 text-xs text-gray-600">
                  <div className="font-medium">{user?.email}</div>
                  <div className="text-gray-500">{user?.role}</div>
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;

