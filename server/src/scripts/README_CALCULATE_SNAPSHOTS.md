# Scripts de Calcul de Snapshots

Ce dossier contient deux scripts pour calculer automatiquement des snapshots de scoring pour les éditeurs :

## 1. calculateHostingSnapshots.ts

### Description
Ce script calcule des snapshots de **bilan hosting** (type `snapshot`) pour un ou plusieurs éditeurs. Il parcourt toutes les solutions de chaque éditeur, trouve les environnements de production (ou le premier disponible), et calcule le score technique en utilisant le `ScoringEngineService`.

### Usage

```bash
# Depuis la racine du projet
cd server
npm run calculate-hosting-snapshots -- "Éditeur 1" "Éditeur 2" ...

# Exemple
npm run calculate-hosting-snapshots -- "GI Informatique" "Cogima"
```

### Fonctionnement

1. **Connexion à MongoDB** : Le script se connecte à la base de données MongoDB via la variable d'environnement `MONGO_URI`.

2. **Recherche des éditeurs** : Recherche les éditeurs par nom (insensible à la casse).

3. **Parcours des solutions** : Pour chaque éditeur trouvé, le script récupère toutes les solutions associées.

4. **Sélection de l'environnement** : Pour chaque solution, le script cherche un environnement dans l'ordre de priorité suivant :
   - Production (`env_type: 'production'`)
   - Test (`env_type: 'test'`)
   - Premier environnement disponible

5. **Calcul du score** : Utilise le `ScoringEngineService` pour calculer les scores par catégorie :
   - Sécurité (30%)
   - Résilience (20%)
   - Observabilité (15%)
   - Architecture (15%)
   - Conformité (20%)

6. **Création du snapshot** : Crée un `ScoringSnapshot` avec :
   - `collection_type: 'snapshot'`
   - `scoreId` unique généré automatiquement
   - Date du snapshot
   - Scores calculés et recommandations

### Résultat

Le script affiche :
- Les éditeurs trouvés
- Le nombre de solutions traitées
- Le nombre de snapshots créés avec succès
- Le nombre d'échecs (données manquantes, etc.)

## 2. calculateDDTech.ts

### Description
Ce script calcule des snapshots de **DD Tech (Due Diligence)** (type `DD`) pour un ou plusieurs éditeurs. Il fonctionne de la même manière que `calculateHostingSnapshots.ts`, mais crée des snapshots avec `collection_type: 'DD'`.

### Usage

```bash
# Depuis la racine du projet
cd server
npm run calculate-dd-tech -- "Éditeur 1" "Éditeur 2" ...

# Exemple
npm run calculate-dd-tech -- "GI Informatique" "Cogima"
```

### Différences avec calculateHostingSnapshots

- **Type de collecte** : Les snapshots créés ont `collection_type: 'DD'` au lieu de `'snapshot'`
- **Identifiant** : Le `scoreId` généré contient le préfixe `score-DD-` au lieu de `score-snapshot-`
- **Usage** : Destiné aux évaluations de Due Diligence technique lors d'acquisitions

## Prérequis

- MongoDB doit être accessible via `MONGO_URI`
- Les éditeurs, solutions, environnements et données associées doivent être présents dans la base de données
- Les données suivantes doivent être complètes pour chaque environnement :
  - `SecurityProfile`
  - `MonitoringObservability`
  - `CodeBase` (au niveau solution)
  - `DevelopmentMetrics` (au niveau solution)

## Gestion des erreurs

- **Éditeur non trouvé** : Le script affiche une liste des éditeurs disponibles
- **Données manquantes** : Si les données nécessaires au calcul sont incomplètes, le script affiche un avertissement et passe à la solution suivante
- **Aucun environnement** : Si aucune solution n'a d'environnement, le script affiche un avertissement

## Notes techniques

- Les scripts utilisent le `ScoringEngineService` existant pour le calcul des scores
- Les snapshots temporaires créés par le service sont supprimés et remplacés par des snapshots avec les bons `collection_type` et `scoreId`
- La recherche d'éditeurs est insensible à la casse et gère les espaces en début/fin de chaîne
- Les scripts sont compilés en JavaScript avant exécution (`npm run build`)

