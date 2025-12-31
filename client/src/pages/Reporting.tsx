// Fichier : /client/src/pages/Reporting.tsx
// Page de gestion des reportings

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor } from '../contexts/EditorContext';
import { useMutation } from '@apollo/client';
import { GENERATE_AISA_REPORT } from '../graphql/queries';
import { parseGraphQLError } from '../utils/errorHandler';

const Reporting: React.FC = () => {
  const { t } = useTranslation();
  const { selectedEditorId, canSelectMultiple, editors } = useEditor();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [generateAisaReport] = useMutation(GENERATE_AISA_REPORT, {
    onCompleted: (data) => {
      if (data.generateAisaReport && data.generateAisaReport.csvContent) {
        // Télécharger le CSV
        const blob = new Blob([data.generateAisaReport.csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `AISA_Report_${selectedEditorId || 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setIsGenerating(false);
        setSuccess(t('reporting.downloadSuccess', 'Rapport téléchargé avec succès'));
        setError(null);
        setTimeout(() => setSuccess(null), 5000);
      }
    },
    onError: (err) => {
      setIsGenerating(false);
      const parsedError = parseGraphQLError(err);
      setError(parsedError.message || t('reporting.downloadError', 'Erreur lors de la génération du rapport'));
      setSuccess(null);
    },
  });

  const handleDownloadAisa = async () => {
    if (!selectedEditorId) {
      setError(t('reporting.selectEntityFirst', 'Veuillez sélectionner une entité au préalable'));
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      await generateAisaReport({
        variables: {
          editorId: selectedEditorId,
        },
      });
    } catch (err) {
      // L'erreur est gérée par onError
      console.error('Error generating AISA report:', err);
    }
  };

  const selectedEditorName = selectedEditorId 
    ? editors.find(e => e.editorId === selectedEditorId)?.name 
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('reporting.title', 'Gestion des Reportings')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {t('reporting.subtitle', 'Exportez les données techniques selon des formats prédéfinis')}
        </p>
      </div>

      {/* Messages d'erreur et de succès */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors duration-200">
          <div className="flex items-center">
            <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 transition-colors duration-200">
          <div className="flex items-center">
            <span className="text-green-700 dark:text-green-300 text-sm">{success}</span>
          </div>
        </div>
      )}

      {/* Reporting AISA v1.0 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('reporting.aisa.title', 'Questionnaire AISA v1.0')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('reporting.aisa.description', 
                'Exportez les données techniques nécessaires pour remplir le questionnaire Altamount Information Security Assessment (AISA) v1.0. Le rapport CSV contient toutes les références de champs, leurs descriptions et les valeurs associées pour l\'entité sélectionnée.')}
            </p>
            {canSelectMultiple && !selectedEditorId && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {t('reporting.selectEntityMessage', 'Veuillez sélectionner une entité dans le menu déroulant du header pour générer le rapport.')}
                </p>
              </div>
            )}
            {selectedEditorName && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {t('reporting.selectedEntity', 'Entité sélectionnée')}: <span className="font-medium">{selectedEditorName}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end">
          <button
            onClick={handleDownloadAisa}
            disabled={isGenerating || (canSelectMultiple && !selectedEditorId)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isGenerating || (canSelectMultiple && !selectedEditorId)
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
            }`}
          >
            {isGenerating ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                {t('reporting.generating', 'Génération en cours...')}
              </>
            ) : (
              <>
                <span className="mr-2">⬇️</span>
                {t('reporting.download', 'Télécharger le rapport CSV')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reporting;

