// Fichier : /client/src/App.tsx

import { useState } from 'react';
import CollectorStepper from './components/CollectorStepper';
import Login from './pages/Login';
import AdminPermissions from './pages/AdminPermissions';
import Navigation from './components/Navigation';
import { SessionProvider, useSession } from './session/SessionContext';

type TabType = 'collector' | 'admin' | 'dashboard';

const AppShell: React.FC = () => {
  const { isAuthenticated, loading, user, refetch } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('collector');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-gray-500 text-sm">Chargement de la session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoggedIn={refetch} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'collector':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Formulaire d'Évaluation Technique MVS
              </h2>
              <p className="text-gray-600 text-sm">
                Collecte des données de Priorité 1 (P1) pour l'évaluation technique
              </p>
            </div>
            <CollectorStepper />
          </div>
        );
      case 'admin':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Administration des Permissions
              </h2>
              <p className="text-gray-600 text-sm">
                Configurez les permissions par rôle pour les mutations GraphQL
              </p>
            </div>
            <AdminPermissions />
          </div>
        );
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Tableau de Bord
              </h2>
              <p className="text-gray-600 text-sm">
                Vue d'ensemble des scores et métriques (à venir)
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-blue-700">Cette fonctionnalité sera disponible prochainement.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
            {renderContent()}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-500">
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
      <AppShell />
    </SessionProvider>
  );
}

export default App;