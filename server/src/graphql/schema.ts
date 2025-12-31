// Fichier : /server/src/graphql/schema.ts

import { gql } from 'apollo-server-express';

const typeDefs = gql`
    # =================================================================
    # SCALARS & ENUMS (Dictionnaire Synthétique)
    # =================================================================

    # Scalar pour JSON (utilisé pour formData dans CollectorDraft)
    scalar JSON

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

    # Note: EnvType est maintenant un String pour permettre des valeurs dynamiques depuis les Value Lists
    # Les valeurs sont validées côté serveur contre la Value List "ENVIRONMENT_TYPES"

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
        name: String
        email: String
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
        change_management: String # AISA 5.2.1
        malware_protection: String # AISA 5.2.3
        key_management: String # ISO 27001 A.10.2 / AISA 5.1.2
    }

    # ENTITÉ MONITORING/OBSERVABILITY (P2) - Liée à Environment [9, 10]
    type MonitoringObservability {
        monId: ID! # PK [10]
        envId: ID! # FK vers Environment [10]
        perf_monitoring: MonitoringStatus # P2 [9, 10]
        log_centralization: MonitoringStatus # P2 [9, 10]
        tools: [String] # Prometheus, Grafana, ELK, Datadog... (P2) [9, 10]
        alerting_strategy: String # DD Section 5a - Stratégie d'alerting
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

    # ENTITÉ ASSET (AISA 1.3, 3.1, 3.2, 3.3, 3.4)
    type Asset {
        assetId: ID! # PK
        editorId: ID! # FK vers Editor
        name: String! # Nom de l'actif (P1, AISA 1.3.1)
        category: String! # intangible, digital_and_data, tangible, financial (P1, AISA 1.3.1)
        type: String! # Type spécifique de l'actif (P1, AISA 1.3.1)
        description: String # Description optionnelle (P2)
        
        # Champs AISA - Gestion des actifs (Section 1.3)
        operational_purpose: String # AISA 1.3.1 - But opérationnel spécifique
        information_owner: String # AISA 1.3.1 - Personne responsable de l'information (Risk Owner)
        custodian: String # AISA 1.3.1 - Responsable technique de la maintenance (ex: Admin IT)
        
        # Classification selon CIA (AISA 1.3.2)
        confidentiality_level: String # Niveau de confidentialité (Public, Interne, Confidentiel, Strictement Confidentiel)
        integrity_level: String # Niveau requis pour l'intégrité
        availability_level: String # Niveau requis pour la disponibilité
        
        # Criticité et continuité
        criticality_status: Boolean # AISA 1.3.2 - Indicateur si l'actif est critique
        mtd_hours: Float # Max Tolerable Downtime (en heures)
        rpo_mtdl_hours: Float # Recovery Point Objective / Maximum Tolerable Data Loss (en heures)
        
        # Évaluation et approbation (AISA 1.3.3, 1.3.4)
        approval_status: String # État de l'évaluation (Évalué, Approuvé, Rejeté)
        encryption_status: String # AISA 3.1.4 - Type de chiffrement (notamment pour actifs mobiles)
        
        # Localisation et version
        physical_location: String # AISA 3.1.3 - Site physique ou zone de sécurité
        version_firmware: String # Version logicielle ou matérielle actuelle
        sbom_reference: String # Lien vers la nomenclature logicielle (Software Bill of Materials)
        
        # Cycle de vie
        end_of_life_date: String # Date de fin de support par le constructeur/éditeur
        last_inventory_date: String # AISA 1.3.1 - Date de la dernière vérification physique ou logique
        disposal_method: String # AISA 3.1.3 - Méthode prévue pour la destruction sécurisée
        
        # Champs AISA - Propriété et utilisation (Section 3.2, 3.3, 3.4)
        ownership: String # AISA 3.2 - Ownership of Assets
        acceptable_use: String # AISA 3.3 - Acceptable Use of Assets
        return_policy: String # AISA 3.4 - Return of Assets
        
        # Champs d'archivage
        archived: Boolean
        archivedAt: String
        archivedBy: String
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

    # Settings / Configuration
    type Setting {
        id: ID!
        key: String!
        value: String!
        description: String
        category: String
        createdAt: String!
        updatedAt: String!
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
        riskLevel: RiskLevel! # Niveau de risque (Low, Medium, High, Critical)
    }

    # ENTITÉ SCORING SNAPSHOT (P1 - Historique) [7, 16]
    type ScoringSnapshot {
        scoreId: ID! # PK [7]
        solutionId: ID! # FK vers Solution (P1) [7]
        envId: ID # FK vers Environment (optionnel) [7]
        date: String! # Date du snapshot (datetime) (P1) [7]
        collection_type: String! # snapshot ou DD
        scores: CategoryScores! # Scores par catégorie (P1) [7]
        global_score: Float! # Score global normalisé (P1) [7]
        risk_level: RiskLevel! # Niveau de risque (P1) [7]
        notes: String # Recommandations automatiques ou manuelles (P1) [7]
        calculationDetails: CalculationDetails # Détails détaillés du calcul (optionnel)
        calculationReport: String # Rapport détaillé du calcul en langage naturel (optionnel)
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
        profilePicture: String # Photo de profil (base64 ou URL)
        themePreference: String # Préférence de thème (light/dark)
        languagePreference: String # Préférence de langue (fr/en/de)
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
        label_de: String
        description: String
        description_fr: String
        description_en: String
        description_de: String
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

    # RAPPORT AISA
    type AisaReportResponse {
        csvContent: String!
        filename: String!
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
        
        env_type: String! # P1 [3, 4] - Validé contre la Value List "ENVIRONMENT_TYPES"
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
        security_zones_managed: String # AISA 3.1.1
        network_services_requirements: String # AISA 5.3.2
        information_assets_removal_policy: String # AISA 5.3.3
        shared_external_it_services_protection: String # AISA 5.3.4
        
        # Champs d'archivage
        archived: Boolean
        archivedAt: String
        archivedBy: String
        
        # Timestamps (ajoutés automatiquement par Mongoose)
        createdAt: String
        updatedAt: String
        
        # Relations 1:1 via Field Resolvers
        hosting: Hosting # FK vers Hosting [17]
        securityProfile: SecurityProfile # FK vers SecurityProfile [17]
        monitoringObservability: MonitoringObservability # FK vers Monitoring [17]
        costs: EntityCost # FK vers Costs [17]
        
        # Relations 0..N via Field Resolvers
        performanceMetrics: [PerformanceMetrics] # Timeseries [17]
        roadmapItems: [RoadmapItem] # Polymorphe [17]
        documents: [Document] # Polymorphe [17]
        scoringSnapshots: [ScoringSnapshot] # Historique des scores pour cet environnement (P1) [17]
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
        api_documentation_quality: String # Section 1d DD [19] - Validé contre la Value List "API_DOCUMENTATION_QUALITY"
        ip_ownership_clear: String # Section 4a DD [19] - Validé contre la Value List "IP_OWNERSHIP_CLEAR"
        licensing_model: String # Section 4b DD [19]
        license_compliance_assured: String # Section 4b DD [19] - Validé contre la Value List "LICENSE_COMPLIANCE_ASSURED"
        
        # Stack technique logicielle (P2)
        tech_stack: [String] # Langages, frameworks, bibliothèques
        
        # Champs d'archivage
        archived: Boolean
        archivedAt: String
        archivedBy: String
        
        # Timestamps (ajoutés automatiquement par Mongoose)
        createdAt: String
        updatedAt: String
        
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
        it_security_strategy: [String] # Stratégies de sécurité interne (array) [6]
        contracts_for_review: [ContractForReview] # Contrats à examiner [6]
        
        # Relations 0..N via Field Resolvers
        assets: [Asset]! # Tous les actifs de cet éditeur (AISA 3.1) [17]
        
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
        it_security_strategy: [String]
        contracts_for_review: [ContractForReviewInput]
    }
    
    # Asset Inputs
    input CreateAssetInput {
        editorId: ID!
        name: String!
        category: String! # intangible, digital_and_data, tangible, financial
        type: String! # Type spécifique selon la catégorie
        description: String
        ownership: String # AISA 3.2
        acceptable_use: String # AISA 3.3
        return_policy: String # AISA 3.4
    }
    
    input UpdateAssetInput {
        assetId: ID!
        name: String
        category: String
        type: String
        description: String
        ownership: String
        acceptable_use: String
        return_policy: String
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
        api_documentation_quality: String # Validé contre la Value List "API_DOCUMENTATION_QUALITY"
        ip_ownership_clear: String # Validé contre la Value List "IP_OWNERSHIP_CLEAR"
        licensing_model: String
        license_compliance_assured: String # Validé contre la Value List "LICENSE_COMPLIANCE_ASSURED"
        tech_stack: [String]
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
        alerting_strategy: String
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
        env_type: String # Validé contre la Value List "ENVIRONMENT_TYPES"
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
    
    # Inputs pour créer des solutions et environnements (Data Management)
    input CreateSolutionInput {
        editorId: ID!
        name: String!
        description: String
        main_use_case: String!
        type: SolutionType!
        product_criticality: Criticality!
        api_robustness: String
        api_documentation_quality: String # Validé contre la Value List "API_DOCUMENTATION_QUALITY"
        ip_ownership_clear: String # Validé contre la Value List "IP_OWNERSHIP_CLEAR"
        licensing_model: String
        license_compliance_assured: String # Validé contre la Value List "LICENSE_COMPLIANCE_ASSURED"
        tech_stack: [String]
    }
    
    input CreateEnvironmentInput {
        solutionId: ID!
        hostingId: ID!
        env_type: String! # Validé contre la Value List "ENVIRONMENT_TYPES"
        deployment_type: DeploymentType
        tech_stack: [String]
        data_types: [String]
        redundancy: RedundancyType!
        backup: BackupInput!
        network_security_mechanisms: [String]
        db_scaling_mechanism: String
        disaster_recovery_plan: String
        sla_offered: String
    }
    
    # Input pour archiver/désarchiver (Data Management)
    input ArchiveInput {
        id: ID! # solutionId ou envId
        archived: Boolean!
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
        languagePreference: String # Préférence de langue (fr/en/de)
        email: String!
        password: String!
        firstName: String
        lastName: String
        phone: String
        role: UserRole!
        associatedEditorId: ID # Pour Editor/EntityDirector
        associatedEditorIds: [ID!] # Pour Supervisor (portefeuille)
        profilePicture: String # Photo de profil (base64 ou URL)
        themePreference: String # Préférence de thème (light/dark)
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
        profilePicture: String # Photo de profil (base64 ou URL)
        themePreference: String # Préférence de thème (light/dark)
        languagePreference: String # Préférence de langue (fr/en/de)
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

    # Inputs P1 pour la collecte initiale (Tech Profiler)
    # Les champs DD sont optionnels et peuvent être remplis en mode "Complet DD Tech"
    input EditorInputP1 {
        name: String!
        business_criticality: String! # Low/Medium/High/Critical
        country: String
        size: String # Micro/SME/Mid/Enterprise
        # Champs DD (optionnels)
        internal_it_systems: [String]
        it_security_strategy: [String]
        contracts_for_review: [ContractForReviewInput]
    }

    input SolutionInputP1 {
        name: String!
        type: String! # SaaS/OnPrem/Hybrid/ClientHeavy
        product_criticality: String! # Low/Medium/High/Critical
        main_use_case: String!
        description: String
        # Champs DD (optionnels)
        api_robustness: String
        api_documentation_quality: String # Validé contre la Value List "API_DOCUMENTATION_QUALITY"
        ip_ownership_clear: String # Validé contre la Value List "IP_OWNERSHIP_CLEAR"
        licensing_model: String
        license_compliance_assured: String # Validé contre la Value List "LICENSE_COMPLIANCE_ASSURED"
        tech_stack: [String]
    }

    input HostingInputP1 {
        provider: String! # OVH, Azure, AWS, OnPrem, etc.
        region: String! # Pays/Région
        tier: String! # datacenter/private/public/cloud
        certifications: [String!]
        # Champs DD (optionnels)
        contact: ContactDetailsInput
    }

    input EnvironmentInputP1 {
        env_type: String! # production/test/dev/backup
        data_types: [String!]! # Personal/Sensitive/Health/Financial/Synthetic
        redundancy: String! # none/minimal/geo-redundant/high
        backup: BackupInputP1!
        deployment_type: String # monolith/microservices/hybrid
        virtualization: String # physical/VM/container/k8s
        tech_stack: [String!]
        # Champs DD (optionnels)
        network_security_mechanisms: [String]
        db_scaling_mechanism: String
        disaster_recovery_plan: String
        sla_offered: String
    }

    input BackupInputP1 {
        exists: Boolean!
        schedule: String
        rto_hours: Float # Recovery Time Objective
        rpo_hours: Float # Recovery Point Objective
        restoration_test_frequency: String # never/annual/quarterly
    }

    input SecurityInputP1 {
        auth: String! # None/Passwords/MFA/SSO
        encryption: EncryptionInput!
        patching: String # ad_hoc/scheduled/automated
        pentest_freq: String # never/annual/quarterly
        vuln_mgmt: String # none/manual/automated
        # Champs DD (optionnels)
        access_control: String
        internal_audits_recent: String
        centralized_monitoring: Boolean
        pentest_results_summary: String
        known_security_flaws: String
        incident_reporting_process: String
    }

    # Type de retour pour submitP1Data
    type SubmitP1DataResponse {
        solution: Solution!
        editor: Editor!
        environment: Environment!
        hosting: Hosting!
        securityProfile: SecurityProfile!
        scoringSnapshot: ScoringSnapshot
    }

    # Entité CollectorDraft pour la gestion des brouillons
    type CollectorDraft {
        draftId: ID!
        userId: ID!
        status: String! # draft, in_progress, failed, completed
        step: Int!
        formData: JSON!
        errorMessage: String
        lastSavedAt: String!
        createdAt: String!
        updatedAt: String!
    }

    # Inputs pour la gestion des brouillons
    input SaveCollectorDraftInput {
        draftId: ID # Optionnel, pour mettre à jour un brouillon existant
        status: String! # draft, in_progress, failed
        step: Int!
        formData: JSON!
        errorMessage: String
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
        getLookups(keys: [String!]!, lang: String!): [Lookup!]!
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

        # Collector Drafts
        listCollectorDrafts(status: String): [CollectorDraft!]! # Liste des brouillons de l'utilisateur connecté
        getCollectorDraft(draftId: ID!): CollectorDraft

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
        
        # Assets
        listAssets(editorId: ID!, includeArchived: Boolean): [Asset!]!
        getAsset(assetId: ID!): Asset
        
        # Documents / Roadmap (Polymorphes)
        listDocumentsByParent(parentId: ID!, linkedTo: ParentEntity!): [Document!]!
        listRoadmapItems(parentId: ID!, linkedTo: ParentEntity!): [RoadmapItem!]!
        
        # Settings / Configuration
        getSetting(key: String!): String
        getAllSettings: [Setting!]!
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
        
        # Assets
        createAsset(input: CreateAssetInput!): Asset!
        updateAsset(input: UpdateAssetInput!): Asset!
        deleteAsset(assetId: ID!): Boolean!
        archiveAsset(assetId: ID!): Asset!
        
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
        submitP1Data(
            editor: EditorInputP1!
            solution: SolutionInputP1!
            hosting: HostingInputP1!
            environment: EnvironmentInputP1!
            security: SecurityInputP1!
            collection_type: String! # snapshot ou DD
        ): SubmitP1DataResponse! # P1 - Collecte initiale depuis Tech Profiler
        saveCollectorDraft(input: SaveCollectorDraftInput!): CollectorDraft! # Sauvegarder un brouillon
        deleteCollectorDraft(draftId: ID!): Boolean! # Supprimer un brouillon
        
        # Documents / Roadmap
        createDocument(input: CreateDocumentInput!): Document!
        createRoadmapItem(input: CreateRoadmapItemInput!): RoadmapItem!
        updateRoadmapItem(input: UpdateRoadmapItemInput!): RoadmapItem!
        
        # Actions : Création de solutions et environnements (Data Management)
        createSolution(input: CreateSolutionInput!): Solution!
        createEnvironment(input: CreateEnvironmentInput!): Environment!
        
        # Actions : Archivage/Désarchivage (Data Management)
        archiveSolution(input: ArchiveInput!): Solution!
        archiveEnvironment(input: ArchiveInput!): Environment!
        
        # Action : Génération de rapport AISA
        generateAisaReport(editorId: ID!): AisaReportResponse!
    }
`;

export default typeDefs;