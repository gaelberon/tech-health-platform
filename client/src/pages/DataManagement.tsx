/**
 * Page Data Management - Gestion complète des données éditeurs, solutions, environnements
 * 
 * Pour les admins : sélection d'un éditeur
 * Pour les autres utilisateurs : éditeur lié automatiquement
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@apollo/client';
import { useSession } from '../session/SessionContext';
import { useEditor } from '../contexts/EditorContext';
import { GET_EDITOR_WITH_DETAILS } from '../graphql/queries';
import EditorDashboard from '../components/data-management/EditorDashboard';
import DataManagementForm from '../components/data-management/DataManagementForm';

const DataManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useSession();
  const { selectedEditorId, canSelectMultiple } = useEditor();
  const [activeView, setActiveView] = useState<'dashboard' | 'form'>('dashboard');
  const [showFieldReferences, setShowFieldReferences] = useState<boolean>(false);

  // Récupérer les détails de l'éditeur sélectionné
  const { data: editorDetails, loading: editorDetailsLoading, error: editorDetailsError, refetch: refetchEditorDetails } = useQuery(
    GET_EDITOR_WITH_DETAILS,
    {
      variables: { editorId: selectedEditorId! },
      skip: !selectedEditorId || !user,
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all', // Continuer même en cas d'erreur partielle
    }
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">{t('dataManagement.loading')}</p>
      </div>
    );
  }

  const editor = editorDetails?.getEditor;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('dataManagement.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {t('dataManagement.subtitle')}
          </p>
        </div>
      </div>

      {/* Option d'affichage des références (uniquement pour Admin) */}
      {user.role === 'Admin' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showFieldReferences}
              onChange={(e) => setShowFieldReferences(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('dataManagement.showFieldReferences', 'Afficher les références au modèle de données')}
            </span>
          </label>
        </div>
      )}


      {/* Navigation entre dashboard et formulaire */}
      {selectedEditorId && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeView === 'dashboard'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              📊 {t('dataManagement.dashboardTab')}
            </button>
            <button
              onClick={() => setActiveView('form')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeView === 'form'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              ✏️ {t('dataManagement.editData')}
            </button>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      {!selectedEditorId ? (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {canSelectMultiple
              ? t('dataManagement.selectEditorFirst', 'Veuillez sélectionner une entité dans le menu en haut à droite pour afficher les données.')
              : t('dataManagement.noEditorAssociated')}
          </p>
        </div>
      ) : editorDetailsLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">{t('dataManagement.loading')}</p>
        </div>
      ) : editorDetailsError ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-700 dark:text-red-300 font-semibold">{t('dataManagement.error')}</p>
          <p className="text-red-600 dark:text-red-400 text-sm mt-2">
            {editorDetailsError.message}
          </p>
        </div>
      ) : activeView === 'dashboard' ? (
        <EditorDashboard editor={editor} editorId={selectedEditorId} />
      ) : (
        <DataManagementForm
          editor={editor}
          editorId={selectedEditorId}
          showFieldReferences={showFieldReferences}
          onDataUpdated={() => {
            refetchEditorDetails();
            // Ne pas changer de vue automatiquement, laisser l'utilisateur continuer à éditer
          }}
        />
      )}
    </div>
  );
};

export default DataManagement;

