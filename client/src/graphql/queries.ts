// Fichier : /client/src/graphql/queries.ts

import { gql } from '@apollo/client';

// Query pour récupérer les lookups P1 nécessaires au CollectorStepper
export const GET_P1_LOOKUPS = gql`
  query GetP1Lookups {
    businessCriticality: getLookups(keys: ["BUSINESS_CRITICALITY"]) {
      key
      values {
        code
        label
        description
        order
        active
      }
    }
    solutionTypes: getLookups(keys: ["SOLUTION_TYPES"]) {
      key
      values {
        code
        label
        description
        order
        active
      }
    }
    dataTypes: getLookups(keys: ["DATA_TYPES"]) {
      key
      values {
        code
        label
        description
        order
        active
      }
    }
    redundancyLevels: getLookups(keys: ["REDUNDANCY_LEVELS"]) {
      key
      values {
        code
        label
        description
        order
        active
      }
    }
    authTypes: getLookups(keys: ["AUTH_TYPES"]) {
      key
      values {
        code
        label
        description
        order
        active
      }
    }
  }
`;

// Query pour récupérer les éditeurs accessibles selon le rôle de l'utilisateur
export const LIST_EDITORS_FOR_USER = gql`
  query ListEditorsForUser {
    listEditorsForUser {
      editorId
      name
      country
      size
      business_criticality
      solutions {
        solutionId
        name
        type
      }
    }
  }
`;

// Query pour récupérer une solution avec tous ses environnements et données d'hébergement
export const GET_SOLUTION_HOSTING_VIEW = gql`
  query GetSolutionHostingView($solutionId: ID!) {
    getSolution(solutionId: $solutionId) {
      solutionId
      name
      type
      environments {
        envId
        env_type
        hostingId
        deployment_type
        virtualization
        tech_stack
        data_types
        redundancy
        backup {
          exists
          schedule
          rto_hours
          rpo_hours
          restoration_test_frequency
        }
        disaster_recovery_plan
        db_scaling_mechanism
        network_security_mechanisms
        sla_offered
        hosting {
          hostingId
          provider
          region
          tier
          certifications
          contact {
            name
            email
          }
        }
        securityProfile {
          secId
          auth
          encryption {
            in_transit
            at_rest
          }
          patching
          pentest_freq
          vuln_mgmt
        }
        monitoringObservability {
          monId
          perf_monitoring
          log_centralization
          tools
        }
        costs {
          costId
          hosting_monthly
          licenses_monthly
          ops_hours_monthly_equiv
          comments
        }
      }
    }
  }
`;


