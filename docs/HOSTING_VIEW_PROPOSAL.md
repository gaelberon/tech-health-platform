# Proposition : Vue d'Hébergement - Tech Health Platform

## Vue d'ensemble

Cette proposition décrit une vue dédiée à l'affichage et à la compréhension des données d'hébergement des solutions informatiques. La vue permet de visualiser de manière intuitive l'infrastructure d'hébergement d'un éditeur, organisée par solution et par environnement.

## Objectifs

1. **Compréhension rapide** : Permettre une compréhension immédiate de l'architecture d'hébergement
2. **Comparaison** : Faciliter la comparaison entre différents environnements
3. **Criticité** : Mettre en évidence les éléments critiques (redondance, backup, sécurité)
4. **Navigation intuitive** : Hiérarchie claire : Éditeur → Solution → Environnements

## Architecture de la Vue

### 1. Navigation Hiérarchique

La navigation s'adapte selon le rôle de l'utilisateur :

#### Admin (pas d'éditeur associé)
```
┌─────────────────────────────────────────────────┐
│  Éditeur: [Sélecteur - Tous les éditeurs]     │
│  Solution: [Sélecteur - Filtré par éditeur]   │
└─────────────────────────────────────────────────┘
```
- **Sélecteur d'éditeur** : Dropdown avec **tous** les éditeurs disponibles
- **Sélecteur de solution** : Dropdown filtré par l'éditeur sélectionné
- **Par défaut** : Premier éditeur sélectionné automatiquement

#### Supervisor (peut avoir plusieurs éditeurs dans son portefeuille)
```
┌─────────────────────────────────────────────────┐
│  Éditeur: [Sélecteur - Éditeurs du portefeuille]│
│  Solution: [Sélecteur - Filtré par éditeur]     │
└─────────────────────────────────────────────────┘
```
- **Sélecteur d'éditeur** : Dropdown avec les éditeurs du portefeuille du supervisor
- **Sélecteur de solution** : Dropdown filtré par l'éditeur sélectionné
- **Par défaut** : Premier éditeur du portefeuille sélectionné

#### Editor / EntityDirector (lié à un seul éditeur)
```
┌─────────────────────────────────────────────────┐
│  Éditeur: Acme Corp (fixe)                      │
│  Solution: [Sélecteur - Solutions de l'éditeur] │
└─────────────────────────────────────────────────┘
```
- **Éditeur** : Affiché en texte (pas de sélecteur, fixe)
- **Sélecteur de solution** : Dropdown avec toutes les solutions de l'éditeur associé
- **Par défaut** : Première solution sélectionnée automatiquement

- **Breadcrumb** : Affichage du chemin actuel (Éditeur > Solution)

### 2. Vue d'Ensemble (Header)

Affiche les métriques clés de la solution sélectionnée :
- Nombre total d'environnements
- Répartition par type (Production, Test, Dev, Backup)
- Indicateur de santé global (basé sur redondance, backup, sécurité)
- Coût total mensuel (si disponible)

### 3. Filtres et Actions

- **Filtres** :
  - Par type d'environnement (Production, Test, Dev, Backup)
  - Par provider d'hébergement
  - Par région
  - Par niveau de criticité (basé sur redondance/backup)
  
- **Actions** :
  - Vue en cartes (défaut)
  - Vue en tableau (comparaison)
  - Export (à venir)

### 4. Vue en Cartes (Par Défaut)

Chaque environnement est affiché dans une carte avec :

#### En-tête de Carte
- **Type d'environnement** : Badge coloré (Production=rouge, Test=orange, Dev=bleu, Backup=gris)
- **Nom/ID de l'environnement** : `envId`
- **Indicateur de santé** : Badge (✅ Optimal, ⚠️ À améliorer, ❌ Critique)

#### Section Principale (Toujours visible)
- **Hébergement** :
  - Provider (ex: OVH, Azure, AWS)
  - Région (avec drapeau si possible)
  - Tier (datacenter/private/public/cloud) avec icône
  - Certifications (badges : ISO27001, HDS, SOC2, etc.)
  
- **Criticité** :
  - Redondance : Badge coloré (none=rouge, minimal=orange, geo-redundant=vert, high=vert foncé)
  - Backup : 
    - Existence (✅/❌)
    - RTO (Recovery Time Objective) en heures
    - RPO (Recovery Point Objective) en heures
    - Fréquence de test de restauration

#### Section Expandable (Détails)
- **Architecture** :
  - Type de déploiement (monolith/microservices/hybrid)
  - Virtualisation (physical/VM/container/k8s)
  - Tech stack (langages, BDD, frameworks)
  - Types de données (Personal, Sensitive, Health, Financial, Synthetic)
  
- **Sécurité** (si SecurityProfile disponible) :
  - Authentification (None/Passwords/MFA/SSO)
  - Chiffrement (en transit, au repos)
  - Gestion des patches (ad_hoc/scheduled/automated)
  - Fréquence des pentests
  - Gestion des vulnérabilités
  
- **Monitoring** (si MonitoringObservability disponible) :
  - Monitoring de performance (Yes/Partial/No)
  - Centralisation des logs (Yes/Partial/No)
  - Outils utilisés (Prometheus, Grafana, ELK, etc.)
  
- **Coûts** (si EntityCost disponible) :
  - Hébergement mensuel
  - Licences mensuelles
  - Heures Ops équivalentes
  - Commentaires
  
- **Plan de reprise** :
  - Disaster Recovery Plan (Documenté/Testé/None)
  - Mécanismes de sécurité réseau
  - Mécanisme de scaling DB

### 5. Vue en Tableau (Comparaison)

Tableau comparatif avec colonnes :
- Type d'environnement
- Provider / Région
- Redondance
- Backup (RTO/RPO)
- Sécurité (score ou indicateur)
- Coûts mensuels
- Actions (voir détails)

### 6. Indicateurs Visuels

#### Badges de Type d'Environnement
- **Production** : Rouge (`bg-red-100 text-red-800`)
- **Test** : Orange (`bg-orange-100 text-orange-800`)
- **Dev** : Bleu (`bg-blue-100 text-blue-800`)
- **Backup** : Gris (`bg-gray-100 text-gray-800`)

#### Badges de Redondance
- **None** : Rouge (`bg-red-100 text-red-800`)
- **Minimal** : Orange (`bg-orange-100 text-orange-800`)
- **Geo-redundant** : Vert (`bg-green-100 text-green-800`)
- **High** : Vert foncé (`bg-green-200 text-green-900`)

#### Indicateurs de Santé
- **✅ Optimal** : Vert - Tous les critères critiques sont remplis
- **⚠️ À améliorer** : Orange - Certains critères manquants
- **❌ Critique** : Rouge - Critères critiques manquants

## Structure des Données GraphQL

### Query Requise

```graphql
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
    }
  }
}
```

### Query pour Liste des Éditeurs

```graphql
query ListEditors {
  listEditors {
    editorId
    name
    solutions {
      solutionId
      name
    }
  }
}
```

## Composants React Proposés

### 1. `HostingView.tsx` (Composant Principal)
- Gère la navigation hiérarchique
- Affiche les filtres
- Gère le switch entre vue cartes/tableau
- Orchestre les sous-composants

### 2. `EnvironmentCard.tsx` (Carte d'Environnement)
- Affiche les informations principales
- Gère l'expansion des détails
- Calcule l'indicateur de santé

### 3. `EnvironmentTable.tsx` (Vue Tableau)
- Tableau comparatif
- Tri et filtrage
- Actions sur les lignes

### 4. `HostingOverview.tsx` (Vue d'Ensemble)
- Métriques clés
- Graphiques de répartition (si nécessaire)

### 5. `HostingFilters.tsx` (Filtres)
- Filtres par type, provider, région, criticité
- Reset des filtres

## Calcul de l'Indicateur de Santé

L'indicateur de santé est calculé en fonction de critères critiques :

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

## Responsive Design

- **Desktop** : 2-3 cartes par ligne
- **Tablet** : 1-2 cartes par ligne
- **Mobile** : 1 carte par ligne, filtres en accordéon

## Intégration dans l'Application

### 1. Ajout dans la Navigation

Ajouter un nouvel onglet "Hébergement" dans `Navigation.tsx` :
- Icône : 🏗️ ou 🖥️
- Label : "Hébergement"
- Type : `'hosting'`

### 2. Ajout dans App.tsx

Ajouter le cas dans le switch :
```typescript
case 'hosting':
  return <HostingView />;
```

### 3. Permissions

Ajouter la permission d'accès à la page "hosting" dans les permissions par défaut :
- Admin : ✅
- Supervisor : ✅
- EntityDirector : ✅
- Editor : ✅ (lecture seule)

## Exemple de Rendu

```
┌─────────────────────────────────────────────────────────────┐
│  Hébergement - Solution: CRM Enterprise                     │
│  Éditeur: Acme Corp  >  Solution: CRM Enterprise           │
├─────────────────────────────────────────────────────────────┤
│  📊 Vue d'ensemble                                          │
│  • 4 environnements  • 1 Production  • 2 Test  • 1 Dev     │
│  • Santé globale: ⚠️ À améliorer                           │
│  • Coût total: 2,450 €/mois                                 │
├─────────────────────────────────────────────────────────────┤
│  🔍 Filtres: [Tous] [Production] [Test] [Dev] [Backup]      │
│  📋 Vue: [Cartes] [Tableau]                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ 🟥 PRODUCTION        │  │ 🟧 TEST              │        │
│  │ ⚠️ À améliorer       │  │ ✅ Optimal           │        │
│  ├──────────────────────┤  ├──────────────────────┤        │
│  │ 🏢 OVH Cloud         │  │ 🏢 Azure             │        │
│  │ 📍 France (Paris)    │  │ 📍 Europe (Ireland)  │        │
│  │ ☁️ Cloud             │  │ ☁️ Cloud             │        │
│  │ 🏅 ISO27001, HDS     │  │ 🏅 ISO27001, SOC2    │        │
│  │                      │  │                      │        │
│  │ 🔄 Redondance:       │  │ 🔄 Redondance:       │        │
│  │    Minimal ⚠️        │  │    Geo-redundant ✅  │        │
│  │                      │  │                      │        │
│  │ 💾 Backup:           │  │ 💾 Backup:           │        │
│  │    ✅ Existe         │  │    ✅ Existe         │        │
│  │    RTO: 12h          │  │    RTO: 4h           │        │
│  │    RPO: 2h           │  │    RPO: 1h           │        │
│  │                      │  │                      │        │
│  │ [▶ Voir détails]     │  │ [▶ Voir détails]     │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Prochaines Étapes

1. ✅ Validation de la proposition
2. Création des composants React
3. Création/extension des queries GraphQL si nécessaire
4. Intégration dans la navigation
5. Tests et ajustements UX
6. Documentation utilisateur

## Notes Techniques

- Utiliser Tailwind CSS pour le styling (cohérence avec le reste de l'app)
- Utiliser Apollo Client pour les queries GraphQL
- Gérer les états de chargement et d'erreur
- Implémenter la pagination si beaucoup d'environnements
- Optimiser les queries GraphQL pour éviter le N+1 problem

