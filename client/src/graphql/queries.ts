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


