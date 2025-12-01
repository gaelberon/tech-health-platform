# Tech Health Platform

**Standardized Technical Health Assessment and Monitoring Platform**

## Introduction

Ce projet vise à établir une **plateforme centralisée et standardisée** pour l'évaluation, la quantification et le suivi de la **santé technique** des éditeurs de logiciels niche (actuels et cibles d'acquisition) du portefeuille du fonds d'investissement.

La plateforme est conçue pour supporter deux usages principaux :
- **Évaluation pré-acquisition** : Via la vue **"Technical DD"** (Due Diligence Technique)
- **Monitoring continu** : Suivi des problématiques techniques post-acquisition

## Objectifs et Fonctionnalités Clés

L'objectif principal est de fournir un **score standardisé** et des vues analytiques pour prioriser les actions de remédiation, les audits de sécurité et les investissements en modernisation ou consolidation.

### 1. Moteur de Scoring et Notation

Le scoring est calculé par un service backend (`Scoring Engine`) qui génère un instantané (`ScoringSnapshot`) de la maturité technique. Le score global (0–100) est décomposé selon les catégories pondérées suivantes :

| Catégorie | Pondération | Rôle |
| :--- | :--- | :--- |
| **Sécurité** | 30% | Audit, Authentification (MFA/SSO), Tests de pénétration |
| **Résilience & Continuité** | 20% | Sauvegarde (RTO/RPO), Redondance, DRP |
| **Conformité & Certifications** | 20% | RGPD, ISO 27001, HDS, Ségur, SOX/SOC1 |
| **Observabilité & Opérations** | 15% | Monitoring de performance, Centralisation des logs |
| **Architecture & Scalabilité** | 15% | Type de déploiement, Capacité de mise à l'échelle |

### 2. Collecte et Vues (Frontend)

L'application supporte plusieurs interfaces utilisateur :

- **Collector UI** : Formulaire guidé (stepper) utilisant la *Progressive Disclosure* pour une collecte progressive des données (priorités P1 à P5)
- **Portfolio View** : Permet la comparaison, le filtrage et l'affichage de *heatmaps* (maturité / risque / coûts) pour toutes les solutions du groupe
- **Technical DD View** : Vue agrégée de tous les champs pertinents pour l'évaluation pré-acquisition
- **Administration** : Module d'administration modulaire pour gérer les utilisateurs, permissions, listes de valeurs et pistes d'audit

### 3. Fonctionnalités Récentes

#### Authentification et Gestion des Utilisateurs
- ✅ Système d'authentification JWT avec cookies HttpOnly
- ✅ Gestion multi-rôles (Admin, Supervisor, EntityDirector, Editor)
- ✅ Support de plusieurs comptes par email (sélection de compte)
- ✅ Gestion complète des utilisateurs (création, édition, archivage, restauration)
- ✅ Contrôle d'accès basé sur les rôles (RBAC)

#### Administration Modulaire
- ✅ **Gestion des Permissions** : Configuration des permissions par rôle et opération
- ✅ **Gestion des Listes de Valeurs** : Administration dynamique des menus déroulants (lookups)
- ✅ **Gestion des Utilisateurs** : CRUD complet avec archivage
- ✅ **Droits d'accès aux pages** : Configuration des permissions d'accès par rôle et page
- ✅ **Pistes d'audit** : Consultation des logs d'audit avec filtres avancés

#### Système de Pistes d'Audit
- ✅ Enregistrement automatique de toutes les modifications (CREATE, UPDATE, DELETE, ARCHIVE, RESTORE)
- ✅ Traçabilité complète : qui, quoi, quand, comment
- ✅ Interface d'administration pour consulter les logs avec filtres (entité, utilisateur, action, période)
- ✅ Sécurité : immutabilité des logs, accès restreint aux Admin/Supervisor

#### Gestion Dynamique des Données
- ✅ Lookups dynamiques : Les menus déroulants sont gérés via MongoDB et peuvent être modifiés sans redéploiement
- ✅ Organisation hiérarchique : Lookups organisés par entité et criticité (P1, P2, etc.)
- ✅ Recherche avancée : Recherche par nom de formulaire, clé technique, description

## Architecture Technique

La plateforme est basée sur une architecture Monorepo utilisant TypeScript pour la cohérence entre le frontend et le backend. L'API est construite autour de GraphQL pour une flexibilité maximale dans la récupération des données.

| Composant | Technologie | Rôle |
| :--- | :--- | :--- |
| **Frontend** | React.js + TypeScript | Interface utilisateur (UI Collector, Dashboard, Administration) |
| **Backend API** | Node.js + Express.js | Logique métier, Moteur de scoring |
| **API Layer** | GraphQL (Apollo Server) | Requêtes flexibles pour les vues complexes (DD, Portfolio) |
| **Base de Données** | MongoDB | Stockage des données DD/CIEC (schéma semi-structuré/évolutif) |
| **Authentification** | JWT + HttpOnly Cookies | Sécurité et gestion de session |
| **Infrastructure** | OVHCloud VPS + Docker | Déploiement conteneurisé en France |
| **Outils de Dev** | GitHub Actions | CI/CD et automatisation |

## Modèle de Données

Le modèle de données fusionne l'inventaire CIEC avec des entités spécifiques au DD technique pour capturer les aspects de gouvernance et de processus.

### Entités Principales

- **`Editor`** : Éditeur de logiciels (entité racine)
- **`Solution`** : Solution logicielle développée par l'éditeur
- **`Environment`** : Environnements d'exécution (Production, Test, Dev, Backup)
- **`Hosting`** : Informations d'hébergement
- **`SecurityProfile`** : Profil de sécurité (critique pour scoring Sécurité 30%)
- **`MonitoringObservability`** : Observabilité et monitoring (critique pour scoring Observabilité 15%)
- **`EntityCost`** : Coûts associés à un environnement
- **`ScoringSnapshot`** : Instantané de scoring (résultat du moteur de scoring)

### Entités Due Diligence

- **`Codebase`** : Gestion du code source, documentation, dépendances, dette technique
- **`DevelopmentMetrics`** : Métriques DevOps (SDLC, CI/CD, MTTR, Lead Time)
- **`DevelopmentTeam`** : Équipe de développement et dépendances
- **`AIFeatures`** : Fonctionnalités IA (services externes vs modèles propres)
- **`RoadmapItem`** : Éléments de roadmap (refactor, migration, security, feature)
- **`Document`** : Documents associés (diagrammes, pentests, contrats)

### Entités d'Administration

- **`User`** : Utilisateurs avec rôles et permissions
- **`Lookup`** : Listes de valeurs dynamiques pour les menus déroulants
- **`Permission`** : Permissions par rôle et opération
- **`PageAccessPermission`** : Permissions d'accès aux pages par rôle
- **`AuditLog`** : Logs d'audit pour la traçabilité

## Sécurité et Conformité

### Authentification
- JWT stocké dans des cookies HttpOnly (protection XSS)
- Support de plusieurs comptes par email avec sélection
- Contrôle d'accès basé sur les rôles (RBAC)

### Pistes d'Audit
- Enregistrement automatique de toutes les modifications
- Collection MongoDB dédiée (`audit_logs`) pour immutabilité
- Accès restreint aux Admin/Supervisor
- Traçabilité complète : qui, quoi, quand, comment

### Conformité
- Support des certifications (ISO 27001, HDS, SOC2, etc.)
- Gestion des données sensibles (RGPD)
- Traçabilité complète pour audits externes

## Installation et Démarrage

### Prérequis
- Node.js 18+
- MongoDB (local ou Atlas)
- npm ou yarn

### Configuration

1. **Variables d'environnement** (`server/.env`) :
```env
MONGO_URI=mongodb://localhost:27017/tech-health-platform
JWT_SECRET=votre-secret-jwt-solide
NODE_ENV=development
```

2. **Installation des dépendances** :
```bash
# Backend
cd server
npm install

# Frontend
cd client
npm install
```

3. **Démarrage** :
```bash
# Backend (port 4000)
cd server
npm start

# Frontend (port 5173)
cd client
npm run dev
```

### Utilisateur Admin par Défaut

Au premier démarrage, un utilisateur admin est créé automatiquement :
- **Email** : `admin@example.com`
- **Mot de passe** : `ChangeMe123!`

⚠️ **Important** : Changez ce mot de passe immédiatement en production !

## Structure du Projet

```
tech-health-platform/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── graphql/        # Queries et mutations GraphQL
│   │   ├── hooks/          # Hooks React personnalisés
│   │   ├── session/        # Gestion de session
│   │   └── utils/          # Utilitaires
│   └── public/             # Assets statiques
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── models/         # Modèles Mongoose
│   │   ├── graphql/        # Schéma et resolvers GraphQL
│   │   ├── services/       # Services métier
│   │   ├── config/         # Configuration et seeds
│   │   └── index.ts        # Point d'entrée
│   └── .env                # Variables d'environnement
├── common/                 # Types partagés
│   └── types/              # Interfaces TypeScript communes
├── docs/                   # Documentation
│   └── AUDIT_TRAIL_BEST_PRACTICES.md
└── README.md              # Ce fichier
```

## Documentation

- **Vue d'ensemble** : Page "About" de l'application
- **Données collectées** : Documentation complète des entités et champs (onglet "Données collectées")
- **Pistes d'audit** : Bonnes pratiques et implémentation (onglet "Pistes d'audit" ou `docs/AUDIT_TRAIL_BEST_PRACTICES.md`)

## Développement

### Scripts Disponibles

**Backend** :
- `npm start` : Compile et démarre le serveur
- `npm run build` : Compile TypeScript
- `npm run dev` : Mode développement (si configuré)

**Frontend** :
- `npm run dev` : Démarre le serveur de développement Vite
- `npm run build` : Build de production
- `npm run preview` : Prévisualise le build de production

## Contribution

Ce projet est développé pour le Centre d'Opérations Techniques (COT) du fonds d'investissement.

## Licence

Propriétaire - Tous droits réservés

---

**Centre d'Opérations Techniques (COT) - Tech Health Platform**
