/**
 * Section pour gérer les détails d'hébergement (Hosting)
 * Inclut : provider, region, tier, certifications, contact
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { UPDATE_HOSTING, UPDATE_ENVIRONMENT } from '../../../graphql/mutations';
import { GET_EDITOR_WITH_DETAILS } from '../../../graphql/queries';
import { parseGraphQLError } from '../../../utils/errorHandler';
import type { ParsedError } from '../../../utils/errorHandler';
import { getFieldClasses } from '../../../utils/fieldValidation';
import ErrorMessage from '../ErrorMessage';
import FieldLabel from '../FieldLabel';
import { useLookups } from '../../../hooks/useLookups';

interface HostingSectionProps {
  hosting: any;
  hostingId: string;
  environmentId?: string;
  editorId: string;
  showFieldReferences?: boolean;
  onDataUpdated: () => void;
  onSuccess?: (message: string) => void;
}

const HostingSection: React.FC<HostingSectionProps> = ({
  hosting,
  hostingId,
  environmentId,
  editorId,
  showFieldReferences = false,
  onDataUpdated,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [updateHosting, { loading: updating }] = useMutation(UPDATE_HOSTING);
  const [updateEnvironment] = useMutation(UPDATE_ENVIRONMENT);
  const [error, setError] = useState<ParsedError | null>(null);
  const { lookups, loading: lookupsLoading } = useLookups();
  
  // Si l'environnement n'a pas de hostingId, on génère un nouveau hostingId basé sur l'environmentId
  const getOrGenerateHostingId = () => {
    if (hostingId) return hostingId;
    if (environmentId) {
      // Générer un hostingId basé sur l'environmentId
      return `hosting-${environmentId}`;
    }
    // Fallback : générer un ID temporaire (ne devrait pas arriver)
    return `hosting-${Date.now()}`;
  };

  const initialHostingId = hostingId || (environmentId ? `hosting-${environmentId}` : '');

  const [formData, setFormData] = useState({
    hostingId: initialHostingId,
    provider: hosting?.provider || '',
    region: hosting?.region || '',
    tier: hosting?.tier || 'cloud',
    certifications: hosting?.certifications || [] as string[],
    contact: {
      name: hosting?.contact?.name || '',
      email: hosting?.contact?.email || '',
    },
  });

  useEffect(() => {
    if (hosting) {
      setFormData({
        hostingId: hosting.hostingId || hostingId || getOrGenerateHostingId(),
        provider: hosting.provider || '',
        region: hosting.region || '',
        tier: hosting.tier || 'cloud',
        certifications: hosting.certifications || [],
        contact: {
          name: hosting.contact?.name || '',
          email: hosting.contact?.email || '',
        },
      });
    } else if (!hostingId) {
      // Si pas de hosting et pas de hostingId, initialiser avec un hostingId généré
      setFormData(prev => ({
        ...prev,
        hostingId: getOrGenerateHostingId(),
      }));
    }
  }, [hosting, hostingId, environmentId]);

  const handleSave = async () => {
    try {
      const finalHostingId = formData.hostingId || getOrGenerateHostingId();
      
      // Créer ou mettre à jour le Hosting
      await updateHosting({
        variables: {
          input: {
            hostingId: finalHostingId,
            provider: formData.provider,
            region: formData.region,
            tier: formData.tier,
            certifications: formData.certifications,
            contact: formData.contact.name || formData.contact.email ? {
              name: formData.contact.name || null,
              email: formData.contact.email || null,
            } : undefined,
          },
        },
        refetchQueries: [{ query: GET_EDITOR_WITH_DETAILS, variables: { editorId } }],
      });
      
      // Si l'environnement n'a pas encore de hostingId, l'associer maintenant
      if (environmentId && !hostingId && finalHostingId) {
        await updateEnvironment({
          variables: {
            input: {
              envId: environmentId,
              hostingId: finalHostingId,
            },
          },
          refetchQueries: [{ query: GET_EDITOR_WITH_DETAILS, variables: { editorId } }],
        });
      }
      
      if (onSuccess) {
        onSuccess(t('dataManagement.form.success'));
      }
      onDataUpdated();
    } catch (err: any) {
      const parsedError = parseGraphQLError(err);
      setError(parsedError);
    }
  };

  const isNewHosting = !hosting && !hostingId;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('dataManagement.hosting.title', 'Détails d\'hébergement')}
        </h3>
        {isNewHosting && (
          <span className="px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            {t('dataManagement.form.createNew', 'Nouveau')}
          </span>
        )}
      </div>
      
      {isNewHosting && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-4 rounded-md">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {t('dataManagement.hosting.createInfo', 'Aucun hébergement n\'est encore associé à cet environnement. Remplissez le formulaire ci-dessous pour créer un nouvel hébergement. Il sera automatiquement associé à cet environnement.')}
          </p>
        </div>
      )}

      {/* Affichage des erreurs */}
      {error && (
        <ErrorMessage
          error={error}
          onClose={() => setError(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel
            translationKey="dataManagement.hosting.provider"
            required
            showFieldReference={showFieldReferences}
          />
          <input
            type="text"
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.provider)}
            placeholder="OVH, Azure, GCP, AWS, Bleu, OnPrem, etc."
            required
          />
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.hosting.region"
            required
            showFieldReference={showFieldReferences}
          />
          <input
            type="text"
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.region)}
            placeholder="France, Europe, etc."
            required
          />
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.hosting.tier"
            required
            showFieldReference={showFieldReferences}
          />
          <select
            value={formData.tier}
            onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.tier)}
            required
            disabled={lookupsLoading}
          >
            {lookups.hostingTiers.length > 0 ? (
              lookups.hostingTiers.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))
            ) : (
              <>
                <option value="datacenter">Datacenter</option>
                <option value="private">Private</option>
                <option value="public">Public</option>
                <option value="cloud">Cloud</option>
                <option value="TBD">TBD</option>
                <option value="N/A">N/A</option>
              </>
            )}
          </select>
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.hosting.certifications"
            showFieldReference={showFieldReferences}
          />
          <input
            type="text"
            value={formData.certifications.join(', ')}
            onChange={(e) => setFormData({ 
              ...formData, 
              certifications: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
            })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.certifications)}
            placeholder="ISO27001, HDS, SOC2, etc. (séparés par des virgules)"
          />
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.hosting.contactName"
            showFieldReference={showFieldReferences}
          />
          <input
            type="text"
            value={formData.contact.name}
            onChange={(e) => setFormData({ 
              ...formData, 
              contact: { ...formData.contact, name: e.target.value } 
            })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.contact.name)}
            placeholder="Nom du contact technique"
          />
        </div>

        <div>
          <FieldLabel
            translationKey="dataManagement.hosting.contactEmail"
            showFieldReference={showFieldReferences}
          />
          <input
            type="email"
            value={formData.contact.email}
            onChange={(e) => setFormData({ 
              ...formData, 
              contact: { ...formData.contact, email: e.target.value } 
            })}
            className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", formData.contact.email)}
            placeholder="contact@example.com"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={updating || !formData.provider || !formData.region}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updating ? t('dataManagement.form.saving') : t('dataManagement.form.save')}
        </button>
      </div>
    </div>
  );
};

export default HostingSection;

