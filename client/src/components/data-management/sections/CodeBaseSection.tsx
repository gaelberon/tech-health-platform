/**
 * Section pour gérer les informations du code source (CodeBase)
 * Inclut : repo_location, documentation_level, code_review_process, version_control_tool,
 * technical_debt_known, legacy_systems, third_party_dependencies
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { UPDATE_CODEBASE } from '../../../graphql/mutations';
import { GET_EDITOR_WITH_DETAILS } from '../../../graphql/queries';
import { parseGraphQLError } from '../../../utils/errorHandler';
import type { ParsedError } from '../../../utils/errorHandler';
import { getFieldClasses } from '../../../utils/fieldValidation';
import ErrorMessage from '../ErrorMessage';
import FieldLabel from '../FieldLabel';

interface CodeBaseSectionProps {
  codebase: any;
  solutionId: string;
  editorId: string;
  showFieldReferences?: boolean;
  onDataUpdated: () => void;
  onSuccess?: (message: string) => void;
}

const CodeBaseSection: React.FC<CodeBaseSectionProps> = ({
  codebase,
  solutionId,
  editorId,
  showFieldReferences = false,
  onDataUpdated,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [updateCodebase, { loading: updating }] = useMutation(UPDATE_CODEBASE);
  const [error, setError] = useState<ParsedError | null>(null);

  const [formData, setFormData] = useState({
    solutionId: solutionId,
    repo_location: codebase?.repo_location || '',
    documentation_level: codebase?.documentation_level || 'Medium',
    code_review_process: codebase?.code_review_process || '',
    version_control_tool: codebase?.version_control_tool || '',
    technical_debt_known: codebase?.technical_debt_known || '',
    legacy_systems: codebase?.legacy_systems || '',
    third_party_dependencies: codebase?.third_party_dependencies || [] as string[],
  });

  useEffect(() => {
    if (codebase) {
      setFormData({
        solutionId: solutionId,
        repo_location: codebase.repo_location || '',
        documentation_level: codebase.documentation_level || 'Medium',
        code_review_process: codebase.code_review_process || '',
        version_control_tool: codebase.version_control_tool || '',
        technical_debt_known: codebase.technical_debt_known || '',
        legacy_systems: codebase.legacy_systems || '',
        third_party_dependencies: codebase.third_party_dependencies || [],
      });
    }
  }, [codebase, solutionId]);

  const handleSave = async () => {
    try {
      setError(null);
      await updateCodebase({
        variables: {
          input: formData,
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
        {t('dataManagement.codebase.title', 'Code Source')}
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
            translationKey="dataManagement.codebase.repoLocation"
            required
            showFieldReference={showFieldReferences}
          />
          <input
            type="text"
            value={formData.repo_location}
            onChange={(e) => setFormData({ ...formData, repo_location: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.repo_location)}
            placeholder="https://github.com/..."
            required
          />
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.codebase.documentationLevel"
            required
            showFieldReference={showFieldReferences}
          />
          <select
            value={formData.documentation_level}
            onChange={(e) => setFormData({ ...formData, documentation_level: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.documentation_level)}
            required
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="None">None</option>
          </select>
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.codebase.versionControlTool"
            showFieldReference={showFieldReferences}
          />
          <input
            type="text"
            value={formData.version_control_tool}
            onChange={(e) => setFormData({ ...formData, version_control_tool: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.version_control_tool)}
            placeholder="Git, SVN, Mercurial, etc."
          />
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.codebase.codeReviewProcess"
            showFieldReference={showFieldReferences}
          />
          <input
            type="text"
            value={formData.code_review_process}
            onChange={(e) => setFormData({ ...formData, code_review_process: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.code_review_process)}
            placeholder="Processus de revue de code"
          />
        </div>
      </div>

      <div>
        <FieldLabel
          translationKey="dataManagement.codebase.technicalDebtKnown"
          showFieldReference={showFieldReferences}
        />
        <textarea
          value={formData.technical_debt_known}
          onChange={(e) => setFormData({ ...formData, technical_debt_known: e.target.value })}
          rows={4}
          className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.technical_debt_known)}
          placeholder="Décrivez la dette technique connue..."
        />
      </div>

      <div>
        <FieldLabel
          translationKey="dataManagement.codebase.legacySystems"
          showFieldReference={showFieldReferences}
        />
        <textarea
          value={formData.legacy_systems}
          onChange={(e) => setFormData({ ...formData, legacy_systems: e.target.value })}
          rows={4}
          className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.legacy_systems)}
          placeholder="Décrivez les systèmes hérités..."
        />
      </div>

      <div>
        <FieldLabel
          translationKey="dataManagement.codebase.thirdPartyDependencies"
          showFieldReference={showFieldReferences}
        />
        <textarea
          value={formData.third_party_dependencies.join('\n')}
          onChange={(e) => {
            const deps = e.target.value
              .split('\n')
              .map(s => s.trim())
              .filter(s => s.length > 0);
            setFormData({ ...formData, third_party_dependencies: deps });
          }}
          rows={4}
          className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.third_party_dependencies)}
          placeholder="Entrez une dépendance par ligne...\nExemple:\nreact\nlodash\naxios"
        />
        {formData.third_party_dependencies.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.third_party_dependencies.map((dep, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
              >
                {dep}
              </span>
            ))}
          </div>
        )}
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

export default CodeBaseSection;

