# tech-health-platform - Summary
Tech-Health-Platform standardise l'audit technique (Due Diligence et suivi) des éditeurs via un scoring des risques (sécurité, dette). Construite sur une stack flexible (React, Node.js, GraphQL, Mongo), elle assure performance et souveraineté grâce à un déploiement conteneurisé sur VPS OVH France.

# Plateforme de Notation et de Suivi de la Santé Technique des Éditeurs

## Introduction

Ce projet vise à établir une **plateforme centralisée et standardisée** pour l'évaluation, la quantification et le suivi de la **santé technique** des éditeurs de logiciels niche (actuels et cibles d'acquisition) du portefeuille du fonds d'investissement.

La plateforme est conçue pour supporter deux usages principaux : l'évaluation préalable à l'acquisition via la vue **"Technical DD"** (Due Diligence Technique) et le monitoring continu des problématiques techniques post-acquisition.

## Objectifs et Fonctionnalités Clés

L'objectif principal est de fournir un **score standardisé** et des vues analytiques pour prioriser les actions de remédiation, les audits de sécurité et les investissements en modernisation ou consolidation.

### 1. Moteur de Scoring et Notation

Le scoring est calculé par un service backend (`Scoring Engine`) qui génère un instantané (`ScoringSnapshot`) de la maturité technique. Le score global (0–100) est décomposé selon les catégories pondérées suivantes:

| Catégorie | Pondération Cible | Rôle |
| :--- | :--- | :--- |
| **Sécurité** | 30% | Audit, Authentification (MFA/SSO), Tests de pénétration. |
| **Résilience & Continuité** | 20% | Sauvegarde (RTO/RPO), Redondance, DRP (`disaster_recovery_plan`). |
| **Conformité & Certifications** | 20% | RGPD, ISO 27001, HDS, Ségur, SOX/SOC1. |
| **Observabilité & Opérations** | 15% | Monitoring de performance, Centralisation des logs (`log_centralization`). |
| **Architecture & Scalabilité** | 15% | Type de déploiement, Capacité de mise à l'échelle (`db_scaling_mechanism`). |

### 2. Collecte et Vues (Frontend)

L'application doit supporter deux interfaces utilisateur clés :
*   **Collector UI :** Formulaire guidé (stepper) utilisant la *Progressive Disclosure* pour une collecte progressive des données (priorités P1 à P5).
*   **Portfolio View :** Permet la comparaison, le filtrage et l'affichage de *heatmaps* (maturité / risque / coûts) pour toutes les solutions du groupe.
*   **Technical DD View :** Vue agrégée de tous les champs pertinents pour l'évaluation pré-acquisition.

## Architecture Technique

La plateforme est basée sur une architecture Monorepo utilisant TypeScript pour la cohérence entre le frontend et le backend. L'API est construite autour de GraphQL pour une flexibilité maximale dans la récupération des données.

| Composant | Technologie | Rôle |
| :--- | :--- | :--- |
| **Frontend** | React.js + TypeScript | Interface utilisateur (UI Collector et Dashboard). |
| **Backend API** | Node.js + Express.js | Logique métier, Moteur de scoring. |
| **API Layer** | GraphQL (Apollo Server) | Requêtes flexibles pour les vues complexes (DD, Portfolio). |
| **Base de Données** | MongoDB | Stockage des données DD/CIEC (schéma semi-structuré/évolutif). |
| **Infrastructure** | OVHCloud VPS + Docker | Déploiement conteneurisé en France [Context]. |
| **Outils de Dev** | GitHub Actions | CI/CD et automatisation. |

## Modèle de Données (Focus Due Diligence)

Le modèle de données fusionne l'inventaire CIEC avec des entités spécifiques au DD technique pour capturer les aspects de gouvernance et de processus.

*   **`Codebase`** : Capture la gestion du code source (`repo_location`), le niveau de documentation, les dépendances critiques (`third_party_dependencies`), la dette technique connue (`technical_debt_known`) et la gestion des systèmes hérités (`legacy_systems`).
*   **`DevelopmentMetrics`** : Intègre les métriques DevOps critiques : `sdlc_process`, niveau d'automatisation CI/CD, rapport planifié/non planifié, *Mean Time to Restore* (`mttr_hours`), et *Lead Time for Changes*.
*   **`AIFeatures`** : Évalue les solutions d'Intelligence Artificielle (utilisation de services externes vs. modèles propres, validation de la qualité `quality_validation_method`, et *continuous improvement*).
*   **`Solution` (Enrichie)** : Permet le suivi de la propriété intellectuelle (`ip_ownership_clear`) et la conformité des licences tierces (`license_compliance_assured`).
*   **`SecurityProfile` (Enrichi)** : Suit les audits récents (`internal_audits_recent`), les failles de sécurité connues, et le processus de gestion des incidents de sécurité.
*   **`Environment` (Enrichi)** : Gère la continuité d'activité (`disaster_recovery_plan`) et la fréquence de test de restauration des sauvegardes (`backup.restoration_test_frequency`).

## Résumé du Projet

La plateforme **Tech-Health-Platform** est l'outil stratégique du CTO pour standardiser l'évaluation technique des éditeurs de logiciels niche, essentielle tant pour la Due Diligence Technique avant acquisition que pour le suivi continu des entités existantes. Le système unifié rassemble des indicateurs opérationnels (CIEC) et de gouvernance (DD) au sein d'un modèle de données flexible, basé sur des entités comme `Codebase` et `DevelopmentMetrics`. Ce modèle permet d'évaluer des aspects critiques tels que la dette technique, les processus de développement (MTTR), et la gestion des innovations comme l'IA (`AIFeatures`).

Techniquement, la plateforme s'appuie sur une stack moderne et performante, privilégiant **React.js et Node.js/TypeScript** dans une architecture orientée **GraphQL** pour garantir la flexibilité nécessaire à la création de vues analytiques complexes (comme les *heatmaps* de la "Portfolio View"). La persistance est assurée par **MongoDB**, adapté aux schémas évolutifs inhérents à l'évaluation technique. Le déploiement sur **OVHCloud VPS** en France [Context] assure une infrastructure stable et une gouvernance des données sous contrôle, répondant aux enjeux de souveraineté et de mutualisation de l'hébergement observés au sein du portefeuille (où OVH est un hébergeur récurrent).
