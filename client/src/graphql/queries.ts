// Fichier : /client/src/graphql/queries.ts

import { gql } from '@apollo/client';

// Query pour récupérer le nom de l'entreprise
export const GET_COMPANY_NAME = gql`
  query GetCompanyName {
    companyName: getSetting(key: "company_name")
  }
`;

// Query pour récupérer les lookups P1 et DD nécessaires au CollectorStepper
export const GET_P1_LOOKUPS = gql`
  query GetP1Lookups($lang: String!) {
    businessCriticality: getLookups(keys: ["BUSINESS_CRITICALITY"], lang: $lang) {
      key
      values {
        code
        label
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
        description
        order
        active
      }
    }
    # Lookups DD (Due Diligence)
    environmentTypes: getLookups(keys: ["ENVIRONMENT_TYPES"], lang: $lang) {
      key
      values {
        code
        label
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
        description
        order
        active
      }
    }
    scalingMechanisms: getLookups(keys: ["SCALING_MECHANISMS"], lang: $lang) {
      key
      values {
        code
        label
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
        description
        order
        active
      }
    }
    monitoringTools: getLookups(keys: ["MONITORING_TOOLS"], lang: $lang) {
      key
      values {
        code
        label
        description
        order
        active
      }
    }
    complianceTypes: getLookups(keys: ["COMPLIANCE_TYPES"], lang: $lang) {
      key
      values {
        code
        label
        description
        order
        active
      }
    }
    securityMechanisms: getLookups(keys: ["SECURITY_MECHANISMS"], lang: $lang) {
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
        scoringSnapshots {
          scoreId
          date
          global_score
          risk_level
          scores {
            security
            resilience
            observability
            architecture
            compliance
          }
          calculationDetails {
            globalScore
            riskLevel
            categories {
              category
              weight
              rawScore
              maxRawScore
              percentage
              contribution
              components {
                name
                value
                max
                reason
              }
            }
          }
          calculationReport
        }
      }
    }
  }
`;

// Queries pour les brouillons de collecte
export const LIST_COLLECTOR_DRAFTS = gql`
  query ListCollectorDrafts($status: String) {
    listCollectorDrafts(status: $status) {
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

export const GET_COLLECTOR_DRAFT = gql`
  query GetCollectorDraft($draftId: ID!) {
    getCollectorDraft(draftId: $draftId) {
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

// Query pour récupérer toutes les données DD Tech d'une solution (vue complète Due Diligence)
export const GET_SOLUTION_DD_TECH_VIEW = gql`
  query GetSolutionDDTechView($solutionId: ID!) {
    solution: getSolution(solutionId: $solutionId) {
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
      codebase {
        codebaseId
        repo_location
        documentation_level
        code_review_process
        version_control_tool
        technical_debt_known
        legacy_systems
        third_party_dependencies
      }
      developmentMetrics {
        metricsId
        sdlc_process
        devops_automation_level
        planned_vs_unplanned_ratio
        lead_time_for_changes_days
        mttr_hours
        internal_vs_external_bug_ratio
      }
      aiFeatures {
        aiId
        technical_type
        quality_validation_method
        continuous_improvement
      }
      roadmapItems {
        roadmapId
        title
        type
        target_date
        status
        impact_estimate
        linkedTo
      }
      scoringSnapshots {
        scoreId
        date
        global_score
        risk_level
        scores {
          security
          resilience
          observability
          architecture
          compliance
        }
        calculationDetails {
          globalScore
          riskLevel
          categories {
            category
            weight
            rawScore
            maxRawScore
            percentage
            contribution
            components {
              name
              value
              max
              reason
            }
          }
          calculationReport
        }
      }
      environments {
        envId
        env_type
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
        network_security_mechanisms
        db_scaling_mechanism
        disaster_recovery_plan
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
            details
          }
          patching
          pentest_freq
          vuln_mgmt
          access_control
          internal_audits_recent
          centralized_monitoring
          pentest_results_summary
          known_security_flaws
          incident_reporting_process
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
          hidden_costs
          cost_evolution_factors
          modernization_investment_needs
        }
        roadmapItems {
          roadmapId
          title
          type
          target_date
          status
          impact_estimate
        }
      }
    }
  }
`;

// Query pour récupérer un éditeur avec ses données DD
export const GET_EDITOR_DD_TECH_VIEW = gql`
  query GetEditorDDTechView($editorId: ID!) {
    editor: getEditor(editorId: $editorId) {
      editorId
      name
      country
      size
      business_criticality
      it_security_strategy
      contracts_for_review {
        type
        summary
      }
      assets {
        assetId
        name
        category
        type
        description
        operational_purpose
        information_owner
        custodian
        confidentiality_level
        integrity_level
        availability_level
        criticality_status
        mtd_hours
        rpo_mtdl_hours
        approval_status
        encryption_status
        physical_location
        version_firmware
        sbom_reference
        end_of_life_date
        last_inventory_date
        disposal_method
        ownership
        acceptable_use
        return_policy
        archived
        archivedAt
        archivedBy
      }
      developmentTeam {
        teamId
        team_size_adequate
        key_person_dependency
      }
    }
  }
`;

// Query pour récupérer un éditeur avec toutes ses données (solutions, environnements, coûts, etc.)
export const GET_EDITOR_WITH_DETAILS = gql`
  query GetEditorWithDetails($editorId: ID!) {
    getEditor(editorId: $editorId) {
      editorId
      name
      country
      size
      business_criticality
      it_security_strategy
      contracts_for_review {
        type
        summary
      }
      information_security_policy
      information_security_roles
      information_security_in_projects
      external_it_service_provider_responsibilities
      external_it_service_evaluation
      information_security_risk_management
      information_security_compliance_procedures
      isms_reviewed_by_independent_authority
      security_incident_management
      employee_qualification_for_sensitive_work
      staff_contractually_bound_to_security_policies
      security_awareness_training
      mobile_work_policy
      supplier_security_management
      compliance_with_regulatory_provisions
      personal_data_protection
      assets {
        assetId
        name
        category
        type
        description
        operational_purpose
        information_owner
        custodian
        confidentiality_level
        integrity_level
        availability_level
        criticality_status
        mtd_hours
        rpo_mtdl_hours
        approval_status
        encryption_status
        physical_location
        version_firmware
        sbom_reference
        end_of_life_date
        last_inventory_date
        disposal_method
        ownership
        acceptable_use
        return_policy
        archived
        archivedAt
        archivedBy
      }
      developmentTeam {
        teamId
        team_size_adequate
        key_person_dependency
      }
      solutions {
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
        archivedAt
        archivedBy
        createdAt
        environments {
          envId
          env_type
          deployment_type
          virtualization
          tech_stack
          data_types
          redundancy
          archived
          archivedAt
          archivedBy
          hostingId
          createdAt
          backup {
            exists
            schedule
            rto_hours
            rpo_hours
            restoration_test_frequency
          }
          network_security_mechanisms
          db_scaling_mechanism
          disaster_recovery_plan
          security_zones_managed
          network_services_requirements
          information_assets_removal_policy
          shared_external_it_services_protection
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
              details
            }
            patching
            pentest_freq
            vuln_mgmt
            access_control
            internal_audits_recent
            centralized_monitoring
            pentest_results_summary
            known_security_flaws
            incident_reporting_process
            change_management
            malware_protection
            key_management
          }
          monitoringObservability {
            monId
            perf_monitoring
            log_centralization
            tools
            alerting_strategy
          }
          costs {
            costId
            hosting_monthly
            licenses_monthly
            ops_hours_monthly_equiv
            comments
            hidden_costs
            cost_evolution_factors
            modernization_investment_needs
          }
        }
        codebase {
          codebaseId
          repo_location
          documentation_level
          code_review_process
          version_control_tool
          technical_debt_known
          legacy_systems
          third_party_dependencies
        }
        developmentMetrics {
          metricsId
          sdlc_process
          devops_automation_level
          planned_vs_unplanned_ratio
          lead_time_for_changes_days
          mttr_hours
          internal_vs_external_bug_ratio
        }
        aiFeatures {
          aiId
          technical_type
          quality_validation_method
          continuous_improvement
        }
      }
    }
  }
`;

// Mutation pour générer le rapport AISA
export const GENERATE_AISA_REPORT = gql`
  mutation GenerateAisaReport($editorId: ID!) {
    generateAisaReport(editorId: $editorId) {
      csvContent
      filename
    }
  }
`;


