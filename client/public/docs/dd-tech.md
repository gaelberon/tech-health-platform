# Technical Due Diligence - Mapping vers Tech Health Platform

Ce document présente le mapping entre les éléments de la Technical Due Diligence (Tech DD), le référentiel CIEC, et le modèle de données de la Tech Health Platform.

> **Note** : La colonne "Catégorie CIEC" est masquée par défaut. Utilisez le bouton "Afficher Catégorie CIEC" en haut de la page pour l'afficher ou la masquer selon vos besoins.

## 1. Informations sur l'Éditeur

| Élément Tech DD | CIEC | Entité | Champ | Catégorie CIEC |
|----------------|------|--------|-------|----------------|
| Nom de l'éditeur | A1 | Editor | `name` | A. Identification et Description Fonctionnelle |
| Pays d'origine | N/A | Editor | `country` | - |
| Taille de l'entreprise | N/A | Editor | `size` | - |
| Criticité métier | N/A | Editor | `business_criticality` | - |
| Systèmes IT internes | N/A | Editor | `internal_it_systems` | - |
| Stratégie de sécurité IT | N/A | Editor | `it_security_strategy` | - |
| Contrats à réviser | N/A | Editor | `contracts_for_review` | - |

## 2. Informations sur la Solution

| Élément Tech DD | CIEC | Entité | Champ | Catégorie CIEC |
|----------------|------|--------|-------|----------------|
| Nom de la solution | A2 | Solution | `name` | A. Identification et Description Fonctionnelle |
| Description | N/A | Solution | `description` | - |
| Cas d'usage principal | A4 | Solution | `main_use_case` | A. Identification et Description Fonctionnelle |
| Type de solution | B1 | Solution | `type` | B. Architecture & Hébergement |
| Criticité produit | N/A | Solution | `product_criticality` | - |
| Robustesse des APIs | N/A | Solution | `api_robustness` | - |
| Qualité de la documentation API | N/A | Solution | `api_documentation_quality` | - |
| Propriété intellectuelle claire | N/A | Solution | `ip_ownership_clear` | - |
| Modèle de licence | N/A | Solution | `licensing_model` | - |
| Conformité des licences | N/A | Solution | `license_compliance_assured` | - |

## 3. Architecture et Infrastructure

| Élément Tech DD | CIEC | Entité | Champ | Catégorie CIEC |
|----------------|------|--------|-------|----------------|
| Type d'environnement | A3 | Environment | `env_type` | A. Identification et Description Fonctionnelle |
| Type de déploiement | B5 | Environment | `deployment_type` | B. Architecture & Hébergement |
| Stack technique | B8 | Environment | `tech_stack` | B. Architecture & Hébergement |
| Types de données | D1 | Environment | `data_types` | D. Contraintes, Sécurité, Risques et Conformité |
| Niveau de redondance | D4 | Environment | `redundancy` | D. Contraintes, Sécurité, Risques et Conformité |
| Mécanismes de sécurité réseau | D5 (partiel) | Environment | `network_security_mechanisms` | D. Contraintes, Sécurité, Risques et Conformité |
| Mécanisme de scaling BDD | B7 | Environment | `db_scaling_mechanism` | B. Architecture & Hébergement |
| Plan de reprise après sinistre | N/A | Environment | `disaster_recovery_plan` | - |
| SLA offert | D6 (partiel) | Environment | `sla_offered` | D. Contraintes, Sécurité, Risques et Conformité |

## 4. Sauvegarde et Récupération

| Élément Tech DD | CIEC | Entité | Champ | Catégorie CIEC |
|----------------|------|--------|-------|----------------|
| Existence de sauvegarde | D3 | Environment | `backup.exists` | D. Contraintes, Sécurité, Risques et Conformité |
| Planification des sauvegardes | N/A | Environment | `backup.schedule` | - |
| RTO (Recovery Time Objective) | N/A | Environment | `backup.rto_hours` | - |
| RPO (Recovery Point Objective) | N/A | Environment | `backup.rpo_hours` | - |
| Fréquence des tests de restauration | N/A | Environment | `backup.restoration_test_frequency` | - |

## 5. Hébergement

| Élément Tech DD | CIEC | Entité | Champ | Catégorie CIEC |
|----------------|------|--------|-------|----------------|
| Fournisseur d'hébergement | B3 | Hosting | `provider` | B. Architecture & Hébergement |
| Région/Pays d'hébergement | B4 | Hosting | `region` | B. Architecture & Hébergement |
| Niveau d'hébergement | B2 | Hosting | `tier` | B. Architecture & Hébergement |
| Certifications | D2 | Hosting | `certifications` | D. Contraintes, Sécurité, Risques et Conformité |
| Contact technique | N/A | Hosting | `contact.name` | - |
| Email de contact | N/A | Hosting | `contact.email` | - |

## 6. Sécurité

| Élément Tech DD | CIEC | Entité | Champ | Catégorie CIEC |
|----------------|------|--------|-------|----------------|
| Méthode d'authentification | D5 (partiel) | SecurityProfile | `auth` | D. Contraintes, Sécurité, Risques et Conformité |
| Chiffrement en transit | D5 (partiel) | SecurityProfile | `encryption.in_transit` | D. Contraintes, Sécurité, Risques et Conformité |
| Chiffrement au repos | D5 (partiel) | SecurityProfile | `encryption.at_rest` | D. Contraintes, Sécurité, Risques et Conformité |
| Détails du chiffrement | N/A | SecurityProfile | `encryption.details` | - |
| Gestion des patchs | D5 (partiel) | SecurityProfile | `patching` | D. Contraintes, Sécurité, Risques et Conformité |
| Fréquence des pentests | D5 (partiel) | SecurityProfile | `pentest_freq` | D. Contraintes, Sécurité, Risques et Conformité |
| Gestion des vulnérabilités | N/A | SecurityProfile | `vuln_mgmt` | - |
| Contrôle d'accès | D5 (partiel) | SecurityProfile | `access_control` | D. Contraintes, Sécurité, Risques et Conformité |
| Audits internes récents | N/A | SecurityProfile | `internal_audits_recent` | - |
| Monitoring centralisé | N/A | SecurityProfile | `centralized_monitoring` | - |
| Résumé des résultats de pentests | N/A | SecurityProfile | `pentest_results_summary` | - |
| Failles de sécurité connues | N/A | SecurityProfile | `known_security_flaws` | - |
| Processus de signalement d'incidents | N/A | SecurityProfile | `incident_reporting_process` | - |

## 7. Observabilité et Monitoring

| Élément Tech DD | CIEC | Entité | Champ | Catégorie CIEC |
|----------------|------|--------|-------|----------------|
| Monitoring des performances | C1 | MonitoringObservability | `perf_monitoring` | C. Monitoring / Observabilité |
| Centralisation des logs | C2 | MonitoringObservability | `log_centralization` | C. Monitoring / Observabilité |
| Outils utilisés | C3 | MonitoringObservability | `tools` | C. Monitoring / Observabilité |

## 8. Code Source et Développement

| Élément Tech DD | CIEC | Entité | Champ | Catégorie CIEC |
|----------------|------|--------|-------|----------------|
| Localisation du dépôt | N/A | Codebase | `repo_location` | - |
| Niveau de documentation | N/A | Codebase | `documentation_level` | - |
| Processus de revue de code | N/A | Codebase | `code_review_process` | - |
| Outil de contrôle de version | N/A | Codebase | `version_control_tool` | - |
| Dette technique connue | N/A | Codebase | `technical_debt_known` | - |
| Systèmes hérités | N/A | Codebase | `legacy_systems` | - |
| Dépendances tierces | N/A | Codebase | `third_party_dependencies` | - |

## 9. Métriques DevOps

| Élément Tech DD | CIEC | Entité | Champ | Catégorie CIEC |
|----------------|------|--------|-------|----------------|
| Processus SDLC | N/A | DevelopmentMetrics | `sdlc_process` | - |
| Niveau d'automatisation CI/CD | N/A | DevelopmentMetrics | `devops_automation_level` | - |
| Ratio travail planifié/non planifié | N/A | DevelopmentMetrics | `planned_vs_unplanned_ratio` | - |
| Délai de mise en œuvre des changements | N/A | DevelopmentMetrics | `lead_time_for_changes_days` | - |
| Mean Time to Restore (MTTR) | N/A | DevelopmentMetrics | `mttr_hours` | - |
| Ratio bugs internes/externes | N/A | DevelopmentMetrics | `internal_vs_external_bug_ratio` | - |

## 10. Équipe de Développement

| Élément Tech DD | CIEC | Entité | Champ | Catégorie CIEC |
|----------------|------|--------|-------|----------------|
| Taille d'équipe adéquate | N/A | DevelopmentTeam | `team_size_adequate` | - |
| Dépendance aux personnes clés | N/A | DevelopmentTeam | `key_person_dependency` | - |

## 11. Fonctionnalités IA

| Élément Tech DD | CIEC | Entité | Champ | Catégorie CIEC |
|----------------|------|--------|-------|----------------|
| Type technique | N/A | AIFeatures | `technical_type` | - |
| Méthode de validation de la qualité | N/A | AIFeatures | `quality_validation_method` | - |
| Amélioration continue | N/A | AIFeatures | `continuous_improvement` | - |

## 12. Coûts

| Élément Tech DD | CIEC | Entité | Champ | Catégorie CIEC |
|----------------|------|--------|-------|----------------|
| Coûts mensuels d'hébergement | E7 | EntityCost | `hosting_monthly` | E. Évaluation et Stratégie (Volume, Coût et Projection) |
| Coûts mensuels de licences | E8 | EntityCost | `licenses_monthly` | E. Évaluation et Stratégie (Volume, Coût et Projection) |
| Heures Ops mensuelles (équivalent) | E9 | EntityCost | `ops_hours_monthly_equiv` | E. Évaluation et Stratégie (Volume, Coût et Projection) |
| Commentaires | N/A | EntityCost | `comments` | - |
| Coûts cachés | N/A | EntityCost | `hidden_costs` | - |
| Facteurs d'évolution des coûts | N/A | EntityCost | `cost_evolution_factors` | - |
| Besoins d'investissement en modernisation | E4 (partiel) | EntityCost | `modernization_investment_needs` | E. Évaluation et Stratégie (Volume, Coût et Projection) |

## 13. Champs CIEC non mappés dans Tech DD

| Élément Tech DD | CIEC | Entité | Champ | Catégorie CIEC |
|----------------|------|--------|-------|----------------|
| N/A | E1 - Nombre de clients | - | - | E. Évaluation et Stratégie (Volume, Coût et Projection) |
| N/A | E2 - Nombre d'utilisateurs | - | - | E. Évaluation et Stratégie (Volume, Coût et Projection) |
| N/A | E3 - Volume de transactions ou fréquence d'usage | - | - | E. Évaluation et Stratégie (Volume, Coût et Projection) |
| N/A | E4 - Volume en Clients (# total/estimé) | - | - | E. Évaluation et Stratégie (Volume, Coût et Projection) |
| N/A | E5 - Volume en Trafic (Utilisateurs) | - | - | E. Évaluation et Stratégie (Volume, Coût et Projection) |
| N/A | E6 - Volume en Trafic (Transactions) | - | - | E. Évaluation et Stratégie (Volume, Coût et Projection) |
| N/A | D7 - Qualité du Support | - | - | D. Contraintes, Sécurité, Risques et Conformité |
| N/A | F1 - Projets techniques à venir | RoadmapItem | `title` | F. Roadmap & Transformation |
| N/A | F2 - Refactoring prévu | RoadmapItem | `title` (type='refactor') | F. Roadmap & Transformation |
| N/A | F3 - Migration cloud prévue | RoadmapItem | `title` (type='migration') | F. Roadmap & Transformation |
| N/A | F5 - Contraintes majeures | - | - | F. Roadmap & Transformation |
| N/A | G1 - Potentiel de mutualisation | - | - | G. Notes/Commentaires |
| N/A | G2 - Conformité/Réglementation (Enjeux) | - | - | G. Notes/Commentaires |
| N/A | G3 - Notes générales | - | - | G. Notes/Commentaires |

## Notes

- Les champs marqués comme "N/A" dans la colonne CIEC indiquent que l'élément Tech DD n'a pas d'équivalent direct dans le référentiel CIEC.
- Les champs marqués comme "N/A" dans la colonne "Élément Tech DD" indiquent que l'élément CIEC n'a pas d'équivalent direct dans la Tech DD actuelle.
- Les champs marqués comme "(partiel)" indiquent que le champ CIEC couvre partiellement l'élément Tech DD, mais qu'il existe des différences ou des compléments.
- La colonne "Catégorie CIEC" est masquée par défaut. Utilisez le bouton en haut de la page pour l'afficher ou la masquer.
- Certains éléments de la Tech DD peuvent nécessiter plusieurs champs ou entités pour être complètement représentés.
- Les priorités P1 à P4 indiquent l'importance pour le scoring, tandis que DD indique les données de Due Diligence.
