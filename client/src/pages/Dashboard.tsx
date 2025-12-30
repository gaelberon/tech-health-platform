// Fichier : /client/src/pages/Dashboard.tsx
// Dashboard personnalisé selon le rôle de l'utilisateur

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../session/SessionContext';
import { useEditor } from '../contexts/EditorContext';
import { useQuery } from '@apollo/client';
import { LIST_EDITORS_FOR_USER } from '../graphql/queries';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useSession();
  const { selectedEditorId, canSelectMultiple, editors } = useEditor();

  // Récupérer les éditeurs pour les utilisateurs qui en ont besoin
  const { data: editorsData, loading: editorsLoading } = useQuery(LIST_EDITORS_FOR_USER, {
    skip: !user,
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
        // Si une entité est sélectionnée, afficher les détails de cette entité
        if (selectedEditorId) {
          const selectedEditor = editors.find((e) => e.editorId === selectedEditorId);
          const editorDetails = editorsData?.listEditorsForUser?.find((e: any) => e.editorId === selectedEditorId);
          return (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {selectedEditor?.name || 'Éditeur sélectionné'}
                </h2>
                {editorDetails && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {editorDetails.business_criticality && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">{t('dashboard.supervisor.criticality')}:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-gray-200">{editorDetails.business_criticality}</span>
                        </div>
                      )}
                      {editorDetails.country && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">{t('dashboard.supervisor.country')}:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-gray-200">{editorDetails.country}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }
        // Sinon, afficher la vue "toutes les entités"
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('dashboard.admin.title')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">{t('dashboard.admin.platformManagement')}</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {t('dashboard.admin.platformManagementDesc')}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-900 dark:text-green-200 mb-2">{t('dashboard.admin.fullAccess')}</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {t('dashboard.admin.fullAccessDesc')}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">{t('dashboard.admin.quickActions')}</h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    {t('dashboard.admin.quickActionsDesc')}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('dashboard.admin.recommendedActions')}</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <span className="mr-2">📊</span>
                  {t('dashboard.admin.viewData')}
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <span className="mr-2">👥</span>
                  {t('dashboard.admin.manageUsers')}
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <span className="mr-2">🔍</span>
                  {t('dashboard.admin.viewAudit')}
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <span className="mr-2">⚙️</span>
                  {t('dashboard.admin.configureLookups')}
                </li>
              </ul>
            </div>
          </div>
        );

      case 'Supervisor':
        const supervisorEditors = editorsData?.listEditorsForUser || [];
        // Si une entité est sélectionnée, afficher les détails de cette entité
        if (selectedEditorId) {
          const selectedEditor = supervisorEditors.find((e: any) => e.editorId === selectedEditorId);
          return (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {selectedEditor?.name || 'Éditeur sélectionné'}
                </h2>
                {selectedEditor && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedEditor.business_criticality && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">{t('dashboard.supervisor.criticality')}:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-gray-200">{selectedEditor.business_criticality}</span>
                        </div>
                      )}
                      {selectedEditor.country && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">{t('dashboard.supervisor.country')}:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-gray-200">{selectedEditor.country}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }
        // Sinon, afficher la vue "toutes les entités"
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('dashboard.supervisor.title')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('dashboard.supervisor.editorsCount', { count: supervisorEditors.length })}
              </p>
              {editorsLoading ? (
                <p className="text-gray-500 dark:text-gray-400">{t('dashboard.supervisor.loadingEditors')}</p>
              ) : supervisorEditors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {supervisorEditors.map((editor: any) => (
                    <div key={editor.editorId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{editor.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('dashboard.supervisor.criticality')}: <span className="font-medium text-gray-900 dark:text-gray-200">{editor.business_criticality}</span>
                      </p>
                      {editor.country && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('dashboard.supervisor.country')}: <span className="font-medium text-gray-900 dark:text-gray-200">{editor.country}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">{t('dashboard.supervisor.noEditors')}</p>
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('dashboard.supervisor.availableActions')}</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <span className="mr-2">📋</span>
                  {t('dashboard.supervisor.accessProfiler')}
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <span className="mr-2">🏠</span>
                  {t('dashboard.supervisor.viewHosting')}
                </li>
                <li className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <span className="mr-2">📊</span>
                  {t('dashboard.supervisor.viewScores')}
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
                {user.role === 'Editor' ? t('dashboard.editor.title') : t('dashboard.entityDirector.title')}
              </h2>
              {editorsLoading ? (
                <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
              ) : editor ? (
                <div className="space-y-4">
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{editor.name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('dashboard.entityDirector.businessCriticality')}:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-gray-200">{editor.business_criticality}</span>
                      </div>
                      {editor.country && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">{t('dashboard.supervisor.country')}:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-gray-200">{editor.country}</span>
                        </div>
                      )}
                      {editor.size && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">{t('dashboard.supervisor.size')}:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-gray-200">{editor.size}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">{t('dashboard.entityDirector.availableActions')}</h4>
                    <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                      <li className="flex items-center">
                        <span className="mr-2">📋</span>
                        {t('dashboard.entityDirector.useProfiler')}
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2">🏠</span>
                        {t('dashboard.entityDirector.viewHosting')}
                      </li>
                      <li className="flex items-center">
                        <span className="mr-2">📊</span>
                        {t('dashboard.entityDirector.viewScores')}
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    {t('dashboard.entityDirector.contactAdmin')}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
            <p className="text-gray-500 dark:text-gray-400">{t('dashboard.unknownRole')}</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('dashboard.welcome', { name: user.firstName || user.email })}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {t('dashboard.role')}: <span className="font-medium text-gray-900 dark:text-gray-200">{t(`roles.${user.role}`)}</span>
        </p>
      </div>
      {renderDashboardContent()}
    </div>
  );
};

export default Dashboard;

