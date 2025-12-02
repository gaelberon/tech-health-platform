// Fichier : /client/src/components/CollectorStepper.tsx

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import AssistanceTooltip from './AssistanceTooltip';
import { GET_P1_LOOKUPS, LIST_EDITORS_FOR_USER, LIST_COLLECTOR_DRAFTS, GET_COLLECTOR_DRAFT } from '../graphql/queries';
import { CREATE_SOLUTION_ENVIRONMENT_P1, SAVE_COLLECTOR_DRAFT, DELETE_COLLECTOR_DRAFT } from '../graphql/mutations';
import { useSession } from '../session/SessionContext';

const CollectorStepper: React.FC = () => {
  // État du formulaire
    const [formData, setFormData] = useState<any>({
    selectedEditorId: '', // ID de l'éditeur sélectionné (si existant)
    useExistingEditor: false, // Mode: éditeur existant ou nouveau
    editorName: '',
    editorCriticality: '',
    editorCountry: '',
    editorSize: '',
    solutionName: '',
    solutionType: '',
    solutionCriticality: '',
    solutionMainUseCase: '',
    solutionDescription: '',
    provider: 'OVH',
    region: 'France',
    hostingTier: 'cloud',
    certifications: [],
    dataTypes: [],
    redundancy: '',
    backupExists: false,
    rto: 24,
    rpo: 4,
    restorationTestFrequency: 'annual',
    deploymentType: '',
    virtualization: '',
    techStack: [],
    auth: '',
    encryptTransit: false,
    encryptRest: false,
    patching: 'ad_hoc',
    pentestFreq: 'never',
    vulnMgmt: 'none',
  });

    const [step, setStep] = useState(1);
  const [showP2Details, setShowP2Details] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [showDraftSelector, setShowDraftSelector] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useSession();
  const { t, i18n } = useTranslation();

  // Déterminer la langue à utiliser (préférence utilisateur ou langue i18n actuelle)
  const currentLang = user?.languagePreference || i18n.language || 'fr';

  // Chargement des lookups P1 avec la langue de l'utilisateur
  const { data: lookupsData, loading: lookupsLoading } = useQuery(GET_P1_LOOKUPS, {
    variables: { lang: currentLang },
  });

  // Chargement des éditeurs existants
  const { data: editorsData, loading: editorsLoading } = useQuery(LIST_EDITORS_FOR_USER);

  // Extraction des valeurs actives des lookups
  const lookups = useMemo(() => {
    if (!lookupsData) return {};
    
    const extractValues = (lookupArray: any[]) => {
      if (!lookupArray || lookupArray.length === 0) return [];
      return lookupArray[0]?.values?.filter((v: any) => v.active !== false) || [];
    };

    return {
      businessCriticality: extractValues(lookupsData.businessCriticality || []),
      solutionTypes: extractValues(lookupsData.solutionTypes || []),
      dataTypes: extractValues(lookupsData.dataTypes || []),
      redundancyLevels: extractValues(lookupsData.redundancyLevels || []),
      authTypes: extractValues(lookupsData.authTypes || []),
    };
  }, [lookupsData]);

  const editors = editorsData?.listEditorsForUser || [];

  // Hook Apollo pour les mutations
  const [submitP1Data, { loading: submitting }] = useMutation(CREATE_SOLUTION_ENVIRONMENT_P1);
  const [saveDraft, { loading: savingDraft }] = useMutation(SAVE_COLLECTOR_DRAFT);
  const [deleteDraft] = useMutation(DELETE_COLLECTOR_DRAFT);

  // Chargement des brouillons existants
  const { data: draftsData, loading: draftsLoading, refetch: refetchDrafts } = useQuery(LIST_COLLECTOR_DRAFTS, {
    variables: { status: null }, // Tous les statuts
    skip: !user, // Ne charger que si l'utilisateur est connecté
  });

  const drafts = draftsData?.listCollectorDrafts || [];

  // Fonction pour sauvegarder automatiquement le brouillon (debounce)
  const autoSaveDraft = async (status: 'draft' | 'in_progress' = 'draft') => {
    if (!user) return;

    // Annuler la sauvegarde précédente si elle est en attente
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Programmer une nouvelle sauvegarde après 2 secondes d'inactivité
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveDraft({
          variables: {
            input: {
              draftId: currentDraftId || undefined,
              status,
              step,
              formData,
            },
          },
        }).then((result) => {
          if (result.data?.saveCollectorDraft) {
            setCurrentDraftId(result.data.saveCollectorDraft.draftId);
          }
        });
      } catch (error) {
        console.error(t('collector.autoSaveError') + ':', error);
      }
    }, 2000); // 2 secondes de délai
  };

  // Sauvegarder automatiquement quand formData ou step change (debounce)
  useEffect(() => {
    if (user && step < 5 && !submissionSuccess) {
      autoSaveDraft('in_progress');
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, step, user, submissionSuccess]);

  // Hook pour charger un brouillon à la demande
  const [loadDraftQuery, { loading: loadingDraft }] = useLazyQuery(GET_COLLECTOR_DRAFT);

  // Fonction pour charger un brouillon
  const loadDraft = async (draftId: string) => {
    try {
      const { data } = await loadDraftQuery({ variables: { draftId } });

      if (data?.getCollectorDraft) {
        const draft = data.getCollectorDraft;
        setFormData(draft.formData);
        setStep(draft.step);
        setCurrentDraftId(draft.draftId);
        setSubmissionError(draft.errorMessage || null);
        setShowDraftSelector(false);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement du brouillon:', error);
      alert(`${t('collector.loadDraftError')}: ${error.message}`);
    }
  };

  // Fonction pour supprimer un brouillon
  const handleDeleteDraft = async (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('collector.deleteDraftConfirm'))) return;

    try {
      await deleteDraft({ variables: { draftId } });
      await refetchDrafts();
      if (currentDraftId === draftId) {
        setCurrentDraftId(null);
      }
    } catch (error: any) {
      alert(`${t('collector.deleteDraftError')}: ${error.message}`);
    }
  };

    const handleSubmit = async () => {
    if (submitting) return;

    setSubmissionError(null);

    // Validation des champs requis
    if (!formData.editorName && !formData.selectedEditorId) {
      setSubmissionError(t('collector.editor.nameRequired'));
      return;
    }

    if (!formData.editorCriticality && !formData.useExistingEditor) {
      setSubmissionError(t('collector.editor.businessCriticalityRequired'));
      return;
    }

    if (!formData.solutionName) {
      setSubmissionError(t('collector.solution.nameRequired'));
      return;
    }

    if (!formData.solutionType) {
      setSubmissionError(t('collector.solution.typeRequired'));
      return;
    }

    if (!formData.solutionCriticality) {
      setSubmissionError(t('collector.solution.criticalityRequired'));
      return;
    }

    if (!formData.solutionMainUseCase) {
      setSubmissionError(t('collector.solution.mainUseCaseRequired'));
      return;
    }

    if (formData.dataTypes.length === 0) {
      setSubmissionError(t('collector.environment.dataTypesRequired'));
      return;
    }

    if (!formData.redundancy) {
      setSubmissionError(t('collector.environment.redundancyRequired'));
      return;
    }

    if (!formData.auth) {
      setSubmissionError(t('collector.security.authRequired'));
      return;
    }

    // Préparation des inputs
        const inputs = {
      editorInput: {
        name: formData.useExistingEditor && formData.selectedEditorId
          ? editors.find((e: any) => e.editorId === formData.selectedEditorId)?.name || formData.editorName
          : formData.editorName,
        business_criticality: formData.editorCriticality,
        country: formData.editorCountry || undefined,
        size: formData.editorSize || undefined,
      },
      solutionInput: {
        name: formData.solutionName,
        type: formData.solutionType,
        product_criticality: formData.solutionCriticality,
        main_use_case: formData.solutionMainUseCase,
        description: formData.solutionDescription || undefined,
      },
      hostingInput: {
        provider: formData.provider,
        region: formData.region,
        tier: formData.hostingTier,
        certifications: formData.certifications || [],
      },
      environmentInput: {
        env_type: 'production', // Par défaut pour la première collecte
        data_types: formData.dataTypes,
        redundancy: formData.redundancy,
        backup: {
          exists: formData.backupExists,
          schedule: undefined,
          rto_hours: formData.rto || undefined,
          rpo_hours: formData.rpo || undefined,
          restoration_test_frequency: formData.restorationTestFrequency || undefined,
        },
        deployment_type: formData.deploymentType || undefined,
        virtualization: formData.virtualization || undefined,
        tech_stack: formData.techStack || [],
      },
      securityInput: {
        auth: formData.auth,
        encryption: {
          in_transit: formData.encryptTransit,
          at_rest: formData.encryptRest,
        },
        patching: formData.patching || 'ad_hoc',
        pentest_freq: formData.pentestFreq || 'never',
        vuln_mgmt: formData.vulnMgmt || 'none',
      },
        };

        try {
      // Sauvegarder le brouillon avec statut "in_progress" avant la soumission
      if (user && currentDraftId) {
        await saveDraft({
          variables: {
            input: {
              draftId: currentDraftId,
              status: 'in_progress',
              step,
              formData,
            },
          },
        });
      }

            const result = await submitP1Data({ variables: inputs });
            
      if (result.data?.submitP1Data) {
        setSubmissionSuccess(true);
        setStep(5); // Étape de succès

        // Marquer le brouillon comme complété et le supprimer
        if (user && currentDraftId) {
          try {
            await deleteDraft({ variables: { draftId: currentDraftId } });
            setCurrentDraftId(null);
            await refetchDrafts();
          } catch (error) {
            console.error('Erreur lors de la suppression du brouillon complété:', error);
          }
        }
      }
    } catch (e: any) {
      console.error('Erreur de soumission GraphQL:', e);
      const errorMessage = e.message || t('collector.error');
      setSubmissionError(errorMessage);

      // Sauvegarder le brouillon avec statut "failed" et le message d'erreur
      if (user) {
        try {
          const result = await saveDraft({
            variables: {
              input: {
                draftId: currentDraftId || undefined,
                status: 'failed',
                step,
                formData,
                errorMessage,
              },
            },
          });
          if (result.data?.saveCollectorDraft) {
            setCurrentDraftId(result.data.saveCollectorDraft.draftId);
          }
          await refetchDrafts();
        } catch (saveError) {
          console.error('Erreur lors de la sauvegarde du brouillon en échec:', saveError);
        }
      }
    }
  };

  // Mise à jour de formData quand un éditeur existant est sélectionné
  const handleEditorSelect = (editorId: string) => {
    const editor = editors.find((e: any) => e.editorId === editorId);
    if (editor) {
      setFormData({
        ...formData,
        selectedEditorId: editorId,
        editorName: editor.name,
        editorCriticality: editor.business_criticality || '',
        editorCountry: editor.country || '',
        editorSize: editor.size || '',
      });
    }
  };

  // Affichage du chargement
  if (lookupsLoading || editorsLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-500 text-sm">{t('collector.loadingLookups')}</p>
      </div>
    );
  }

  // Afficher le sélecteur de brouillons si demandé
  if (showDraftSelector && drafts.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('collector.resumeDraft')}</h2>
          <button
            onClick={() => setShowDraftSelector(false)}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            {t('collector.newForm')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {drafts.map((draft: any) => (
            <div
              key={draft.draftId}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer bg-white dark:bg-gray-800 transition-colors"
              onClick={() => loadDraft(draft.draftId)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        draft.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : draft.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {draft.status === 'failed' ? t('collector.draftStatus.failed') : draft.status === 'in_progress' ? t('collector.draftStatus.in_progress') : t('collector.draftStatus.draft')}
                    </span>
                    <span className="text-sm text-gray-500">{t('collector.step', { current: draft.step, total: 4 })}</span>
                  </div>
                  {draft.formData.solutionName && (
                    <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {draft.formData.solutionName}
                    </p>
                  )}
                  {draft.formData.editorName && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {t('collector.editor.editorLabel')}: {draft.formData.editorName}
                    </p>
                  )}
                  {draft.errorMessage && (
                    <p className="text-xs text-red-600 mt-2 italic">
                      {t('collector.errorLabel')}: {draft.errorMessage}
                    </p>
                  )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {t('collector.lastSaved')} {new Date(draft.lastSavedAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteDraft(draft.draftId, e)}
                  className="text-red-500 hover:text-red-700 ml-2"
                  title={t('common.delete')}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

    const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('collector.solution.step1Title')}</h2>

            {/* Choix: éditeur existant ou nouveau */}
            <div className="border border-gray-200 dark:border-gray-700 p-4 rounded bg-gray-50 dark:bg-gray-800 transition-colors">
              <label className="flex items-center mb-3 text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.useExistingEditor}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      useExistingEditor: e.target.checked,
                      selectedEditorId: e.target.checked ? (editors.length > 0 ? editors[0].editorId : '') : '',
                    });
                    if (e.target.checked && editors.length > 0) {
                      handleEditorSelect(editors[0].editorId);
                    }
                  }}
                  className="mr-2"
                />
                <span className="font-medium">{t('collector.editor.useExisting')}</span>
              </label>

              {formData.useExistingEditor && editors.length > 0 && (
                <select
                  value={formData.selectedEditorId}
                  onChange={(e) => handleEditorSelect(e.target.value)}
                  className="w-full border p-2 rounded mt-2"
                >
                  <option value="">{t('collector.editor.selectEditor')}</option>
                  {editors.map((editor: any) => (
                    <option key={editor.editorId} value={editor.editorId}>
                      {editor.name} ({editor.editorId})
                    </option>
                  ))}
                </select>
              )}

              {formData.useExistingEditor && editors.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('collector.editor.noEditorAvailable')}</p>
              )}
            </div>

            {/* Editor.name (P1) */}
            <label className="block text-gray-700 dark:text-gray-300">
              {t('collector.editor.name')} {formData.useExistingEditor ? '(pré-rempli)' : '*'}
                <AssistanceTooltip content="Nom légal de l'entreprise éditrice du logiciel." />
            </label>
            <input
              type="text"
              value={formData.editorName}
              onChange={(e) => setFormData({ ...formData, editorName: e.target.value })}
              disabled={formData.useExistingEditor}
              className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />

            {/* Editor.business_criticality (P1) */}
            <label className="block pt-2 text-gray-700 dark:text-gray-300">
              {t('collector.editor.criticalityLabel')} *
              <AssistanceTooltip content="Évalue l'impact métier si l'éditeur devenait indisponible (définitions standardisées). P1 pour le score global : fixe la tolérance au risque et les exigences de product_criticality." />
            </label>
            <select
              value={formData.editorCriticality}
              onChange={(e) => setFormData({ ...formData, editorCriticality: e.target.value })}
              disabled={formData.useExistingEditor}
              className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="">{t('collector.select')}</option>
              {lookups.businessCriticality.map((item: any) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>

            {/* Solution.name (P1) */}
            <label className="block pt-2 text-gray-700 dark:text-gray-300">
              {t('collector.solution.name')} *
              <AssistanceTooltip content="Nom de la solution logicielle évaluée." />
            </label>
            <input
              type="text"
              value={formData.solutionName}
              onChange={(e) => setFormData({ ...formData, solutionName: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />

            {/* Solution.type (P1) */}
            <label className="block pt-2 text-gray-700 dark:text-gray-300">
              {t('collector.solution.typeLabel')} *
                <AssistanceTooltip content="Modèle de livraison du logiciel. Crucial pour les enjeux d'hébergement." />
            </label>
            <select
              value={formData.solutionType}
              onChange={(e) => setFormData({ ...formData, solutionType: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="">{t('collector.select')}</option>
              {lookups.solutionTypes.map((item: any) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>

            {/* Solution.product_criticality (P1) */}
            <label className="block pt-2 text-gray-700 dark:text-gray-300">
              {t('collector.solution.criticality')} *
              <AssistanceTooltip content="Criticité de la solution pour l'organisation." />
            </label>
            <select
              value={formData.solutionCriticality}
              onChange={(e) => setFormData({ ...formData, solutionCriticality: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="">{t('collector.select')}</option>
              {lookups.businessCriticality.map((item: any) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>

            {/* Solution.main_use_case (P1) */}
            <label className="block pt-2 text-gray-700 dark:text-gray-300">
              {t('collector.solution.mainUseCase')} *
              <AssistanceTooltip content="Description du cas d'usage principal de la solution." />
            </label>
            <textarea
              value={formData.solutionMainUseCase}
              onChange={(e) => setFormData({ ...formData, solutionMainUseCase: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={3}
              required
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('collector.hosting.step2Title')}</h2>

            {/* Hosting.provider (P1) */}
            <label className="block text-gray-700 dark:text-gray-300">
              {t('collector.hosting.providerLabel')} *
                <AssistanceTooltip content="Nom du fournisseur technique (ex: OVH, Azure, GCP). Champ conditionnel si SaaS ou Hébergé." />
            </label>
            <input
              type="text"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />

            {/* Hosting.region (P1) */}
            <label className="block pt-2 text-gray-700 dark:text-gray-300">
              {t('collector.hosting.regionLabel')} *
                <AssistanceTooltip content="Pays/Région où les données sont hébergées. Nécessaire pour la conformité RGPD." />
            </label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />

            {/* Hosting.tier (P1) */}
            <label className="block pt-2 text-gray-700 dark:text-gray-300">
              {t('collector.hosting.tierLabel')} *
              <AssistanceTooltip content="Type d'infrastructure d'hébergement." />
            </label>
            <select
              value={formData.hostingTier}
              onChange={(e) => setFormData({ ...formData, hostingTier: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="datacenter">Datacenter</option>
              <option value="private">Private</option>
              <option value="public">Public</option>
              <option value="cloud">Cloud</option>
            </select>

            {/* Environment.data_types (P1) */}
            <label className="block pt-2 text-gray-700 dark:text-gray-300">
              {t('collector.environment.dataTypesLabel')} *
              <AssistanceTooltip content="Indique si des données réglementées sont traitées (Santé, Finance, RGPD). Critique pour le score de conformité (20%) et justifie les exigences de certifications (HDS, Ségur)." />
            </label>
            <select
              multiple
              value={formData.dataTypes}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFormData({ ...formData, dataTypes: selected });
              }}
              className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded min-h-[100px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            >
              {lookups.dataTypes.map((item: any) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('collector.environment.dataTypesHint')}</p>

            {/* Environment.redundancy (P1) */}
            <label className="block pt-2 text-gray-700 dark:text-gray-300">
              {t('collector.environment.redundancyLabel')} *
              <AssistanceTooltip content="Niveau de redondance de l'infrastructure." />
            </label>
            <select
              value={formData.redundancy}
              onChange={(e) => setFormData({ ...formData, redundancy: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="">{t('collector.select')}</option>
              {lookups.redundancyLevels.map((item: any) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>

            {/* Environment.backup (exists, RTO, RPO) (P1) */}
            <div className="border border-gray-200 dark:border-gray-700 p-4 rounded mt-4 bg-white dark:bg-gray-800 transition-colors">
              <label className="block font-medium text-gray-700 dark:text-gray-300">{t('collector.environment.backupPolicy')} :</label>
              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  id="backupExists"
                  checked={formData.backupExists}
                  onChange={(e) => setFormData({ ...formData, backupExists: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="backupExists" className="text-gray-700 dark:text-gray-300">{t('collector.environment.backupExists')}</label>
              </div>

              {formData.backupExists && (
                <>
                  <label className="block pt-2 text-gray-700 dark:text-gray-300">
                    RTO (Heures) :
                    <AssistanceTooltip content="Recovery Time Objective : durée maximale pour rétablir le service après un incident critique. P1 pour le score Résilience (20%). Un RTO court est attendu pour un score élevé." />
              </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.rto}
                    onChange={(e) => setFormData({ ...formData, rto: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Ex: 24 (heures)"
                  />

                  <label className="block pt-2 text-gray-700 dark:text-gray-300">
                    RPO (Heures) :
                <AssistanceTooltip content="Recovery Point Objective: Perte de données maximale acceptable (en heures)." />
              </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.rpo}
                    onChange={(e) => setFormData({ ...formData, rpo: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Ex: 4 (heures)"
                  />

                  <label className="block pt-2 text-gray-700 dark:text-gray-300">
                    Fréquence de test de restauration :
                  </label>
                  <select
                    value={formData.restorationTestFrequency}
                    onChange={(e) => setFormData({ ...formData, restorationTestFrequency: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="never">Jamais</option>
                    <option value="annual">Annuel</option>
                    <option value="quarterly">Trimestriel</option>
                  </select>
                </>
              )}
            </div>

            {/* Progressive Disclosure pour P2/P3 */}
            <button
              onClick={() => setShowP2Details(!showP2Details)}
              className="mt-4 text-blue-500 hover:underline"
            >
              {showP2Details ? t('collector.hide') : t('collector.showMore')}
            </button>

            {showP2Details && (
              <div className="border border-gray-200 dark:border-gray-700 p-4 rounded bg-gray-50 dark:bg-gray-800 mt-2 transition-colors">
                <h3 className="font-semibold mb-2">{t('collector.p2Fields')}</h3>
                <label className="block text-gray-700 dark:text-gray-300 font-medium">Certifications (P2) :</label>
                <select
                  multiple
                  value={formData.certifications}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, certifications: selected });
                  }}
                  className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="ISO27001">ISO 27001</option>
                  <option value="HDS">HDS</option>
                  <option value="SOC2">SOC 2</option>
                </select>
                <label className="block pt-2 text-gray-700 dark:text-gray-300">Type de déploiement (P2) :</label>
                <select
                  value={formData.deploymentType}
                  onChange={(e) => setFormData({ ...formData, deploymentType: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">{t('collector.select')}</option>
                  <option value="monolith">Monolith</option>
                  <option value="microservices">Microservices</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('collector.security.step3Title')}</h2>

            {/* SecurityProfile.auth (P1) */}
            <label className="block text-gray-700 dark:text-gray-300">
              {t('collector.security.auth')} *
              <AssistanceTooltip content="Méthode pour valider l'identité des utilisateurs (Passwords/MFA/SSO). P1 pour le score Sécurité (30%) : MFA ou SSO requis pour atteindre le maximum." />
            </label>
            <select
              value={formData.auth}
              onChange={(e) => setFormData({ ...formData, auth: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="">{t('collector.select')}</option>
              {lookups.authTypes.map((item: any) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>

            {/* SecurityProfile.encryption (in_transit, at_rest) (P1) */}
            <div className="border p-4 rounded mt-4">
              <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300">{t('collector.security.encryption')} :</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="encryptTransit"
                  checked={formData.encryptTransit}
                  onChange={(e) => setFormData({ ...formData, encryptTransit: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="encryptTransit">{t('collector.security.encryptTransit')}</label>
              </div>
              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  id="encryptRest"
                  checked={formData.encryptRest}
                  onChange={(e) => setFormData({ ...formData, encryptRest: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="encryptRest">{t('collector.security.encryptRest')}</label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">{t('collector.submitTitle')}</h2>
            <p className="mb-8 text-gray-700 dark:text-gray-300">{t('collector.submitDescription')}</p>
            
            {submissionError && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300 mb-4 transition-colors">
                <p className="font-semibold">{t('common.error')}</p>
                <p className="text-sm">{submissionError}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('collector.submitting') : t('collector.submit')}
            </button>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-4">
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-6 transition-colors">
              <h2 className="text-2xl font-semibold text-green-800 dark:text-green-200 mb-4">✅ {t('collector.success')}</h2>
              <p className="text-green-700 dark:text-green-300 mb-4">
                {t('collector.success')}
              </p>
              <button
                onClick={() => {
                  setStep(1);
                  setSubmissionSuccess(false);
                  setSubmissionError(null);
                  setFormData({
                    selectedEditorId: '',
                    useExistingEditor: false,
                    editorName: '',
                    editorCriticality: '',
                    editorCountry: '',
                    editorSize: '',
                    solutionName: '',
                    solutionType: '',
                    solutionCriticality: '',
                    solutionMainUseCase: '',
                    solutionDescription: '',
                    provider: 'OVH',
                    region: 'France',
                    hostingTier: 'cloud',
                    certifications: [],
                    dataTypes: [],
                    redundancy: '',
                    backupExists: false,
                    rto: 24,
                    rpo: 4,
                    restorationTestFrequency: 'annual',
                    deploymentType: '',
                    virtualization: '',
                    techStack: [],
                    auth: '',
                    encryptTransit: false,
                    encryptRest: false,
                    patching: 'ad_hoc',
                    pentestFreq: 'never',
                    vulnMgmt: 'none',
                  });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('collector.newForm')}
              </button>
            </div>
          </div>
        );

      default:
        return <p>{t('common.error')}</p>;
    }
  };

    return (
      <div>
      {/* En-tête avec bouton pour voir les brouillons */}
      {user && drafts.length > 0 && !showDraftSelector && (
        <div className="mb-4 flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {t('collector.draftsAvailable', { count: drafts.length })}
            </span>
            {currentDraftId && (
              <span className="text-xs text-blue-600 dark:text-blue-400">
                {t('collector.draftActive')}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowDraftSelector(true)}
            className="px-3 py-1 text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-200 font-medium"
          >
            {t('collector.viewDrafts')}
          </button>
        </div>
      )}

      {/* Bouton pour voir les brouillons au démarrage si aucun brouillon n'est chargé */}
      {user && drafts.length > 0 && !currentDraftId && !showDraftSelector && step === 1 && (
        <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 transition-colors">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
            {t('collector.draftsSaved', { count: drafts.length })}
          </p>
          <button
            onClick={() => setShowDraftSelector(true)}
            className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            {t('collector.viewMyDrafts')}
          </button>
        </div>
      )}

      {savingDraft && (
        <div className="mb-2 text-xs text-gray-500 italic">
          {t('collector.autoSaving')}
        </div>
      )}

        {renderStep()}

        <div className="flex justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        {step > 1 && step < 5 && (
            <button
            onClick={() => {
              setStep(step - 1);
              setSubmissionError(null);
            }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {t('collector.previous')}
            </button>
          )}

          {step < 4 && (
            <button
            onClick={() => {
              setStep(step + 1);
              setSubmissionError(null);
            }}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 ml-auto"
            >
              {t('collector.next')}
            </button>
          )}
        </div>
      </div>
    );
};

export default CollectorStepper;
