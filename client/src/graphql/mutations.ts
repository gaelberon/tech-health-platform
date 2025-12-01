// Fichier : /client/src/graphql/mutations.ts

import { gql } from '@apollo/client';

// NOTE : Cette mutation est une structure simplifiée pour l'MVS P1,
// elle combine la création ou la mise à jour des entités Editor, Solution, Hosting, et Environment.

export const CREATE_SOLUTION_ENVIRONMENT_P1 = gql`
  mutation CreateSolutionEnvironmentP1(
    $editorInput: EditorInputP1!
    $solutionInput: SolutionInputP1!
    $hostingInput: HostingInputP1!
    $environmentInput: EnvironmentInputP1!
    $securityInput: SecurityInputP1!
  ) {
    submitP1Data(
      editor: $editorInput
      solution: $solutionInput
      hosting: $hostingInput
      environment: $environmentInput
      security: $securityInput
    ) {
      solution {
        solutionId
        name
        type
        product_criticality
      }
      editor {
        editorId
        name
        business_criticality
      }
      environment {
        envId
        env_type
        redundancy
      }
      hosting {
        hostingId
        provider
        region
      }
      securityProfile {
        secId
        auth
      }
      scoringSnapshot {
        scoreId
        global_score
        risk_level
        date
      }
    }
  }
`;

// Mutations pour la gestion des brouillons
export const SAVE_COLLECTOR_DRAFT = gql`
  mutation SaveCollectorDraft($input: SaveCollectorDraftInput!) {
    saveCollectorDraft(input: $input) {
      draftId
      userId
      status
      step
      formData
      errorMessage
      lastSavedAt
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_COLLECTOR_DRAFT = gql`
  mutation DeleteCollectorDraft($draftId: ID!) {
    deleteCollectorDraft(draftId: $draftId)
  }
`;

// Note : Les interfaces TypeScript (EditorInputP1, etc.) sont définies dans /common/types.
// Le backend doit utiliser les types partagés pour définir ces Inputs.