/**
 * Section pour gérer tous les détails d'un Environment
 * Inclut tous les champs : env_type, deployment_type, virtualization, redundancy, tech_stack, data_types,
 * network_security_mechanisms, db_scaling_mechanism, disaster_recovery_plan, sla_offered, backup
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { UPDATE_ENVIRONMENT } from '../../../graphql/mutations';
import { GET_EDITOR_WITH_DETAILS } from '../../../graphql/queries';
import { parseGraphQLError, validateFormData } from '../../../utils/errorHandler';
import type { ParsedError } from '../../../utils/errorHandler';
import { getFieldClasses } from '../../../utils/fieldValidation';
import ErrorMessage from '../ErrorMessage';
import FieldLabel from '../FieldLabel';
import { useLookups } from '../../../hooks/useLookups';

interface EnvironmentDetailsSectionProps {
  environment: any;
  environmentId: string;
  solutionId: string;
  editorId: string;
  showFieldReferences?: boolean;
  onDataUpdated: () => void;
  onSuccess?: (message: string) => void;
}

const EnvironmentDetailsSection: React.FC<EnvironmentDetailsSectionProps> = ({
  environment,
  environmentId,
  solutionId,
  editorId,
  showFieldReferences = false,
  onDataUpdated,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [updateEnvironment, { loading: updating }] = useMutation(UPDATE_ENVIRONMENT);
  const [error, setError] = useState<ParsedError | null>(null);
  const { lookups, loading: lookupsLoading } = useLookups();

  const [formData, setFormData] = useState({
    env_type: environment?.env_type || 'production',
    deployment_type: environment?.deployment_type || '',
    virtualization: environment?.virtualization || '',
    redundancy: environment?.redundancy === 'geo_redundant' ? 'geo-redundant' : (environment?.redundancy || 'none'),
    tech_stack: environment?.tech_stack || [] as string[],
    data_types: environment?.data_types || [] as string[],
    network_security_mechanisms: environment?.network_security_mechanisms || [] as string[],
    db_scaling_mechanism: environment?.db_scaling_mechanism || '',
    disaster_recovery_plan: environment?.disaster_recovery_plan || '',
    security_zones_managed: environment?.security_zones_managed || '',
    network_services_requirements: environment?.network_services_requirements || '',
    information_assets_removal_policy: environment?.information_assets_removal_policy || '',
    shared_external_it_services_protection: environment?.shared_external_it_services_protection || '',
    sla_offered: environment?.sla_offered || '',
    backup: {
      exists: environment?.backup?.exists || false,
      schedule: environment?.backup?.schedule || '',
      rto_hours: environment?.backup?.rto_hours || 24,
      rpo_hours: environment?.backup?.rpo_hours || 4,
      restoration_test_frequency: environment?.backup?.restoration_test_frequency || 'never',
    },
  });

  useEffect(() => {
    if (environment) {
      const displayRedundancy = environment.redundancy === 'geo_redundant' ? 'geo-redundant' : (environment.redundancy || 'none');
      setFormData({
        env_type: environment.env_type || 'production',
        deployment_type: environment.deployment_type || '',
        virtualization: environment.virtualization || '',
        redundancy: displayRedundancy,
        tech_stack: environment.tech_stack || [],
        data_types: environment.data_types || [],
        network_security_mechanisms: environment.network_security_mechanisms || [],
        db_scaling_mechanism: environment.db_scaling_mechanism || '',
        disaster_recovery_plan: environment.disaster_recovery_plan || '',
        security_zones_managed: environment.security_zones_managed || '',
        network_services_requirements: environment.network_services_requirements || '',
        information_assets_removal_policy: environment.information_assets_removal_policy || '',
        shared_external_it_services_protection: environment.shared_external_it_services_protection || '',
        sla_offered: environment.sla_offered || '',
        backup: {
          exists: environment.backup?.exists || false,
          schedule: environment.backup?.schedule || '',
          rto_hours: environment.backup?.rto_hours || 24,
          rpo_hours: environment.backup?.rpo_hours || 4,
          restoration_test_frequency: environment.backup?.restoration_test_frequency || 'never',
        },
      });
    }
  }, [environment]);

  const handleSave = async () => {
    setError(null);
    
    // Validation avant soumission - vérifier que les valeurs par défaut "-" ne sont pas utilisées pour les champs optionnels
    const validationData: Record<string, any> = {
      env_type: formData.env_type,
      redundancy: formData.redundancy,
    };
    
    // Vérifier les champs optionnels qui ne doivent pas être "-"
    if (formData.deployment_type === '-') {
      setError({
        message: 'Erreur de validation',
        field: 'deployment_type',
        reason: 'Le champ "Type de déploiement" ne peut pas avoir la valeur "-". Veuillez sélectionner une valeur valide ou laisser le champ vide.',
        suggestion: 'Sélectionnez "Monolith", "Microservices" ou "Hybrid", ou laissez le champ vide si non applicable',
      });
      return;
    }
    
    if (formData.virtualization === '-') {
      setError({
        message: 'Erreur de validation',
        field: 'virtualization',
        reason: 'Le champ "Virtualisation" ne peut pas avoir la valeur "-". Veuillez sélectionner une valeur valide ou laisser le champ vide.',
        suggestion: 'Sélectionnez "Physical", "VM", "Container" ou "Kubernetes", ou laissez le champ vide si non applicable',
      });
      return;
    }
    
    if (formData.disaster_recovery_plan === '-') {
      setError({
        message: 'Erreur de validation',
        field: 'disaster_recovery_plan',
        reason: 'Le champ "Plan de reprise après sinistre" ne peut pas avoir la valeur "-". Veuillez sélectionner une valeur valide ou laisser le champ vide.',
        suggestion: 'Sélectionnez "Documented", "Tested" ou "None", ou laissez le champ vide si non applicable',
      });
      return;
    }

    // Validation des champs requis
    const validation = validateFormData(validationData, ['env_type', 'redundancy']);
    if (!validation.valid) {
      const firstError = validation.errors[0];
      setError({
        message: 'Erreur de validation',
        field: firstError.field,
        reason: firstError.message,
        suggestion: 'Veuillez corriger les erreurs avant de continuer',
      });
      return;
    }

    try {
      const mappedRedundancy = formData.redundancy === 'geo-redundant' ? 'geo_redundant' : formData.redundancy;
      
      // Nettoyer les valeurs "-" et les chaînes vides
      // Pour les champs enum optionnels, ne pas les envoyer s'ils sont vides ou "-"
      const cleanedData: any = {
        env_type: formData.env_type,
        redundancy: mappedRedundancy,
        tech_stack: formData.tech_stack,
        data_types: formData.data_types,
        network_security_mechanisms: formData.network_security_mechanisms,
        sla_offered: formData.sla_offered || undefined,
        backup: {
          exists: formData.backup.exists,
          rto_hours: formData.backup.rto_hours,
          rpo_hours: formData.backup.rpo_hours,
          restoration_test_frequency: formData.backup.restoration_test_frequency,
          schedule: formData.backup.schedule || undefined,
        },
      };
      
      // Ajouter les champs optionnels seulement s'ils ont une valeur valide (pas "-" ni vide)
      if (formData.deployment_type && formData.deployment_type !== '-') {
        cleanedData.deployment_type = formData.deployment_type;
      }
      
      if (formData.virtualization && formData.virtualization !== '-') {
        cleanedData.virtualization = formData.virtualization;
      }
      
      if (formData.db_scaling_mechanism && formData.db_scaling_mechanism !== '-') {
        cleanedData.db_scaling_mechanism = formData.db_scaling_mechanism;
      }
      
      if (formData.disaster_recovery_plan && formData.disaster_recovery_plan !== '-') {
        cleanedData.disaster_recovery_plan = formData.disaster_recovery_plan;
      }
      
      // Ajouter les nouveaux champs AISA si présents
      if (formData.security_zones_managed) {
        cleanedData.security_zones_managed = formData.security_zones_managed;
      }
      if (formData.network_services_requirements) {
        cleanedData.network_services_requirements = formData.network_services_requirements;
      }
      if (formData.information_assets_removal_policy) {
        cleanedData.information_assets_removal_policy = formData.information_assets_removal_policy;
      }
      if (formData.shared_external_it_services_protection) {
        cleanedData.shared_external_it_services_protection = formData.shared_external_it_services_protection;
      }
      
      await updateEnvironment({
        variables: {
          input: {
            envId: environmentId,
            solutionId: solutionId,
            ...cleanedData,
          },
        },
        refetchQueries: [{ query: GET_EDITOR_WITH_DETAILS, variables: { editorId } }],
      });
      setError(null);
      if (onSuccess) {
        onSuccess(t('dataManagement.form.success'));
      }
      onDataUpdated();
    } catch (err: any) {
      const parsedError = parseGraphQLError(err);
      setError(parsedError);
    }
  };

  // Utiliser les lookups pour les types de données, avec fallback si non disponibles
  // IMPORTANT: Utiliser le code (pas le label) pour correspondre aux valeurs stockées en base
  const dataTypesOptions = lookups.dataTypes.length > 0 
    ? lookups.dataTypes.map(v => ({ code: v.code, label: v.label }))
    : [
        { code: 'Personal', label: 'Personal' },
        { code: 'Sensitive', label: 'Sensitive' },
        { code: 'Health', label: 'Health' },
        { code: 'Financial', label: 'Financial' },
        { code: 'Synthetic', label: 'Synthetic' }
      ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {t('dataManagement.environment.title', 'Détails de l\'environnement')}
      </h3>

      {/* Affichage des erreurs */}
      {error && (
        <ErrorMessage
          error={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Informations de base */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel
            translationKey="dataManagement.environment.envType"
            required
            showFieldReference={showFieldReferences}
          />
          <select
            value={formData.env_type}
            onChange={(e) => setFormData({ ...formData, env_type: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.env_type)}
            disabled={lookupsLoading}
          >
            {lookups.environmentTypes.length > 0 ? (
              lookups.environmentTypes.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))
            ) : (
              <>
                <option value="production">Production</option>
                <option value="test">Test</option>
                <option value="dev">Dev</option>
                <option value="backup">Backup</option>
              </>
            )}
          </select>
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.environment.redundancy"
            required
            showFieldReference={showFieldReferences}
          />
          <select
            value={formData.redundancy}
            onChange={(e) => setFormData({ ...formData, redundancy: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.redundancy)}
            disabled={lookupsLoading}
          >
            {lookups.redundancyLevels.length > 0 ? (
              lookups.redundancyLevels.map((opt) => (
                <option key={opt.code} value={opt.code === 'geo_redundant' ? 'geo-redundant' : opt.code}>
                  {opt.label}
                </option>
              ))
            ) : (
              <>
                <option value="none">None</option>
                <option value="minimal">Minimal</option>
                <option value="geo-redundant">Geo-redundant</option>
                <option value="high">High</option>
              </>
            )}
          </select>
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.environment.deploymentType"
            showFieldReference={showFieldReferences}
          />
          <select
            value={formData.deployment_type}
            onChange={(e) => setFormData({ ...formData, deployment_type: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.deployment_type)}
            disabled={lookupsLoading}
          >
            <option value="">{t('dataManagement.form.select', 'Sélectionner...')}</option>
            {lookups.deploymentTypes.length > 0 ? (
              lookups.deploymentTypes.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))
            ) : (
              <>
                <option value="monolith">Monolith</option>
                <option value="microservices">Microservices</option>
                <option value="hybrid">Hybrid</option>
                <option value="TBD">TBD</option>
                <option value="N/A">N/A</option>
              </>
            )}
          </select>
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.environment.virtualization"
            showFieldReference={showFieldReferences}
          />
          <select
            value={formData.virtualization}
            onChange={(e) => setFormData({ ...formData, virtualization: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.virtualization)}
            disabled={lookupsLoading}
          >
            <option value="">{t('dataManagement.form.select', 'Sélectionner...')}</option>
            {lookups.virtualizationTypes.length > 0 ? (
              lookups.virtualizationTypes.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))
            ) : (
              <>
                <option value="physical">Physical</option>
                <option value="VM">VM</option>
                <option value="container">Container</option>
                <option value="k8s">Kubernetes</option>
                <option value="TBD">TBD</option>
                <option value="N/A">N/A</option>
              </>
            )}
          </select>
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.environment.dbScaling"
            showFieldReference={showFieldReferences}
          />
          <input
            type="text"
            value={formData.db_scaling_mechanism}
            onChange={(e) => setFormData({ ...formData, db_scaling_mechanism: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.db_scaling_mechanism)}
            placeholder="Verticale, Horizontale, Non supportée"
          />
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.environment.disasterRecovery"
            showFieldReference={showFieldReferences}
          />
          <select
            value={formData.disaster_recovery_plan}
            onChange={(e) => setFormData({ ...formData, disaster_recovery_plan: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.disaster_recovery_plan)}
            disabled={lookupsLoading}
          >
            <option value="">{t('dataManagement.form.select', 'Sélectionner...')}</option>
            {lookups.disasterRecoveryPlan.length > 0 ? (
              lookups.disasterRecoveryPlan.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))
            ) : (
              <>
                <option value="TBD">TBD</option>
                <option value="N/A">N/A</option>
              </>
            )}
          </select>
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.environment.sla"
            showFieldReference={showFieldReferences}
          />
          <input
            type="text"
            value={formData.sla_offered}
            onChange={(e) => setFormData({ ...formData, sla_offered: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.sla_offered)}
            placeholder="99.9%, 99.99%, etc."
          />
        </div>
      </div>

      {/* Tech Stack */}
      <div>
        <FieldLabel
          translationKey="dataManagement.environment.techStack"
          showFieldReference={showFieldReferences}
        />
        <textarea
          value={formData.tech_stack.join('\n')}
          onChange={(e) => {
            const stack = e.target.value
              .split('\n')
              .map(s => s.trim())
              .filter(s => s.length > 0);
            setFormData({ ...formData, tech_stack: stack });
          }}
          rows={4}
          className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.tech_stack)}
          placeholder={t('dataManagement.environment.techStackPlaceholder', 'Entrez une technologie par ligne...\nExemple:\nNode.js\nPostgreSQL\nReact\nDocker')}
        />
        {formData.tech_stack.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.tech_stack.map((tech, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Types de données */}
      <div>
        <FieldLabel
          translationKey="dataManagement.environment.dataTypes"
          showFieldReference={showFieldReferences}
          className="mb-2"
        />
        <div className="mb-2">
          <textarea
            value={formData.data_types.join('\n')}
            onChange={(e) => {
              const types = e.target.value
                .split('\n')
                .map(s => s.trim())
                .filter(s => s.length > 0);
              setFormData({ ...formData, data_types: types });
            }}
            rows={3}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.data_types)}
            placeholder={t('dataManagement.environment.dataTypesPlaceholder', 'Entrez un type par ligne...\nExemple:\nPersonal\nSensitive\nHealth\nFinancial\nSynthetic')}
          />
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">{t('dataManagement.environment.quickSelect', 'Sélection rapide:')}</span>
          {dataTypesOptions.map((option) => (
            <label key={option.code} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.data_types.includes(option.code)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ ...formData, data_types: [...formData.data_types, option.code] });
                  } else {
                    setFormData({ ...formData, data_types: formData.data_types.filter(t => t !== option.code) });
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
            </label>
          ))}
        </div>
        {formData.data_types.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.data_types.map((type, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              >
                {type}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Mécanismes de sécurité réseau */}
      <div>
        <FieldLabel
          translationKey="dataManagement.environment.networkSecurity"
          showFieldReference={showFieldReferences}
        />
        <textarea
          value={formData.network_security_mechanisms.join('\n')}
          onChange={(e) => {
            const mechanisms = e.target.value
              .split('\n')
              .map(s => s.trim())
              .filter(s => s.length > 0);
            setFormData({ ...formData, network_security_mechanisms: mechanisms });
          }}
          rows={4}
          className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.network_security_mechanisms)}
          placeholder={t('dataManagement.environment.networkSecurityPlaceholder', 'Entrez un mécanisme par ligne...\nExemple:\nVPN\nFirewall\nIDS/IPS\nWAF')}
        />
        {formData.network_security_mechanisms.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.network_security_mechanisms.map((mechanism, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
              >
                {mechanism}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Nouveaux champs AISA */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('dataManagement.environment.aisaFields', 'Champs AISA supplémentaires')}
        </h4>
        <div className="space-y-4">
          <div>
            <FieldLabel
              translationKey="dataManagement.environment.securityZonesManaged"
              showFieldReference={showFieldReferences}
            />
            <textarea
              value={formData.security_zones_managed}
              onChange={(e) => setFormData({ ...formData, security_zones_managed: e.target.value })}
              rows={3}
              className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.security_zones_managed)}
              placeholder="Gestion des zones de sécurité pour protéger les actifs d'information..."
            />
          </div>

          <div>
            <FieldLabel
              translationKey="dataManagement.environment.networkServicesRequirements"
              showFieldReference={showFieldReferences}
            />
            <textarea
              value={formData.network_services_requirements}
              onChange={(e) => setFormData({ ...formData, network_services_requirements: e.target.value })}
              rows={3}
              className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.network_services_requirements)}
              placeholder="Exigences pour les services réseau..."
            />
          </div>

          <div>
            <FieldLabel
              translationKey="dataManagement.environment.informationAssetsRemovalPolicy"
              showFieldReference={showFieldReferences}
            />
            <textarea
              value={formData.information_assets_removal_policy}
              onChange={(e) => setFormData({ ...formData, information_assets_removal_policy: e.target.value })}
              rows={3}
              className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.information_assets_removal_policy)}
              placeholder="Politique de retour et suppression sécurisée des actifs d'information..."
            />
          </div>

          <div>
            <FieldLabel
              translationKey="dataManagement.environment.sharedExternalItServicesProtection"
              showFieldReference={showFieldReferences}
            />
            <textarea
              value={formData.shared_external_it_services_protection}
              onChange={(e) => setFormData({ ...formData, shared_external_it_services_protection: e.target.value })}
              rows={3}
              className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.shared_external_it_services_protection)}
              placeholder="Protection de l'information dans les services IT externes partagés..."
            />
          </div>
        </div>
      </div>

      {/* Backup */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('dataManagement.environment.backup', 'Sauvegarde')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.backup.exists}
              onChange={(e) => setFormData({ 
                ...formData, 
                backup: { ...formData.backup, exists: e.target.checked } 
              })}
              className="mr-2"
            />
            <FieldLabel
              translationKey="dataManagement.environment.backupExists"
              showFieldReference={showFieldReferences}
              className="text-sm"
            />
          </div>
          <div>
            <FieldLabel
              translationKey="dataManagement.environment.backupSchedule"
              showFieldReference={showFieldReferences}
            />
            <select
              value={formData.backup.schedule}
              onChange={(e) => setFormData({ 
                ...formData, 
                backup: { ...formData.backup, schedule: e.target.value } 
              })}
              className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.backup.schedule)}
              disabled={lookupsLoading}
            >
              <option value="">{t('dataManagement.form.select', 'Sélectionner...')}</option>
              {lookups.backupSchedule.length > 0 ? (
                lookups.backupSchedule.map((opt) => (
                  <option key={opt.code} value={opt.code}>{opt.label}</option>
                ))
              ) : (
                <>
                  <option value="TBD">TBD</option>
                  <option value="N/A">N/A</option>
                  <option value="Quotidienne">Quotidienne</option>
                  <option value="Bi-quotidienne">Bi-quotidienne</option>
                  <option value="Hebdomadaire">Hebdomadaire</option>
                  <option value="Bi-hebdomadaire">Bi-hebdomadaire</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Bi-Monthly">Bi-Monthly</option>
                  <option value="Other">Other</option>
                </>
              )}
            </select>
          </div>
          <div>
            <FieldLabel
              translationKey="dataManagement.environment.rto"
              showFieldReference={showFieldReferences}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(heures)</span>
            <input
              type="number"
              value={formData.backup.rto_hours}
              onChange={(e) => setFormData({ 
                ...formData, 
                backup: { ...formData.backup, rto_hours: parseFloat(e.target.value) || 0 } 
              })}
              className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.backup.rto_hours)}
            />
          </div>
          <div>
            <FieldLabel
              translationKey="dataManagement.environment.rpo"
              showFieldReference={showFieldReferences}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(heures)</span>
            <input
              type="number"
              value={formData.backup.rpo_hours}
              onChange={(e) => setFormData({ 
                ...formData, 
                backup: { ...formData.backup, rpo_hours: parseFloat(e.target.value) || 0 } 
              })}
              className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.backup.rpo_hours)}
            />
          </div>
          <div>
            <FieldLabel
              translationKey="dataManagement.environment.restorationTestFrequency"
              showFieldReference={showFieldReferences}
            />
            <select
              value={formData.backup.restoration_test_frequency}
              onChange={(e) => setFormData({ 
                ...formData, 
                backup: { ...formData.backup, restoration_test_frequency: e.target.value } 
              })}
              className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.backup.restoration_test_frequency)}
              disabled={lookupsLoading}
            >
              <option value="">{t('dataManagement.form.select', 'Sélectionner...')}</option>
              {lookups.restorationTestFrequency.length > 0 ? (
                lookups.restorationTestFrequency.map((opt) => (
                  <option key={opt.code} value={opt.code}>{opt.label}</option>
                ))
              ) : (
                <>
                  <option value="annual">Annual</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="never">Never</option>
                  <option value="TBD">TBD</option>
                  <option value="N/A">N/A</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Bouton de sauvegarde */}
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

export default EnvironmentDetailsSection;

