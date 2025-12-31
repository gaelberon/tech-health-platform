/**
 * Section pour gérer les assets d'un éditeur
 * Permet de créer, modifier, archiver et supprimer des assets
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { CREATE_ASSET, UPDATE_ASSET, DELETE_ASSET, ARCHIVE_ASSET } from '../../../graphql/mutations';
import { GET_EDITOR_WITH_DETAILS } from '../../../graphql/queries';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';
import FieldLabel from '../FieldLabel';
import { parseGraphQLError } from '../../../utils/errorHandler';

interface Asset {
  assetId: string;
  name: string;
  category: string;
  type: string;
  description?: string;
  operational_purpose?: string;
  information_owner?: string;
  custodian?: string;
  confidentiality_level?: string;
  integrity_level?: string;
  availability_level?: string;
  criticality_status?: boolean;
  mtd_hours?: number;
  rpo_mtdl_hours?: number;
  approval_status?: string;
  encryption_status?: string;
  physical_location?: string;
  version_firmware?: string;
  sbom_reference?: string;
  end_of_life_date?: string;
  last_inventory_date?: string;
  disposal_method?: string;
  ownership?: string;
  acceptable_use?: string;
  return_policy?: string;
  archived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
}

interface AssetsSectionProps {
  editorId: string;
  assets: Asset[];
  showArchived: boolean;
  showFieldReferences?: boolean;
  onDataUpdated: () => void;
}

const AssetsSection: React.FC<AssetsSectionProps> = ({
  editorId,
  assets,
  showArchived,
  showFieldReferences = false,
  onDataUpdated,
}) => {
  const { t } = useTranslation();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isCreatingAsset, setIsCreatingAsset] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createAsset, { loading: creatingAsset }] = useMutation(CREATE_ASSET, {
    refetchQueries: [{ query: GET_EDITOR_WITH_DETAILS, variables: { editorId } }],
    onCompleted: () => {
      setSuccess(t('dataManagement.assets.created', 'Asset créé avec succès'));
      setIsCreatingAsset(false);
      onDataUpdated();
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err) => {
      const parsedError = parseGraphQLError(err);
      setError(parsedError.message);
    },
  });

  const [updateAsset, { loading: updatingAsset }] = useMutation(UPDATE_ASSET, {
    refetchQueries: [{ query: GET_EDITOR_WITH_DETAILS, variables: { editorId } }],
    onCompleted: () => {
      setSuccess(t('dataManagement.assets.updated', 'Asset mis à jour avec succès'));
      setSelectedAssetId(null);
      onDataUpdated();
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err) => {
      const parsedError = parseGraphQLError(err);
      setError(parsedError.message);
    },
  });

  const [deleteAsset, { loading: deletingAsset }] = useMutation(DELETE_ASSET, {
    refetchQueries: [{ query: GET_EDITOR_WITH_DETAILS, variables: { editorId } }],
    onCompleted: () => {
      setSuccess(t('dataManagement.assets.deleted', 'Asset supprimé avec succès'));
      onDataUpdated();
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err) => {
      const parsedError = parseGraphQLError(err);
      setError(parsedError.message);
    },
  });

  const [archiveAsset, { loading: archivingAsset }] = useMutation(ARCHIVE_ASSET, {
    refetchQueries: [{ query: GET_EDITOR_WITH_DETAILS, variables: { editorId } }],
    onCompleted: () => {
      setSuccess(t('dataManagement.assets.archived', 'Asset archivé avec succès'));
      onDataUpdated();
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err) => {
      const parsedError = parseGraphQLError(err);
      setError(parsedError.message);
    },
  });

  // Filtrer les assets selon showArchived
  const filteredAssets = assets.filter(asset => showArchived || !asset.archived);

  // Catégories et types d'assets
  const assetCategories = [
    { value: 'intangible', label: t('dataManagement.assets.categoryOptions.intangible', 'Intangible') },
    { value: 'digital_and_data', label: t('dataManagement.assets.categoryOptions.digital_and_data', 'Digital & Data') },
    { value: 'tangible', label: t('dataManagement.assets.categoryOptions.tangible', 'Tangible') },
    { value: 'financial', label: t('dataManagement.assets.categoryOptions.financial', 'Financial') },
  ];

  const assetTypes = {
    intangible: [
      { value: 'ip_source_code', label: t('dataManagement.assets.typeOptions.ip_source_code', 'IP - Source Code') },
      { value: 'ip_patent', label: t('dataManagement.assets.typeOptions.ip_patent', 'IP - Patent') },
      { value: 'ip_trademark', label: t('dataManagement.assets.typeOptions.ip_trademark', 'IP - Trademark') },
      { value: 'ip_copyright', label: t('dataManagement.assets.typeOptions.ip_copyright', 'IP - Copyright') },
      { value: 'commercial_customer_database', label: t('dataManagement.assets.typeOptions.commercial_customer_database', 'Commercial - Customer Database') },
      { value: 'commercial_maintenance_subscription', label: t('dataManagement.assets.typeOptions.commercial_maintenance_subscription', 'Commercial - Maintenance/Subscription') },
      { value: 'commercial_brand_equity', label: t('dataManagement.assets.typeOptions.commercial_brand_equity', 'Commercial - Brand Equity') },
      { value: 'human_capital_core_competencies', label: t('dataManagement.assets.typeOptions.human_capital_core_competencies', 'Human Capital - Core Competencies') },
      { value: 'human_capital_internal_processes', label: t('dataManagement.assets.typeOptions.human_capital_internal_processes', 'Human Capital - Internal Processes') },
    ],
    digital_and_data: [
      { value: 'usage_data', label: t('dataManagement.assets.typeOptions.usage_data', 'Usage Data') },
      { value: 'logical_cloud_infrastructure', label: t('dataManagement.assets.typeOptions.logical_cloud_infrastructure', 'Logical/Cloud Infrastructure') },
      { value: 'documentation', label: t('dataManagement.assets.typeOptions.documentation', 'Documentation') },
    ],
    tangible: [
      { value: 'it_hardware', label: t('dataManagement.assets.typeOptions.it_hardware', 'IT Hardware') },
      { value: 'furniture_fixtures', label: t('dataManagement.assets.typeOptions.furniture_fixtures', 'Furniture & Fixtures') },
      { value: 'real_estate', label: t('dataManagement.assets.typeOptions.real_estate', 'Real Estate') },
    ],
    financial: [
      { value: 'cash_cash_equivalents', label: t('dataManagement.assets.typeOptions.cash_cash_equivalents', 'Cash & Cash Equivalents') },
      { value: 'accounts_receivable', label: t('dataManagement.assets.typeOptions.accounts_receivable', 'Accounts Receivable') },
      { value: 'investments', label: t('dataManagement.assets.typeOptions.investments', 'Investments') },
    ],
  };

  const selectedAsset = selectedAssetId ? filteredAssets.find(a => a.assetId === selectedAssetId) : null;
  const isEditing = selectedAssetId !== null && !isCreatingAsset;

  // Formulaire pour créer/modifier un asset
  const [assetForm, setAssetForm] = useState({
    name: '',
    category: 'digital_and_data',
    type: 'logical_cloud_infrastructure',
    description: '',
    operational_purpose: '',
    information_owner: '',
    custodian: '',
    confidentiality_level: '',
    integrity_level: '',
    availability_level: '',
    criticality_status: false,
    mtd_hours: '',
    rpo_mtdl_hours: '',
    approval_status: '',
    encryption_status: '',
    physical_location: '',
    version_firmware: '',
    sbom_reference: '',
    end_of_life_date: '',
    last_inventory_date: '',
    disposal_method: '',
    ownership: '',
    acceptable_use: '',
    return_policy: '',
  });

  // Initialiser le formulaire avec les données de l'asset sélectionné
  React.useEffect(() => {
    if (selectedAsset) {
      setAssetForm({
        name: selectedAsset.name || '',
        category: selectedAsset.category || 'digital_and_data',
        type: selectedAsset.type || 'logical_cloud_infrastructure',
        description: selectedAsset.description || '',
        operational_purpose: selectedAsset.operational_purpose || '',
        information_owner: selectedAsset.information_owner || '',
        custodian: selectedAsset.custodian || '',
        confidentiality_level: selectedAsset.confidentiality_level || '',
        integrity_level: selectedAsset.integrity_level || '',
        availability_level: selectedAsset.availability_level || '',
        criticality_status: selectedAsset.criticality_status || false,
        mtd_hours: selectedAsset.mtd_hours?.toString() || '',
        rpo_mtdl_hours: selectedAsset.rpo_mtdl_hours?.toString() || '',
        approval_status: selectedAsset.approval_status || '',
        encryption_status: selectedAsset.encryption_status || '',
        physical_location: selectedAsset.physical_location || '',
        version_firmware: selectedAsset.version_firmware || '',
        sbom_reference: selectedAsset.sbom_reference || '',
        end_of_life_date: selectedAsset.end_of_life_date ? selectedAsset.end_of_life_date.split('T')[0] : '',
        last_inventory_date: selectedAsset.last_inventory_date ? selectedAsset.last_inventory_date.split('T')[0] : '',
        disposal_method: selectedAsset.disposal_method || '',
        ownership: selectedAsset.ownership || '',
        acceptable_use: selectedAsset.acceptable_use || '',
        return_policy: selectedAsset.return_policy || '',
      });
    } else if (isCreatingAsset) {
      // Réinitialiser le formulaire pour la création
      setAssetForm({
        name: '',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        description: '',
        operational_purpose: '',
        information_owner: '',
        custodian: '',
        confidentiality_level: '',
        integrity_level: '',
        availability_level: '',
        criticality_status: false,
        mtd_hours: '',
        rpo_mtdl_hours: '',
        approval_status: '',
        encryption_status: '',
        physical_location: '',
        version_firmware: '',
        sbom_reference: '',
        end_of_life_date: '',
        last_inventory_date: '',
        disposal_method: '',
        ownership: '',
        acceptable_use: '',
        return_policy: '',
      });
    }
  }, [selectedAsset, isCreatingAsset]);

  const handleCreateAsset = async () => {
    setError(null);
    try {
      await createAsset({
        variables: {
          input: {
            editorId,
            name: assetForm.name,
            category: assetForm.category,
            type: assetForm.type,
            description: assetForm.description || undefined,
            operational_purpose: assetForm.operational_purpose || undefined,
            information_owner: assetForm.information_owner || undefined,
            custodian: assetForm.custodian || undefined,
            confidentiality_level: assetForm.confidentiality_level || undefined,
            integrity_level: assetForm.integrity_level || undefined,
            availability_level: assetForm.availability_level || undefined,
            criticality_status: assetForm.criticality_status || undefined,
            mtd_hours: assetForm.mtd_hours ? parseFloat(assetForm.mtd_hours) : undefined,
            rpo_mtdl_hours: assetForm.rpo_mtdl_hours ? parseFloat(assetForm.rpo_mtdl_hours) : undefined,
            approval_status: assetForm.approval_status || undefined,
            encryption_status: assetForm.encryption_status || undefined,
            physical_location: assetForm.physical_location || undefined,
            version_firmware: assetForm.version_firmware || undefined,
            sbom_reference: assetForm.sbom_reference || undefined,
            end_of_life_date: assetForm.end_of_life_date || undefined,
            last_inventory_date: assetForm.last_inventory_date || undefined,
            disposal_method: assetForm.disposal_method || undefined,
            ownership: assetForm.ownership || undefined,
            acceptable_use: assetForm.acceptable_use || undefined,
            return_policy: assetForm.return_policy || undefined,
          },
        },
      });
    } catch (err) {
      // Error handled by onError callback
    }
  };

  const handleUpdateAsset = async () => {
    if (!selectedAssetId) return;
    setError(null);
    try {
      await updateAsset({
        variables: {
          input: {
            assetId: selectedAssetId,
            name: assetForm.name,
            category: assetForm.category,
            type: assetForm.type,
            description: assetForm.description || undefined,
            operational_purpose: assetForm.operational_purpose || undefined,
            information_owner: assetForm.information_owner || undefined,
            custodian: assetForm.custodian || undefined,
            confidentiality_level: assetForm.confidentiality_level || undefined,
            integrity_level: assetForm.integrity_level || undefined,
            availability_level: assetForm.availability_level || undefined,
            criticality_status: assetForm.criticality_status || undefined,
            mtd_hours: assetForm.mtd_hours ? parseFloat(assetForm.mtd_hours) : undefined,
            rpo_mtdl_hours: assetForm.rpo_mtdl_hours ? parseFloat(assetForm.rpo_mtdl_hours) : undefined,
            approval_status: assetForm.approval_status || undefined,
            encryption_status: assetForm.encryption_status || undefined,
            physical_location: assetForm.physical_location || undefined,
            version_firmware: assetForm.version_firmware || undefined,
            sbom_reference: assetForm.sbom_reference || undefined,
            end_of_life_date: assetForm.end_of_life_date || undefined,
            last_inventory_date: assetForm.last_inventory_date || undefined,
            disposal_method: assetForm.disposal_method || undefined,
            ownership: assetForm.ownership || undefined,
            acceptable_use: assetForm.acceptable_use || undefined,
            return_policy: assetForm.return_policy || undefined,
          },
        },
      });
    } catch (err) {
      // Error handled by onError callback
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm(t('dataManagement.assets.confirmDelete', 'Êtes-vous sûr de vouloir supprimer cet asset ?'))) {
      return;
    }
    setError(null);
    try {
      await deleteAsset({ variables: { assetId } });
    } catch (err) {
      // Error handled by onError callback
    }
  };

  const handleArchiveAsset = async (assetId: string) => {
    setError(null);
    try {
      await archiveAsset({ variables: { assetId } });
    } catch (err) {
      // Error handled by onError callback
    }
  };

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess(null)} />}

      {/* Liste des assets */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('dataManagement.assets.title', 'Actifs')}
          </h3>
          <button
            onClick={() => {
              setIsCreatingAsset(true);
              setSelectedAssetId(null);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {t('dataManagement.assets.create', 'Créer un asset')}
          </button>
        </div>

        {filteredAssets.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            {t('dataManagement.assets.noAssets', 'Aucun asset enregistré')}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredAssets.map((asset) => (
              <div
                key={asset.assetId}
                className={`p-4 border rounded-lg ${
                  selectedAssetId === asset.assetId
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                } ${asset.archived ? 'opacity-50' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{asset.name}</h4>
                      {asset.archived && (
                        <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">
                          {t('dataManagement.archived', 'Archivé')}
                        </span>
                      )}
                      {asset.criticality_status && (
                        <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
                          {t('dataManagement.assets.critical', 'Critique')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {assetCategories.find(c => c.value === asset.category)?.label} - {assetTypes[asset.category as keyof typeof assetTypes]?.find(t => t.value === asset.type)?.label}
                    </p>
                    {asset.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{asset.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedAssetId(asset.assetId);
                        setIsCreatingAsset(false);
                      }}
                      className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      {t('dataManagement.edit', 'Modifier')}
                    </button>
                    {!asset.archived && (
                      <button
                        onClick={() => handleArchiveAsset(asset.assetId)}
                        className="px-3 py-1 text-sm bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-300 dark:hover:bg-yellow-700"
                        disabled={archivingAsset}
                      >
                        {t('dataManagement.archive', 'Archiver')}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAsset(asset.assetId)}
                      className="px-3 py-1 text-sm bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded hover:bg-red-300 dark:hover:bg-red-700"
                      disabled={deletingAsset}
                    >
                      {t('dataManagement.delete', 'Supprimer')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulaire de création/modification */}
      {(isCreatingAsset || isEditing) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {isCreatingAsset
              ? t('dataManagement.assets.create', 'Créer un asset')
              : t('dataManagement.assets.edit', 'Modifier un asset')}
          </h3>

          <div className="space-y-4">
            {/* Champs de base */}
            <div>
              <FieldLabel
                translationKey="dataManagement.assets.name"
                showFieldReference={showFieldReferences}
              />
              <input
                type="text"
                value={assetForm.name}
                onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel
                  translationKey="dataManagement.assets.category"
                  showFieldReference={showFieldReferences}
                />
                <select
                  value={assetForm.category}
                  onChange={(e) => {
                    setAssetForm({
                      ...assetForm,
                      category: e.target.value,
                      type: assetTypes[e.target.value as keyof typeof assetTypes]?.[0]?.value || '',
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  {assetCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel
                  translationKey="dataManagement.assets.type"
                  showFieldReference={showFieldReferences}
                />
                <select
                  value={assetForm.type}
                  onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  {assetTypes[assetForm.category as keyof typeof assetTypes]?.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <FieldLabel
                translationKey="dataManagement.assets.description"
                showFieldReference={showFieldReferences}
              />
              <textarea
                value={assetForm.description}
                onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Champs AISA - Section 1.3 */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('dataManagement.assets.aisaSection1_3', 'AISA 1.3 - Gestion des actifs')}
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel
                    translationKey="dataManagement.assets.operational_purpose"
                    showFieldReference={showFieldReferences}
                  />
                  <input
                    type="text"
                    value={assetForm.operational_purpose}
                    onChange={(e) => setAssetForm({ ...assetForm, operational_purpose: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <FieldLabel
                    translationKey="dataManagement.assets.information_owner"
                    showFieldReference={showFieldReferences}
                  />
                  <input
                    type="text"
                    value={assetForm.information_owner}
                    onChange={(e) => setAssetForm({ ...assetForm, information_owner: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <FieldLabel
                    translationKey="dataManagement.assets.custodian"
                    showFieldReference={showFieldReferences}
                  />
                  <input
                    type="text"
                    value={assetForm.custodian}
                    onChange={(e) => setAssetForm({ ...assetForm, custodian: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Classification CIA */}
              <div className="mt-4">
                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('dataManagement.assets.ciaClassification', 'Classification CIA (AISA 1.3.2)')}
                </h5>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <FieldLabel
                      translationKey="dataManagement.assets.confidentiality_level"
                      showFieldReference={showFieldReferences}
                    />
                    <input
                      type="text"
                      value={assetForm.confidentiality_level}
                      onChange={(e) => setAssetForm({ ...assetForm, confidentiality_level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="Public, Interne, Confidentiel, Strictement Confidentiel"
                    />
                  </div>

                  <div>
                    <FieldLabel
                      translationKey="dataManagement.assets.integrity_level"
                      showFieldReference={showFieldReferences}
                    />
                    <input
                      type="text"
                      value={assetForm.integrity_level}
                      onChange={(e) => setAssetForm({ ...assetForm, integrity_level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <FieldLabel
                      translationKey="dataManagement.assets.availability_level"
                      showFieldReference={showFieldReferences}
                    />
                    <input
                      type="text"
                      value={assetForm.availability_level}
                      onChange={(e) => setAssetForm({ ...assetForm, availability_level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Criticité et continuité */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={assetForm.criticality_status}
                    onChange={(e) => setAssetForm({ ...assetForm, criticality_status: e.target.checked })}
                    className="rounded"
                  />
                  <FieldLabel
                    translationKey="dataManagement.assets.criticality_status"
                    showFieldReference={showFieldReferences}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel
                      translationKey="dataManagement.assets.mtd_hours"
                      showFieldReference={showFieldReferences}
                    />
                    <input
                      type="number"
                      value={assetForm.mtd_hours}
                      onChange={(e) => setAssetForm({ ...assetForm, mtd_hours: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <FieldLabel
                      translationKey="dataManagement.assets.rpo_mtdl_hours"
                      showFieldReference={showFieldReferences}
                    />
                    <input
                      type="number"
                      value={assetForm.rpo_mtdl_hours}
                      onChange={(e) => setAssetForm({ ...assetForm, rpo_mtdl_hours: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Évaluation et approbation */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel
                    translationKey="dataManagement.assets.approval_status"
                    showFieldReference={showFieldReferences}
                  />
                  <input
                    type="text"
                    value={assetForm.approval_status}
                    onChange={(e) => setAssetForm({ ...assetForm, approval_status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Évalué, Approuvé, Rejeté"
                  />
                </div>

                <div>
                  <FieldLabel
                    translationKey="dataManagement.assets.encryption_status"
                    showFieldReference={showFieldReferences}
                  />
                  <input
                    type="text"
                    value={assetForm.encryption_status}
                    onChange={(e) => setAssetForm({ ...assetForm, encryption_status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Champs AISA - Section 3.2, 3.3, 3.4 */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('dataManagement.assets.aisaSection3', 'AISA 3.2, 3.3, 3.4 - Propriété et utilisation')}
              </h4>

              <div className="space-y-4">
                <div>
                  <FieldLabel
                    translationKey="dataManagement.assets.ownership"
                    showFieldReference={showFieldReferences}
                  />
                  <textarea
                    value={assetForm.ownership}
                    onChange={(e) => setAssetForm({ ...assetForm, ownership: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <FieldLabel
                    translationKey="dataManagement.assets.acceptable_use"
                    showFieldReference={showFieldReferences}
                  />
                  <textarea
                    value={assetForm.acceptable_use}
                    onChange={(e) => setAssetForm({ ...assetForm, acceptable_use: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <FieldLabel
                    translationKey="dataManagement.assets.return_policy"
                    showFieldReference={showFieldReferences}
                  />
                  <textarea
                    value={assetForm.return_policy}
                    onChange={(e) => setAssetForm({ ...assetForm, return_policy: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Autres champs */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('dataManagement.assets.otherFields', 'Autres informations')}
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel
                    translationKey="dataManagement.assets.physical_location"
                    showFieldReference={showFieldReferences}
                  />
                  <input
                    type="text"
                    value={assetForm.physical_location}
                    onChange={(e) => setAssetForm({ ...assetForm, physical_location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <FieldLabel
                    translationKey="dataManagement.assets.version_firmware"
                    showFieldReference={showFieldReferences}
                  />
                  <input
                    type="text"
                    value={assetForm.version_firmware}
                    onChange={(e) => setAssetForm({ ...assetForm, version_firmware: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <FieldLabel
                    translationKey="dataManagement.assets.sbom_reference"
                    showFieldReference={showFieldReferences}
                  />
                  <input
                    type="text"
                    value={assetForm.sbom_reference}
                    onChange={(e) => setAssetForm({ ...assetForm, sbom_reference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <FieldLabel
                    translationKey="dataManagement.assets.disposal_method"
                    showFieldReference={showFieldReferences}
                  />
                  <input
                    type="text"
                    value={assetForm.disposal_method}
                    onChange={(e) => setAssetForm({ ...assetForm, disposal_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <FieldLabel
                    translationKey="dataManagement.assets.end_of_life_date"
                    showFieldReference={showFieldReferences}
                  />
                  <input
                    type="date"
                    value={assetForm.end_of_life_date}
                    onChange={(e) => setAssetForm({ ...assetForm, end_of_life_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <FieldLabel
                    translationKey="dataManagement.assets.last_inventory_date"
                    showFieldReference={showFieldReferences}
                  />
                  <input
                    type="date"
                    value={assetForm.last_inventory_date}
                    onChange={(e) => setAssetForm({ ...assetForm, last_inventory_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={isCreatingAsset ? handleCreateAsset : handleUpdateAsset}
                disabled={!assetForm.name || creatingAsset || updatingAsset}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingAsset
                  ? t('dataManagement.assets.create', 'Créer')
                  : t('dataManagement.assets.update', 'Mettre à jour')}
              </button>
              <button
                onClick={() => {
                  setIsCreatingAsset(false);
                  setSelectedAssetId(null);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {t('dataManagement.cancel', 'Annuler')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsSection;

