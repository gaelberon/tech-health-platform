// Fichier : /client/src/App.tsx

import { useState, useEffect } from 'react';
import CollectorStepper from './components/CollectorStepper';
import Login from './pages/Login';
import AccountSelection from './pages/AccountSelection';
import AdminDashboard from './pages/admin/AdminDashboard';
import About from './pages/About';
import HostingView from './pages/HostingView';
import Dashboard from './pages/Dashboard';
import Navigation from './components/Navigation';
import { SessionProvider, useSession } from './session/SessionContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { hasAccessToTab, getDefaultTab, type TabType } from './utils/permissions';
import { usePagePermissions } from './hooks/usePagePermissions';

const AppShell: React.FC = () => {
  const { isAuthenticated, loading, user, refetch } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [availableAccounts, setAvailableAccounts] = useState<any[] | null>(null);
  
  // Charger les permissions d'accès aux pages depuis la base de données
  const { permissions: pagePermissions, loading: permissionsLoading } = usePagePermissions(user?.role);

  // Vérifier les permissions et rediriger si nécessaire
  useEffect(() => {
    if (isAuthenticated && user && !permissionsLoading) {
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
        <span className="text-gray-500 text-sm">Chargement de la session...</span>
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
    // Double vérification de sécurité avant de rendre le contenu
    if (!user || (!permissionsLoading && !hasAccessToTab(user.role, activeTab, pagePermissions))) {
      return (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-semibold">Accès refusé</p>
            <p className="text-red-600 text-sm mt-2">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
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
                Formulaire d'Évaluation Technique MVS
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Collecte des données de Priorité 1 (P1) pour l'évaluation technique
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
                <p className="text-red-700 dark:text-red-300 font-semibold">Accès refusé</p>
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                  Seuls les administrateurs peuvent accéder à cette page.
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
            Centre d'Opérations Techniques (COT) - Tech Health Platform
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </SessionProvider>
  );
}

export default App;