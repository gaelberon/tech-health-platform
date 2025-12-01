// Fichier : /server/src/graphql/schema.ts

import { gql } from 'apollo-server-express';

const typeDefs = gql`
    # =================================================================
    # SCALARS & ENUMS (Dictionnaire Synthétique)
    # =================================================================

    # Priorités P1/P2/P3
    enum Criticality {
        Low
        Medium
        High
        Critical
    }

    # Priorité P2
    enum CompanySize {
        Micro
        SME
        Mid
        Enterprise
    }

    # Solution (P1)
    enum SolutionType {
        SaaS
        OnPrem
        Hybrid
        ClientHeavy
        FullWeb # Ajouté baser sur Technocarte
    }

    # Environnement (P1)
    enum EnvType {
        production
        test
        dev
        backup
    }

    # Environnement (P2)
    enum DeploymentType {
        monolith
        microservices
        hybrid
    }
    
    # Environnement (P2)
    enum VirtualizationType {
        physical
        VM
        container
        k8s
    }

    # Environnement (P1)
    enum RedundancyType {
        none
        minimal
        geo_redundant
        high
    }

    # SecurityProfile (P1)
    enum AuthType {
        None
        Passwords
        MFA
        SSO
    }
    
    # SecurityProfile (P2)
    enum PatchingType {
        ad_hoc
        scheduled
        automated
    }

    # SecurityProfile (P3)
    enum PentestFreqType {
        never
        annual
        quarterly
    }

    # Monitoring (P2)
    enum MonitoringStatus {
        Yes
        Partial
        No
    }

    # RoadmapItem & Document (Polymorphe)
    enum ParentEntity {
        Editor
        Solution
        Environment
    }
    
    # RoadmapItem (P3)
    enum RoadmapType {
        refactor
        migration
        security
        feature
        compliance
        other
    }

    # RoadmapItem
    enum RoadmapStatus {
        Planned
        InProgress
        Completed
        Deferred
    }

    # Document (P4)
    enum DocumentType {
        diagram
        pentest
        contract
        other
    }

    # ScoringSnapshot (P1)
    enum RiskLevel {
        Low
        Medium
        High
        Critical
    }

    # Utilisateurs / Auth
    enum UserRole {
        Admin
        Supervisor
        EntityDirector
        Editor
    }

    # =================================================================
    # NESTED OBJECT TYPES (Objets imbriqués)
    # =================================================================

    # Utilisé dans Environment (P1) [3]
    type Backup {
        exists: Boolean!
        schedule: String
        rto_hours: Float # Recovery Time Objective (en heures)
        rpo_hours: Float # Recovery Point Objective (en heures)
        restoration_test_frequency: String # Fréquence à laquelle la restauration est testée [4]
    }

    # Utilisé dans SecurityProfile (P1) [5]
    type Encryption {
        in_transit: Boolean!
        at_rest: Boolean!
        details: String
    }

    # Utilisé dans Editor Input (P4) [6]
    type ContractForReview {
        type: String!
        summary: String
    }

    # Utilisé dans Hosting Input (P4) [5]
    type ContactDetails {
        name: String!
        email: String!
    }

    # Utilisé dans ScoringSnapshot (P1) [7]
    type CategoryScores {
        security: Float!
        resilience: Float!
        observability: Float!
        architecture: Float!
        compliance: Float!
    }

    # =================================================================
    # ENTITIES - FEUILLE (1:1 ou Timeseries)
    # =================================================================

    # ENTITÉ HOSTING (P1) - Liée à Environment [5, 8]
    type Hosting {
        hostingId: ID! # PK [5, 8]
        provider: String! # OVH, Azure, GCP, OnPrem... [5]
        region: String! # Pays/Région [5, 8]
        tier: String # datacenter/private/public/cloud [5]
        contact: ContactDetails # P4 [5]
        certifications: [String] # ISO27001, HDS, SOC2 [5, 8]
        
        # NOTE: Pas de lien vers Environment car Environment est le parent
    }

    # ENTITÉ SECURITY PROFILE (P1) - Liée à Environment [5, 8]
    type SecurityProfile {
        secId: ID! # PK [8]
        envId: ID! # FK vers Environment [8]
        auth: AuthType! # MFA/SSO (P1) [5, 8]
        encryption: Encryption! # In_transit & at_rest (P1) [5, 8]
        patching: PatchingType # P2 [5]
        pentest_freq: PentestFreqType # P3 [5, 8]
        vuln_mgmt: String # Gestion des vulnérabilités (P2) [5, 8]
        access_control: String # PAM used? (P2) [5]
        internal_audits_recent: String # Audits récents [8]
        centralized_monitoring: Boolean # Monitoring centralisé pour la sécurité (P2) [8]
        pentest_results_summary: String # Résumé des derniers pentests [8]
        known_security_flaws: String # Failles connues [8]
        incident_reporting_process: String # Processus de résolution des incidents [8]
    }

    # ENTITÉ MONITORING/OBSERVABILITY (P2) - Liée à Environment [9, 10]
    type MonitoringObservability {
        monId: ID! # PK [10]
        envId: ID! # FK vers Environment [10]
        perf_monitoring: MonitoringStatus # P2 [9, 10]
        log_centralization: MonitoringStatus # P2 [9, 10]
        tools: [String] # Prometheus, Grafana, ELK, Datadog... (P2) [9, 10]
    }

    # ENTITÉ PERFORMANCE METRICS (P3 - Timeseries) - Liée à Environment [9, 11]
    type PerformanceMetrics {
        metricId: ID! # PK [11]
        envId: ID! # FK vers Environment [11]
        date: String! # Date de la mesure (datetime) [11]
        active_users: Int # P3 [11]
        transactions_per_minute: Int # P3 [11]
        avg_response_ms: Float # P3 [11]
        incident_count: Int # P3 [11]
    }

    # ENTITÉ ENTITY COST (P4) - Liée à Environment [9, 12]
    type EntityCost {
        costId: ID! # PK [12]
        envId: ID! # FK vers Environment [12]
        hosting_monthly: Float # Coûts mensuels d'hébergement [9, 12]
        licenses_monthly: Float # Coûts mensuels des licences [9, 12]
        ops_hours_monthly_equiv: Float # Heures Ops équivalentes (P4) [9]
        comments: String # P4 [9]
        hidden_costs: String # Coûts cachés [12]
        cost_evolution_factors: String # Facteurs d'évolution des coûts [12]
        modernization_investment_needs: String # Investissements nécessaires [12]
    }
    
    # ENTITÉ CODEBASE (P2) - Liée à Solution (1:1) [13]
    type CodeBase {
        codebaseId: ID! # PK [13]
        solutionId: ID! # FK vers Solution [13]
        repo_location: String # Où le code source est-il géré [13]
        documentation_level: String # État de la documentation [13]
        code_review_process: String # Présence et qualité des revues de code [13]
        version_control_tool: String # Outil utilisé pour le contrôle de version [13]
        technical_debt_known: String # Description des dettes techniques [13]
        legacy_systems: String # Description des systèmes hérités [13]
        third_party_dependencies: [String] # Dépendances tiers/Open Source [13]
    }

    # ENTITÉ DEVELOPMENT METRICS (P3) - Liée à Solution (1:1) [14]
    type DevelopmentMetrics {
        metricsId: ID! # PK [14]
        solutionId: ID! # FK vers Solution [14]
        sdlc_process: String # Scrum, Kanban, Cascade [14]
        devops_automation_level: String # Degré d'automatisation CI/CD [14]
        planned_vs_unplanned_ratio: Float # Ratio travail planifié/non planifié [14]
        lead_time_for_changes_days: Float # Délai de mise en œuvre des changements (jours) [14]
        mttr_hours: Float # Mean Time to Restore (MTTR) (heures) [14]
        internal_vs_external_bug_ratio: Float # Proportion bugs externe vs interne [14]
    }

    # ENTITÉ AI FEATURES (P3) - Liée à Solution (0..N) [15]
    type AIFeatures {
        aiId: ID! # PK [15]
        solutionId: ID! # FK vers Solution [15]
        technical_type: String # Services externes ou modèles propres [15]
        quality_validation_method: String # Comment la qualité a été mesurée/validée [15]
        continuous_improvement: Boolean # Workflows pour l'amélioration continue [15]
    }
    
    # ENTITÉ DEVELOPMENT TEAM (P3) - Liée à Editor (1:1) [10]
    type DevelopmentTeam {
        teamId: ID! # PK [10]
        editorId: ID! # FK vers Editor [10]
        team_size_adequate: String # Taille de l'équipe suffisante [10]
        key_person_dependency: String # Dépendances envers des personnes clés [10]
    }

    # ENTITÉ ROADMAP ITEM (P3 - Polymorphe) [11, 16]
    type RoadmapItem {
        roadmapId: ID! # PK [11]
        parentId: ID! # FK vers Solution ou Environment [11]
        linkedTo: ParentEntity! # Entité parente (Solution ou Environment)
        title: String! # P3 [11]
        type: RoadmapType! # refactor/migration/security/feature [11]
        target_date: String! # Date cible (P3) [11]
        status: RoadmapStatus!
        impact_estimate: String # P3 [11]
    }

    # ENTITÉ DOCUMENT (P4 - Polymorphe) [7, 16]
    type Document {
        docId: ID! # PK [7]
        parentId: ID! # FK vers Editor, Solution ou Environment
        linkedTo: ParentEntity! # Entité parente [7]
        type: DocumentType! # diagram/pentest/contract [7]
        url_or_hash: String! # Localisation du fichier (P4) [7]
        upload_date: String # Date de l'ajout (P4) [7]
    }

    # ENTITÉ SCORING SNAPSHOT (P1 - Historique) [7, 16]
    type ScoringSnapshot {
        scoreId: ID! # PK [7]
        solutionId: ID! # FK vers Solution (P1) [7]
        envId: ID # FK vers Environment (optionnel) [7]
        date: String! # Date du snapshot (datetime) (P1) [7]
        scores: CategoryScores! # Scores par catégorie (P1) [7]
        global_score: Float! # Score global normalisé (P1) [7]
        risk_level: RiskLevel! # Niveau de risque (P1) [7]
        notes: String # Recommandations automatiques ou manuelles (P1) [7]
    }

    # ENTITÉ UTILISATEUR (P1) - Contrôle d'accès / RBAC
    type User {
        userId: ID!
        email: String!
        firstName: String
        lastName: String
        phone: String
        role: UserRole!
        associatedEditorId: ID # Pour Editor/EntityDirector (un seul éditeur)
        associatedEditorIds: [ID!] # Pour Supervisor (portefeuille d'éditeurs)
        archived: Boolean
        archivedAt: String
        archivedBy: ID
        lastLoginAt: String
        createdAt: String
        updatedAt: String
    }

    # Réponse de connexion (peut contenir plusieurs comptes)
    type LoginResponse {
        user: User
        availableAccounts: [User!]!
        requiresAccountSelection: Boolean!
    }

    # ENTITÉ LOOKUP (Administration) - Listes de valeurs pour les menus déroulants
    type LookupValue {
        code: String!
        label: String!
        label_fr: String
        label_en: String
        description: String
        order: Int
        active: Boolean
    }

    type Lookup {
        id: ID!
        key: String!
        values: [LookupValue!]!
        category: String
        entity: String
        formLabel: String
        description: String
    }

    # MATRICE DE PERMISSIONS PAR ROLE
    type RolePermission {
        id: ID!
        role: UserRole!
        operation: String!
        allowed: Boolean!
    }

    # PERMISSIONS D'ACCÈS AUX PAGES
    type PageAccessPermission {
        id: ID!
        role: UserRole!
        page: String!
        allowed: Boolean!
    }

    # PISTES D'AUDIT
    type AuditChange {
        field: String!
        oldValue: String
        newValue: String
    }

    type AuditLog {
        id: ID!
        userId: String!
        userEmail: String
        userRole: String
        action: String!
        entityType: String!
        entityId: String!
        changes: [AuditChange!]
        before: String # JSON stringifié
        after: String # JSON stringifié
        ipAddress: String
        userAgent: String
        description: String
        timestamp: String!
        createdAt: String!
    }


    # =================================================================
    # CORE ENTITIES (Nœuds principaux)
    # =================================================================
    
    # ENTITÉ ENVIRONMENT (P1) - Liée à Solution (1:N) [3, 4]
    type Environment {
        envId: ID! # PK [3, 4]
        solutionId: ID! # FK vers Solution [3, 4]
        hostingId: ID! # FK vers Hosting [3]
        
        env_type: EnvType! # P1 [3, 4]
        deployment_type: DeploymentType # P2 [3, 4]
        virtualization: VirtualizationType # P2 [3]
        tech_stack: [String] # P2 [3, 4]
        data_types: [String] # P1 [3]
        redundancy: RedundancyType! # P1 [3, 4]
        backup: Backup! # P1 [3, 4]
        sla_offered: String # P3 [3]

        # Champs DD spécifiques
        network_security_mechanisms: [String] # Section 2c DD [4]
        db_scaling_mechanism: String # Section 2b DD [4]
        disaster_recovery_plan: String # Section 5c DD [4]
        
        # Relations 1:1 via Field Resolvers
        hosting: Hosting # FK vers Hosting [17]
        securityProfile: SecurityProfile # FK vers SecurityProfile [17]
        monitoringObservability: MonitoringObservability # FK vers Monitoring [17]
        costs: EntityCost # FK vers Costs [17]
        
        # Relations 0..N via Field Resolvers
        performanceMetrics: [PerformanceMetrics] # Timeseries [17]
        roadmapItems: [RoadmapItem] # Polymorphe [17]
        documents: [Document] # Polymorphe [17]
    }

    # ENTITÉ SOLUTION (P1) - Liée à Editor (1:N) [18, 19]
    type Solution {
        solutionId: ID! # PK [18, 19]
        editorId: ID! # FK vers Editor [18, 19]
        name: String! # P1 [18, 19]
        description: String # P2 [18]
        main_use_case: String! # P1 [18]
        type: SolutionType! # SaaS, OnPrem, Hybrid, ClientHeavy (P1) [18, 19]
        product_criticality: Criticality! # P1 [18, 19]

        # Champs DD spécifiques
        api_robustness: String # Section 1d DD [19]
        api_documentation_quality: String # Section 1d DD [19]
        ip_ownership_clear: Boolean # Section 4a DD [19]
        licensing_model: String # Section 4b DD [19]
        license_compliance_assured: Boolean # Section 4b DD [19]
        
        # Relations 1:1 via Field Resolvers
        codebase: CodeBase # Section 1 DD [17]
        developmentMetrics: DevelopmentMetrics # Section 6c DD [17]
        
        # Relations 0..N via Field Resolvers
        environments: [Environment] # Environnements (Prod/Test/Dev) [17]
        aiFeatures: [AIFeatures] # Fonctionnalités IA [17]
        roadmapItems: [RoadmapItem] # Polymorphe [17]
        documents: [Document] # Polymorphe [17]
        scoringSnapshots: [ScoringSnapshot] # Historique des scores (P1) [17]
    }

    # ENTITÉ EDITOR (P1) - Racine de la Vue Portfolio [6, 18]
    type Editor {
        editorId: ID! # PK [6, 18]
        name: String! # P1 [6, 18]
        country: String # P2 [6, 18]
        size: CompanySize # P2 [6, 18]
        business_criticality: Criticality! # P1 [6, 18]

        # Champs DD internes
        internal_it_systems: [String] # Systèmes IT internes (ERP, CRM) [6]
        it_security_strategy: String # Stratégie de sécurité interne [6]
        contracts_for_review: [ContractForReview] # Contrats à examiner [6]
        
        # Relations 0..N via Field Resolvers
        solutions: [Solution]! # Toutes les Solutions de cet éditeur [17]
        developmentTeam: DevelopmentTeam # Équipe de développement (1:1) [17]
        documents: [Document] # Polymorphe [17]
    }

    # =================================================================
    # INPUTS (Arguments pour les Mutations)
    # =================================================================

    # Editor Inputs
    input ContractForReviewInput {
        type: String!
        summary: String
    }

    input UpdateEditorInput {
        editorId: ID
        name: String
        country: String
        size: CompanySize
        business_criticality: Criticality
        internal_it_systems: [String]
        it_security_strategy: String
        contracts_for_review: [ContractForReviewInput]
    }

    # Solution Inputs
    input UpdateSolutionInput {
        solutionId: ID!
        name: String
        description: String
        main_use_case: String
        type: SolutionType
        product_criticality: Criticality
        api_robustness: String
        api_documentation_quality: String
        ip_ownership_clear: Boolean
        licensing_model: String
        license_compliance_assured: Boolean
    }

    # DevelopmentMetrics Inputs (pour la Mutation updateDevelopmentMetrics) [20]
    input UpdateDevelopmentMetricsInput {
        solutionId: ID!
        sdlc_process: String
        devops_automation_level: String
        planned_vs_unplanned_ratio: Float
        lead_time_for_changes_days: Float
        mttr_hours: Float
        internal_vs_external_bug_ratio: Float
    }
    
    # CodeBase Inputs
    input UpdateCodebaseInput {
        solutionId: ID!
        repo_location: String
        documentation_level: String
        code_review_process: String
        version_control_tool: String
        technical_debt_known: String
        legacy_systems: String
        third_party_dependencies: [String]
    }

    # DevelopmentTeam Inputs
    input UpdateDevelopmentTeamInput {
        editorId: ID!
        team_size_adequate: String
        key_person_dependency: String
    }

    # AI Features Inputs
    input CreateAIFeatureInput {
        solutionId: ID!
        technical_type: String!
        quality_validation_method: String
        continuous_improvement: Boolean!
    }

    # Hosting Inputs
    input ContactDetailsInput {
        name: String!
        email: String!
    }
    
    input UpdateHostingInput {
        hostingId: ID!
        provider: String
        region: String
        tier: String
        contact: ContactDetailsInput
        certifications: [String]
    }

    # SecurityProfile Inputs
    input EncryptionInput {
        in_transit: Boolean!
        at_rest: Boolean!
        details: String
    }

    input UpdateSecurityProfileInput {
        envId: ID!
        auth: AuthType
        encryption: EncryptionInput
        patching: PatchingType
        pentest_freq: PentestFreqType
        vuln_mgmt: String
        access_control: String
        internal_audits_recent: String
        centralized_monitoring: Boolean
        pentest_results_summary: String
        known_security_flaws: String
        incident_reporting_process: String
    }

    # MonitoringObservability Inputs
    input UpdateMonitoringObservabilityInput {
        envId: ID!
        perf_monitoring: MonitoringStatus
        log_centralization: MonitoringStatus
        tools: [String]
    }

    # Environment Inputs
    input BackupInput {
        exists: Boolean!
        schedule: String
        rto_hours: Float
        rpo_hours: Float
        restoration_test_frequency: String
    }

    input UpdateEnvironmentInput {
        envId: ID!
        solutionId: ID!
        env_type: EnvType
        deployment_type: DeploymentType
        virtualization: VirtualizationType
        tech_stack: [String]
        data_types: [String]
        redundancy: RedundancyType
        backup: BackupInput
        sla_offered: String
        network_security_mechanisms: [String]
        db_scaling_mechanism: String
        disaster_recovery_plan: String
    }

    # EntityCost Inputs
    input UpdateEntityCostInput {
        envId: ID!
        hosting_monthly: Float
        licenses_monthly: Float
        ops_hours_monthly_equiv: Float
        comments: String
        hidden_costs: String
        cost_evolution_factors: String
        modernization_investment_needs: String
    }

    # PerformanceMetrics Inputs
    input CreatePerformanceMetricInput {
        envId: ID!
        date: String!
        active_users: Int
        transactions_per_minute: Int
        avg_response_ms: Float
        incident_count: Int
    }

    # RoadmapItem Inputs
    input CreateRoadmapItemInput {
        parentId: ID!
        linkedTo: ParentEntity!
        title: String!
        type: RoadmapType!
        target_date: String!
        status: RoadmapStatus!
        impact_estimate: String
    }
    
    input UpdateRoadmapItemInput {
        roadmapId: ID!
        title: String
        type: RoadmapType
        target_date: String
        status: RoadmapStatus
        impact_estimate: String
    }

    # Document Inputs
    input CreateDocumentInput {
        parentId: ID!
        linkedTo: ParentEntity!
        type: DocumentType!
        url_or_hash: String!
        # upload_date: String est géré par la DB/API
    }

    # ScoringSnapshot Inputs
    input CategoryScoresInput {
        security: Float!
        resilience: Float!
        observability: Float!
        architecture: Float!
        compliance: Float!
    }

    # Lookup Inputs
    input LookupValueInput {
        code: String!
        label: String!
        label_fr: String
        label_en: String
        description: String
        order: Int
        active: Boolean
    }

    input UpdateLookupInput {
        key: String!
        values: [LookupValueInput!]!
        category: String
        entity: String
        formLabel: String
        description: String
    }

    # User Inputs
    input CreateUserInput {
        email: String!
        password: String!
        firstName: String
        lastName: String
        phone: String
        role: UserRole!
        associatedEditorId: ID # Pour Editor/EntityDirector
        associatedEditorIds: [ID!] # Pour Supervisor (portefeuille)
    }

    input UpdateUserInput {
        userId: ID!
        email: String
        firstName: String
        lastName: String
        phone: String
        role: UserRole
        associatedEditorId: ID # Pour Editor/EntityDirector
        associatedEditorIds: [ID!] # Pour Supervisor (portefeuille)
        password: String # Optionnel, pour changer le mot de passe
    }

    input CreateScoringSnapshotInput {
        solutionId: ID!
        envId: ID
        scores: CategoryScoresInput!
        global_score: Float!
        risk_level: RiskLevel!
        notes: String
    }


    # =================================================================
    # ROOT QUERY
    # =================================================================
    
    type Query {
        # Auth / Session
        me: User

        # Permissions / Administration
        listRolePermissions(role: UserRole!): [RolePermission!]!
        listPageAccessPermissions(role: UserRole!): [PageAccessPermission!]!
        
        # Lookups / Dictionnaires
        getLookups(keys: [String!]!): [Lookup!]!
        listAllLookups(category: String): [Lookup!]!
        
        # Users / Administration
        listUsers(includeArchived: Boolean): [User!]!
        getUser(userId: ID!): User
        
        # Audit / Pistes d'audit
        listAuditLogs(
            entityType: String
            entityId: ID
            userId: ID
            action: String
            startDate: String
            endDate: String
            limit: Int
        ): [AuditLog!]!
        getAuditLogsForEntity(entityType: String!, entityId: ID!): [AuditLog!]!

        # Editor (Vue Portfolio)
        listEditors: [Editor!]!
        getEditor(editorId: ID!): Editor
        listEditorsForUser: [Editor!]! # Liste des éditeurs accessibles selon le rôle de l'utilisateur

        # Solution (P1)
        getSolution(solutionId: ID!): Solution

        # Environment (P1)
        listEnvironmentsForSolution(solutionId: ID!): [Environment!]!
        getEnvironment(envId: ID!): Environment

        # Hosting (P1)
        getHostingProfile(hostingId: ID!): Hosting

        # Security (P1)
        getSecurityProfile(envId: ID!): SecurityProfile

        # Monitoring (P2)
        getMonitoringObservability(envId: ID!): MonitoringObservability

        # CodeBase (P2)
        getCodebase(solutionId: ID!): CodeBase

        # DevelopmentTeam (P3)
        getDevelopmentTeamForEditor(editorId: ID!): DevelopmentTeam

        # EntityCost (P4)
        getEntityCostForEnvironment(envId: ID!): EntityCost
        
        # AIFeatures (P3)
        listAIFeaturesForSolution(solutionId: ID!): [AIFeatures!]!

        # Timeseries / Historique
        listPerformanceMetrics(envId: ID!, startDate: String, endDate: String): [PerformanceMetrics!]!
        listScoringSnapshots(solutionId: ID!, envId: ID): [ScoringSnapshot!]!
        
        # Documents / Roadmap (Polymorphes)
        listDocumentsByParent(parentId: ID!, linkedTo: ParentEntity!): [Document!]!
        listRoadmapItems(parentId: ID!, linkedTo: ParentEntity!): [RoadmapItem!]!
    }

    # =================================================================
    # ROOT MUTATION
    # =================================================================
    
    type Mutation {
    # Auth
    login(email: String!, password: String!): LoginResponse!
    selectAccount(userId: ID!): User!
    logout: Boolean!

        # Permissions / Administration
        setRolePermission(role: UserRole!, operation: String!, allowed: Boolean!): RolePermission!
        setPageAccessPermission(role: UserRole!, page: String!, allowed: Boolean!): PageAccessPermission!
        
        # Lookups / Dictionnaires
        updateLookup(input: UpdateLookupInput!): Lookup!
        
        # Users / Administration
        createUser(input: CreateUserInput!): User!
        updateUser(input: UpdateUserInput!): User!
        archiveUser(userId: ID!): User!
        restoreUser(userId: ID!): User!

        # Editor & Team
        updateEditor(input: UpdateEditorInput!): Editor!
        updateDevelopmentTeam(input: UpdateDevelopmentTeamInput!): DevelopmentTeam!
        
        # Solution & Metrics
        updateSolution(input: UpdateSolutionInput!): Solution!
        updateDevelopmentMetrics(input: UpdateDevelopmentMetricsInput!): DevelopmentMetrics!
        createAIFeature(input: CreateAIFeatureInput!): AIFeatures!
        updateCodebase(input: UpdateCodebaseInput!): CodeBase!

        # Environment & Satellites (P1)
        updateEnvironment(input: UpdateEnvironmentInput!): Environment!
        updateHostingProfile(input: UpdateHostingInput!): Hosting!
        updateSecurityProfile(input: UpdateSecurityProfileInput!): SecurityProfile!
        
        # Monitoring & Costs
        updateMonitoringObservability(input: UpdateMonitoringObservabilityInput!): MonitoringObservability!
        updateEntityCost(input: UpdateEntityCostInput!): EntityCost!

        # Timeseries / Historique
        recordPerformanceMetric(input: CreatePerformanceMetricInput!): PerformanceMetrics!
        recordScoringSnapshot(input: CreateScoringSnapshotInput!): ScoringSnapshot! # P1 - Appelé par le service
        
        # Documents / Roadmap
        createDocument(input: CreateDocumentInput!): Document!
        createRoadmapItem(input: CreateRoadmapItemInput!): RoadmapItem!
        updateRoadmapItem(input: UpdateRoadmapItemInput!): RoadmapItem!
    }
`;

export default typeDefs;