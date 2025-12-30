/**
 * Formulaire intelligent pour gérer les données d'un éditeur
 * Permet de créer/mettre à jour/supprimer solutions, environnements et données associées
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { useSession } from '../../session/SessionContext';
import { useLookups } from '../../hooks/useLookups';
import {
  UPDATE_EDITOR,
  UPDATE_SOLUTION,
  UPDATE_ENVIRONMENT,
  CREATE_SOLUTION,
  CREATE_ENVIRONMENT,
  ARCHIVE_SOLUTION,
  ARCHIVE_ENVIRONMENT,
} from '../../graphql/mutations';
import { GET_EDITOR_WITH_DETAILS } from '../../graphql/queries';
import EnvironmentFullDetails from './EnvironmentFullDetails';
import CodeBaseSection from './sections/CodeBaseSection';
import DevelopmentMetricsSection from './sections/DevelopmentMetricsSection';
import { parseGraphQLError, formatErrorMessage, validateFormData } from '../../utils/errorHandler';
import type { ParsedError } from '../../utils/errorHandler';
import { getFieldClasses } from '../../utils/fieldValidation';
import ErrorMessage from './ErrorMessage';
import SuccessMessage from './SuccessMessage';
import FieldLabel from './FieldLabel';

interface DataManagementFormProps {
  editor: any;
  editorId: string;
  showFieldReferences?: boolean;
  onDataUpdated: () => void;
}

const DataManagementForm: React.FC<DataManagementFormProps> = ({
  editor,
  editorId,
  showFieldReferences = false,
  onDataUpdated,
}) => {
  const { t } = useTranslation();
  const { user } = useSession();
  const { lookups, loading: lookupsLoading } = useLookups();
  const [activeSection, setActiveSection] = useState<'editor' | 'solutions' | 'environments'>('editor');
  const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [isCreatingSolution, setIsCreatingSolution] = useState<boolean>(false);
  const [isCreatingEnvironment, setIsCreatingEnvironment] = useState<boolean>(false);

  const isAdminOrSupervisor = user?.role === 'Admin' || user?.role === 'Supervisor';

  const [updateEditor, { loading: updatingEditor }] = useMutation(UPDATE_EDITOR);
  const [updateSolution, { loading: updatingSolution }] = useMutation(UPDATE_SOLUTION);
  const [updateEnvironment, { loading: updatingEnvironment }] = useMutation(UPDATE_ENVIRONMENT);
  const [createSolution, { loading: creatingSolution }] = useMutation(CREATE_SOLUTION);
  const [createEnvironment, { loading: creatingEnvironment }] = useMutation(CREATE_ENVIRONMENT);
  const [archiveSolution, { loading: archivingSolution }] = useMutation(ARCHIVE_SOLUTION);
  const [archiveEnvironment, { loading: archivingEnvironment }] = useMutation(ARCHIVE_ENVIRONMENT);

  // Formulaire éditeur
  const [editorForm, setEditorForm] = useState({
    name: editor?.name || '',
    country: editor?.country || '',
    size: editor?.size || '',
    business_criticality: editor?.business_criticality || 'Medium',
    internal_it_systems: editor?.internal_it_systems || [],
    it_security_strategy: editor?.it_security_strategy || [],
    contracts_for_review: editor?.contracts_for_review || [],
  });

  // Formulaire solution
  const [solutionForm, setSolutionForm] = useState({
    name: '',
    description: '',
    main_use_case: '',
    type: 'SaaS',
    product_criticality: 'Medium',
    api_robustness: '',
    api_documentation_quality: '',
    ip_ownership_clear: '',
    licensing_model: '',
    license_compliance_assured: '',
    tech_stack: [] as string[],
  });

  // Formulaire environnement
  const [environmentForm, setEnvironmentForm] = useState({
    env_type: 'production',
    deployment_type: '',
    redundancy: 'none',
    tech_stack: [] as string[],
    data_types: [] as string[],
  });

  // État pour les erreurs
  const [error, setError] = useState<ParsedError | null>(null);
  // État pour les messages de succès
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // États initiaux sauvegardés (snapshot au montage du composant)
  const initialStatesRef = useRef<{
    editorForm: typeof editorForm;
    selectedSolutionId: string | null;
    selectedEnvId: string | null;
    solutionForm: typeof solutionForm;
    environmentForm: typeof environmentForm;
    activeSection: typeof activeSection;
    showArchived: boolean;
    isCreatingSolution: boolean;
    isCreatingEnvironment: boolean;
  } | null>(null);

  // Fonction utilitaire pour trouver l'élément le plus ancien
  const findOldestItem = (items: any[], dateField: string = 'createdAt', idField: string = 'id'): any | null => {
    if (!items || items.length === 0) return null;
    if (items.length === 1) return items[0];
    
    const sorted = [...items].sort((a: any, b: any) => {
      const dateA = a[dateField] ? new Date(a[dateField]).getTime() : 0;
      const dateB = b[dateField] ? new Date(b[dateField]).getTime() : 0;
      if (dateA === 0 && dateB === 0) {
        // Fallback: utiliser l'ID (séquentiel)
        return a[idField]?.localeCompare(b[idField]) || 0;
      }
      return dateA - dateB; // Tri croissant (plus ancienne en premier)
    });
    return sorted[0];
  };

  // Sauvegarder l'état initial au montage et quand editor change (seulement si c'est un nouvel editor)
  const previousEditorIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);
  const solutionAutoSelectedRef = useRef<boolean>(false);
  const envAutoSelectedRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (editor) {
      const isNewEditor = previousEditorIdRef.current !== editor.editorId;
      previousEditorIdRef.current = editor.editorId;

      const initialEditorForm = {
        name: editor?.name || '',
        country: editor?.country || '',
        size: editor?.size || '',
        business_criticality: editor?.business_criticality || 'Medium',
        internal_it_systems: editor?.internal_it_systems || [],
        it_security_strategy: editor?.it_security_strategy || [],
        contracts_for_review: editor?.contracts_for_review || [],
      };

      // Si c'est un nouvel editor, réinitialiser tout et initialiser les sélections par défaut
      if (isNewEditor) {
        hasInitializedRef.current = false;
        
        // Trouver la solution par défaut (la plus ancienne)
        const availableSolutions = editor.solutions?.filter((s: any) => !(s.archived === true)) || [];
        const defaultSolution = findOldestItem(availableSolutions, 'createdAt', 'solutionId');
        
        // Trouver l'environnement par défaut si une solution existe
        let defaultEnv = null;
        if (defaultSolution) {
          const solution = editor.solutions?.find((s: any) => s.solutionId === defaultSolution.solutionId);
          const availableEnvs = solution?.environments?.filter((e: any) => !(e.archived === true)) || [];
          defaultEnv = findOldestItem(availableEnvs, 'createdAt', 'envId');
        }

        initialStatesRef.current = {
          editorForm: initialEditorForm,
          selectedSolutionId: defaultSolution?.solutionId || null,
          selectedEnvId: defaultEnv?.envId || null,
          solutionForm: {
            name: '',
            description: '',
            main_use_case: '',
            type: 'SaaS',
            product_criticality: 'Medium',
            api_robustness: '',
            api_documentation_quality: '',
            ip_ownership_clear: '',
            licensing_model: '',
            license_compliance_assured: '',
            tech_stack: [],
          },
          environmentForm: {
            env_type: 'production',
            deployment_type: '',
            redundancy: 'none',
            tech_stack: [],
            data_types: [],
          },
          activeSection: 'editor',
          showArchived: false,
          isCreatingSolution: false,
          isCreatingEnvironment: false,
        };

        // Réinitialiser les formulaires avec les valeurs initiales
        setEditorForm(initialEditorForm);
        setActiveSection('editor');
        setShowArchived(false);
        setIsCreatingSolution(false);
        setIsCreatingEnvironment(false);
        
        // Initialiser les sélections par défaut et remplir les formulaires immédiatement
        isInitializingRef.current = true;
        
        if (defaultSolution) {
          // Remplir le formulaire solution avec les données de la solution par défaut
          const solution = editor.solutions?.find((s: any) => s.solutionId === defaultSolution.solutionId);
          if (solution) {
            const initialSolutionForm = {
              name: solution.name || '',
              description: solution.description || '',
              main_use_case: solution.main_use_case || '',
              type: solution.type || 'SaaS',
              product_criticality: solution.product_criticality || 'Medium',
              api_robustness: solution.api_robustness || '',
              api_documentation_quality: solution.api_documentation_quality || '',
              ip_ownership_clear: solution.ip_ownership_clear ?? '',
              licensing_model: solution.licensing_model || '',
              license_compliance_assured: solution.license_compliance_assured ?? '',
              tech_stack: solution.tech_stack || [],
            };
            initialStatesRef.current!.solutionForm = initialSolutionForm;
            setSolutionForm(initialSolutionForm);
            
            // Si un environnement par défaut existe, remplir son formulaire aussi
            if (defaultEnv) {
              const env = solution.environments?.find((e: any) => e.envId === defaultEnv.envId);
              if (env) {
                const displayRedundancy = env.redundancy === 'geo_redundant' ? 'geo-redundant' : (env.redundancy || 'none');
                const initialEnvironmentForm = {
                  env_type: env.env_type || 'production',
                  deployment_type: env.deployment_type || '',
                  redundancy: displayRedundancy,
                  tech_stack: env.tech_stack || [],
                  data_types: env.data_types || [],
                };
                initialStatesRef.current!.environmentForm = initialEnvironmentForm;
                setEnvironmentForm(initialEnvironmentForm);
              }
            } else {
              // Pas d'environnement par défaut, réinitialiser le formulaire
              setEnvironmentForm(initialStatesRef.current.environmentForm);
            }
          }
          
          // Définir les sélections (déclenchera les useEffect pour maintenir la cohérence)
          setSelectedSolutionId(defaultSolution.solutionId);
          setSelectedEnvId(defaultEnv?.envId || null);
        } else {
          // Pas de solution par défaut
          setSelectedSolutionId(null);
          setSelectedEnvId(null);
          setSolutionForm(initialStatesRef.current.solutionForm);
          setEnvironmentForm(initialStatesRef.current.environmentForm);
        }
        
        isInitializingRef.current = false;
        hasInitializedRef.current = true;
        solutionAutoSelectedRef.current = false;
        envAutoSelectedRef.current = null;
      } else {
        // Si c'est le même editor (juste un refetch), mettre à jour seulement les données du formulaire editor
        // mais conserver l'état de navigation (activeSection, selectedSolutionId, etc.)
        setEditorForm(initialEditorForm);
        // Mettre à jour initialStatesRef pour refléter les nouvelles valeurs
        if (initialStatesRef.current) {
          initialStatesRef.current.editorForm = initialEditorForm;
        }
      }
    }
  }, [editor]);

  // Sélectionner automatiquement une solution par défaut seulement lors de l'initialisation
  // Ne pas forcer la sélection si l'utilisateur a déjà fait un choix
  useEffect(() => {
    if (editor?.solutions && hasInitializedRef.current && activeSection === 'solutions') {
      const availableSolutions = showArchived 
        ? editor.solutions 
        : editor.solutions.filter((s: any) => !(s.archived === true));
      
      // Sélectionner automatiquement seulement si aucune solution n'est sélectionnée
      // ET qu'on n'a pas déjà fait une auto-sélection pour cet onglet
      if (!selectedSolutionId && availableSolutions.length > 0 && !solutionAutoSelectedRef.current) {
        const defaultSolution = findOldestItem(availableSolutions, 'createdAt', 'solutionId');
        if (defaultSolution) {
          setSelectedSolutionId(defaultSolution.solutionId);
          solutionAutoSelectedRef.current = true;
        }
      }
    }
    
    // Réinitialiser le flag si on change d'onglet (pour permettre une nouvelle auto-sélection si nécessaire)
    if (activeSection !== 'solutions') {
      solutionAutoSelectedRef.current = false;
    }
  }, [activeSection, editor, showArchived, selectedSolutionId]);

  // Sélectionner automatiquement un environnement par défaut seulement lors de l'initialisation ou changement de solution
  // Ne pas forcer la sélection si l'utilisateur a déjà fait un choix
  useEffect(() => {
    if (hasInitializedRef.current && selectedSolutionId && editor?.solutions && activeSection === 'environments') {
      const solution = editor.solutions.find((s: any) => s.solutionId === selectedSolutionId);
      if (solution?.environments) {
        const availableEnvironments = showArchived 
          ? solution.environments 
          : solution.environments.filter((e: any) => !(e.archived === true));
        
        // Sélectionner automatiquement seulement si :
        // 1. La solution a changé (pas encore auto-sélectionné pour cette solution) OU aucun environnement n'est sélectionné
        // 2. On n'a pas déjà auto-sélectionné pour cette solution
        if (availableEnvironments.length > 0) {
          const solutionChanged = envAutoSelectedRef.current !== selectedSolutionId;
          const shouldAutoSelect = solutionChanged || (!selectedEnvId && envAutoSelectedRef.current === null);
          
          if (shouldAutoSelect) {
            const defaultEnv = findOldestItem(availableEnvironments, 'createdAt', 'envId');
            if (defaultEnv) {
              setSelectedEnvId(defaultEnv.envId);
              envAutoSelectedRef.current = selectedSolutionId;
            }
          }
        }
      } else if (selectedEnvId) {
        // Si la solution n'a plus d'environnements, réinitialiser
        setSelectedEnvId(null);
        envAutoSelectedRef.current = null;
      }
    }
  }, [activeSection, selectedSolutionId, editor, showArchived]);

  // Sauvegarder l'état initial quand on sélectionne une solution (avant de remplir le formulaire)
  // Ne pas réinitialiser l'environnement si on est en train d'initialiser
  useEffect(() => {
    if (selectedSolutionId && initialStatesRef.current && editor && hasInitializedRef.current) {
      const solution = editor?.solutions?.find((s: any) => s.solutionId === selectedSolutionId);
      if (solution) {
        // Vérifier si le formulaire est déjà rempli avec les bonnes données
        const currentFormMatches = solutionForm.name === solution.name && 
                                   solutionForm.main_use_case === solution.main_use_case;
        
        if (!currentFormMatches) {
          // Sauvegarder l'état initial AVANT de remplir le formulaire
          const initialSolutionForm = {
            name: solution.name || '',
            description: solution.description || '',
            main_use_case: solution.main_use_case || '',
            type: solution.type || 'SaaS',
            product_criticality: solution.product_criticality || 'Medium',
            api_robustness: solution.api_robustness || '',
            api_documentation_quality: solution.api_documentation_quality || '',
            ip_ownership_clear: solution.ip_ownership_clear ?? '',
            licensing_model: solution.licensing_model || '',
            license_compliance_assured: solution.license_compliance_assured ?? '',
            tech_stack: solution.tech_stack || [],
          };
          initialStatesRef.current.solutionForm = initialSolutionForm;
          initialStatesRef.current.selectedSolutionId = selectedSolutionId;
          
          // Remplir le formulaire avec les données de la solution
          setSolutionForm(initialSolutionForm);
          
          // Réinitialiser l'environnement seulement si on change de solution (pas lors de l'init)
          if (initialStatesRef.current.selectedEnvId && !isInitializingRef.current) {
            initialStatesRef.current.selectedEnvId = null;
            initialStatesRef.current.environmentForm = {
              env_type: 'production',
              deployment_type: '',
              redundancy: 'none',
              tech_stack: [],
              data_types: [],
            };
            setSelectedEnvId(null);
            setEnvironmentForm({
              env_type: 'production',
              deployment_type: '',
              redundancy: 'none',
              tech_stack: [],
              data_types: [],
            });
          }
        }
      }
    }
  }, [selectedSolutionId, editor, solutionForm.name, solutionForm.main_use_case]);

  // Sauvegarder l'état initial quand on sélectionne un environnement (avant de remplir le formulaire)
  useEffect(() => {
    if (selectedEnvId && selectedSolutionId && initialStatesRef.current && editor) {
      const solution = editor?.solutions?.find((s: any) => s.solutionId === selectedSolutionId);
      const env = solution?.environments?.find((envItem: any) => envItem.envId === selectedEnvId);
      if (env) {
        // Mapper la valeur de redondance : "geo_redundant" -> "geo-redundant" pour l'affichage dans le formulaire
        const displayRedundancy = env.redundancy === 'geo_redundant' 
          ? 'geo-redundant' 
          : (env.redundancy || 'none');
        
        // Sauvegarder l'état initial AVANT de remplir le formulaire
        const initialEnvironmentForm = {
          env_type: env.env_type || 'production',
          deployment_type: env.deployment_type || '',
          redundancy: displayRedundancy,
          tech_stack: env.tech_stack || [],
          data_types: env.data_types || [],
        };
        initialStatesRef.current.environmentForm = initialEnvironmentForm;
        initialStatesRef.current.selectedEnvId = selectedEnvId;
        // Remplir le formulaire avec les données de l'environnement
        setEnvironmentForm(initialEnvironmentForm);
      }
    }
  }, [selectedEnvId, selectedSolutionId, editor]);

  // Fonction pour annuler toutes les modifications
  const handleCancel = () => {
    if (initialStatesRef.current) {
      setEditorForm(initialStatesRef.current.editorForm);
      setSelectedSolutionId(initialStatesRef.current.selectedSolutionId);
      setSelectedEnvId(initialStatesRef.current.selectedEnvId);
      setSolutionForm(initialStatesRef.current.solutionForm);
      setEnvironmentForm(initialStatesRef.current.environmentForm);
      setActiveSection(initialStatesRef.current.activeSection);
      setShowArchived(initialStatesRef.current.showArchived);
      setIsCreatingSolution(initialStatesRef.current.isCreatingSolution);
      setIsCreatingEnvironment(initialStatesRef.current.isCreatingEnvironment);
    }
  };

  const handleUpdateEditor = async () => {
    setError(null);
    
    // Validation avant soumission
    const validation = validateFormData(editorForm, ['name']);
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
      // Préparer les données pour la mutation
      const inputData: any = {
        editorId,
        name: editorForm.name,
        country: editorForm.country || undefined,
        size: editorForm.size || undefined,
        business_criticality: editorForm.business_criticality,
      };

      // Ajouter les champs DD seulement s'ils ont des valeurs
      if (editorForm.internal_it_systems.length > 0) {
        inputData.internal_it_systems = editorForm.internal_it_systems;
      }
      if (editorForm.it_security_strategy.length > 0) {
        inputData.it_security_strategy = editorForm.it_security_strategy;
      }
      if (editorForm.contracts_for_review.length > 0) {
        // Filtrer les contrats avec au moins un type (requis)
        const validContracts = editorForm.contracts_for_review
          .filter((c: any) => c && c.type && c.type.trim().length > 0)
          // Important : ne pas envoyer __typename à l'input GraphQL
          .map((c: any) => ({
            type: c.type,
            summary: c.summary || '',
          }));

        if (validContracts.length > 0) {
          inputData.contracts_for_review = validContracts;
        }
      }

      await updateEditor({
        variables: {
          input: inputData,
        },
      });
      setSuccessMessage(t('dataManagement.form.success'));
      setError(null);
      onDataUpdated();
    } catch (err: any) {
      const parsedError = parseGraphQLError(err);
      setError(parsedError);
    }
  };

  const handleUpdateSolution = async () => {
    setError(null);
    
    if (!selectedSolutionId) {
      setError({
        message: 'Aucune solution sélectionnée',
        reason: 'Vous devez sélectionner une solution avant de pouvoir la modifier',
        suggestion: 'Veuillez sélectionner une solution dans la liste déroulante',
      });
      return;
    }

    // Validation avant soumission
    const validation = validateFormData(solutionForm, ['name', 'main_use_case', 'type', 'product_criticality']);
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
      // Préparer les données pour la mutation
      const inputData: any = {
        solutionId: selectedSolutionId,
        name: solutionForm.name,
        description: solutionForm.description || undefined,
        main_use_case: solutionForm.main_use_case,
        type: solutionForm.type,
        product_criticality: solutionForm.product_criticality,
        ip_ownership_clear: solutionForm.ip_ownership_clear,
      };

      // Ajouter les champs DD seulement s'ils ont des valeurs
      if (solutionForm.api_robustness) {
        inputData.api_robustness = solutionForm.api_robustness;
      }
      if (solutionForm.api_documentation_quality) {
        inputData.api_documentation_quality = solutionForm.api_documentation_quality;
      }
      if (solutionForm.licensing_model) {
        inputData.licensing_model = solutionForm.licensing_model;
      }
      if (solutionForm.license_compliance_assured) {
        inputData.license_compliance_assured = solutionForm.license_compliance_assured;
      }
      if (solutionForm.tech_stack && solutionForm.tech_stack.length > 0) {
        inputData.tech_stack = solutionForm.tech_stack;
      }

      await updateSolution({
        variables: {
          input: inputData,
        },
      });
      setSuccessMessage(t('dataManagement.form.success'));
      setError(null);
      onDataUpdated();
    } catch (err: any) {
      const parsedError = parseGraphQLError(err);
      setError(parsedError);
    }
  };

  const handleUpdateEnvironment = async () => {
    setError(null);
    
    if (!selectedEnvId || !selectedSolutionId) {
      setError({
        message: 'Aucun environnement sélectionné',
        reason: 'Vous devez sélectionner un environnement avant de pouvoir le modifier',
        suggestion: 'Veuillez sélectionner un environnement dans la liste',
      });
      return;
    }

    // Validation avant soumission
    const validation = validateFormData(environmentForm, ['env_type', 'redundancy']);
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
      // Mapper la valeur de redondance : "geo-redundant" -> "geo_redundant"
      const mappedRedundancy = environmentForm.redundancy === 'geo-redundant' 
        ? 'geo_redundant' 
        : environmentForm.redundancy;
      
      await updateEnvironment({
        variables: {
          input: {
            envId: selectedEnvId,
            solutionId: selectedSolutionId,
            ...environmentForm,
            redundancy: mappedRedundancy,
          },
        },
      });
      setSuccessMessage(t('dataManagement.form.success'));
      setError(null);
      onDataUpdated();
    } catch (err: any) {
      const parsedError = parseGraphQLError(err);
      setError(parsedError);
    }
  };

  const handleCreateSolution = async () => {
    setError(null);
    
    // Validation avant soumission
    const validation = validateFormData(solutionForm, ['name', 'main_use_case', 'type', 'product_criticality']);
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
      // Préparer les données pour la mutation
      const inputData: any = {
        editorId,
        name: solutionForm.name,
        description: solutionForm.description || undefined,
        main_use_case: solutionForm.main_use_case,
        type: solutionForm.type,
        product_criticality: solutionForm.product_criticality,
        ip_ownership_clear: solutionForm.ip_ownership_clear,
      };

      // Ajouter les champs DD seulement s'ils ont des valeurs
      if (solutionForm.api_robustness) {
        inputData.api_robustness = solutionForm.api_robustness;
      }
      if (solutionForm.api_documentation_quality) {
        inputData.api_documentation_quality = solutionForm.api_documentation_quality;
      }
      if (solutionForm.licensing_model) {
        inputData.licensing_model = solutionForm.licensing_model;
      }
      if (solutionForm.license_compliance_assured) {
        inputData.license_compliance_assured = solutionForm.license_compliance_assured;
      }
      if (solutionForm.tech_stack && solutionForm.tech_stack.length > 0) {
        inputData.tech_stack = solutionForm.tech_stack;
      }

      await createSolution({
        variables: {
          input: inputData,
        },
      });
      alert(t('dataManagement.form.success'));
      setError(null);
      setIsCreatingSolution(false);
      setSolutionForm({
        name: '',
        description: '',
        main_use_case: '',
        type: 'SaaS',
        product_criticality: 'Medium',
        api_robustness: '',
        api_documentation_quality: '',
        ip_ownership_clear: '',
        licensing_model: '',
        license_compliance_assured: '',
        tech_stack: [],
      });
      onDataUpdated();
    } catch (err: any) {
      const parsedError = parseGraphQLError(err);
      setError(parsedError);
    }
  };

  const handleCreateEnvironment = async () => {
    setError(null);
    
    if (!selectedSolutionId) {
      setError({
        message: 'Aucune solution sélectionnée',
        reason: 'Vous devez sélectionner une solution avant de créer un environnement',
        suggestion: 'Veuillez sélectionner une solution dans la liste déroulante',
      });
      return;
    }

    // Validation avant soumission
    const validation = validateFormData(environmentForm, ['env_type', 'redundancy']);
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
      // Créer un hostingId temporaire (sera géré plus tard)
      const tempHostingId = `hosting-temp-${Date.now()}`;
      
      // Mapper la valeur de redondance : "geo-redundant" -> "geo_redundant"
      const mappedRedundancy = environmentForm.redundancy === 'geo-redundant' 
        ? 'geo_redundant' 
        : environmentForm.redundancy;
      
      await createEnvironment({
        variables: {
          input: {
            solutionId: selectedSolutionId,
            hostingId: tempHostingId,
            ...environmentForm,
            redundancy: mappedRedundancy,
            backup: {
              exists: false,
              rto_hours: 24,
              rpo_hours: 4,
              restoration_test_frequency: 'never',
            },
          },
        },
      });
      alert(t('dataManagement.form.success'));
      setError(null);
      setIsCreatingEnvironment(false);
      setEnvironmentForm({
        env_type: 'production',
        deployment_type: '',
        redundancy: 'none',
        tech_stack: [],
        data_types: [],
      });
      onDataUpdated();
    } catch (err: any) {
      const parsedError = parseGraphQLError(err);
      setError(parsedError);
    }
  };

  const handleArchiveSolution = async (solutionId: string, archived: boolean) => {
    setError(null);
    try {
      await archiveSolution({
        variables: {
          input: {
            id: solutionId,
            archived: !archived,
          },
        },
      });
      setSuccessMessage(t('dataManagement.form.success'));
      setError(null);
      onDataUpdated();
    } catch (err: any) {
      const parsedError = parseGraphQLError(err);
      setError(parsedError);
    }
  };

  const handleArchiveEnvironment = async (envId: string, archived: boolean) => {
    setError(null);
    try {
      await archiveEnvironment({
        variables: {
          input: {
            id: envId,
            archived: !archived,
          },
        },
        // Forcer le refetch pour s'assurer que les données sont à jour
        refetchQueries: [{ query: GET_EDITOR_WITH_DETAILS, variables: { editorId } }],
        awaitRefetchQueries: true,
      });
      setSuccessMessage(t('dataManagement.form.success'));
      setError(null);
      onDataUpdated();
    } catch (err: any) {
      const parsedError = parseGraphQLError(err);
      setError(parsedError);
    }
  };

  const solutions = editor?.solutions || [];
  const filteredSolutions = showArchived 
    ? solutions 
    : solutions.filter((s: any) => !(s.archived === true));

  // Trouver la solution sélectionnée pour accéder à codebase et developmentMetrics
  const selectedSolution = selectedSolutionId 
    ? solutions.find((s: any) => s.solutionId === selectedSolutionId)
    : null;

  return (
    <div className="space-y-6">
      {/* Bouton Cancel global */}
      <div className="flex justify-end">
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {t('dataManagement.form.cancel')}
        </button>
      </div>

      {/* Affichage des messages de succès */}
      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* Affichage des erreurs */}
      {error && (
        <ErrorMessage
          error={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Navigation par sections */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveSection('editor')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeSection === 'editor'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            📝 {t('dataManagement.form.editor')}
          </button>
          <button
            onClick={() => setActiveSection('solutions')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeSection === 'solutions'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            📦 {t('dataManagement.form.solutions')}
          </button>
          <button
            onClick={() => setActiveSection('environments')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeSection === 'environments'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            🌐 {t('dataManagement.form.environments')}
          </button>
        </div>
      </div>

      {/* Section Éditeur */}
      {activeSection === 'editor' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('dataManagement.form.editEditor')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel
                translationKey="dataManagement.form.name"
                required
                showFieldReference={showFieldReferences}
              />
              <input
                type="text"
                value={editorForm.name}
                onChange={(e) => setEditorForm({ ...editorForm, name: e.target.value })}
                className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", editorForm.name)}
                required
              />
            </div>
            <div>
              <FieldLabel
                translationKey="dataManagement.form.country"
                showFieldReference={showFieldReferences}
              />
              <input
                type="text"
                value={editorForm.country}
                onChange={(e) => setEditorForm({ ...editorForm, country: e.target.value })}
                className={getFieldClasses("w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", editorForm.country)}
              />
            </div>
            <div>
              <FieldLabel
                translationKey="dataManagement.form.size"
                showFieldReference={showFieldReferences}
              />
              <select
                value={editorForm.size}
                onChange={(e) => setEditorForm({ ...editorForm, size: e.target.value })}
                className={getFieldClasses("w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", editorForm.size)}
                disabled={lookupsLoading}
              >
                <option value="">{t('dataManagement.form.selectSize')}</option>
                {lookups.editorSize.length > 0 ? (
                  lookups.editorSize.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                  ))
                ) : (
                  <>
                    <option value="Micro">Micro</option>
                    <option value="SME">SME</option>
                    <option value="Mid">Mid</option>
                    <option value="Enterprise">Enterprise</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <FieldLabel
                translationKey="dataManagement.form.businessCriticality"
                required
                showFieldReference={showFieldReferences}
              />
              <select
                value={editorForm.business_criticality}
                onChange={(e) => setEditorForm({ ...editorForm, business_criticality: e.target.value })}
                className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", editorForm.business_criticality)}
                required
                disabled={lookupsLoading}
              >
                {lookups.businessCriticality.length > 0 ? (
                  lookups.businessCriticality.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                  ))
                ) : (
                  <>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Champs DD - Systèmes IT internes */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('dataManagement.editor.internalItSystems', 'Systèmes IT internes')}
            </h4>
            <div>
              <FieldLabel
                translationKey="dataManagement.editor.internalItSystemsList"
                showFieldReference={showFieldReferences}
              />
              <textarea
                value={(editorForm.internal_it_systems || []).join(', ')}
                onChange={(e) => {
                  const systems = e.target.value
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                  setEditorForm({ ...editorForm, internal_it_systems: systems });
                }}
                rows={3}
                className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", editorForm.internal_it_systems)}
                placeholder="ERP, CRM, Gestion RH, ..."
              />
              {editorForm.internal_it_systems.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {editorForm.internal_it_systems.map((system, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {system}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Champs DD - Stratégies de sécurité IT */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('dataManagement.editor.itSecurityStrategy', 'Stratégies de sécurité IT')}
            </h4>
            <div>
              <FieldLabel
                translationKey="dataManagement.editor.itSecurityStrategyDesc"
                showFieldReference={showFieldReferences}
              />
              <textarea
                value={(editorForm.it_security_strategy || []).join('\n')}
                onChange={(e) => {
                  const strategies = e.target.value
                    .split('\n')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                  setEditorForm({ ...editorForm, it_security_strategy: strategies });
                }}
                rows={5}
                className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", editorForm.it_security_strategy)}
                placeholder={t('dataManagement.editor.itSecurityStrategyPlaceholder', 'Entrez une stratégie par ligne...\nExemple:\nStratégie de gestion des accès\nStratégie de chiffrement\nStratégie de monitoring')}
              />
              {editorForm.it_security_strategy.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {editorForm.it_security_strategy.map((strategy, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      {strategy}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Champs DD - Contrats à examiner */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                {t('dataManagement.editor.contractsForReview', 'Contrats à examiner')}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setEditorForm({
                    ...editorForm,
                    contracts_for_review: [...editorForm.contracts_for_review, { type: '', summary: '' }],
                  });
                }}
                className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                + {t('dataManagement.editor.addContract', 'Ajouter un contrat')}
              </button>
            </div>
            {editorForm.contracts_for_review.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                {t('dataManagement.editor.noContracts', 'Aucun contrat à examiner')}
              </p>
            ) : (
              <div className="space-y-4">
                {editorForm.contracts_for_review.map((contract, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900/50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('dataManagement.editor.contract', 'Contrat')} #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newContracts = editorForm.contracts_for_review.filter((_, i) => i !== index);
                          setEditorForm({ ...editorForm, contracts_for_review: newContracts });
                        }}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                      >
                        {t('dataManagement.editor.removeContract', 'Supprimer')}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <FieldLabel
                          translationKey="dataManagement.editor.contractType"
                          required
                          showFieldReference={showFieldReferences}
                        />
                        <input
                          type="text"
                          value={contract.type}
                          onChange={(e) => {
                            const newContracts = [...editorForm.contracts_for_review];
                            newContracts[index] = { ...contract, type: e.target.value };
                            setEditorForm({ ...editorForm, contracts_for_review: newContracts });
                          }}
                          className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", contract.type)}
                          placeholder={t('dataManagement.editor.contractTypePlaceholder', 'Ex: Maintenance, Support, Licence...')}
                          required
                        />
                      </div>
                      <div>
                        <FieldLabel
                          translationKey="dataManagement.editor.contractSummary"
                          showFieldReference={showFieldReferences}
                        />
                        <textarea
                          value={contract.summary || ''}
                          onChange={(e) => {
                            const newContracts = [...editorForm.contracts_for_review];
                            newContracts[index] = { ...contract, summary: e.target.value };
                            setEditorForm({ ...editorForm, contracts_for_review: newContracts });
                          }}
                          rows={2}
                          className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", contract.summary)}
                          placeholder={t('dataManagement.editor.contractSummaryPlaceholder', 'Résumé du contrat...')}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t('dataManagement.form.cancel')}
            </button>
            <button
              onClick={handleUpdateEditor}
              disabled={updatingEditor || !editorForm.name}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatingEditor ? t('dataManagement.form.saving') : t('dataManagement.form.save')}
            </button>
          </div>
        </div>
      )}

      {/* Section Solutions */}
      {activeSection === 'solutions' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('dataManagement.form.manageSolutions')}
            </h3>
            <div className="flex gap-2">
              {isAdminOrSupervisor && (
                <button
                  onClick={() => setIsCreatingSolution(!isCreatingSolution)}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 dark:bg-green-500 rounded-md hover:bg-green-700 dark:hover:bg-green-600"
                >
                  {isCreatingSolution ? '✕' : '+'} {t('dataManagement.form.createNew')} {t('dataManagement.form.solutions')}
                </button>
              )}
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {showArchived ? t('dataManagement.form.hideArchived') : t('dataManagement.form.showArchived')}
              </button>
            </div>
          </div>
          
          {/* Formulaire de création */}
          {isCreatingSolution && isAdminOrSupervisor && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('dataManagement.form.createNew')} {t('dataManagement.form.solutions')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel
                    translationKey="dataManagement.form.name"
                    required
                    showFieldReference={showFieldReferences}
                  />
                  <input
                    type="text"
                    value={solutionForm.name}
                    onChange={(e) => setSolutionForm({ ...solutionForm, name: e.target.value })}
                    className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100", solutionForm.name)}
                    required
                  />
                </div>
                <div>
                  <FieldLabel
                    translationKey="dataManagement.form.mainUseCase"
                    required
                    showFieldReference={showFieldReferences}
                  />
                  <input
                    type="text"
                    value={solutionForm.main_use_case}
                    onChange={(e) => setSolutionForm({ ...solutionForm, main_use_case: e.target.value })}
                    className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100", solutionForm.main_use_case)}
                    required
                  />
                </div>
                <div>
                  <FieldLabel
                    translationKey="dataManagement.form.type"
                    showFieldReference={showFieldReferences}
                  />
                  <select
                    value={solutionForm.type}
                    onChange={(e) => setSolutionForm({ ...solutionForm, type: e.target.value })}
                    className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100", solutionForm.type)}
                    disabled={lookupsLoading}
                  >
                    {lookups.solutionTypes.length > 0 ? (
                      lookups.solutionTypes.map((opt) => (
                        <option key={opt.code} value={opt.code}>{opt.label}</option>
                      ))
                    ) : (
                      <>
                        <option value="SaaS">SaaS</option>
                        <option value="OnPrem">OnPrem</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="ClientHeavy">ClientHeavy</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <FieldLabel
                    translationKey="dataManagement.form.productCriticality"
                    showFieldReference={showFieldReferences}
                  />
                  <select
                    value={solutionForm.product_criticality}
                    onChange={(e) => setSolutionForm({ ...solutionForm, product_criticality: e.target.value })}
                    className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100", solutionForm.product_criticality)}
                    disabled={lookupsLoading}
                  >
                    {lookups.productCriticality.length > 0 ? (
                      lookups.productCriticality.map((opt) => (
                        <option key={opt.code} value={opt.code}>{opt.label}</option>
                      ))
                    ) : (
                      <>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <FieldLabel
                    translationKey="dataManagement.form.description"
                    showFieldReference={showFieldReferences}
                  />
                  <textarea
                    value={solutionForm.description}
                    onChange={(e) => setSolutionForm({ ...solutionForm, description: e.target.value })}
                    rows={3}
                    className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100", solutionForm.description)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setIsCreatingSolution(false);
                    setSolutionForm({
                      name: '',
                      description: '',
                      main_use_case: '',
                      type: 'SaaS',
                      product_criticality: 'Medium',
                      api_robustness: '',
                      api_documentation_quality: '',
                      ip_ownership_clear: false,
                      licensing_model: '',
                      license_compliance_assured: false,
                      tech_stack: [],
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateSolution}
                  disabled={creatingSolution || !solutionForm.name || !solutionForm.main_use_case}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 dark:bg-green-500 rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingSolution ? t('dataManagement.form.creating') : t('dataManagement.form.create')}
                </button>
              </div>
            </div>
          )}
          
          {/* Sélection de solution */}
          {filteredSolutions.length > 0 && (
            <div className="mb-4">
              <FieldLabel
                translationKey="dataManagement.form.selectSolution"
                showFieldReference={showFieldReferences}
                className="mb-2"
              />
              <select
                value={selectedSolutionId || ''}
                onChange={(e) => {
                  setSelectedSolutionId(e.target.value || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">{t('dataManagement.form.selectSolutionPlaceholder')}</option>
                {filteredSolutions.map((solution: any) => (
                  <option key={solution.solutionId} value={solution.solutionId}>
                    {solution.name} {solution.archived ? `(${t('dataManagement.form.archived')})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Liste des solutions avec actions d'archivage */}
          {filteredSolutions.length > 0 && (
            <div className="mt-4 space-y-2">
              {filteredSolutions.map((solution: any) => (
                <div
                  key={solution.solutionId}
                  className={`flex items-center justify-between p-3 border rounded-md ${
                    solution.archived
                      ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 opacity-75'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {solution.name}
                      </span>
                      {solution.archived && (
                        <span className="px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded">
                          {t('dataManagement.form.archived')}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {solution.type} - {solution.product_criticality}
                    </div>
                  </div>
                  {isAdminOrSupervisor && (
                    <button
                      onClick={() => handleArchiveSolution(solution.solutionId, solution.archived)}
                      disabled={archivingSolution}
                      className={`ml-4 px-3 py-1.5 text-sm font-medium rounded-md ${
                        solution.archived
                          ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {archivingSolution
                        ? t('dataManagement.form.archiving')
                        : solution.archived
                        ? t('dataManagement.form.unarchive')
                        : t('dataManagement.form.archive')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Formulaire solution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel
                translationKey="dataManagement.form.name"
                required
                showFieldReference={showFieldReferences}
              />
              <input
                type="text"
                value={solutionForm.name}
                onChange={(e) => setSolutionForm({ ...solutionForm, name: e.target.value })}
                className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", solutionForm.name)}
                required
              />
            </div>
            <div>
              <FieldLabel
                translationKey="dataManagement.form.mainUseCase"
                required
                showFieldReference={showFieldReferences}
              />
              <input
                type="text"
                value={solutionForm.main_use_case}
                onChange={(e) => setSolutionForm({ ...solutionForm, main_use_case: e.target.value })}
                className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", solutionForm.main_use_case)}
                required
              />
            </div>
            <div>
              <FieldLabel
                translationKey="dataManagement.form.type"
                required
                showFieldReference={showFieldReferences}
              />
              <select
                value={solutionForm.type}
                onChange={(e) => setSolutionForm({ ...solutionForm, type: e.target.value })}
                className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", solutionForm.type)}
                required
                disabled={lookupsLoading}
              >
                {lookups.solutionTypes.length > 0 ? (
                  lookups.solutionTypes.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                  ))
                ) : (
                  <>
                    <option value="SaaS">SaaS</option>
                    <option value="OnPrem">OnPrem</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="ClientHeavy">ClientHeavy</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <FieldLabel
                translationKey="dataManagement.form.productCriticality"
                required
                showFieldReference={showFieldReferences}
              />
              <select
                value={solutionForm.product_criticality}
                onChange={(e) => setSolutionForm({ ...solutionForm, product_criticality: e.target.value })}
                className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", solutionForm.product_criticality)}
                required
                disabled={lookupsLoading}
              >
                {lookups.productCriticality.length > 0 ? (
                  lookups.productCriticality.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                  ))
                ) : (
                  <>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </>
                )}
              </select>
            </div>
            <div className="md:col-span-2">
              <FieldLabel
                translationKey="dataManagement.form.description"
                showFieldReference={showFieldReferences}
              />
              <textarea
                value={solutionForm.description}
                onChange={(e) => setSolutionForm({ ...solutionForm, description: e.target.value })}
                rows={3}
                className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", solutionForm.description)}
              />
            </div>
          </div>

          {/* Champs DD - API & Documentation */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('dataManagement.solution.apiAndDocumentation', 'API & Documentation')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel
                  translationKey="dataManagement.solution.apiRobustness"
                  showFieldReference={showFieldReferences}
                />
                <textarea
                  value={solutionForm.api_robustness}
                  onChange={(e) => setSolutionForm({ ...solutionForm, api_robustness: e.target.value })}
                  rows={3}
                  className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", solutionForm.api_robustness)}
                  placeholder={t('dataManagement.solution.apiRobustnessPlaceholder', 'Décrivez la robustesse des APIs et les possibilités d\'intégration...')}
                />
              </div>
              <div>
                <FieldLabel
                  translationKey="dataManagement.solution.apiDocumentationQuality"
                  showFieldReference={showFieldReferences}
                />
                <select
                  value={solutionForm.api_documentation_quality}
                  onChange={(e) => setSolutionForm({ ...solutionForm, api_documentation_quality: e.target.value })}
                  className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", solutionForm.api_documentation_quality)}
                  disabled={lookupsLoading}
                >
                  <option value="">{t('dataManagement.form.select', 'Sélectionner...')}</option>
                  {lookups.apiDocumentationQuality.length > 0 ? (
                    lookups.apiDocumentationQuality.map((opt) => (
                      <option key={opt.code} value={opt.code}>{opt.label}</option>
                    ))
                  ) : (
                    <>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                      <option value="None">None</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Champs DD - Propriété intellectuelle & Licences */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('dataManagement.solution.ipAndLicensing', 'Propriété intellectuelle & Licences')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel
                  translationKey="dataManagement.solution.ipOwnershipClear"
                  required
                  showFieldReference={showFieldReferences}
                />
                <select
                  value={solutionForm.ip_ownership_clear}
                  onChange={(e) => setSolutionForm({ ...solutionForm, ip_ownership_clear: e.target.value })}
                  className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", solutionForm.ip_ownership_clear)}
                  required
                  disabled={lookupsLoading}
                >
                  <option value="">{t('dataManagement.form.select', 'Sélectionner...')}</option>
                  {lookups.ipOwnershipClear.length > 0 ? (
                    lookups.ipOwnershipClear.map((opt) => (
                      <option key={opt.code} value={opt.code}>{opt.label}</option>
                    ))
                  ) : (
                    <>
                      <option value="Yes">{t('dataManagement.form.yes', 'Oui')}</option>
                      <option value="No">{t('dataManagement.form.no', 'Non')}</option>
                      <option value="TBD">TBD</option>
                      <option value="N/A">N/A</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <FieldLabel
                  translationKey="dataManagement.solution.licenseComplianceAssured"
                  showFieldReference={showFieldReferences}
                />
                <select
                  value={solutionForm.license_compliance_assured}
                  onChange={(e) => setSolutionForm({ ...solutionForm, license_compliance_assured: e.target.value })}
                  className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", solutionForm.license_compliance_assured)}
                  disabled={lookupsLoading}
                >
                  <option value="">{t('dataManagement.form.select', 'Sélectionner...')}</option>
                  {lookups.licenseComplianceAssured.length > 0 ? (
                    lookups.licenseComplianceAssured.map((opt) => (
                      <option key={opt.code} value={opt.code}>{opt.label}</option>
                    ))
                  ) : (
                    <>
                      <option value="Yes">{t('dataManagement.form.yes', 'Oui')}</option>
                      <option value="No">{t('dataManagement.form.no', 'Non')}</option>
                      <option value="TBD">TBD</option>
                      <option value="N/A">N/A</option>
                    </>
                  )}
                </select>
              </div>
              <div className="md:col-span-2">
                <FieldLabel
                  translationKey="dataManagement.solution.licensingModel"
                  showFieldReference={showFieldReferences}
                />
                <textarea
                  value={solutionForm.licensing_model}
                  onChange={(e) => setSolutionForm({ ...solutionForm, licensing_model: e.target.value })}
                  rows={3}
                  className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", solutionForm.licensing_model)}
                  placeholder={t('dataManagement.solution.licensingModelPlaceholder', 'Décrivez les modèles de licence utilisés...')}
                />
              </div>
            </div>
          </div>

          {/* Champs DD - Stack technique logicielle */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('dataManagement.solution.techStack', 'Stack technique logicielle')}
            </h4>
            <div>
              <FieldLabel
                translationKey="dataManagement.solution.techStack"
                showFieldReference={showFieldReferences}
              />
              <textarea
                value={(solutionForm.tech_stack || []).join('\n')}
                onChange={(e) => {
                  const stack = e.target.value
                    .split('\n')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                  setSolutionForm({ ...solutionForm, tech_stack: stack });
                }}
                rows={5}
                className={getFieldClasses("w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100", solutionForm.tech_stack)}
                placeholder={t('dataManagement.solution.techStackPlaceholder', 'Entrez une technologie par ligne...\nExemple:\nNode.js\nPostgreSQL\nReact\nDocker\nMongoDB')}
              />
              {(solutionForm.tech_stack || []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {(solutionForm.tech_stack || []).map((tech, index) => (
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
          </div>

          {/* Section CodeBase */}
          {selectedSolutionId && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              <CodeBaseSection
                codebase={selectedSolution?.codebase || null}
                solutionId={selectedSolutionId}
                editorId={editorId}
                showFieldReferences={showFieldReferences}
                onDataUpdated={onDataUpdated}
                onSuccess={(message) => setSuccessMessage(message)}
              />
            </div>
          )}

          {/* Section DevelopmentMetrics */}
          {selectedSolutionId && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              <DevelopmentMetricsSection
                developmentMetrics={selectedSolution?.developmentMetrics || null}
                solutionId={selectedSolutionId}
                editorId={editorId}
                showFieldReferences={showFieldReferences}
                onDataUpdated={onDataUpdated}
                onSuccess={(message) => setSuccessMessage(message)}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t('dataManagement.form.cancel')}
            </button>
            <button
              onClick={handleUpdateSolution}
              disabled={updatingSolution || !selectedSolutionId || !solutionForm.name}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatingSolution ? t('dataManagement.form.saving') : t('dataManagement.form.save')}
            </button>
          </div>
        </div>
      )}

      {/* Section Environnements */}
      {activeSection === 'environments' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('dataManagement.form.manageEnvironments')}
            </h3>
            <div className="flex gap-2">
              {isAdminOrSupervisor && selectedSolutionId && (
                <button
                  onClick={() => setIsCreatingEnvironment(!isCreatingEnvironment)}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 dark:bg-green-500 rounded-md hover:bg-green-700 dark:hover:bg-green-600"
                >
                  {isCreatingEnvironment ? '✕' : '+'} {t('dataManagement.form.createNew')} {t('dataManagement.form.environments')}
                </button>
              )}
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {showArchived ? t('dataManagement.form.hideArchived') : t('dataManagement.form.showArchived')}
              </button>
            </div>
          </div>
          
          {/* Formulaire de création */}
          {isCreatingEnvironment && isAdminOrSupervisor && selectedSolutionId && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('dataManagement.form.createNew')} {t('dataManagement.form.environments')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel
                    translationKey="dataManagement.environment.envType"
                    required
                    showFieldReference={showFieldReferences}
                  />
                  <select
                    value={environmentForm.env_type}
                    onChange={(e) => setEnvironmentForm({ ...environmentForm, env_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                    required
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
                    value={environmentForm.redundancy}
                    onChange={(e) => setEnvironmentForm({ ...environmentForm, redundancy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                    required
                  >
                    <option value="none">None</option>
                    <option value="minimal">Minimal</option>
                    <option value="geo-redundant">Geo-redundant</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <FieldLabel
                    translationKey="dataManagement.environment.deploymentType"
                    showFieldReference={showFieldReferences}
                  />
                  <select
                    value={environmentForm.deployment_type}
                    onChange={(e) => setEnvironmentForm({ ...environmentForm, deployment_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">-</option>
                    <option value="monolith">Monolith</option>
                    <option value="microservices">Microservices</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setIsCreatingEnvironment(false);
                    setEnvironmentForm({
                      env_type: 'production',
                      deployment_type: '',
                      redundancy: 'none',
                      tech_stack: [],
                      data_types: [],
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateEnvironment}
                  disabled={creatingEnvironment || !environmentForm.env_type || !environmentForm.redundancy}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 dark:bg-green-500 rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingEnvironment ? t('dataManagement.form.creating') : t('dataManagement.form.create')}
                </button>
              </div>
            </div>
          )}
          
          {/* Sélection de solution et environnement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <FieldLabel
                translationKey="dataManagement.form.selectSolution"
                required
                showFieldReference={showFieldReferences}
                className="mb-2"
              />
              <select
                value={selectedSolutionId || ''}
                onChange={(e) => {
                  setSelectedSolutionId(e.target.value);
                  setSelectedEnvId(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">{t('dataManagement.form.selectSolutionPlaceholder')}</option>
                {solutions.map((solution: any) => (
                  <option key={solution.solutionId} value={solution.solutionId}>
                    {solution.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedSolutionId && (
              <div>
                <FieldLabel
                  translationKey="dataManagement.form.selectEnvironment"
                  showFieldReference={showFieldReferences}
                  className="mb-2"
                />
                <select
                  value={selectedEnvId || ''}
                  onChange={(e) => {
                    setSelectedEnvId(e.target.value || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">{t('dataManagement.form.selectEnvironmentPlaceholder')}</option>
                  {(showArchived
                    ? solutions.find((s: any) => s.solutionId === selectedSolutionId)?.environments || []
                    : solutions.find((s: any) => s.solutionId === selectedSolutionId)?.environments?.filter((e: any) => !(e.archived === true)) || []
                  ).map((env: any) => (
                    <option key={env.envId} value={env.envId}>
                      {env.env_type} - {env.envId} {env.archived ? `(${t('dataManagement.form.archived')})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {/* Liste des environnements avec actions d'archivage */}
          {selectedSolutionId && (
            <div className="mt-4 space-y-2">
              {(showArchived
                ? solutions.find((s: any) => s.solutionId === selectedSolutionId)?.environments || []
                : solutions.find((s: any) => s.solutionId === selectedSolutionId)?.environments?.filter((e: any) => !(e.archived === true)) || []
              ).map((env: any) => (
                <div
                  key={env.envId}
                  onClick={() => setSelectedEnvId(env.envId)}
                  className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedEnvId === env.envId
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : env.archived
                      ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 opacity-75'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {env.env_type} - {env.envId}
                      </span>
                      {env.archived && (
                        <span className="px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded">
                          {t('dataManagement.form.archived')}
                        </span>
                      )}
                      {selectedEnvId === env.envId && (
                        <span className="px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded">
                          {t('dataManagement.form.selected', 'Sélectionné')}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {env.deployment_type || '-'} - {env.redundancy}
                    </div>
                  </div>
                  {isAdminOrSupervisor && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveEnvironment(env.envId, env.archived);
                      }}
                      disabled={archivingEnvironment}
                      className={`ml-4 px-3 py-1.5 text-sm font-medium rounded-md ${
                        env.archived
                          ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {archivingEnvironment
                        ? t('dataManagement.form.archiving')
                        : env.archived
                        ? t('dataManagement.form.unarchive')
                        : t('dataManagement.form.archive')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Formulaire environnement enrichi avec toutes les entités liées */}
          {selectedSolutionId && selectedEnvId && (
            (() => {
              const solution = solutions.find((s: any) => s.solutionId === selectedSolutionId);
              const environment = solution?.environments?.find((envItem: any) => envItem.envId === selectedEnvId);
              
              if (!environment) {
                return (
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      Environnement non trouvé
                    </p>
                  </div>
                );
              }

              return (
                <EnvironmentFullDetails
                  environment={environment}
                  solutionId={selectedSolutionId}
                  editorId={editorId}
                  showFieldReferences={showFieldReferences}
                  onDataUpdated={onDataUpdated}
                  onSuccess={(message) => setSuccessMessage(message)}
                />
              );
            })()
          )}

          {/* Message si aucun environnement sélectionné */}
          {selectedSolutionId && !selectedEnvId && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {t('dataManagement.form.selectEnvironment')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Message si aucune solution */}
      {activeSection === 'environments' && solutions.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {t('dataManagement.form.noSolutions')}
          </p>
        </div>
      )}
    </div>
  );
};

export default DataManagementForm;

