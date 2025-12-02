// Fichier : /client/src/pages/Dashboard.tsx
// Dashboard personnalisé selon le rôle de l'utilisateur

import React from 'react';
import { useSession } from '../session/SessionContext';
import { useQuery } from '@apollo/client';
import { LIST_EDITORS_FOR_USER } from '../graphql/queries';

const Dashboard: React.FC = () => {
  const { user } = useSession();

  // Récupérer les éditeurs pour les utilisateurs qui en ont besoin
  const { data: editorsData, loading: editorsLoading } = useQuery(LIST_EDITORS_FOR_USER, {
    skip: !user || user.role === 'Admin', // Admin voit tout, pas besoin de filtrer
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
      </div>
    );
  }

  const renderDashboardContent = () => {
    switch (user.role) {
      case 'Admin':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Vue d'ensemble Administrateur</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Gestion de la Plateforme</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Accédez à tous les modules d'administration pour gérer les utilisateurs, permissions, listes de valeurs et pistes d'audit.
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-900 dark:text-green-200 mb-2">Accès Complet</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Visualisez tous les éditeurs, solutions et données collectées sur la plateforme.
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">Actions Rapides</h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Créez des utilisateurs, configurez les permissions et administrez les données.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Actions Recommandées</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <span className="mr-2">📊</span>
                  Consulter les données collectées via le Tech Profiler
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <span className="mr-2">👥</span>
                  Gérer les utilisateurs et leurs permissions
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <span className="mr-2">🔍</span>
                  Consulter les pistes d'audit pour la traçabilité
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <span className="mr-2">⚙️</span>
                  Configurer les listes de valeurs dynamiques
                </li>
              </ul>
            </div>
          </div>
        );

      case 'Supervisor':
        const editors = editorsData?.listEditorsForUser || [];
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Tableau de bord Superviseur
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Vous supervisez {editors.length} éditeur{editors.length !== 1 ? 's' : ''} dans votre portefeuille.
              </p>
              {editorsLoading ? (
                <p className="text-gray-500 dark:text-gray-400">Chargement des éditeurs...</p>
              ) : editors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {editors.map((editor: any) => (
                    <div key={editor.editorId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{editor.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Criticité: <span className="font-medium text-gray-900 dark:text-gray-200">{editor.business_criticality}</span>
                      </p>
                      {editor.country && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Pays: <span className="font-medium text-gray-900 dark:text-gray-200">{editor.country}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Aucun éditeur assigné à votre portefeuille.</p>
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Actions Disponibles</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <span className="mr-2">📋</span>
                  Accéder au Tech Profiler pour collecter de nouvelles données
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <span className="mr-2">🏠</span>
                  Visualiser les données d'hébergement de vos éditeurs
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <span className="mr-2">📊</span>
                  Consulter les scores et métriques de vos éditeurs
                </li>
              </ul>
            </div>
          </div>
        );

      case 'EntityDirector':
      case 'Editor':
        const editor = editorsData?.listEditorsForUser?.[0];
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Tableau de bord {user.role === 'Editor' ? 'Éditeur' : 'Directeur d\'Entité'}
              </h2>
              {editorsLoading ? (
                <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
              ) : editor ? (
                <div className="space-y-4">
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{editor.name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Criticité métier:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-gray-200">{editor.business_criticality}</span>
                      </div>
                      {editor.country && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Pays:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-gray-200">{editor.country}</span>
                        </div>
                      )}
                      {editor.size && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Taille:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-gray-200">{editor.size}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Actions Disponibles</h4>
                    <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                      <li className="flex items-center">
                        <span className="mr-2">📋</span>
                        Utiliser le Tech Profiler pour mettre à jour vos données
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2">🏠</span>
                        Consulter les informations d'hébergement
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2">📊</span>
                        Visualiser vos scores de santé technique
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    Aucun éditeur associé à votre compte. Contactez un administrateur pour être assigné à un éditeur.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
            <p className="text-gray-500 dark:text-gray-400">Rôle non reconnu.</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Bienvenue, {user.firstName || user.email} !
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Rôle: <span className="font-medium text-gray-900 dark:text-gray-200">{user.role}</span>
        </p>
      </div>
      {renderDashboardContent()}
    </div>
  );
};

export default Dashboard;

