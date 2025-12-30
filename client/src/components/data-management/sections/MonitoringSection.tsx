/**
 * Section pour gérer le monitoring et l'observabilité
 * Inclut : perf_monitoring, log_centralization, tools, alerting_strategy
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { UPDATE_MONITORING } from '../../../graphql/mutations';
import { GET_EDITOR_WITH_DETAILS } from '../../../graphql/queries';
import { gql } from '@apollo/client';
import { parseGraphQLError } from '../../../utils/errorHandler';
import type { ParsedError } from '../../../utils/errorHandler';
import { getFieldClasses } from '../../../utils/fieldValidation';
import ErrorMessage from '../ErrorMessage';
import FieldLabel from '../FieldLabel';
import { useLookups } from '../../../hooks/useLookups';

const GET_MONITORING_TOOLS_LOOKUP = gql`
  query GetMonitoringToolsLookup($lang: String!) {
    monitoringTools: getLookups(keys: ["MONITORING_TOOLS"], lang: $lang) {
      key
      values {
        code
        label
        label_fr
        label_en
        description
        order
        active
      }
    }
  }
`;

interface MonitoringSectionProps {
  monitoring: any;
  environmentId: string;
  editorId: string;
  showFieldReferences?: boolean;
  onDataUpdated: () => void;
  onSuccess?: (message: string) => void;
}

const MonitoringSection: React.FC<MonitoringSectionProps> = ({
  monitoring,
  environmentId,
  editorId,
  showFieldReferences = false,
  onDataUpdated,
  onSuccess,
}) => {
  const { t, i18n } = useTranslation();
  const [updateMonitoring, { loading: updating }] = useMutation(UPDATE_MONITORING);
  const [error, setError] = useState<ParsedError | null>(null);
  const { lookups, loading: lookupsLoading } = useLookups();

  // Charger les lookups pour les outils de monitoring
  const { data: lookupsData } = useQuery(GET_MONITORING_TOOLS_LOOKUP, {
    variables: { lang: i18n.language || 'fr' },
    fetchPolicy: 'cache-and-network', // Forcer le rechargement pour avoir les dernières données
    notifyOnNetworkStatusChange: true,
  });

  // Extraire les options de monitoring depuis les lookups
  const monitoringToolsOptions = useMemo(() => {
    // Priorité 1 : Utiliser les lookups du hook useLookups (plus récent)
    if (lookups.monitoringTools && lookups.monitoringTools.length > 0) {
      return lookups.monitoringTools;
    }
    
    // Priorité 2 : Utiliser la query séparée
    if (lookupsData?.monitoringTools && lookupsData.monitoringTools.length > 0) {
      const values = lookupsData.monitoringTools[0]?.values || [];
      // Filtrer les valeurs actives et les trier par ordre
      return values
        .filter((v: any) => v.active !== false)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        .map((v: any) => {
          // Utiliser le label localisé si disponible, sinon le label par défaut
          const lang = i18n.language || 'fr';
          let label = v.label || v.code;
          if (lang === 'fr' && v.label_fr) label = v.label_fr;
          if (lang === 'en' && v.label_en) label = v.label_en;
          
          return {
            code: v.code,
            label: label
          };
        });
    }
    
    // Fallback vers les options par défaut si les lookups ne sont pas disponibles
    return [
      { code: 'prometheus', label: 'Prometheus' },
      { code: 'grafana', label: 'Grafana' },
      { code: 'elk', label: 'ELK Stack' },
      { code: 'datadog', label: 'Datadog' },
      { code: 'splunk', label: 'Splunk' },
      { code: 'newrelic', label: 'New Relic' },
      { code: 'zabbix', label: 'Zabbix' },
      { code: 'graylog', label: 'Graylog' },
      { code: 'other', label: 'Other' }
    ];
  }, [lookups.monitoringTools, lookupsData, i18n.language]);

  const [formData, setFormData] = useState({
    envId: environmentId,
    perf_monitoring: monitoring?.perf_monitoring || 'No',
    log_centralization: monitoring?.log_centralization || 'No',
    tools: monitoring?.tools || [] as string[],
    alerting_strategy: monitoring?.alerting_strategy || '',
  });

  useEffect(() => {
    if (monitoring) {
      setFormData({
        envId: environmentId,
        perf_monitoring: monitoring.perf_monitoring || 'No',
        log_centralization: monitoring.log_centralization || 'No',
        tools: monitoring.tools || [],
        alerting_strategy: monitoring.alerting_strategy || '',
      });
    }
  }, [monitoring, environmentId]);

  const handleSave = async () => {
    try {
      setError(null);
      await updateMonitoring({
        variables: {
          input: formData,
        },
        refetchQueries: [{ query: GET_EDITOR_WITH_DETAILS, variables: { editorId } }],
      });
      if (onSuccess) {
        onSuccess(t('dataManagement.form.success'));
      }
      onDataUpdated();
    } catch (error: any) {
      const parsedError = parseGraphQLError(error);
      setError(parsedError);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {t('dataManagement.monitoring.title', 'Monitoring & Observabilité')}
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
            translationKey="dataManagement.monitoring.perfMonitoring"
            required
            showFieldReference={showFieldReferences}
          />
          <select
            value={formData.perf_monitoring}
            onChange={(e) => setFormData({ ...formData, perf_monitoring: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.perf_monitoring)}
            required
            disabled={lookupsLoading}
          >
            {lookups.monitoringStatus.length > 0 ? (
              lookups.monitoringStatus.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))
            ) : (
              <>
                <option value="Yes">Yes</option>
                <option value="Partial">Partial</option>
                <option value="No">No</option>
              </>
            )}
          </select>
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.monitoring.logCentralization"
            required
            showFieldReference={showFieldReferences}
          />
          <select
            value={formData.log_centralization}
            onChange={(e) => setFormData({ ...formData, log_centralization: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.log_centralization)}
            required
            disabled={lookupsLoading}
          >
            {lookups.monitoringStatus.length > 0 ? (
              lookups.monitoringStatus.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))
            ) : (
              <>
                <option value="Yes">Yes</option>
                <option value="Partial">Partial</option>
                <option value="No">No</option>
              </>
            )}
          </select>
        </div>
      </div>

      <div>
        <FieldLabel
          translationKey="dataManagement.monitoring.tools"
          showFieldReference={showFieldReferences}
          className="mb-2"
        />
        <div className="flex flex-wrap gap-2">
          {monitoringToolsOptions.map((tool) => {
            // Vérifier si l'outil est sélectionné (par code ou par label pour compatibilité)
            const isChecked = formData.tools.some(t => 
              t === tool.code || 
              t === tool.label ||
              t.toLowerCase() === tool.code.toLowerCase() ||
              t.toLowerCase() === tool.label.toLowerCase()
            );
            
            return (
              <label key={tool.code} className="flex items-center">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Ajouter le code (normaliser pour utiliser le code)
                      const newTools = [...formData.tools];
                      // Retirer l'ancienne valeur si elle existe (code ou label)
                      const filteredTools = newTools.filter(t => 
                        t !== tool.code && 
                        t !== tool.label &&
                        t.toLowerCase() !== tool.code.toLowerCase() &&
                        t.toLowerCase() !== tool.label.toLowerCase()
                      );
                      // Ajouter le code
                      filteredTools.push(tool.code);
                      setFormData({ ...formData, tools: filteredTools });
                    } else {
                      // Retirer le code ou le label (gérer les deux cas pour compatibilité)
                      setFormData({ 
                        ...formData, 
                        tools: formData.tools.filter(t => 
                          t !== tool.code && 
                          t !== tool.label &&
                          t.toLowerCase() !== tool.code.toLowerCase() &&
                          t.toLowerCase() !== tool.label.toLowerCase()
                        ) 
                      });
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{tool.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel
          translationKey="dataManagement.monitoring.alertingStrategy"
          showFieldReference={showFieldReferences}
        />
        <textarea
          value={formData.alerting_strategy}
          onChange={(e) => setFormData({ ...formData, alerting_strategy: e.target.value })}
          rows={4}
          className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.alerting_strategy)}
          placeholder="Comment les alertes sont-elles gérées et routées ?"
        />
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

export default MonitoringSection;

