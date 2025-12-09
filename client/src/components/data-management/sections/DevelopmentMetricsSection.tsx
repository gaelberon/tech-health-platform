/**
 * Section pour gérer les métriques de développement (DevelopmentMetrics)
 * Inclut : sdlc_process, devops_automation_level, planned_vs_unplanned_ratio,
 * lead_time_for_changes_days, mttr_hours, internal_vs_external_bug_ratio
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { UPDATE_DEVELOPMENT_METRICS } from '../../../graphql/mutations';
import { GET_EDITOR_WITH_DETAILS } from '../../../graphql/queries';
import { parseGraphQLError } from '../../../utils/errorHandler';
import type { ParsedError } from '../../../utils/errorHandler';
import { getFieldClasses } from '../../../utils/fieldValidation';
import ErrorMessage from '../ErrorMessage';
import FieldLabel from '../FieldLabel';

interface DevelopmentMetricsSectionProps {
  developmentMetrics: any;
  solutionId: string;
  editorId: string;
  showFieldReferences?: boolean;
  onDataUpdated: () => void;
  onSuccess?: (message: string) => void;
}

const DevelopmentMetricsSection: React.FC<DevelopmentMetricsSectionProps> = ({
  developmentMetrics,
  solutionId,
  editorId,
  showFieldReferences = false,
  onDataUpdated,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [updateDevelopmentMetrics, { loading: updating }] = useMutation(UPDATE_DEVELOPMENT_METRICS);
  const [error, setError] = useState<ParsedError | null>(null);

  const [formData, setFormData] = useState({
    solutionId: solutionId,
    sdlc_process: developmentMetrics?.sdlc_process || 'Scrum',
    devops_automation_level: developmentMetrics?.devops_automation_level || 'Manual',
    planned_vs_unplanned_ratio: developmentMetrics?.planned_vs_unplanned_ratio?.toString() || '0.85',
    lead_time_for_changes_days: developmentMetrics?.lead_time_for_changes_days?.toString() || '0',
    mttr_hours: developmentMetrics?.mttr_hours?.toString() || '0',
    internal_vs_external_bug_ratio: developmentMetrics?.internal_vs_external_bug_ratio?.toString() || '0.5',
  });

  useEffect(() => {
    if (developmentMetrics) {
      setFormData({
        solutionId: solutionId,
        sdlc_process: developmentMetrics.sdlc_process || 'Scrum',
        devops_automation_level: developmentMetrics.devops_automation_level || 'Manual',
        planned_vs_unplanned_ratio: developmentMetrics.planned_vs_unplanned_ratio?.toString() || '0.85',
        lead_time_for_changes_days: developmentMetrics.lead_time_for_changes_days?.toString() || '0',
        mttr_hours: developmentMetrics.mttr_hours?.toString() || '0',
        internal_vs_external_bug_ratio: developmentMetrics.internal_vs_external_bug_ratio?.toString() || '0.5',
      });
    }
  }, [developmentMetrics, solutionId]);

  const handleSave = async () => {
    try {
      setError(null);
      
      // Convertir les valeurs numériques
      const inputData = {
        solutionId: formData.solutionId,
        sdlc_process: formData.sdlc_process,
        devops_automation_level: formData.devops_automation_level,
        planned_vs_unplanned_ratio: parseFloat(formData.planned_vs_unplanned_ratio) || 0.85,
        lead_time_for_changes_days: parseFloat(formData.lead_time_for_changes_days) || 0,
        mttr_hours: parseFloat(formData.mttr_hours) || 0,
        internal_vs_external_bug_ratio: parseFloat(formData.internal_vs_external_bug_ratio) || 0.5,
      };

      await updateDevelopmentMetrics({
        variables: {
          input: inputData,
        },
        refetchQueries: [{ query: GET_EDITOR_WITH_DETAILS, variables: { editorId } }],
      });
      if (onSuccess) {
        onSuccess(t('dataManagement.form.success'));
      }
      onDataUpdated();
    } catch (err: any) {
      const parsedError = parseGraphQLError(err);
      setError(parsedError);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {t('dataManagement.developmentMetrics.title', 'Métriques de Développement')}
      </h3>

      {error && (
        <ErrorMessage
          error={error}
          onClose={() => setError(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel
            translationKey="dataManagement.developmentMetrics.sdlcProcess"
            required
            showFieldReference={showFieldReferences}
          />
          <select
            value={formData.sdlc_process}
            onChange={(e) => setFormData({ ...formData, sdlc_process: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.sdlc_process)}
            required
          >
            <option value="Scrum">Scrum</option>
            <option value="Kanban">Kanban</option>
            <option value="Waterfall">Waterfall</option>
            <option value="Agile">Agile</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.developmentMetrics.devopsAutomationLevel"
            required
            showFieldReference={showFieldReferences}
          />
          <select
            value={formData.devops_automation_level}
            onChange={(e) => setFormData({ ...formData, devops_automation_level: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.devops_automation_level)}
            required
          >
            <option value="None">None</option>
            <option value="Manual">Manual</option>
            <option value="Partial CI">Partial CI</option>
            <option value="Full CI/CD">Full CI/CD</option>
          </select>
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.developmentMetrics.plannedVsUnplannedRatio"
            required
            showFieldReference={showFieldReferences}
          />
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={formData.planned_vs_unplanned_ratio}
            onChange={(e) => setFormData({ ...formData, planned_vs_unplanned_ratio: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.planned_vs_unplanned_ratio)}
            placeholder="0.85 (pour 85%)"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('dataManagement.developmentMetrics.ratioHint', 'Ratio entre 0 et 1 (ex: 0.85 = 85%)')}
          </p>
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.developmentMetrics.leadTimeForChangesDays"
            required
            showFieldReference={showFieldReferences}
          />
          <input
            type="number"
            step="0.1"
            min="0"
            value={formData.lead_time_for_changes_days}
            onChange={(e) => setFormData({ ...formData, lead_time_for_changes_days: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.lead_time_for_changes_days)}
            placeholder="5"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('dataManagement.developmentMetrics.daysHint', 'Délai en jours')}
          </p>
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.developmentMetrics.mttrHours"
            required
            showFieldReference={showFieldReferences}
          />
          <input
            type="number"
            step="0.1"
            min="0"
            value={formData.mttr_hours}
            onChange={(e) => setFormData({ ...formData, mttr_hours: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.mttr_hours)}
            placeholder="24"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('dataManagement.developmentMetrics.hoursHint', 'MTTR en heures')}
          </p>
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.developmentMetrics.internalVsExternalBugRatio"
            required
            showFieldReference={showFieldReferences}
          />
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={formData.internal_vs_external_bug_ratio}
            onChange={(e) => setFormData({ ...formData, internal_vs_external_bug_ratio: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.internal_vs_external_bug_ratio)}
            placeholder="0.5 (pour 50%)"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('dataManagement.developmentMetrics.ratioHint', 'Ratio entre 0 et 1 (ex: 0.5 = 50%)')}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={updating}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updating ? t('dataManagement.form.saving') : t('dataManagement.form.save')}
        </button>
      </div>
    </div>
  );
};

export default DevelopmentMetricsSection;

