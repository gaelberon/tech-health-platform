/**
 * Hook réutilisable pour charger les lookups dynamiquement
 * Utilise le cache Apollo pour éviter les requêtes multiples
 */

import { useQuery, gql } from '@apollo/client';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

// Query pour charger plusieurs lookups en une seule requête
export const GET_LOOKUPS_BATCH = gql`
  query GetLookupsBatch($lang: String!) {
    businessCriticality: getLookups(keys: ["BUSINESS_CRITICALITY"], lang: $lang) {
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
    solutionTypes: getLookups(keys: ["SOLUTION_TYPES"], lang: $lang) {
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
    # PRODUCT_CRITICALITY utilise les mêmes valeurs que BUSINESS_CRITICALITY
    productCriticality: getLookups(keys: ["BUSINESS_CRITICALITY"], lang: $lang) {
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
    # EDITOR_SIZE n'existe pas encore, on utilise un fallback vide
    editorSize: getLookups(keys: ["EDITOR_SIZE"], lang: $lang) {
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
    dataTypes: getLookups(keys: ["DATA_TYPES"], lang: $lang) {
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
    environmentTypes: getLookups(keys: ["ENVIRONMENT_TYPES"], lang: $lang) {
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
    redundancyLevels: getLookups(keys: ["REDUNDANCY_LEVELS"], lang: $lang) {
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
    deploymentTypes: getLookups(keys: ["DEPLOYMENT_TYPES"], lang: $lang) {
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
    virtualizationTypes: getLookups(keys: ["VIRTUALIZATION_TYPES"], lang: $lang) {
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
    # DISASTER_RECOVERY_PLAN n'existe pas encore, on utilise un fallback vide
    disasterRecoveryPlan: getLookups(keys: ["DISASTER_RECOVERY_PLAN"], lang: $lang) {
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
    # RESTORATION_TEST_FREQUENCY n'existe pas encore, on utilise un fallback vide
    restorationTestFrequency: getLookups(keys: ["RESTORATION_TEST_FREQUENCY"], lang: $lang) {
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
    authTypes: getLookups(keys: ["AUTH_TYPES"], lang: $lang) {
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
    # PATCHING_TYPES n'existe pas encore, on utilise un fallback vide
    patchingTypes: getLookups(keys: ["PATCHING_TYPES"], lang: $lang) {
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
    # PENTEST_FREQ n'existe pas encore, on utilise un fallback vide
    pentestFreq: getLookups(keys: ["PENTEST_FREQ"], lang: $lang) {
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
    # VULN_MGMT n'existe pas encore, on utilise un fallback vide
    vulnMgmt: getLookups(keys: ["VULN_MGMT"], lang: $lang) {
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
    hostingTiers: getLookups(keys: ["HOSTING_TIERS"], lang: $lang) {
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
    monitoringStatus: getLookups(keys: ["MONITORING_STATUS"], lang: $lang) {
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
    apiDocumentationQuality: getLookups(keys: ["API_DOCUMENTATION_QUALITY"], lang: $lang) {
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
    # Outils de monitoring
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
    ipOwnershipClear: getLookups(keys: ["IP_OWNERSHIP_CLEAR"], lang: $lang) {
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
    licenseComplianceAssured: getLookups(keys: ["LICENSE_COMPLIANCE_ASSURED"], lang: $lang) {
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
    devopsAutomationLevel: getLookups(keys: ["DEVOPS_AUTOMATION_LEVEL"], lang: $lang) {
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
    sdlcProcess: getLookups(keys: ["SDLC_PROCESS"], lang: $lang) {
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
    documentationLevel: getLookups(keys: ["DOCUMENTATION_LEVEL"], lang: $lang) {
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
    backupSchedule: getLookups(keys: ["BACKUP_SCHEDULE"], lang: $lang) {
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

/**
 * Extrait les valeurs d'un lookup et retourne un tableau d'objets {code, label}
 */
function extractLookupValues(lookupArray: any[], lang: string = 'fr'): Array<{ code: string; label: string }> {
  if (!lookupArray || lookupArray.length === 0) return [];
  
  const values = lookupArray[0]?.values || [];
  return values
    .filter((v: any) => v.active !== false)
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    .map((v: any) => {
      // Utiliser le label localisé si disponible
      let label = v.label || v.code;
      if (lang === 'fr' && v.label_fr) label = v.label_fr;
      if (lang === 'en' && v.label_en) label = v.label_en;
      
      return {
        code: v.code,
        label: label
      };
    });
}

/**
 * Hook pour charger tous les lookups nécessaires aux formulaires de Data Management
 */
export function useLookups() {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'fr';

  const { data, loading, error, refetch } = useQuery(GET_LOOKUPS_BATCH, {
    variables: { lang },
    fetchPolicy: 'cache-and-network', // Utiliser le cache mais aussi vérifier les mises à jour
    notifyOnNetworkStatusChange: true, // Notifier lors des changements de statut réseau
  });

  const lookups = useMemo(() => {
    // Toujours retourner un objet avec des tableaux vides par défaut
    const defaultLookups = {
      businessCriticality: [] as Array<{ code: string; label: string }>,
      solutionTypes: [] as Array<{ code: string; label: string }>,
      productCriticality: [] as Array<{ code: string; label: string }>,
      editorSize: [] as Array<{ code: string; label: string }>,
      dataTypes: [] as Array<{ code: string; label: string }>,
      environmentTypes: [] as Array<{ code: string; label: string }>,
      redundancyLevels: [] as Array<{ code: string; label: string }>,
      deploymentTypes: [] as Array<{ code: string; label: string }>,
      virtualizationTypes: [] as Array<{ code: string; label: string }>,
      disasterRecoveryPlan: [] as Array<{ code: string; label: string }>,
      restorationTestFrequency: [] as Array<{ code: string; label: string }>,
      authTypes: [] as Array<{ code: string; label: string }>,
      patchingTypes: [] as Array<{ code: string; label: string }>,
      pentestFreq: [] as Array<{ code: string; label: string }>,
      vulnMgmt: [] as Array<{ code: string; label: string }>,
      hostingTiers: [] as Array<{ code: string; label: string }>,
      monitoringStatus: [] as Array<{ code: string; label: string }>,
      apiDocumentationQuality: [] as Array<{ code: string; label: string }>,
      monitoringTools: [] as Array<{ code: string; label: string }>,
      ipOwnershipClear: [] as Array<{ code: string; label: string }>,
      licenseComplianceAssured: [] as Array<{ code: string; label: string }>,
      devopsAutomationLevel: [] as Array<{ code: string; label: string }>,
      sdlcProcess: [] as Array<{ code: string; label: string }>,
      documentationLevel: [] as Array<{ code: string; label: string }>,
      backupSchedule: [] as Array<{ code: string; label: string }>,
    };

    if (!data) return defaultLookups;

    return {
      businessCriticality: extractLookupValues(data.businessCriticality || [], lang),
      solutionTypes: extractLookupValues(data.solutionTypes || [], lang),
      productCriticality: extractLookupValues(data.productCriticality || [], lang),
      editorSize: extractLookupValues(data.editorSize || [], lang),
      dataTypes: extractLookupValues(data.dataTypes || [], lang),
      environmentTypes: extractLookupValues(data.environmentTypes || [], lang),
      redundancyLevels: extractLookupValues(data.redundancyLevels || [], lang),
      deploymentTypes: extractLookupValues(data.deploymentTypes || [], lang),
      virtualizationTypes: extractLookupValues(data.virtualizationTypes || [], lang),
      disasterRecoveryPlan: extractLookupValues(data.disasterRecoveryPlan || [], lang),
      restorationTestFrequency: extractLookupValues(data.restorationTestFrequency || [], lang),
      authTypes: extractLookupValues(data.authTypes || [], lang),
      patchingTypes: extractLookupValues(data.patchingTypes || [], lang),
      pentestFreq: extractLookupValues(data.pentestFreq || [], lang),
      vulnMgmt: extractLookupValues(data.vulnMgmt || [], lang),
      hostingTiers: extractLookupValues(data.hostingTiers || [], lang),
      monitoringStatus: extractLookupValues(data.monitoringStatus || [], lang),
      apiDocumentationQuality: extractLookupValues(data.apiDocumentationQuality || [], lang),
      monitoringTools: extractLookupValues(data.monitoringTools || [], lang),
      ipOwnershipClear: extractLookupValues(data.ipOwnershipClear || [], lang),
      licenseComplianceAssured: extractLookupValues(data.licenseComplianceAssured || [], lang),
      devopsAutomationLevel: extractLookupValues(data.devopsAutomationLevel || [], lang),
      sdlcProcess: extractLookupValues(data.sdlcProcess || [], lang),
      documentationLevel: extractLookupValues(data.documentationLevel || [], lang),
      backupSchedule: extractLookupValues(data.backupSchedule || [], lang),
    };
  }, [data, lang]);

  return {
    lookups,
    loading,
    error,
    refetch, // Exposer refetch pour permettre un rechargement manuel
  };
}

