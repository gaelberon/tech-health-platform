import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../session/SessionContext';
import { TAB_METADATA, hasAccessToTab, type TabType } from '../utils/permissions';
import { usePagePermissions } from '../hooks/usePagePermissions';
import UserMenu from './UserMenu';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onNavigate?: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, onNavigate }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userButtonRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useSession();
  
  // Charger les permissions depuis la base de données
  const { permissions: pagePermissions } = usePagePermissions(user?.role);

  // Utiliser le système de permissions pour déterminer les onglets disponibles
  const allTabs: TabType[] = ['dashboard', 'collector', 'admin', 'dd-tech', 'hosting', 'about'];
  const tabs = allTabs
    .filter((tab) => {
      // Admin est maintenant accessible via le menu utilisateur, retiré du header
      if (tab === 'admin') return false;
      return hasAccessToTab(user?.role, tab, pagePermissions);
    })
    .map((tab) => ({
      id: tab,
      label: t(`navigation.${tab}`),
      subtitle: TAB_METADATA[tab].subtitle,
      icon: TAB_METADATA[tab].icon,
    }));

  const availableTabs = tabs;

  return (
    <>
      {/* Navigation Desktop - Barre horizontale en haut */}
      <nav className="hidden md:flex bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Titre */}
            <div 
              onClick={() => onTabChange('dashboard')}
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img
                src="/icon-192.png"
                alt="Tech Health Platform"
                className="h-10 w-10 object-contain"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Tech</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Health</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Platform</span>
              </div>
            </div>

            {/* Onglets de navigation */}
            <div className="flex items-center space-x-1">
              {availableTabs.map((tab) => {
                const canAccess = hasAccessToTab(user?.role, tab.id, pagePermissions);
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (canAccess) {
                        onTabChange(tab.id);
                      } else {
                        console.warn(`[SECURITY] Tentative d'accès non autorisé à l'onglet ${tab.id}`);
                      }
                    }}
                    disabled={!canAccess}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
                        : canAccess
                        ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                        : 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* User profile picture/name & Menu */}
            <div className="flex items-center space-x-4">
              <div
                ref={userButtonRef}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              >
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.firstName || user.email}
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-semibold text-sm border-2 border-gray-300 dark:border-gray-600 flex-shrink-0">
                    {user?.firstName
                      ? user.firstName[0].toUpperCase()
                      : user?.email
                      ? user.email[0].toUpperCase()
                      : 'U'}
                  </div>
                )}
              </div>
              <UserMenu
                isOpen={isUserMenuOpen}
                onClose={() => setIsUserMenuOpen(false)}
                anchorElement={userButtonRef.current}
                onNavigate={onNavigate}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Navigation Mobile - Menu burger */}
      <nav className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50 transition-colors duration-200">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div 
              onClick={() => {
                onTabChange('dashboard');
                setIsMenuOpen(false);
              }}
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img
                src="/icon-192.png"
                alt="Tech Health Platform"
                className="h-8 w-8 object-contain"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Tech</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Health</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">Platform</span>
              </div>
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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
          <div className="border-t border-gray-200 bg-white transition-colors duration-200">
            <div className="px-4 py-2 space-y-1">
              {availableTabs.map((tab) => {
                const canAccess = hasAccessToTab(user?.role, tab.id, pagePermissions);
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (canAccess) {
                        onTabChange(tab.id);
                        setIsMenuOpen(false);
                      } else {
                        console.warn(`[SECURITY] Tentative d'accès non autorisé à l'onglet ${tab.id}`);
                      }
                    }}
                    disabled={!canAccess}
                    className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                        : canAccess
                        ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        : 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="px-4 py-2 flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.firstName || user.email}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                      {user?.firstName
                        ? user.firstName[0].toUpperCase()
                        : user?.email
                        ? user.email[0].toUpperCase()
                        : 'U'}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{user?.firstName || user?.email}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</div>
                  </div>
                </div>
                <UserMenu
                  isOpen={isUserMenuOpen}
                  onClose={() => setIsUserMenuOpen(false)}
                  anchorElement={null}
                  onNavigate={onNavigate}
                />
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;

