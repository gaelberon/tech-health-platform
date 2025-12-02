// Fichier : /client/src/App.tsx

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CollectorStepper from './components/CollectorStepper';
import Login from './pages/Login';
import AccountSelection from './pages/AccountSelection';
import AdminDashboard from './pages/admin/AdminDashboard';
import About from './pages/About';
import HostingView from './pages/HostingView';
import Dashboard from './pages/Dashboard';
import MyProfile from './pages/MyProfile';
import Navigation from './components/Navigation';
import { SessionProvider, useSession } from './session/SessionContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { I18nProvider } from './i18n/I18nProvider';
import { hasAccessToTab, getDefaultTab, type TabType } from './utils/permissions';
import { usePagePermissions } from './hooks/usePagePermissions';

const AppShell: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, loading, user, refetch } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showProfile, setShowProfile] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<any[] | null>(null);
  
  // Charger les permissions d'accès aux pages depuis la base de données
  const { permissions: pagePermissions, loading: permissionsLoading } = usePagePermissions(user?.role);

  // Gérer la navigation vers le profil
  useEffect(() => {
    if (activeTab === 'profile') {
      setShowProfile(true);
    } else {
      setShowProfile(false);
    }
  }, [activeTab]);

  // Vérifier les permissions et rediriger si nécessaire
  useEffect(() => {
    if (isAuthenticated && user && !permissionsLoading) {
      // Le profil est toujours accessible, ne pas rediriger
      if (activeTab === 'profile') {
        return;
      }
      // Si l'utilisateur n'a pas accès à l'onglet actuel, rediriger vers un onglet autorisé
      if (!hasAccessToTab(user.role, activeTab, pagePermissions)) {
        const defaultTab = getDefaultTab(user.role, pagePermissions);
        console.warn(`[SECURITY] Utilisateur ${user.role} n'a pas accès à l'onglet ${activeTab}. Redirection vers ${defaultTab}`);
        setActiveTab(defaultTab);
      }
    } else if (!isAuthenticated) {
      // Réinitialiser l'onglet lors de la déconnexion
      setActiveTab('dashboard');
    }
  }, [isAuthenticated, user?.role, activeTab, pagePermissions, permissionsLoading]);

  // Lors de la connexion, rediriger vers un onglet autorisé
  useEffect(() => {
    if (isAuthenticated && user && !permissionsLoading) {
      // Si l'utilisateur arrive sur collector mais a accès au dashboard, rediriger vers dashboard
      if (activeTab === 'collector' && hasAccessToTab(user.role, 'dashboard', pagePermissions)) {
        setActiveTab('dashboard');
      } else if (!hasAccessToTab(user.role, activeTab, pagePermissions)) {
        const defaultTab = getDefaultTab(user.role, pagePermissions);
        setActiveTab(defaultTab);
      }
    }
  }, [isAuthenticated, user?.role, pagePermissions, permissionsLoading]); // S'exécute quand l'utilisateur change

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-gray-500 text-sm">{t('app.sessionLoading')}</span>
      </div>
    );
  }

  // Si des comptes sont disponibles pour sélection, afficher la page de sélection
  if (availableAccounts && availableAccounts.length > 0) {
    return (
      <AccountSelection
        accounts={availableAccounts}
        onAccountSelected={() => {
          setAvailableAccounts(null);
          // Réinitialiser l'onglet actif lors de la sélection de compte
          setActiveTab('dashboard');
          refetch();
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <Login
        onLoggedIn={() => {
          // Réinitialiser l'onglet actif lors de la connexion
          setActiveTab('dashboard');
          refetch();
        }}
        onAccountSelectionRequired={(accounts) => {
          setAvailableAccounts(accounts);
        }}
      />
    );
  }

  const renderContent = () => {
    // Afficher la page de profil si demandée
    if (showProfile) {
      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 transition-colors duration-200">
            <MyProfile
              onClose={() => {
                setShowProfile(false);
                setActiveTab('dashboard');
              }}
            />
          </div>
        </div>
      );
    }

    // Double vérification de sécurité avant de rendre le contenu
    // Le profil est toujours accessible, ne pas bloquer
    if (!user || (activeTab !== 'profile' && !permissionsLoading && !hasAccessToTab(user.role, activeTab, pagePermissions))) {
      return (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-700 font-semibold">{t('app.accessDenied')}</p>
              <p className="text-red-600 text-sm mt-2">
                {t('app.noPermission')}
              </p>
            </div>
          </div>
      );
    }

    switch (activeTab) {
      case 'collector':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {t('app.collectorTitle')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t('app.collectorSubtitle')}
              </p>
            </div>
            <CollectorStepper />
          </div>
        );
      case 'admin':
        // Vérification supplémentaire pour la page admin
        if (user.role !== 'Admin') {
          return (
            <div className="space-y-6">
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center transition-colors duration-200">
                <p className="text-red-700 dark:text-red-300 font-semibold">{t('app.accessDenied')}</p>
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                  {t('app.adminOnly')}
                </p>
              </div>
            </div>
          );
        }
        return <AdminDashboard />;
      case 'dashboard':
        return <Dashboard />;
      case 'hosting':
        return <HostingView />;
      case 'about':
        return <About />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} onNavigate={setActiveTab} />
      
      <main className="flex-1">
        {activeTab === 'dashboard' ? (
          renderContent()
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 transition-colors duration-200">
              {renderContent()}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            {t('app.footer')}
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <SessionProvider>
      <I18nProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </I18nProvider>
    </SessionProvider>
  );
}

export default App;