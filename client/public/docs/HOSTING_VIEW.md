# Vue d'Hébergement - Documentation

## Vue d'ensemble

La **Vue d'Hébergement** est une interface dédiée à la visualisation et à l'analyse de l'infrastructure d'hébergement des solutions informatiques. Elle permet de comprendre rapidement l'architecture d'hébergement d'un éditeur, organisée par solution et par environnement.

## Accès

La vue d'hébergement est accessible via l'onglet **"Hébergement"** 🏗️ dans la navigation principale de l'application.

### Permissions

Tous les rôles ont accès à la vue d'hébergement en lecture :
- **Admin** : Accès à tous les éditeurs
- **Supervisor** : Accès aux éditeurs de son portefeuille
- **EntityDirector** : Accès à l'éditeur associé
- **Editor** : Accès à l'éditeur associé

## Navigation Hiérarchique

La navigation s'adapte automatiquement selon votre rôle :

### Admin
- **Sélection d'éditeur** : Dropdown avec tous les éditeurs disponibles
- **Sélection de solution** : Dropdown filtré par l'éditeur sélectionné
- **Par défaut** : Premier éditeur sélectionné automatiquement

### Supervisor
- **Sélection d'éditeur** : Dropdown avec les éditeurs de votre portefeuille
- **Sélection de solution** : Dropdown filtré par l'éditeur sélectionné
- **Par défaut** : Premier éditeur du portefeuille sélectionné

### Editor / EntityDirector
- **Éditeur** : Affiché en texte (pas de sélection, fixe à votre éditeur associé)
- **Sélection de solution** : Dropdown avec toutes les solutions de votre éditeur
- **Par défaut** : Première solution sélectionnée automatiquement

## Fonctionnalités

### Vue d'Ensemble

La vue d'ensemble affiche les métriques clés de la solution sélectionnée :
- **Nombre total d'environnements**
- **Répartition par type** : Production, Test, Développement, Backup
- **Coût total mensuel** : Somme des coûts d'hébergement et de licences (si disponible)

### Filtres

Vous pouvez filtrer les environnements par :
- **Type d'environnement** : Tous, Production, Test, Développement, Backup
- **Provider d'hébergement** (à venir)
- **Région** (à venir)
- **Niveau de criticité** (à venir)

### Modes d'Affichage

#### Vue en Cartes (Par Défaut)

Chaque environnement est affiché dans une carte avec :

**En-tête** :
- Badge de type d'environnement (Production=rouge, Test=orange, Dev=bleu, Backup=gris)
- Indicateur de santé (✅ Optimal, ⚠️ À améliorer, ❌ Critique)
- ID de l'environnement

**Informations Principales** :
- **Hébergement** :
  - Provider (ex: OVH, Azure, AWS)
  - Région
  - Tier (datacenter/private/public/cloud)
  - Certifications (ISO27001, HDS, SOC2, etc.)
  
- **Redondance** : Badge coloré (none=rouge, minimal=orange, geo-redundant=vert, high=vert foncé)
  
- **Backup** :
  - Existence (✅/❌)
  - RTO (Recovery Time Objective) en heures
  - RPO (Recovery Point Objective) en heures

**Détails Expandables** (bouton "Voir les détails") :
- **Architecture** : Type de déploiement, virtualisation, tech stack, types de données
- **Sécurité** : Authentification, chiffrement, gestion des patches, pentests
- **Monitoring** : Performance, centralisation des logs, outils utilisés
- **Coûts** : Hébergement mensuel, licences, heures Ops
- **Plan de reprise** : Disaster Recovery Plan

#### Vue en Tableau

Vue comparative avec colonnes :
- Type d'environnement
- Provider / Région
- Redondance
- Backup (RTO/RPO)
- Sécurité (indicateur)
- Coûts mensuels

## Indicateurs Visuels

### Badges de Type d'Environnement
- **Production** : Rouge - Environnement critique de production
- **Test** : Orange - Environnement de test
- **Dev** : Bleu - Environnement de développement
- **Backup** : Gris - Environnement de sauvegarde

### Badges de Redondance
- **None** : Rouge - Aucune redondance (critique)
- **Minimal** : Orange - Redondance minimale
- **Geo-redundant** : Vert - Redondance géographique
- **High** : Vert foncé - Redondance élevée

### Indicateurs de Santé

L'indicateur de santé est calculé automatiquement selon 3 critères :

**✅ Optimal** (tous les critères remplis) :
- Redondance : geo-redundant ou high
- Backup : exists = true, RTO ≤ 24h, RPO ≤ 4h
- Sécurité : auth = MFA ou SSO, encryption (in_transit et at_rest) = true

**⚠️ À améliorer** (critères partiels) :
- Redondance : minimal
- Backup : exists = true mais RTO > 24h ou RPO > 4h
- Sécurité : auth = Passwords ou encryption partiel

**❌ Critique** (critères critiques manquants) :
- Redondance : none
- Backup : exists = false
- Sécurité : auth = None ou encryption manquant

## Données Affichées

### Informations d'Hébergement (P1)
- Provider (OVH, Azure, GCP, AWS, Bleu, OnPrem, etc.)
- Région (Pays/Région d'hébergement)
- Tier (datacenter/private/public/cloud)
- Certifications (ISO27001, HDS, SOC2, etc.)
- Contact technique (nom, email)

### Informations d'Environnement (P1)
- Type d'environnement (production/test/dev/backup)
- Redondance (none/minimal/geo-redundant/high)
- Backup (existence, RTO, RPO, fréquence de test)
- Types de données (Personal, Sensitive, Health, Financial, Synthetic)

### Informations d'Architecture (P2)
- Type de déploiement (monolith/microservices/hybrid)
- Virtualisation (physical/VM/container/k8s)
- Tech stack (langages, BDD, frameworks)

### Informations de Sécurité (P1)
- Authentification (None/Passwords/MFA/SSO)
- Chiffrement (en transit, au repos)
- Gestion des patches (ad_hoc/scheduled/automated)
- Fréquence des pentests
- Gestion des vulnérabilités

### Informations de Monitoring (P2)
- Monitoring de performance (Yes/Partial/No)
- Centralisation des logs (Yes/Partial/No)
- Outils utilisés (Prometheus, Grafana, ELK, Datadog, etc.)

### Informations de Coûts (P4)
- Hébergement mensuel
- Licences mensuelles
- Heures Ops équivalentes
- Commentaires

## Bonnes Pratiques

### Pour les Administrateurs
- Vérifier régulièrement les indicateurs de santé
- Identifier les environnements critiques nécessitant une amélioration
- Comparer les coûts entre environnements pour optimiser le budget

### Pour les Supervisors
- Surveiller les environnements de production de votre portefeuille
- Vérifier la conformité des certifications
- Analyser les coûts pour identifier les opportunités d'optimisation

### Pour les Editors
- Maintenir à jour les informations de vos environnements
- Vérifier que les backups sont configurés correctement
- S'assurer que la redondance est adaptée à la criticité

## Limitations Actuelles

- Les filtres par provider et région ne sont pas encore disponibles
- L'export des données n'est pas encore implémenté
- Les graphiques de tendance ne sont pas encore disponibles

## Évolutions Prévues

- Filtres avancés (provider, région, criticité)
- Export CSV/PDF
- Graphiques de tendance des coûts
- Alertes sur environnements critiques
- Comparaison entre solutions


