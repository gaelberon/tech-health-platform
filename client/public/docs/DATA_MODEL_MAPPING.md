# Mapping du Modèle de Données - Référentiels DD Tech, CIEC et AISA

Ce document présente le mapping complet entre les champs du modèle de données de la plateforme et les référentiels sources :
- **DD Tech** : Référentiel Due Diligence Technique (sections numérotées)
- **CIEC** : Cadre d'Intervention pour l'Évaluation des Capacités (champs A1, B1, C1, etc.)
- **AISA** : Altamount Information Security Assessment v1.0 (contrôles numérotés)

## Structure du Document

Pour chaque entité du modèle de données, un tableau présente :
- Le nom du champ
- Son type
- Sa priorité (P1/P2/P3/P4/DD)
- S'il est requis
- Sa description
- Les références DD Tech (si applicable)
- Les références CIEC (si applicable)
- Les références AISA (si applicable)

---

## Editor

| Champ | Type | Priorité | Requis | Description | DD Tech | CIEC | AISA |
|-------|------|----------|--------|-------------|---------|------|------|
| editorId | string | P1 | Oui | Identifiant unique | - | - | - |
| name | string | P1 | Oui | Nom de l'éditeur | - | A1 | - |
| country | string | P2 | Non | Pays | - | - | - |
| size | enum | P2 | Non | Taille (Micro/SME/Mid/Enterprise) | - | - | - |
| business_criticality | enum | P1 | Oui | Criticité métier (Low/Medium/High/Critical) | - | - | - |
| internal_it_systems | string[] | DD | Non | Systèmes IT internes | 9.a.1 | - | 3.1, 3.2 |
| it_security_strategy | string | DD | Non | Stratégie de sécurité IT | 9.a.2 | - | 5.1, 5.2 |
| contracts_for_review | object[] | DD | Non | Contrats à réviser | 4.c.1 | - | - |

---

## Solution

| Champ | Type | Priorité | Requis | Description | DD Tech | CIEC | AISA |
|-------|------|----------|--------|-------------|---------|------|------|
| solutionId | string | P1 | Oui | Identifiant unique | - | - | - |
| editorId | ObjectId | P1 | Oui | Référence vers Editor | - | - | - |
| name | string | P1 | Oui | Nom de la solution | - | A2 | - |
| description | string | P2 | Non | Description | - | - | - |
| main_use_case | string | P1 | Oui | Cas d'usage principal | - | A4 | - |
| type | enum | P1 | Oui | Type (SaaS/OnPrem/Hybrid/ClientHeavy) | - | B1 | - |
| product_criticality | enum | P1 | Oui | Criticité produit | - | - | - |
| api_robustness | string | DD | Non | Robustesse des APIs | 1.d.1 | - | 8.1, 8.2 |
| api_documentation_quality | enum | DD | Non | Qualité documentation API | 1.d.2 | - | 8.1 |
| ip_ownership_clear | boolean | DD | Oui | Propriété intellectuelle claire | 4.a.1 | - | - |
| licensing_model | string | DD | Non | Modèle de licence | 4.b.1 | - | - |
| license_compliance_assured | boolean | DD | Non | Conformité licences | 4.b.2 | - | - |
| tech_stack | string[] | P2 | Non | Stack technique logicielle (langages, frameworks, bibliothèques) | 1.a.1 | B8 | - |

---

## Environment

| Champ | Type | Priorité | Requis | Description | DD Tech | CIEC | AISA |
|-------|------|----------|--------|-------------|---------|------|------|
| envId | string | P1 | Oui | Identifiant unique | - | - | - |
| solutionId | ObjectId | P1 | Oui | Référence vers Solution | - | - | - |
| hostingId | string | P1 | Oui | Référence vers Hosting | - | - | - |
| env_type | enum | P1 | Oui | Type (production/test/dev/backup/recette) | - | A3 | - |
| deployment_type | enum | P2 | Non | Type de déploiement (monolith/microservices/hybrid) | 1.b.1 | B5 | - |
| tech_stack | string[] | P2 | Non | Stack technique (langages, BDD, frameworks) | - | B8 | - |
| data_types | enum[] | P1 | Oui | Types de données (Personal/Sensitive/Health/Financial/Synthetic) | - | D1 | 8.2 |
| redundancy | enum | P1 | Oui | Niveau de redondance (none/minimal/geo-redundant/high) | - | D4 | 7.1, 7.2 |
| backup | object | P1 | Oui | Détails de sauvegarde (exists, rto, rpo, restoration_test_frequency) | 2.b.2, 5.c.3 | D3 | 7.1, 12.3 |
| disaster_recovery_plan | string | DD | Non | Plan de reprise après sinistre | 5.c.1 | - | 7.1, 12.3 |
| network_security_mechanisms | string[] | DD | Non | Mécanismes de sécurité réseau | 2.c.2 | D5 | 6.1, 6.2, 9.1 |
| db_scaling_mechanism | string | DD | Non | Mécanisme de scaling BDD | 2.b.1 | B7 | - |
| sla_offered | string | P3 | Non | SLA offert | 5.b.1 | D6 | - |

---

## Hosting

| Champ | Type | Priorité | Requis | Description | DD Tech | CIEC | AISA |
|-------|------|----------|--------|-------------|---------|------|------|
| hostingId | string | P1 | Oui | Identifiant unique | - | - | - |
| provider | string | P1 | Oui | Fournisseur (OVH, Azure, GCP, AWS, etc.) | - | B3 | - |
| region | string | P1 | Oui | Région/Pays d'hébergement | - | B4 | - |
| tier | enum | P1 | Oui | Niveau (datacenter/private/public/cloud) | - | B2 | - |
| certifications | string[] | P2/P3 | Non | Certifications (ISO27001, HDS, SOC2, etc.) | - | D2 | 5.1, 5.2, 18.1 |
| contact | object | P4 | Non | Contact technique (name, email) | - | - | - |

---

## SecurityProfile

| Champ | Type | Priorité | Requis | Description | DD Tech | CIEC | AISA |
|-------|------|----------|--------|-------------|---------|------|------|
| secId | string | P1 | Oui | Identifiant unique | - | - | - |
| envId | ObjectId | P1 | Oui | Référence vers Environment | - | - | - |
| auth | enum | P1 | Oui | Authentification (None/Passwords/MFA/SSO) | 3.a.1, 9.b.1 | D5 | 9.1, 9.2, 9.3, 9.4 |
| encryption | object | P1 | Oui | Chiffrement (in_transit, at_rest, details) | 3.a.1 | D5 | 10.1, 10.2 |
| patching | enum | P2 | Oui | Gestion des patchs (ad_hoc/scheduled/automated) | 3.b.2 | D5 | 12.1, 12.2 |
| pentest_freq | enum | P3 | Oui | Fréquence pentests (never/annual/quarterly) | 3.c.1 | D5 | 12.7 |
| vuln_mgmt | enum | P2 | Oui | Gestion vulnérabilités (none/manual/automated) | 3.b.2 | D5 | 12.1, 12.2, 12.3 |
| access_control | string | P2 | Non | Contrôle d'accès (ex: PAM) | 9.b.2 | D5 | 9.1, 9.2, 9.5 |
| internal_audits_recent | string | DD | Non | Audits internes récents | 3.c.2 | - | 18.1, 18.2 |
| centralized_monitoring | boolean | DD | Non | Monitoring centralisé | 3.a.2 | - | 12.4, 12.5 |
| pentest_results_summary | string | DD | Non | Résumé résultats pentests | 3.c.1 | - | 12.7 |
| known_security_flaws | string | DD | Non | Failles connues | 3.b.1 | - | 12.1, 12.2, 12.3 |
| incident_reporting_process | string | DD | Non | Processus signalement incidents | 3.b.3 | - | 16.1, 16.2, 16.3 |

---

## MonitoringObservability

| Champ | Type | Priorité | Requis | Description | DD Tech | CIEC | AISA |
|-------|------|----------|--------|-------------|---------|------|------|
| monId | string | P2 | Oui | Identifiant unique | - | - | - |
| envId | ObjectId | P2 | Oui | Référence vers Environment | - | - | - |
| perf_monitoring | enum | P2 | Oui | Monitoring performance (Yes/Partial/No) | 5.a.2 | C1 | 12.4, 12.5 |
| log_centralization | enum | P2 | Oui | Centralisation logs (Yes/Partial/No) | 5.a.2 | C2 | 12.4, 12.5 |
| tools | string[] | P2 | Non | Outils (Prometheus, Grafana, ELK, Datadog, etc.) | 5.a.2 | C3 | 12.4, 12.5 |
| alerting_strategy | string | DD | Non | Stratégie d'alerting | 5.a.2 | - | 12.4, 12.5 |

---

## EntityCost

| Champ | Type | Priorité | Requis | Description | DD Tech | CIEC | AISA |
|-------|------|----------|--------|-------------|---------|------|------|
| costId | string | P4 | Oui | Identifiant unique | - | - | - |
| envId | ObjectId | P4 | Oui | Référence vers Environment | - | - | - |
| hosting_monthly | number | P4 | Non | Coûts mensuels hébergement | 8.a.1 | E7 | - |
| licenses_monthly | number | P4 | Non | Coûts mensuels licences | 8.a.1 | E8 | - |
| ops_hours_monthly_equiv | number | P4 | Non | Heures Ops mensuelles (équivalent) | 8.a.1 | E9 | - |
| comments | string | P4 | Non | Commentaires | 8.a.1 | - | - |
| hidden_costs | string | DD | Non | Coûts cachés | 8.a.2 | - | - |
| cost_evolution_factors | string | DD | Non | Facteurs d'évolution | 8.a.3 | - | - |
| modernization_investment_needs | string | DD | Non | Besoins investissement modernisation | 8.b.1 | F4 | - |

---

## CodeBase

| Champ | Type | Priorité | Requis | Description | DD Tech | CIEC | AISA |
|-------|------|----------|--------|-------------|---------|------|------|
| codebaseId | string | DD | Oui | Identifiant unique | - | - | - |
| solutionId | ObjectId | DD | Oui | Référence vers Solution | - | - | - |
| repo_location | string | DD | Oui | Localisation du dépôt | 1.c.1 | - | 6.1, 6.2 |
| documentation_level | enum | DD | Oui | Niveau documentation (High/Medium/Low/None) | 1.c.2 | - | 7.1, 7.2 |
| code_review_process | string | DD | Non | Processus de revue de code | 1.c.3 | - | 6.1, 6.2 |
| version_control_tool | string | DD | Non | Outil de contrôle de version | 1.c.4 | - | 6.1, 6.2 |
| technical_debt_known | string | DD | Non | Dette technique connue | 1.e.1 | - | - |
| legacy_systems | string | DD | Non | Systèmes hérités | 1.e.3 | - | - |
| third_party_dependencies | string[] | DD | Non | Dépendances tierces | 1.a.2 | - | 15.1, 15.2 |

---

## DevelopmentMetrics

| Champ | Type | Priorité | Requis | Description | DD Tech | CIEC | AISA |
|-------|------|----------|--------|-------------|---------|------|------|
| metricsId | string | P3 | Oui | Identifiant unique | - | - | - |
| solutionId | ObjectId | P3 | Oui | Référence vers Solution | - | - | - |
| sdlc_process | enum | P3 | Oui | Processus SDLC (Scrum/Kanban/Waterfall/Agile/Hybrid) | 6.c.1 | - | 6.1, 6.2 |
| devops_automation_level | enum | P3 | Oui | Niveau automatisation CI/CD (None/Manual/Partial CI/Full CI/CD) | 2.d.1 | - | 6.1, 6.2, 12.1 |
| planned_vs_unplanned_ratio | number | P3 | Oui | Ratio travail planifié/non planifié (0-1) | 6.c.4 | - | - |
| lead_time_for_changes_days | number | P3 | Oui | Délai mise en œuvre changements (jours) | 6.c.5 | - | - |
| mttr_hours | number | P3 | Oui | Mean Time to Restore (heures) | 5.b.3 | - | 16.1, 16.2 |
| internal_vs_external_bug_ratio | number | P3 | Oui | Ratio bugs internes/externes (0-1) | 7.a.3 | - | 12.1, 12.2 |

---

## DevelopmentTeam

| Champ | Type | Priorité | Requis | Description | DD Tech | CIEC | AISA |
|-------|------|----------|--------|-------------|---------|------|------|
| teamId | string | DD | Oui | Identifiant unique | - | - | - |
| editorId | ObjectId | DD | Oui | Référence vers Editor | - | - | - |
| team_size_adequate | string | DD | Oui | Taille équipe adéquate | 6.b.1 | - | 7.1, 7.2 |
| key_person_dependency | string | DD | Non | Dépendances personnes clés | 6.b.2 | - | 7.1, 7.2 |

---

## AIFeatures

| Champ | Type | Priorité | Requis | Description | DD Tech | CIEC | AISA |
|-------|------|----------|--------|-------------|---------|------|------|
| aiId | string | DD | Oui | Identifiant unique | - | - | - |
| solutionId | ObjectId | DD | Oui | Référence vers Solution | - | - | - |
| technical_type | string | DD | Oui | Type technique (services externes vs modèles propres) | 10.1 | - | 15.1, 15.2 |
| quality_validation_method | string | DD | Non | Méthode validation qualité | 10.2 | - | 6.1, 6.2 |
| continuous_improvement | boolean | DD | Oui | Amélioration continue | 10.3 | - | 5.2 |

---

## ScoringSnapshot

| Champ | Type | Priorité | Requis | Description | DD Tech | CIEC | AISA |
|-------|------|----------|--------|-------------|---------|------|------|
| scoreId | string | P1 | Oui | Identifiant unique | - | - | - |
| solutionId | ObjectId | P1 | Oui | Référence vers Solution | - | - | - |
| envId | ObjectId | P1 | Non | Référence vers Environment (souvent Prod) | - | - | - |
| date | Date | P1 | Oui | Date du snapshot | - | - | - |
| global_score | number | P1 | Oui | Score global (0-100) | - | - | - |
| risk_level | enum | P1 | Oui | Niveau de risque (Low/Medium/High/Critical) | - | - | - |
| scores | object | P1 | Oui | Scores par catégorie (Security, Resilience, Observability, Architecture, Compliance) | - | - | - |
| notes | string | P1 | Non | Notes et recommandations | - | - | - |

---

## RoadmapItem

| Champ | Type | Priorité | Requis | Description | DD Tech | CIEC | AISA |
|-------|------|----------|--------|-------------|---------|------|------|
| roadmapId | string | P3 | Oui | Identifiant unique | - | - | - |
| parentId | ObjectId | P3 | Oui | Référence Solution ou Environment | - | - | - |
| linkedTo | enum | P3 | Oui | Type parent (Solution/Environment) | - | - | - |
| title | string | P3 | Oui | Titre | 6.a.1 | F1 | - |
| type | enum | P3 | Oui | Type (refactor/migration/security/feature/compliance) | 6.a.2 | F2, F3 | - |
| target_date | Date | P3 | Non | Date cible | 6.a.1 | - | - |
| status | enum | P3 | Oui | Statut (Planned/In Progress/Completed/Deferred) | 6.a.3 | - | - |
| impact_estimate | string | P3 | Non | Estimation impact | 6.a.1 | - | - |

---

## Document

| Champ | Type | Priorité | Requis | Description | DD Tech | CIEC | AISA |
|-------|------|----------|--------|-------------|---------|------|------|
| docId | string | P4 | Oui | Identifiant unique | - | - | - |
| parentId | ObjectId | P4 | Oui | Référence Editor, Solution ou Environment | - | - | - |
| linkedTo | enum | P4 | Oui | Type parent (Editor/Solution/Environment) | - | - | - |
| type | enum | P4 | Oui | Type (diagram/pentest/contract/audit/report) | 3.c.2 | - | 18.1, 18.2 |
| url_or_hash | string | P4 | Oui | URL ou hash du fichier | - | - | - |
| upload_date | Date | P4 | Oui | Date d'upload | - | - | - |

---

## Champs AISA non encore mappés dans le modèle

Les contrôles AISA suivants ne sont pas encore représentés dans le modèle de données actuel et pourraient être ajoutés :

### Organisation et Gouvernance
- **1.1 - Information Security Policy** : Politique de sécurité de l'information
- **1.2 - Roles and Responsibilities** : Rôles et responsabilités en sécurité
- **1.3 - Information Classification** : Classification de l'information (partiellement couvert par `data_types`)
- **1.4 - Information Security Awareness** : Sensibilisation à la sécurité
- **1.5 - Information Security Training** : Formation à la sécurité
- **1.6 - Information Security Incident Management** : Gestion des incidents (partiellement couvert par `incident_reporting_process`)

### Organisation de la Sécurité
- **2.1 - Mobile Device Policy** : Politique pour appareils mobiles
- **2.2 - Home Working** : Télétravail
- **2.3 - Confidentiality Agreements** : Accords de confidentialité

### Gestion des Actifs
- **3.1 - Inventory of Assets** : Inventaire des actifs (partiellement couvert par `internal_it_systems`)
- **3.2 - Ownership of Assets** : Propriété des actifs
- **3.3 - Acceptable Use of Assets** : Utilisation acceptable des actifs
- **3.4 - Return of Assets** : Retour des actifs

### Contrôle d'Accès
- **4.1 - Access Control Policy** : Politique de contrôle d'accès (partiellement couvert par `access_control`)
- **4.2 - User Access Management** : Gestion des accès utilisateurs
- **4.3 - User Responsibilities** : Responsabilités utilisateurs
- **4.4 - System and Application Access Control** : Contrôle d'accès système et application
- **4.5 - Privileged Access Rights** : Droits d'accès privilégiés (partiellement couvert par `access_control`)

### Cryptographie
- **10.1 - Cryptographic Controls** : Contrôles cryptographiques (partiellement couvert par `encryption`)
- **10.2 - Key Management** : Gestion des clés cryptographiques

### Relations avec les Fournisseurs
- **15.1 - Information Security in Supplier Relationships** : Sécurité dans les relations fournisseurs
- **15.2 - Supplier Service Delivery Management** : Gestion de la livraison de services fournisseurs

### Gestion des Incidents
- **16.1 - Information Security Incident Management** : Gestion des incidents de sécurité (partiellement couvert par `incident_reporting_process`)
- **16.2 - Information Security Incident Reporting** : Signalement des incidents
- **16.3 - Information Security Incident Response** : Réponse aux incidents

### Continuité d'Activité
- **17.1 - Information Security Continuity** : Continuité de la sécurité de l'information (partiellement couvert par `disaster_recovery_plan`)
- **17.2 - Redundancies** : Redondances (partiellement couvert par `redundancy`)

### Conformité
- **18.1 - Compliance with Legal and Contractual Requirements** : Conformité aux exigences légales et contractuelles (partiellement couvert par `certifications`)
- **18.2 - Information Security Reviews** : Revues de sécurité de l'information (partiellement couvert par `internal_audits_recent`)

---

## Notes sur le Mapping AISA

1. **Niveaux de Maturité** : AISA utilise un modèle de maturité à 5 niveaux (0-5) pour évaluer chaque contrôle. Le modèle de données actuel capture principalement l'existence/absence de contrôles, mais pas leur niveau de maturité.

2. **Contrôles Organisationnels vs Techniques** : Certains contrôles AISA sont organisationnels (politiques, processus) et ne correspondent pas directement à des champs techniques dans le modèle.

3. **Mapping Partiel** : Plusieurs champs du modèle couvrent partiellement plusieurs contrôles AISA. Par exemple, `SecurityProfile.encryption` couvre à la fois 10.1 (Cryptographic Controls) et 10.2 (Key Management).

4. **Champs Manquants** : Les champs suivants pourraient être ajoutés pour une meilleure couverture AISA :
   - Politique de sécurité de l'information (Editor ou Solution)
   - Gestion des accès utilisateurs détaillée (SecurityProfile)
   - Gestion des incidents structurée (nouvelle entité ou extension de SecurityProfile)
   - Relations fournisseurs et sécurité (nouvelle entité ou extension de Editor)
   - Continuité d'activité détaillée (extension de Environment ou nouvelle entité)

---

## Références

- **DD Tech** : Référentiel Due Diligence Technique (clés uniformes : X.a, X.b.1, etc.) - "Tech_DD_chapters_template_changes - FR.pdf"
- **CIEC** : Cadre d'Intervention pour l'Évaluation des Capacités - "Editeurs-Overview - Entities, CIEC & Dictionary.pdf"
- **AISA** : Altamount Information Security Assessment v1.0 (09.05.2025) - Basé sur ISA Catalog VDA (non officiellement approuvé)

