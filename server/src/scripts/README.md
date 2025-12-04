# Scripts de Gestion de la Base de Données

Ce dossier contient plusieurs scripts utilitaires pour gérer les données de la plateforme Tech Health Platform.

## Scripts disponibles

### 1. Import CSV
**Fichier** : `importCSV.ts`  
**Documentation** : [README_IMPORT_CSV.md](./README_IMPORT_CSV.md)  
**Commande** : `npm run import-csv`

Importe les données depuis un fichier CSV (`data/Editeurs-Overview - Data.csv`) dans la base de données MongoDB.

### 2. Suppression d'éditeur
**Fichier** : `deleteEditor.ts`  
**Documentation** : [README_DELETE_EDITOR.md](./README_DELETE_EDITOR.md)  
**Commande** : `npm run delete-editor -- "Nom de l'éditeur"`

Supprime un éditeur et toutes ses données associées de manière sécurisée avec confirmation utilisateur.

### 3. Fusion d'éditeurs
**Fichier** : `mergeEditors.ts`  
**Documentation** : [README_MERGE_EDITORS.md](./README_MERGE_EDITORS.md)  
**Commande** : `npm run merge-editors -- "Éditeur Source" "Éditeur Destination"`

Fusionne deux éditeurs en déplaçant toutes les données de l'éditeur source vers l'éditeur destination.

### 4. Calcul de snapshots de bilan hosting
**Fichier** : `calculateHostingSnapshots.ts`  
**Documentation** : [README_CALCULATE_SNAPSHOTS.md](./README_CALCULATE_SNAPSHOTS.md)  
**Commande** : `npm run calculate-hosting-snapshots -- "Éditeur 1" "Éditeur 2" ...`

Calcule des snapshots de scoring (type `snapshot`) pour un ou plusieurs éditeurs.

### 5. Calcul de DD Tech
**Fichier** : `calculateDDTech.ts`  
**Documentation** : [README_CALCULATE_SNAPSHOTS.md](./README_CALCULATE_SNAPSHOTS.md)  
**Commande** : `npm run calculate-dd-tech -- "Éditeur 1" "Éditeur 2" ...`

Calcule des snapshots de Due Diligence technique (type `DD`) pour un ou plusieurs éditeurs.

## Prérequis communs

Tous les scripts nécessitent :

1. **MongoDB accessible** : La variable d'environnement `MONGO_URI` doit être configurée
2. **Dépendances installées** : `npm install` doit avoir été exécuté
3. **Compilation** : Les scripts sont compilés automatiquement avant exécution (`npm run build`)

## Utilisation générale

Tous les scripts suivent le même pattern :

```bash
cd server
npm run <nom-du-script> -- [arguments]
```

Les scripts sont compilés en JavaScript avant exécution pour éviter les problèmes de module ESM/CommonJS.

## Sécurité

- ⚠️ **Actions irréversibles** : Les scripts de suppression et de fusion sont définitifs
- ✅ **Confirmations requises** : Les scripts critiques demandent confirmation avant exécution
- ✅ **Audits complets** : Les scripts affichent un résumé détaillé avant toute action
- ✅ **Gestion d'erreurs** : Tous les scripts gèrent les erreurs proprement

## Notes techniques

- Les scripts utilisent directement `mongoose.connect()` pour éviter les problèmes d'import ESM
- Les scripts sont compilés en JavaScript avant exécution (`npm run build`)
- Les imports de modèles utilisent l'extension `.js` pour pointer vers les fichiers compilés
- La recherche d'éditeurs est insensible à la casse et gère les espaces
