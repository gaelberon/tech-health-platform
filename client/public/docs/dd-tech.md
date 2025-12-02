# Technical Due Diligence - Mapping vers Tech Health Platform

Ce document présente le mapping entre les éléments de la Technical Due Diligence (Tech DD) et le modèle de données de la Tech Health Platform.

## 1. Informations sur l'Éditeur

| Élément Tech DD | Entité | Champ |
|----------------|--------|-------|
| Nom de l'éditeur | Editor | `name` |
| Pays d'origine | Editor | `country` |
| Taille de l'entreprise | Editor | `size` |
| Criticité métier | Editor | `business_criticality` |
| Systèmes IT internes | Editor | `internal_it_systems` |
| Stratégie de sécurité IT | Editor | `it_security_strategy` |
| Contrats à réviser | Editor | `contracts_for_review` |

## 2. Informations sur la Solution

| Élément Tech DD | Entité | Champ |
|----------------|--------|-------|
| Nom de la solution | Solution | `name` |
| Description | Solution | `description` |
| Cas d'usage principal | Solution | `main_use_case` |
| Type de solution | Solution | `type` |
| Criticité produit | Solution | `product_criticality` |
| Robustesse des APIs | Solution | `api_robustness` |
| Qualité de la documentation API | Solution | `api_documentation_quality` |
| Propriété intellectuelle claire | Solution | `ip_ownership_clear` |
| Modèle de licence | Solution | `licensing_model` |
| Conformité des licences | Solution | `license_compliance_assured` |

## 3. Architecture et Infrastructure

| Élément Tech DD | Entité | Champ |
|----------------|--------|-------|
| Type d'environnement | Environment | `env_type` |
| Type de déploiement | Environment | `deployment_type` |
| Stack technique | Environment | `tech_stack` |
| Types de données | Environment | `data_types` |
| Niveau de redondance | Environment | `redundancy` |
| Mécanismes de sécurité réseau | Environment | `network_security_mechanisms` |
| Mécanisme de scaling BDD | Environment | `db_scaling_mechanism` |
| Plan de reprise après sinistre | Environment | `disaster_recovery_plan` |
| SLA offert | Environment | `sla_offered` |

## 4. Sauvegarde et Récupération

| Élément Tech DD | Entité | Champ |
|----------------|--------|-------|
| Existence de sauvegarde | Environment | `backup.exists` |
| Planification des sauvegardes | Environment | `backup.schedule` |
| RTO (Recovery Time Objective) | Environment | `backup.rto_hours` |
| RPO (Recovery Point Objective) | Environment | `backup.rpo_hours` |
| Fréquence des tests de restauration | Environment | `backup.restoration_test_frequency` |

## 5. Hébergement

| Élément Tech DD | Entité | Champ |
|----------------|--------|-------|
| Fournisseur d'hébergement | Hosting | `provider` |
| Région/Pays d'hébergement | Hosting | `region` |
| Niveau d'hébergement | Hosting | `tier` |
| Certifications | Hosting | `certifications` |
| Contact technique | Hosting | `contact.name` |
| Email de contact | Hosting | `contact.email` |

## 6. Sécurité

| Élément Tech DD | Entité | Champ |
|----------------|--------|-------|
| Méthode d'authentification | SecurityProfile | `auth` |
| Chiffrement en transit | SecurityProfile | `encryption.in_transit` |
| Chiffrement au repos | SecurityProfile | `encryption.at_rest` |
| Détails du chiffrement | SecurityProfile | `encryption.details` |
| Gestion des patchs | SecurityProfile | `patching` |
| Fréquence des pentests | SecurityProfile | `pentest_freq` |
| Gestion des vulnérabilités | SecurityProfile | `vuln_mgmt` |
| Contrôle d'accès | SecurityProfile | `access_control` |
| Audits internes récents | SecurityProfile | `internal_audits_recent` |
| Monitoring centralisé | SecurityProfile | `centralized_monitoring` |
| Résumé des résultats de pentests | SecurityProfile | `pentest_results_summary` |
| Failles de sécurité connues | SecurityProfile | `known_security_flaws` |
| Processus de signalement d'incidents | SecurityProfile | `incident_reporting_process` |

## 7. Observabilité et Monitoring

| Élément Tech DD | Entité | Champ |
|----------------|--------|-------|
| Monitoring des performances | MonitoringObservability | `perf_monitoring` |
| Centralisation des logs | MonitoringObservability | `log_centralization` |
| Outils utilisés | MonitoringObservability | `tools` |

## 8. Code Source et Développement

| Élément Tech DD | Entité | Champ |
|----------------|--------|-------|
| Localisation du dépôt | Codebase | `repo_location` |
| Niveau de documentation | Codebase | `documentation_level` |
| Processus de revue de code | Codebase | `code_review_process` |
| Outil de contrôle de version | Codebase | `version_control_tool` |
| Dette technique connue | Codebase | `technical_debt_known` |
| Systèmes hérités | Codebase | `legacy_systems` |
| Dépendances tierces | Codebase | `third_party_dependencies` |

## 9. Métriques DevOps

| Élément Tech DD | Entité | Champ |
|----------------|--------|-------|
| Processus SDLC | DevelopmentMetrics | `sdlc_process` |
| Niveau d'automatisation CI/CD | DevelopmentMetrics | `devops_automation_level` |
| Ratio travail planifié/non planifié | DevelopmentMetrics | `planned_vs_unplanned_ratio` |
| Délai de mise en œuvre des changements | DevelopmentMetrics | `lead_time_for_changes_days` |
| Mean Time to Restore (MTTR) | DevelopmentMetrics | `mttr_hours` |
| Ratio bugs internes/externes | DevelopmentMetrics | `internal_vs_external_bug_ratio` |

## 10. Équipe de Développement

| Élément Tech DD | Entité | Champ |
|----------------|--------|-------|
| Taille d'équipe adéquate | DevelopmentTeam | `team_size_adequate` |
| Dépendance aux personnes clés | DevelopmentTeam | `key_person_dependency` |

## 11. Fonctionnalités IA

| Élément Tech DD | Entité | Champ |
|----------------|--------|-------|
| Type technique | AIFeatures | `technical_type` |
| Méthode de validation de la qualité | AIFeatures | `quality_validation_method` |
| Amélioration continue | AIFeatures | `continuous_improvement` |

## 12. Coûts

| Élément Tech DD | Entité | Champ |
|----------------|--------|-------|
| Coûts mensuels d'hébergement | EntityCost | `hosting_monthly` |
| Coûts mensuels de licences | EntityCost | `licenses_monthly` |
| Heures Ops mensuelles (équivalent) | EntityCost | `ops_hours_monthly_equiv` |
| Commentaires | EntityCost | `comments` |
| Coûts cachés | EntityCost | `hidden_costs` |
| Facteurs d'évolution des coûts | EntityCost | `cost_evolution_factors` |
| Besoins d'investissement en modernisation | EntityCost | `modernization_investment_needs` |

## Notes

- Les champs marqués comme vides dans la première version seront mappés dans les versions futures.
- Certains éléments de la Tech DD peuvent nécessiter plusieurs champs ou entités pour être complètement représentés.
- Les priorités P1 à P4 indiquent l'importance pour le scoring, tandis que DD indique les données de Due Diligence.

