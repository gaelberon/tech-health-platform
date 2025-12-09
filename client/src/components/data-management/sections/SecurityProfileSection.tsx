/**
 * Section pour gérer le profil de sécurité (SecurityProfile)
 * Inclut tous les champs : auth, encryption, patching, pentest_freq, vuln_mgmt, access_control,
 * internal_audits_recent, centralized_monitoring, pentest_results_summary, known_security_flaws, incident_reporting_process
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { UPDATE_SECURITY_PROFILE } from '../../../graphql/mutations';
import { GET_EDITOR_WITH_DETAILS } from '../../../graphql/queries';
import { parseGraphQLError } from '../../../utils/errorHandler';
import type { ParsedError } from '../../../utils/errorHandler';
import { getFieldClasses } from '../../../utils/fieldValidation';
import ErrorMessage from '../ErrorMessage';
import FieldLabel from '../FieldLabel';
import { useLookups } from '../../../hooks/useLookups';

interface SecurityProfileSectionProps {
  securityProfile: any;
  environmentId: string;
  editorId: string;
  showFieldReferences?: boolean;
  onDataUpdated: () => void;
  onSuccess?: (message: string) => void;
}

const SecurityProfileSection: React.FC<SecurityProfileSectionProps> = ({
  securityProfile,
  environmentId,
  editorId,
  showFieldReferences = false,
  onDataUpdated,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [updateSecurityProfile, { loading: updating }] = useMutation(UPDATE_SECURITY_PROFILE);
  const [error, setError] = useState<ParsedError | null>(null);
  const { lookups, loading: lookupsLoading } = useLookups();

  const [formData, setFormData] = useState({
    envId: environmentId,
    auth: securityProfile?.auth || 'Passwords',
    encryption: {
      in_transit: securityProfile?.encryption?.in_transit || false,
      at_rest: securityProfile?.encryption?.at_rest || false,
      details: securityProfile?.encryption?.details || '',
    },
    patching: securityProfile?.patching || 'ad_hoc',
    pentest_freq: securityProfile?.pentest_freq || 'never',
    vuln_mgmt: securityProfile?.vuln_mgmt || 'none',
    access_control: securityProfile?.access_control || '',
    internal_audits_recent: securityProfile?.internal_audits_recent || '',
    centralized_monitoring: securityProfile?.centralized_monitoring || false,
    pentest_results_summary: securityProfile?.pentest_results_summary || '',
    known_security_flaws: securityProfile?.known_security_flaws || '',
    incident_reporting_process: securityProfile?.incident_reporting_process || '',
  });

  useEffect(() => {
    if (securityProfile) {
      setFormData({
        envId: environmentId,
        auth: securityProfile.auth || 'Passwords',
        encryption: {
          in_transit: securityProfile.encryption?.in_transit || false,
          at_rest: securityProfile.encryption?.at_rest || false,
          details: securityProfile.encryption?.details || '',
        },
        patching: securityProfile.patching || 'ad_hoc',
        pentest_freq: securityProfile.pentest_freq || 'never',
        vuln_mgmt: securityProfile.vuln_mgmt || 'none',
        access_control: securityProfile.access_control || '',
        internal_audits_recent: securityProfile.internal_audits_recent || '',
        centralized_monitoring: securityProfile.centralized_monitoring || false,
        pentest_results_summary: securityProfile.pentest_results_summary || '',
        known_security_flaws: securityProfile.known_security_flaws || '',
        incident_reporting_process: securityProfile.incident_reporting_process || '',
      });
    }
  }, [securityProfile, environmentId]);

  const handleSave = async () => {
    try {
      setError(null);
      await updateSecurityProfile({
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
        {t('dataManagement.security.title', 'Profil de sécurité')}
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
            translationKey="dataManagement.security.auth"
            required
            showFieldReference={showFieldReferences}
          />
          <select
            value={formData.auth}
            onChange={(e) => setFormData({ ...formData, auth: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.auth)}
            required
            disabled={lookupsLoading}
          >
            {lookups.authTypes.length > 0 ? (
              lookups.authTypes.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))
            ) : (
              <>
                <option value="None">None</option>
                <option value="Passwords">Passwords</option>
                <option value="MFA">MFA</option>
                <option value="SSO">SSO</option>
              </>
            )}
          </select>
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.security.patching"
            required
            showFieldReference={showFieldReferences}
          />
          <select
            value={formData.patching}
            onChange={(e) => setFormData({ ...formData, patching: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.patching)}
            required
            disabled={lookupsLoading}
          >
            {lookups.patchingTypes.length > 0 ? (
              lookups.patchingTypes.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))
            ) : (
              <>
                <option value="ad_hoc">Ad hoc</option>
                <option value="scheduled">Scheduled</option>
                <option value="automated">Automated</option>
              </>
            )}
          </select>
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.security.pentestFreq"
            required
            showFieldReference={showFieldReferences}
          />
          <select
            value={formData.pentest_freq}
            onChange={(e) => setFormData({ ...formData, pentest_freq: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.pentest_freq)}
            required
            disabled={lookupsLoading}
          >
            {lookups.pentestFreq.length > 0 ? (
              lookups.pentestFreq.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))
            ) : (
              <>
                <option value="never">Never</option>
                <option value="annual">Annual</option>
                <option value="quarterly">Quarterly</option>
              </>
            )}
          </select>
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.security.vulnMgmt"
            required
            showFieldReference={showFieldReferences}
          />
          <select
            value={formData.vuln_mgmt}
            onChange={(e) => setFormData({ ...formData, vuln_mgmt: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.vuln_mgmt)}
            required
            disabled={lookupsLoading}
          >
            {lookups.vulnMgmt.length > 0 ? (
              lookups.vulnMgmt.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))
            ) : (
              <>
                <option value="none">None</option>
                <option value="manual">Manual</option>
                <option value="automated">Automated</option>
              </>
            )}
          </select>
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.security.accessControl"
            showFieldReference={showFieldReferences}
          />
          <input
            type="text"
            value={formData.access_control}
            onChange={(e) => setFormData({ ...formData, access_control: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.access_control)}
            placeholder="e.g., PAM utilisé ?"
          />
        </div>
      </div>

      {/* Encryption */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('dataManagement.security.encryption', 'Chiffrement')}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.encryption.in_transit}
              onChange={(e) => setFormData({ 
                ...formData, 
                encryption: { ...formData.encryption, in_transit: e.target.checked } 
              })}
              className="mr-2"
            />
            <FieldLabel
              translationKey="dataManagement.security.encryptionInTransit"
              showFieldReference={showFieldReferences}
              className="text-sm"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.encryption.at_rest}
              onChange={(e) => setFormData({ 
                ...formData, 
                encryption: { ...formData.encryption, at_rest: e.target.checked } 
              })}
              className="mr-2"
            />
            <FieldLabel
              translationKey="dataManagement.security.encryptionAtRest"
              showFieldReference={showFieldReferences}
              className="text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <FieldLabel
              translationKey="dataManagement.security.encryptionDetails"
              showFieldReference={showFieldReferences}
            />
            <textarea
              value={formData.encryption.details}
              onChange={(e) => setFormData({ 
                ...formData, 
                encryption: { ...formData.encryption, details: e.target.value } 
              })}
              rows={3}
              className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.encryption.details)}
              placeholder="Détails sur le chiffrement utilisé..."
            />
          </div>
        </div>
      </div>

      {/* Monitoring */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={formData.centralized_monitoring}
            onChange={(e) => setFormData({ ...formData, centralized_monitoring: e.target.checked })}
            className="mr-2"
          />
          <FieldLabel
            translationKey="dataManagement.security.centralizedMonitoring"
            showFieldReference={showFieldReferences}
            className="text-sm"
          />
        </div>
      </div>

      {/* Champs texte libres */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div>
          <FieldLabel
            translationKey="dataManagement.security.internalAudits"
            showFieldReference={showFieldReferences}
          />
          <textarea
            value={formData.internal_audits_recent}
            onChange={(e) => setFormData({ ...formData, internal_audits_recent: e.target.value })}
            rows={3}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.internal_audits_recent)}
            placeholder="Détails sur les audits récents et mesures prises..."
          />
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.security.pentestResults"
            showFieldReference={showFieldReferences}
          />
          <textarea
            value={formData.pentest_results_summary}
            onChange={(e) => setFormData({ ...formData, pentest_results_summary: e.target.value })}
            rows={3}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.pentest_results_summary)}
            placeholder="Résumé des derniers résultats de pentests..."
          />
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.security.knownFlaws"
            showFieldReference={showFieldReferences}
          />
          <textarea
            value={formData.known_security_flaws}
            onChange={(e) => setFormData({ ...formData, known_security_flaws: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            placeholder="Failles de sécurité actuellement connues..."
          />
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.security.incidentProcess"
            showFieldReference={showFieldReferences}
          />
          <textarea
            value={formData.incident_reporting_process}
            onChange={(e) => setFormData({ ...formData, incident_reporting_process: e.target.value })}
            rows={3}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.incident_reporting_process)}
            placeholder="Processus de signalement et de résolution des incidents..."
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

export default SecurityProfileSection;

