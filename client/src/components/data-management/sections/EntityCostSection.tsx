/**
 * Section pour gérer les coûts (EntityCost)
 * Inclut : hosting_monthly, licenses_monthly, ops_hours_monthly_equiv, comments,
 * hidden_costs, cost_evolution_factors, modernization_investment_needs
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { UPDATE_ENTITY_COST } from '../../../graphql/mutations';
import { GET_EDITOR_WITH_DETAILS } from '../../../graphql/queries';
import { parseGraphQLError } from '../../../utils/errorHandler';
import type { ParsedError } from '../../../utils/errorHandler';
import { getFieldClasses } from '../../../utils/fieldValidation';
import ErrorMessage from '../ErrorMessage';
import FieldLabel from '../FieldLabel';

interface EntityCostSectionProps {
  costs: any;
  environmentId: string;
  editorId: string;
  showFieldReferences?: boolean;
  onDataUpdated: () => void;
  onSuccess?: (message: string) => void;
}

const EntityCostSection: React.FC<EntityCostSectionProps> = ({
  costs,
  environmentId,
  editorId,
  showFieldReferences = false,
  onDataUpdated,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [updateEntityCost, { loading: updating }] = useMutation(UPDATE_ENTITY_COST);
  const [error, setError] = useState<ParsedError | null>(null);

  const [formData, setFormData] = useState({
    envId: environmentId,
    hosting_monthly: costs?.hosting_monthly || 0,
    licenses_monthly: costs?.licenses_monthly || 0,
    ops_hours_monthly_equiv: costs?.ops_hours_monthly_equiv || 0,
    comments: costs?.comments || '',
    hidden_costs: costs?.hidden_costs || '',
    cost_evolution_factors: costs?.cost_evolution_factors || '',
    modernization_investment_needs: costs?.modernization_investment_needs || '',
  });

  useEffect(() => {
    if (costs) {
      setFormData({
        envId: environmentId,
        hosting_monthly: costs.hosting_monthly || 0,
        licenses_monthly: costs.licenses_monthly || 0,
        ops_hours_monthly_equiv: costs.ops_hours_monthly_equiv || 0,
        comments: costs.comments || '',
        hidden_costs: costs.hidden_costs || '',
        cost_evolution_factors: costs.cost_evolution_factors || '',
        modernization_investment_needs: costs.modernization_investment_needs || '',
      });
    }
  }, [costs, environmentId]);

  const handleSave = async () => {
    try {
      // S'assurer que envId est bien une string (pas un ObjectId)
      const inputData = {
        ...formData,
        envId: environmentId, // Utiliser environmentId directement (string)
      };
      
      await updateEntityCost({
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
        {t('dataManagement.costs.title', 'Coûts')}
      </h3>

      {/* Affichage des erreurs */}
      {error && (
        <ErrorMessage
          error={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Coûts mensuels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <FieldLabel
            translationKey="dataManagement.costs.hostingMonthly"
            showFieldReference={showFieldReferences}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(€)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.hosting_monthly}
            onChange={(e) => setFormData({ ...formData, hosting_monthly: parseFloat(e.target.value) || 0 })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.hosting_monthly)}
            placeholder="0.00"
          />
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.costs.licensesMonthly"
            showFieldReference={showFieldReferences}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(€)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.licenses_monthly}
            onChange={(e) => setFormData({ ...formData, licenses_monthly: parseFloat(e.target.value) || 0 })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.licenses_monthly)}
            placeholder="0.00"
          />
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.costs.opsHoursMonthly"
            showFieldReference={showFieldReferences}
          />
          <input
            type="number"
            step="0.1"
            min="0"
            value={formData.ops_hours_monthly_equiv}
            onChange={(e) => setFormData({ ...formData, ops_hours_monthly_equiv: parseFloat(e.target.value) || 0 })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.ops_hours_monthly_equiv)}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <FieldLabel
          translationKey="dataManagement.costs.comments"
          showFieldReference={showFieldReferences}
        />
        <textarea
          value={formData.comments}
          onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
          rows={3}
          className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.comments)}
          placeholder="Commentaires sur les coûts..."
        />
      </div>

      {/* Champs DD */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div>
          <FieldLabel
            translationKey="dataManagement.costs.hiddenCosts"
            showFieldReference={showFieldReferences}
          />
          <textarea
            value={formData.hidden_costs}
            onChange={(e) => setFormData({ ...formData, hidden_costs: e.target.value })}
            rows={3}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.hidden_costs)}
            placeholder="Coûts cachés ou obligations contractuelles futures..."
          />
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.costs.costEvolution"
            showFieldReference={showFieldReferences}
          />
          <textarea
            value={formData.cost_evolution_factors}
            onChange={(e) => setFormData({ ...formData, cost_evolution_factors: e.target.value })}
            rows={3}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.cost_evolution_factors)}
            placeholder="Comment les coûts évoluent avec l'utilisation (tokens IA, workflows)..."
          />
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.costs.modernizationNeeds"
            showFieldReference={showFieldReferences}
          />
          <textarea
            value={formData.modernization_investment_needs}
            onChange={(e) => setFormData({ ...formData, modernization_investment_needs: e.target.value })}
            rows={3}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.modernization_investment_needs)}
            placeholder="Investissements nécessaires pour la modernisation/croissance..."
          />
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

export default EntityCostSection;

