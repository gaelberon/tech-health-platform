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
    $collectionType: String!
  ) {
    submitP1Data(
      editor: $editorInput
      solution: $solutionInput
      hosting: $hostingInput
      environment: $environmentInput
      security: $securityInput
      collection_type: $collectionType
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
        collection_type
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

// Mutations pour la gestion des données (Data Management)
export const UPDATE_EDITOR = gql`
  mutation UpdateEditor($input: UpdateEditorInput!) {
    updateEditor(input: $input) {
      editorId
      name
      country
      size
      business_criticality
      internal_it_systems
      it_security_strategy
    }
  }
`;

export const UPDATE_SOLUTION = gql`
  mutation UpdateSolution($input: UpdateSolutionInput!) {
    updateSolution(input: $input) {
      solutionId
      name
      description
      main_use_case
      type
      product_criticality
    }
  }
`;

export const UPDATE_ENVIRONMENT = gql`
  mutation UpdateEnvironment($input: UpdateEnvironmentInput!) {
    updateEnvironment(input: $input) {
      envId
      env_type
      deployment_type
      redundancy
    }
  }
`;

export const UPDATE_HOSTING = gql`
  mutation UpdateHosting($input: UpdateHostingInput!) {
    updateHostingProfile(input: $input) {
      hostingId
      provider
      region
      tier
      certifications
    }
  }
`;

export const UPDATE_SECURITY_PROFILE = gql`
  mutation UpdateSecurityProfile($input: UpdateSecurityProfileInput!) {
    updateSecurityProfile(input: $input) {
      secId
      auth
      patching
      pentest_freq
    }
  }
`;

export const UPDATE_ENTITY_COST = gql`
  mutation UpdateEntityCost($input: UpdateEntityCostInput!) {
    updateEntityCost(input: $input) {
      costId
      hosting_monthly
      licenses_monthly
      ops_hours_monthly_equiv
    }
  }
`;

export const UPDATE_MONITORING = gql`
  mutation UpdateMonitoring($input: UpdateMonitoringObservabilityInput!) {
    updateMonitoringObservability(input: $input) {
      monId
      envId
      perf_monitoring
      log_centralization
      tools
      alerting_strategy
    }
  }
`;

export const UPDATE_CODEBASE = gql`
  mutation UpdateCodebase($input: UpdateCodebaseInput!) {
    updateCodebase(input: $input) {
      codebaseId
      repo_location
      documentation_level
      code_review_process
      version_control_tool
      technical_debt_known
      legacy_systems
      third_party_dependencies
    }
  }
`;

export const UPDATE_DEVELOPMENT_METRICS = gql`
  mutation UpdateDevelopmentMetrics($input: UpdateDevelopmentMetricsInput!) {
    updateDevelopmentMetrics(input: $input) {
      metricsId
      sdlc_process
      devops_automation_level
      planned_vs_unplanned_ratio
      lead_time_for_changes_days
      mttr_hours
      internal_vs_external_bug_ratio
    }
  }
`;

// Mutations pour créer des solutions et environnements (Data Management)
export const CREATE_SOLUTION = gql`
  mutation CreateSolution($input: CreateSolutionInput!) {
    createSolution(input: $input) {
      solutionId
      name
      description
      main_use_case
      type
      product_criticality
      api_robustness
      api_documentation_quality
      ip_ownership_clear
      licensing_model
      license_compliance_assured
      tech_stack
      archived
    }
  }
`;

export const CREATE_ENVIRONMENT = gql`
  mutation CreateEnvironment($input: CreateEnvironmentInput!) {
    createEnvironment(input: $input) {
      envId
      env_type
      deployment_type
      redundancy
      archived
    }
  }
`;

// Mutations pour archiver/désarchiver (Data Management)
export const ARCHIVE_SOLUTION = gql`
  mutation ArchiveSolution($input: ArchiveInput!) {
    archiveSolution(input: $input) {
      solutionId
      name
      archived
      archivedAt
      archivedBy
    }
  }
`;

export const ARCHIVE_ENVIRONMENT = gql`
  mutation ArchiveEnvironment($input: ArchiveInput!) {
    archiveEnvironment(input: $input) {
      envId
      env_type
      archived
      archivedAt
      archivedBy
    }
  }
`;

// Note : Les interfaces TypeScript (EditorInputP1, etc.) sont définies dans /common/types.
// Le backend doit utiliser les types partagés pour définir ces Inputs.