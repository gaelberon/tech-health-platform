# Data Management

## Vue d'ensemble

La page **Data Management** permet la gestion complète des données des éditeurs, solutions et environnements. Cette interface offre un accès centralisé pour créer, modifier, archiver et consulter toutes les informations techniques stockées dans la plateforme.

## Accès

La page **Data Management** est accessible depuis le menu principal de l'application, directement après le **Dashboard**. Elle est disponible pour tous les types d'utilisateurs :

- **Admin** : Accès complet avec sélection d'éditeur
- **Supervisor** : Accès complet avec sélection d'éditeur
- **EntityDirector** : Accès limité à l'éditeur associé
- **Editor** : Accès limité à l'éditeur associé

## Fonctionnalités principales

### 1. Sélection d'éditeur

- **Pour Admin et Supervisor** : Un menu déroulant permet de sélectionner n'importe quel éditeur de la base de données
- **Pour EntityDirector et Editor** : L'éditeur associé au compte est automatiquement sélectionné (pas de choix)

### 2. Dashboard de l'éditeur

Une fois un éditeur sélectionné, un **dashboard court** affiche :

#### Vue Solutions
- **Nombre total de solutions** associées à l'éditeur
- **Liste des solutions** avec :
  - Nom
  - Type (SaaS, OnPrem, Hybrid, ClientHeavy)
  - Criticité produit (Low, Medium, High, Critical)
  - Statut d'archivage (si applicable)

#### Vue Environnements
- **Nombre total d'environnements** pour toutes les solutions
- **Répartition par type** :
  - Production
  - Test
  - Dev
  - Backup
- **Liste des environnements** avec leur type et solution associée

#### Vue financière agrégée
- **Coûts mensuels totaux** basés sur les environnements avec données financières :
  - Coût d'hébergement
  - Coût des licences
  - Coût des opérations (heures équivalentes)
  - **Total mensuel**
- **Note** : Indique le nombre d'environnements utilisés pour le calcul

### 3. Formulaire d'édition

Le formulaire permet de gérer toutes les données de l'éditeur sélectionné, organisé en onglets :

#### Onglet "Éditeur"
- **Informations générales** :
  - Nom
  - Pays
  - Taille (Micro, SME, Mid, Enterprise)
  - Criticité métier (Low, Medium, High, Critical)
  - Description
- **Informations DD** :
  - Systèmes IT internes
  - Stratégie de sécurité IT
  - Contrats à examiner

#### Onglet "Solutions"
- **Liste des solutions** avec possibilité de :
  - **Sélectionner une solution** pour modification
  - **Créer une nouvelle solution** (Admin/Supervisor uniquement)
  - **Archiver/Désarchiver** une solution (Admin/Supervisor uniquement)
  - **Afficher/Masquer les solutions archivées** (tous les utilisateurs)

- **Champs modifiables** :
  - Nom
  - Description
  - Cas d'usage principal
  - Type (SaaS, OnPrem, Hybrid, ClientHeavy)
  - Criticité produit (Low, Medium, High, Critical)
  - **Champs DD** :
    - Robustesse de l'API
    - Qualité de la documentation API
    - Clarté de la propriété intellectuelle
    - Modèle de licence
    - Conformité des licences assurée

#### Onglet "Environnements"
- **Liste des environnements** avec possibilité de :
  - **Sélectionner un environnement** pour modification
  - **Créer un nouvel environnement** (Admin/Supervisor uniquement)
  - **Archiver/Désarchiver** un environnement (Admin/Supervisor uniquement)
  - **Afficher/Masquer les environnements archivés** (tous les utilisateurs)

- **Champs modifiables** :
  - Solution associée
  - Type d'environnement (production, test, dev, backup)
  - Type de déploiement (monolith, microservices, hybrid)
  - Stack technique (array)
  - Types de données (array)
  - Redondance (none, minimal, geo-redundant, high)
  - **Configuration de sauvegarde** :
    - Existence de sauvegarde
    - Planification
    - RTO (Recovery Time Objective) en heures
    - RPO (Recovery Point Objective) en heures
    - Fréquence de test de restauration
  - **Champs DD** :
    - Mécanismes de sécurité réseau
    - Mécanisme de montée en charge de la base de données
    - Plan de reprise après sinistre
    - SLA offert

## Permissions et restrictions

### Création
- **Admin et Supervisor** : Peuvent créer de nouvelles solutions et environnements
- **EntityDirector et Editor** : Ne peuvent pas créer de nouvelles entités

### Archivage
- **Admin et Supervisor** : Peuvent archiver et désarchiver solutions et environnements
- **EntityDirector et Editor** : Ne peuvent pas archiver, mais peuvent voir les éléments archivés

### Visualisation
- **Tous les utilisateurs** : Peuvent voir les éléments archivés (affichés avec un fond gris et un badge "Archivé")
- **Toggle** : Bouton pour afficher/masquer les éléments archivés

## Archivage

L'archivage est un mécanisme de **soft delete** qui permet de :

- **Conserver les données** dans la base de données
- **Masquer par défaut** les éléments archivés dans les listes
- **Conserver l'historique** avec :
  - Date d'archivage (`archivedAt`)
  - Utilisateur ayant archivé (`archivedBy`)
  - Statut d'archivage (`archived: true/false`)

### Utilisation
- Les éléments archivés sont **toujours visibles** dans la page Data Management
- Ils sont **affichés avec un fond gris** et un badge "Archivé"
- Un bouton permet de **basculer l'affichage** pour montrer/masquer les éléments archivés
- Les éléments archivés peuvent être **désarchivés** par un Admin ou Supervisor

## Workflow recommandé

1. **Sélectionner un éditeur** (si Admin/Supervisor)
2. **Consulter le dashboard** pour avoir une vue d'ensemble
3. **Naviguer vers l'onglet "Éditer les données"**
4. **Modifier les informations** selon les besoins :
   - Mettre à jour les informations de l'éditeur
   - Créer de nouvelles solutions si nécessaire
   - Créer de nouveaux environnements pour les solutions
   - Archiver les solutions/environnements obsolètes
5. **Sauvegarder** les modifications

## Intégration avec d'autres fonctionnalités

### Tech Profiler (Collector)
Les données créées/modifiées dans Data Management sont utilisables dans le **Tech Profiler** pour la collecte de données techniques.

### Vue Hébergement
Les environnements et leurs configurations d'hébergement sont visibles dans la **Vue Hébergement**.

### Vue DD Tech
Les données complètes de l'éditeur, solutions et environnements sont accessibles dans la **Vue DD Tech** pour l'évaluation pré-acquisition.

### Scoring Engine
Les modifications des données peuvent déclencher un **recalcul des scores** via le moteur de scoring.

## Notes techniques

- **GraphQL** : Toutes les opérations utilisent des mutations GraphQL
- **Validation** : Les données sont validées côté serveur selon le schéma GraphQL
- **Permissions** : Les permissions sont vérifiées côté serveur pour chaque opération
- **Cache** : Les données sont mises en cache par Apollo Client et rafraîchies automatiquement après modification

## Pour une description détaillée des champs

Pour une description complète des champs et de leur signification, consultez la section [Modèle de Données](../../about#data-model) dans la documentation "About".

