# Référence des Champs CIEC - Extraction du PDF

Ce document liste tous les champs CIEC extraits du PDF "Editeurs-Overview - Entities, CIEC & Dictionary.pdf" avec leurs valeurs possibles.

## A. Identification et Description Fonctionnelle

### A1 - Éditeur
- **Type**: Texte libre
- **Mapping**: `Editor.name`

### A2 - Solution
- **Type**: Texte libre
- **Mapping**: `Solution.name`

### A3 - Environnement
- **Type**: Sélection unique
- **Valeurs possibles**:
  - Production
  - Production (Petits Clients)
  - Poduction (Grands Clients) [Note: typo dans le PDF]
  - Infrastructure Interne
  - Développement - Local environment (IDE, BDD, etc.)
  - Développement - Distant (BDD, etc.)
  - Tests
  - Backup
  - Repository Distant - Source Code (for Collaboration and Backup)
- **Mapping**: `Environment.env_type`

### A4 - Fonction principale
- **Type**: Texte libre
- **Mapping**: `Solution.main_use_case`

## B. Architecture & Hébergement

### B1 - Type de Solution Logicielle
- **Type**: Sélection unique
- **Valeurs possibles**:
  - Client lourd
  - Client lourd (hébergé)
  - Client lourd avec possibilité d'hébergement
  - SaaS (cloud)
  - Full web (installé chez le client ou hébergé)
  - On-premises (Éditeur)
  - On-premises (Client)
  - N/A (ERP tout-en-un)
  - Locally (on developer's machine)
- **Mapping**: `Solution.type`

### B2 - Type d'hébergement
- **Type**: Sélection unique
- **Valeurs possibles**:
  - On-premises (Éditeur)
  - On-premises (Client)
  - Datacenter (Éditeur)
  - Datacenter (Privé)
  - Hébergeur tiers (OVH, Bleu, Scaleway, etc.)
  - Hébergeur tiers (migration en cours)
  - Cloud public (AWS, Azure, GCP, etc.)
  - Cloud hybride
  - En interne (chez l'éditeur)
  - N/A
- **Mapping**: `Hosting.tier`

### B3 - Hébergeur
- **Type**: Texte libre (avec exemples)
- **Exemples**: OVH, Scaleway, Azure, GCP, Bleu (ex Bretagne Telecom), Google, etc.
- **Mapping**: `Hosting.provider`

### B4 - Localisation
- **Type**: Texte libre (Pays, Région)
- **Mapping**: `Hosting.region`

### B5 - Type de déploiement
- **Type**: Sélection unique
- **Valeurs possibles**:
  - Monolithique
  - Microservices
  - Hybride
  - N/A
- **Mapping**: `Environment.deployment_type`

### B6 - Virtualisation/Conteneurisation
- **Type**: Sélection unique
- **Valeurs possibles**:
  - Matériel
  - VMware
  - Docker
  - Kubernetes
  - N/A
  - TBD
- **Mapping**: `Environment.virtualization`

### B7 - Montée en charge
- **Type**: Sélection unique
- **Valeurs possibles**:
  - Verticale
  - Horizontale
  - Non supportée
  - N/A
  - TBD
- **Mapping**: `Environment.db_scaling_mechanism` (DD)

### B8 - Tech Stack
- **Type**: Texte libre (Langages/BDD)
- **Mapping**: `Environment.tech_stack` (array)

## C. Monitoring / Observabilité

### C1 - Monitoring de la performance
- **Type**: Sélection unique
- **Valeurs possibles**:
  - Oui (industriel)
  - Partiel
  - Non
  - N/A
  - TBD
- **Mapping**: `MonitoringObservability.perf_monitoring`

### C2 - Centralisation des logs
- **Type**: Sélection unique
- **Valeurs possibles**:
  - Oui (industriel)
  - Partiel
  - Non
  - N/A
  - TBD
- **Mapping**: `MonitoringObservability.log_centralization`

### C3 - Outils utilisés
- **Type**: Choix multiple
- **Valeurs possibles**:
  - Prometheus (Observabilité hybride)
  - Grafana (Observabilité hybride)
  - ELK Stack (Elasticsearch, Logstash, Kibana) (Observabilité hybride)
  - Graylog (Observabilité hybride)
  - Datadog (Monitoring d'Application et Infrastructure)
  - Splunk (Monitoring d'Application et Infrastructure)
  - Zabbix (Monitoring d'Application et Infrastructure)
  - Nagios (Monitoring d'Application et Infrastructure)
  - Icinga (Monitoring d'Application et Infrastructure)
  - Checkmk (Monitoring d'Application et Infrastructure)
  - New Relic (Monitoring d'Application et Infrastructure)
  - Dynatrace (Monitoring d'Application et Infrastructure)
  - AppDynamics (Monitoring d'Application et Infrastructure)
  - Grafana Loki (Observabilité Spécialisée, plus moderne)
  - Grafana Tempo (Observabilité Spécialisée, plus moderne)
  - Jaeger (Observabilité Spécialisée, plus moderne)
  - OpenTelemetry (Observabilité Spécialisée, plus moderne)
  - Sentry (Observabilité Spécialisée, plus moderne)
  - PRTG Network Monitor (Observabilité Spécialisée, plus moderne)
  - SolarWinds (Observabilité Spécialisée, plus moderne)
  - Netdata (Observabilité Spécialisée, plus moderne)
  - Sumo Logic (Outils moins adaptés)
  - Honeycomb (Outils moins adaptés)
  - N/A
  - TBD
- **Mapping**: `MonitoringObservability.tools` (array)

## D. Contraintes, Sécurité, Risques et Conformité

### D1 - Type de données hébergées
- **Type**: Choix multiple
- **Valeurs possibles**:
  - Sensibles
  - Personnelles
  - Health Data
  - Synthétiques
  - N/A
  - TBD
- **Mapping**: `Environment.data_types` (array)

### D2 - Conformité & Réglementation
- **Type**: Choix multiple
- **Valeurs possibles**:
  - RGPD & Confidentialité des Données - Conforme
  - RGPD & Confidentialité des Données - Non conforme
  - Normes Bancaires (EBICS, SEPA, etc.) - Conforme
  - Normes Bancaires (EBICS, SEPA, etc.) - Non conforme
  - Certifications Spécifiques Santé/Social (Ségur, HDS) - Conforme
  - Certifications Spécifiques Santé/Social (Ségur, HDS) - Non conforme
  - Certifications Qualité/Caisse (NF525, Datadock/Qualiopi) - Conforme
  - Certifications Qualité/Caisse (NF525, Datadock/Qualiopi) - Non conforme
  - Conformité Financière (SOX/SOC1) - Conforme
  - Conformité Financière (SOX/SOC1) - Non conforme
  - Facturation Électronique (PDP) - Conforme
  - Facturation Électronique (PDP) - Non conforme
  - Risque d'Infrastructure Critique - Conforme
  - Risque d'Infrastructure Critique - Non conforme
  - NF525 (Certification AFNOR pour les logiciels de caisse et d'encaissement) - Conforme
  - NF525 (Certification AFNOR pour les logiciels de caisse et d'encaissement) - Non conforme
  - N/A
  - TBD
- **Mapping**: `Hosting.certifications` (array) + champs DD spécifiques

### D3 - Sauvegarde
- **Type**: Sélection unique
- **Valeurs possibles**:
  - Oui (serveur de Production)
  - Oui (serveur dédié)
  - Non
  - N/A
  - TBD
- **Mapping**: `Environment.backup.exists` (Boolean)

### D4 - Redondance
- **Type**: Sélection unique
- **Valeurs possibles**:
  - Oui (minimale, dégradée)
  - Oui (full perimeter)
  - Non
  - N/A
  - TBD
- **Mapping**: `Environment.redundancy`

### D5 - Cybersécurité
- **Type**: Choix multiple
- **Valeurs possibles**:
  - Authentification forte activée (MFA, SSO)
  - Gestion des patchs
  - Chiffrement en transit
  - Chiffrement au repos
  - Gestion des accès à privilèges
  - Tests de sécurité réalisés (e.g., tests de pénétration)
  - Ports ouverts
  - API publiques
  - Dépendance à Internet
  - Reverse proxy
  - Firewall applicatif
  - Certificats HTTPS automatisés
  - N/A
  - TBD
- **Mapping**: `SecurityProfile.*` (plusieurs champs)

### D6 - Performance & Capacité
- **Type**: Sélection unique
- **Valeurs possibles**:
  - Suivi régulier des temps de réponse
  - SLA affiché aux clients
  - Existence d'alerting automatisé
  - N/A
  - TBD
- **Mapping**: `Environment.sla_offered` (DD) + `MonitoringObservability.*`

### D7 - Qualité du Support
- **Type**: Texte libre
- **Mapping**: Champ DD à définir

## E. Évaluation et Stratégie (Volume, Coût et Projection)

### E1 - Nombre de clients
- **Type**: Nombre
- **Mapping**: Champ DD à définir (peut être dans EntityCost ou une nouvelle entité)

### E2 - Nombre d'utilisateurs
- **Type**: Nombre
- **Mapping**: Champ DD à définir

### E3 - Volume de transactions ou fréquence d'usage
- **Type**: Texte libre
- **Mapping**: Champ DD à définir

### E4 - Volume en Clients (# total/estimé)
- **Type**: Nombre
- **Mapping**: Champ DD à définir

### E5 - Volume en Trafic (Utilisateurs)
- **Type**: Nombre
- **Mapping**: Champ DD à définir

### E6 - Volume en Trafic (Transactions)
- **Type**: Nombre
- **Mapping**: Champ DD à définir

### E7 - Coût d'hébergement (annuel)
- **Type**: Nombre (€)
- **Mapping**: `EntityCost.hosting_monthly` * 12

### E8 - Coût des licences PaaS / IaaS (annuel)
- **Type**: Nombre (€)
- **Mapping**: `EntityCost.licenses_monthly` * 12

### E9 - Équipe requise (Eqh / temps homme) (annuel)
- **Type**: Nombre
- **Mapping**: `EntityCost.ops_hours_monthly_equiv` * 12

## F. Roadmap & Transformation

### F1 - Projets techniques à venir
- **Type**: Texte libre
- **Mapping**: `RoadmapItem.title` (plusieurs items)

### F2 - Refactoring prévu
- **Type**: Texte libre
- **Mapping**: `RoadmapItem` avec type='refactor'

### F3 - Migration cloud prévue
- **Type**: Texte libre
- **Mapping**: `RoadmapItem` avec type='migration'

### F4 - Investissements envisagés
- **Type**: Texte libre
- **Mapping**: `EntityCost.modernization_investment_needs`

### F5 - Contraintes majeures
- **Type**: Texte libre
- **Mapping**: Champ DD à définir

## G. Notes/Commentaires

### G1 - Potentiel de mutualisation
- **Type**: Texte libre
- **Mapping**: Champ DD à définir

### G2 - Conformité/Réglementation (Enjeux)
- **Type**: Texte libre
- **Mapping**: Champ DD à définir

### G3 - Notes générales
- **Type**: Texte libre
- **Mapping**: Champ DD à définir

## Lookups à Créer

1. **ENVIRONMENT_TYPES**: Production, Test, Dev, Backup, Infrastructure Interne, etc.
2. **SOLUTION_TYPES**: Client lourd, SaaS, Full web, On-premises, etc.
3. **HOSTING_TIERS**: Datacenter, Cloud, On-premises, Hébergeur tiers, etc.
4. **DEPLOYMENT_TYPES**: Monolithique, Microservices, Hybride
5. **VIRTUALIZATION_TYPES**: Matériel, VMware, Docker, Kubernetes
6. **SCALING_MECHANISMS**: Verticale, Horizontale, Non supportée
7. **MONITORING_STATUS**: Oui (industriel), Partiel, Non
8. **MONITORING_TOOLS**: Prometheus, Grafana, ELK, Datadog, etc. (choix multiple)
9. **DATA_TYPES**: Sensibles, Personnelles, Health Data, Synthétiques (déjà existant)
10. **COMPLIANCE_TYPES**: RGPD, ISO27001, HDS, Ségur, SOX/SOC1, NF525, etc. (choix multiple)
11. **REDUNDANCY_LEVELS**: Oui (minimale), Oui (full), Non (déjà existant mais à enrichir)
12. **SECURITY_MECHANISMS**: MFA/SSO, Patching, Encryption, Pentest, etc. (choix multiple)
13. **PERFORMANCE_METRICS**: Suivi temps réponse, SLA, Alerting (choix multiple)




