/**
 * Page Data Management - Gestion complète des données éditeurs, solutions, environnements
 * 
 * Pour les admins : sélection d'un éditeur
 * Pour les autres utilisateurs : éditeur lié automatiquement
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@apollo/client';
import { useSession } from '../session/SessionContext';
import { LIST_EDITORS_FOR_USER, GET_EDITOR_WITH_DETAILS } from '../graphql/queries';
import EditorDashboard from '../components/data-management/EditorDashboard';
import DataManagementForm from '../components/data-management/DataManagementForm';

const DataManagement: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useSession();
  const [selectedEditorId, setSelectedEditorId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'form'>('dashboard');
  const [showFieldReferences, setShowFieldReferences] = useState<boolean>(false);

  // Récupérer les éditeurs disponibles
  const { data: editorsData, loading: editorsLoading } = useQuery(LIST_EDITORS_FOR_USER, {
    skip: !user,
  });

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

  // Déterminer l'éditeur par défaut selon le rôle
  useEffect(() => {
    if (!user || editorsLoading) return;

    const editors = editorsData?.listEditorsForUser || [];

    if (editors.length > 0 && !selectedEditorId) {
      // Sélectionner l'éditeur le plus ancien (basé sur createdAt) ou le premier si pas de date
      let defaultEditor = editors[0];
      if (editors.length > 1) {
        const sortedEditors = [...editors].sort((a: any, b: any) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (dateA === 0 && dateB === 0) {
            // Fallback: utiliser editorId (séquentiel)
            return a.editorId.localeCompare(b.editorId);
          }
          return dateA - dateB; // Tri croissant (plus ancienne en premier)
        });
        defaultEditor = sortedEditors[0];
      }
      setSelectedEditorId(defaultEditor.editorId);
    }
  }, [user, editorsData, editorsLoading, selectedEditorId]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">{t('dataManagement.loading')}</p>
      </div>
    );
  }

  const editors = editorsData?.listEditorsForUser || [];
  const selectedEditor = editors.find((e: any) => e.editorId === selectedEditorId);
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

      {/* Sélection d'éditeur (uniquement pour les admins) */}
      {user.role === 'Admin' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('dataManagement.selectEditor')}
          </label>
          {editorsLoading ? (
            <p className="text-gray-500 dark:text-gray-400">{t('dataManagement.loading')}</p>
          ) : (
            <select
              value={selectedEditorId || ''}
              onChange={(e) => {
                setSelectedEditorId(e.target.value);
                setActiveView('dashboard');
              }}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">{t('dataManagement.selectEditorPlaceholder')}</option>
              {editors.map((editor: any) => (
                <option key={editor.editorId} value={editor.editorId}>
                  {editor.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Affichage de l'éditeur pour les non-admins */}
      {user.role !== 'Admin' && selectedEditor && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <span className="font-medium">{t('dataManagement.currentEditor')}:</span> {selectedEditor.name}
          </p>
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
            {user.role === 'Admin'
              ? t('dataManagement.selectEditorFirst')
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

