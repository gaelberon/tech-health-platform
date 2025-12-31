// Remarquez que GraphQL utilise des types scalaires comme ID, String, Int, Float, Boolean, et Date (qui doit être définie)
// Assurez-vous d'avoir graphql-tag installé si vous utilisez Apollo Server

// Ligne d'importation INCORRECTE pour ESM/NodeNext :
// import gql from 'graphql-tag'; 

// Ligne d'importation CORRIGÉE (Import Nommé ou Import global + sélection) :
// import * as gql from 'graphql-tag'; 

// OU, plus propre si cela fonctionne :
import { gql } from 'graphql-tag'; 

export const typeDefs = gql`

    # ------------------ TYPES SCALAIRES PERSONNALISÉS ------------------
    # Types qui ne sont pas natifs à GraphQL (utilisés pour les dates et les identifiants Mongoose)
    scalar Date
    scalar ObjectID
    
    # ------------------ TYPES IMBRIQUÉS ET OBJETS COMPOSÉS ------------------

    # Utilisé par Editor (DD 4.c)
    type ContractForReview {
        type: String
        summary: String
    }

    # Utilisé par Hosting (P4)
    type ContactDetails {
        name: String
        email: String
    }
    
    # Utilisé par SecurityProfile (P1)
    type EncryptionDetails {
        in_transit: Boolean!
        at_rest: Boolean!
        details: String # Information DD
    }

    # Utilisé par Environment (P1)
    type BackupDetails {
        exists: Boolean!
        schedule: String
        rto_hours: Float # Recovery Time Objective (en heures)
        rpo_hours: Float # Recovery Point Objective (en heures)
        restoration_test_frequency: String # Sous-champ DD 2.b.2, 5.c.3
    }
    
    # Utilisé par ScoringSnapshot (P1)
    # Les pourcentages de pondération sont Sécurité (30%), Résilience (20%), Observabilité (15%), Architecture (15%), Conformité (20%)
    type CategoricalScores {
        Security: Float! 
        Resilience: Float!
        Observability: Float!
        Architecture: Float!
        Compliance: Float!
    }

    # Détails de calcul d'une composante
    type CalculationComponent {
        name: String! # Nom de la composante (ex: "Authentification", "Backup RTO/RPO")
        value: Float! # Points obtenus
        max: Float! # Points maximum possibles
        reason: String! # Raison de la note (ex: "SSO configuré", "RPO > 4h")
    }

    # Détails de calcul d'une catégorie
    type CalculationCategory {
        category: String! # Nom de la catégorie (ex: "Sécurité", "Résilience")
        weight: Float! # Poids dans le score global (ex: 0.30 pour 30%)
        rawScore: Float! # Score brut (points obtenus)
        maxRawScore: Float! # Score brut maximum
        percentage: Float! # Score en pourcentage (0-100)
        contribution: Float! # Contribution au score global (après pondération)
        components: [CalculationComponent!]! # Détails des composantes
    }

    # Structure complète des détails de calcul
    type CalculationDetails {
        categories: [CalculationCategory!]! # Détails par catégorie
        globalScore: Float! # Score global final
        riskLevel: String! # Niveau de risque (Low, Medium, High, Critical)
    }

    # ------------------ TYPES D'ENTITÉS PRINCIPALES ------------------

    # Entité P1/P2 : Editor (Lien 1:N vers Solution) [4, 9]
    type Editor {
        editorId: ID!
        name: String!
        country: String
        size: String # Micro/SME/Mid/Enterprise
        business_criticality: String! # Low/Medium/High/Critical
        
        # Champs DD (9.a, 4.c)
        internal_it_systems: [String] 
        it_security_strategy: [String] 
        contracts_for_review: [ContractForReview]
        
        # Champs AISA - Organisation et Gouvernance
        information_security_policy: String # AISA 1.1.1
        information_security_roles: String # AISA 1.2.2
        information_security_in_projects: String # AISA 1.2.3
        external_it_service_provider_responsibilities: String # AISA 1.2.4
        external_it_service_evaluation: String # AISA 1.3.3
        information_security_risk_management: String # AISA 1.4.1
        information_security_compliance_procedures: String # AISA 1.5.1
        isms_reviewed_by_independent_authority: String # AISA 1.5.2
        security_incident_management: String # AISA 1.6.1, 1.6.2, 1.6.3
        employee_qualification_for_sensitive_work: String # AISA 2.1.1
        staff_contractually_bound_to_security_policies: String # AISA 2.1.2
        security_awareness_training: String # AISA 2.1.3
        mobile_work_policy: String # AISA 2.1.4
        supplier_security_management: String # AISA 6.1.1, 6.1.2
        compliance_with_regulatory_provisions: String # AISA 7.1.1
        personal_data_protection: String # AISA 7.1.2
        
        # Relation 1:N
        solutions: [Solution!]
        developmentTeam: DevelopmentTeam # Relation 1:1 (6.b)
    }
    
    # Entité P1/P2 : Solution (Lien 1:N vers Environment) [4, 10]
    type Solution {
        solutionId: ID!
        editorId: ObjectID!
        name: String!
        description: String
        main_use_case: String!
        type: String! # SaaS, OnPrem, Hybrid, ClientHeavy
        product_criticality: String! 
        
        # Champs DD (API & Licences) 1.d, 4.a, 4.b
        api_robustness: String
        api_documentation_quality: String # Validé contre la Value List "API_DOCUMENTATION_QUALITY"
        ip_ownership_clear: String # Validé contre la Value List "IP_OWNERSHIP_CLEAR"
        licensing_model: String
        license_compliance_assured: String # Validé contre la Value List "LICENSE_COMPLIANCE_ASSURED"
        
        # Stack technique logicielle (P2)
        tech_stack: [String] # Langages, frameworks, bibliothèques
        
        # Champs d'archivage
        archived: Boolean
        archivedAt: Date
        archivedBy: String

        # Relations 1:N
        environments: [Environment!]
        aiFeatures: [AIFeatures!] # Relation 0..N (10)
        scoringSnapshots: [ScoringSnapshot!]
        
        # Relations 1:1 (ou N:1 pour les DD, si gérées via Field Resolvers)
        codebase: Codebase 
        developmentMetrics: DevelopmentMetrics
    }

    # Entité P1/P2 : Environment (Lien N:1 vers Solution) [5, 11]
    type Environment {
        envId: ID!
        solutionId: ObjectID!
        env_type: String! # production/test/dev/backup
        deployment_type: String # monolith/microservices/hybrid
        tech_stack: [String] # languages, BDD, framework
        data_types: [String] # Personal/Sensitive/Health/Financial/Synthetic
        redundancy: String! # none/minimal/geo-redundant/high
        backup: BackupDetails! # Objet imbriqué (P1)
        
        # Champs DD (2.b, 5.c)
        network_security_mechanisms: [String]
        db_scaling_mechanism: String
        disaster_recovery_plan: String
        security_zones_managed: String # AISA 3.1.1
        network_services_requirements: String # AISA 5.3.2
        information_assets_removal_policy: String # AISA 5.3.3
        shared_external_it_services_protection: String # AISA 5.3.4
        sla_offered: String # P3 (5.b.1)
        
        # Champs d'archivage
        archived: Boolean
        archivedAt: Date
        archivedBy: String

        # Relations 1:1
        hosting: Hosting! # hostingId FK (2.a)
        securityProfile: SecurityProfile
        monitoringObservability: MonitoringObservability
        costs: EntityCost
        
        # Relations N:1
        performanceMetrics: [PerformanceMetrics!] # Timeseries [7, 18]
        roadmapItems: [RoadmapItem!] # RoadmapItems peuvent être liés à Solution ou Environment [8, 18]
        scoringSnapshots: [ScoringSnapshot!] # Historique des scores pour cet environnement (P1)
    }
    
    # Entité P1/P2/P3 : Hosting [6, 12]
    type Hosting {
        hostingId: ID!
        provider: String!
        region: String!
        tier: String! # datacenter/private/public/cloud
        certifications: [String] # ISO27001, HDS, SOC2, etc.
        contact: ContactDetails
    }
    
    # Entité P1/P2/P3 : SecurityProfile (Critique pour le scoring Sécurité 30%) [6, 12]
    type SecurityProfile {
        secId: ID!
        envId: ObjectID!
        auth: String! # None/Passwords/MFA/SSO
        encryption: EncryptionDetails! # in_transit, at_rest
        patching: String # ad_hoc/scheduled/automated (3.b.2)
        pentest_freq: String # never/annual/quarterly
        vuln_mgmt: String # none/manual/automated
        access_control: String # e.g., PAM used? (9.b.2)
        
        # Champs DD (3.a, 3.b, 3.c, 3.d)
        internal_audits_recent: String
        centralized_monitoring: Boolean
        pentest_results_summary: String
        known_security_flaws: String
        incident_reporting_process: String
        change_management: String # AISA 5.2.1
        malware_protection: String # AISA 5.2.3
        key_management: String # ISO 27001 A.10.2 / AISA 5.1.2
    }
    
    # Entité P2 : MonitoringObservability (Critique pour le scoring Observabilité 15%) (5.a.2)
    type MonitoringObservability {
        monId: ID!
        envId: ObjectID!
        perf_monitoring: String! # Yes/Partial/No
        log_centralization: String! # Yes/Partial/No
        tools: [String] # Prometheus, Grafana, ELK, Datadog, etc.
    }
    
    # Entité P3 : DevelopmentMetrics (4 Métriques clés DevOps) (2.d, 5.b, 6.c, 7.a)
    type DevelopmentMetrics {
        metricsId: ID!
        solutionId: ObjectID!
        sdlc_process: String! # Scrum, Kanban, Cascade
        devops_automation_level: String! # Degré d'automatisation CI/CD
        planned_vs_unplanned_ratio: Float # Ratio travail planifié/non planifié
        lead_time_for_changes_days: Float
        mttr_hours: Float # Mean Time to Restore
        internal_vs_external_bug_ratio: Float
    }
    
    # Entité P4 : EntityCost [7, 13]
    type EntityCost {
        costId: ID!
        envId: ObjectID!
        hosting_monthly: Float
        licenses_monthly: Float
        ops_hours_monthly_equiv: Float # P4 (8.a.1)
        comments: String # P4 (8.a.1)
        
        # Champs DD (8.a, 8.b)
        hidden_costs: String 
        cost_evolution_factors: String
        modernization_investment_needs: String
    }
    
    # Entité P3 : RoadmapItem [8, 18]
    type RoadmapItem {
        roadmapId: ID!
        parentId: ObjectID! # Référence Solution ou Environment
        linkedTo: String! # Solution ou Environment
        title: String!
        type: String! # refactor/migration/security/feature/compliance (6.a.2)
        target_date: Date
        status: String # Planned/In Progress/Completed/Deferred [Conversation History]
        impact_estimate: String
    }
    
    # Entité P4 : Document [8, 19]
    type Document {
        docId: ID!
        parentId: ObjectID! # Référence Editor, Solution, ou Environment
        linkedTo: String! # Editor, Solution, ou Environment
        type: String! # diagram/pentest/contract
        url_or_hash: String!
        upload_date: Date!
    }
    
    # Entité P1 : ScoringSnapshot (Résultat du Scoring Engine) [8, 19]
    type ScoringSnapshot {
        scoreId: ID!
        solutionId: ObjectID!
        envId: ObjectID # Le scoring est souvent lié à l'environnement Prod
        date: Date!
        collection_type: String # snapshot ou DD
        global_score: Float! # 0-100
        risk_level: String! # Low, Medium, High, Critical
        scores: CategoricalScores!
        notes: String
        calculationDetails: CalculationDetails # Détails détaillés du calcul (optionnel)
        calculationReport: String # Rapport détaillé du calcul en langage naturel (optionnel)
    }
    
    # Entité DD : AIFeatures (10)
    type AIFeatures {
        aiId: ID!
        solutionId: ObjectID!
        technical_type: String!
        quality_validation_method: String
        continuous_improvement: Boolean!
    }

    # Entité DD : Codebase (1.c, 1.e)
    type Codebase {
        codebaseId: ID!
        solutionId: ObjectID!
        repo_location: String
        documentation_level: String
        code_review_process: String
        version_control_tool: String
        technical_debt_known: String
        legacy_systems: String
        third_party_dependencies: [String]
    }

    # Entité DD : DevelopmentTeam (6.b)
    type DevelopmentTeam {
        teamId: ID!
        editorId: ObjectID!
        team_size_adequate: String
        key_person_dependency: String # Dépendance aux personnes clés (ex: Evelyne COLLIN chez Cogima)
    }

    # ------------------ INPUTS POUR LES MUTATIONS (Exemples) ------------------
    
    input UpdateDevelopmentMetricsInput {
        solutionId: ObjectID!
        sdlc_process: String
        devops_automation_level: String
        planned_vs_unplanned_ratio: Float
        lead_time_for_changes_days: Float
        mttr_hours: Float
        internal_vs_external_bug_ratio: Float
    }
    
    input CreateEditorInput {
        name: String!
        country: String
        business_criticality: String!
    }
    
    input CreateSolutionInput {
        editorId: ObjectID!
        name: String!
        description: String
        main_use_case: String!
        type: String! # SaaS, OnPrem, Hybrid, ClientHeavy
        product_criticality: String! # Low, Medium, High, Critical
        api_robustness: String
        api_documentation_quality: String # Validé contre la Value List "API_DOCUMENTATION_QUALITY"
        ip_ownership_clear: String # Validé contre la Value List "IP_OWNERSHIP_CLEAR"
        licensing_model: String
        license_compliance_assured: String # Validé contre la Value List "LICENSE_COMPLIANCE_ASSURED"
    }
    
    input CreateEnvironmentInput {
        solutionId: ObjectID!
        hostingId: String!
        env_type: String! # production, test, dev, backup
        deployment_type: String # monolith, microservices, hybrid
        tech_stack: [String]
        data_types: [String]
        redundancy: String! # none, minimal, geo-redundant, high
        backup: BackupInput!
        network_security_mechanisms: [String]
        db_scaling_mechanism: String
        disaster_recovery_plan: String
        sla_offered: String
    }
    
    input BackupInput {
        exists: Boolean!
        schedule: String
        rto_hours: Float
        rpo_hours: Float
        restoration_test_frequency: String
    }
    
    input ArchiveInput {
        id: ID! # solutionId ou envId
        archived: Boolean!
    }

    # ------------------ REQUÊTES RACINES (Queries) ------------------

    type Query {
        # Vue Portfolio : Liste de tous les éditeurs
        listEditors: [Editor!]!
        
        # Vue Fiche Éditeur : Récupération d'un éditeur
        getEditor(editorId: ID!): Editor
        
        # Vue Détaillée : Récupération d'une solution et de toutes ses données DD associées (via Field Resolvers)
        getSolution(solutionId: ID!): Solution
        
        # Vue Historique : Récupération des scores passés pour une solution
        listScoringSnapshots(solutionId: ID!): [ScoringSnapshot!]!
    }

    # ------------------ MUTATIONS RACINES ------------------

    type Mutation {
        # Action : Création d'un nouvel éditeur (via l'Admin Dashboard)
        createEditor(input: CreateEditorInput!): Editor
        
        # Action : Mise à jour des métriques de développement (déclenchement du moteur de scoring)
        updateDevelopmentMetrics(input: UpdateDevelopmentMetricsInput!): DevelopmentMetrics

        # Action : Déclenchement manuel ou automatique d'un nouveau Snapshot de Scoring (P1)
        createScoringSnapshot(solutionId: ID!): ScoringSnapshot
        
        # Actions : Création de solutions et environnements (Data Management)
        createSolution(input: CreateSolutionInput!): Solution
        createEnvironment(input: CreateEnvironmentInput!): Environment
        
        # Actions : Archivage/Désarchivage (Data Management)
        archiveSolution(input: ArchiveInput!): Solution
        archiveEnvironment(input: ArchiveInput!): Environment
        
        # Action : Génération de rapport AISA
        generateAisaReport(editorId: ID!): AisaReportResponse
    }
    
    # Type de réponse pour le rapport AISA
    type AisaReportResponse {
        csvContent: String!
        filename: String!
    }
`;