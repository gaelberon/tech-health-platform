# Script d'Import CSV

## Description

Ce script permet d'importer les données depuis le fichier CSV `data/Editeurs-Overview - Data.csv` dans la base de données MongoDB.

## Prérequis

1. MongoDB doit être accessible (variable d'environnement `MONGO_URI` configurée)
2. Le fichier CSV doit être présent dans `data/Editeurs-Overview - Data.csv`
3. Les dépendances npm doivent être installées (`npm install`)

## Utilisation

```bash
cd server
npm run import-csv
```

Ou directement avec ts-node :

```bash
cd server
npx ts-node --esm src/scripts/importCSV.ts
```

## Fonctionnement

Le script :

1. **Se connecte à MongoDB** via la configuration dans `src/config/db.ts`
2. **Parse le fichier CSV** en utilisant `csv-parse`
3. **Crée ou met à jour les entités** dans l'ordre hiérarchique suivant :
   - **Editor** : Éditeur de la solution
   - **Solution** : Solution logicielle (peut être multiple par ligne si séparée par des virgules)
   - **Hosting** : Hébergement de l'environnement
   - **Environment** : Environnement (production, test, dev, backup)
   - **SecurityProfile** (optionnel) : Profil de sécurité si des données sont disponibles
   - **MonitoringObservability** (optionnel) : Observabilité si des données sont disponibles
   - **EntityCost** (optionnel) : Coûts si des données sont disponibles

## Mapping des colonnes CSV

### Editor
- `A1. Éditeur` → `name`
- `B3. Localisation` → `country`

### Solution
- `A2. Solution` → `name` (peut contenir plusieurs solutions séparées par des virgules)
- `A4. Fonction principale` → `description` et `main_use_case`
- `A5. Type de Solution Logicielle` → `type` (mappé vers SaaS/OnPrem/Hybrid/ClientHeavy)

### Hosting
- `B1. Type d'hébergement` → `tier` (mappé vers datacenter/private/public/cloud)
- `B2. Hébergeur` → `provider`
- `B3. Localisation` → `region`

### Environment
- `A3. Environnement` → `env_type` (mappé vers production/test/dev/backup)
- `B8. Tech Stack (Langages/BDD)` → `tech_stack` (array)
- `D3. Sauvegarde (RTO/RPO)` → `backup` (objet avec exists, schedule, rto, rpo)
- `D4. Redondance` → `redundancy` (mappé vers none/minimal/geo-redundant/high)
- `B6. Montée en charge` → `db_scaling_mechanism`

### SecurityProfile (optionnel)
- Créé seulement si `D5. Cybersécurité` ou `D2. Conformité & Réglementation` contient des données

### MonitoringObservability (optionnel)
- `C1. Monitoring de la performance` → `perf_monitoring`
- `C2. Centralisation des logs` → `log_centralization`
- `C3. Outils utilisés` → `tools` (array)

### EntityCost (optionnel)
- `E5. Coût d'hébergement (annuel)` → `hosting_monthly` (divisé par 12)
- `E6. Coût des licences PaaS / IaaS (annuel)` → `licenses_monthly` (divisé par 12)
- `G3. Notes générales` → `comments`

## Gestion des valeurs manquantes

Le script ignore automatiquement les valeurs suivantes :
- `MANQUANT (a completer manuellement)`
- `TBD`
- `N/A`
- `#ERROR!`
- Chaînes vides

Ces valeurs sont traitées comme `undefined` et ne sont pas enregistrées dans la base de données.

## Génération des IDs

Les IDs sont générés automatiquement à partir des noms :
- Format : `{prefix}-{nom-normalisé}`
- Exemple : `editor-gi-informatique`, `solution-winlogic`, `env-production`

## Comportement

- **Création** : Si une entité n'existe pas, elle est créée
- **Mise à jour** : Si une entité existe déjà (même ID), elle n'est pas modifiée (sauf pour Editor.country si manquant)
- **Relations** : Les relations entre entités sont automatiquement établies via les ObjectId MongoDB

## Résumé

À la fin de l'exécution, le script affiche un résumé avec :
- Nombre d'Editors créés/mis à jour
- Nombre de Solutions créées/mises à jour
- Nombre de Hostings créés/mis à jour
- Nombre d'Environments créés/mis à jour

## Notes

- Le script est idempotent : il peut être exécuté plusieurs fois sans créer de doublons
- Les erreurs sur une ligne n'arrêtent pas le traitement des autres lignes
- Les logs détaillent chaque création d'entité pour faciliter le débogage

