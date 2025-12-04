# Script de Fusion de Deux Éditeurs

## Description

Ce script permet de fusionner deux éditeurs en déplaçant toutes les données de l'éditeur source vers l'éditeur destination, puis en supprimant l'éditeur source.

## Prérequis

1. MongoDB doit être accessible (variable d'environnement `MONGO_URI` configurée)
2. Les dépendances npm doivent être installées (`npm install`)

## Utilisation

```bash
cd server
npm run merge-editors -- "Éditeur Source" "Éditeur Destination"
```

**Important** : Les noms des éditeurs doivent être exactement ceux enregistrés dans la base de données (respecte la casse).

**Exemple** :
```bash
npm run merge-editors -- "GI Informatique" "Cogima"
```

## Fonctionnement

Le script effectue les étapes suivantes :

1. **Connexion à MongoDB**
2. **Recherche des deux éditeurs** par nom exact
3. **Audit complet** : Liste toutes les entités qui seront fusionnées
4. **Affichage du résumé** : Affiche un rapport détaillé de ce qui sera fusionné
5. **Demande de confirmation** : L'utilisateur doit répondre "oui" pour confirmer
6. **Fusion des données** : Déplace toutes les données du source vers le destination
7. **Suppression de l'éditeur source**

## Ordre de Fusion

Le script fusionne les entités dans l'ordre suivant :

1. **Solutions** : Toutes les solutions de l'éditeur source sont déplacées vers le destination (mise à jour de `editorId`)

2. **Données liées aux Solutions** (automatiquement déplacées car liées par `solutionId`) :
   - Codebases
   - DevelopmentMetrics
   - AIFeatures
   - ScoringSnapshots
   - RoadmapItems (liés aux Solutions)

3. **Environnements** (automatiquement déplacés car liés aux Solutions) :
   - Tous les environnements des solutions déplacées

4. **Données liées aux Environnements** (automatiquement déplacées car liées par `envId`) :
   - SecurityProfiles
   - MonitoringObservability
   - EntityCosts
   - PerformanceMetrics
   - RoadmapItems (liés aux Environments)

5. **Documents** : Tous les documents liés à l'éditeur source, ses solutions et environnements sont déplacés vers le destination

6. **DevelopmentTeam** :
   - Si le destination a déjà un DevelopmentTeam : le DevelopmentTeam source est supprimé
   - Si le destination n'a pas de DevelopmentTeam : le DevelopmentTeam source est déplacé vers le destination

7. **Éditeur Source** : Supprimé après la fusion

## Résumé Affiché

Le script affiche un résumé détaillé incluant :

- **Éditeur Source** : Nom, ID, DevelopmentTeam (sera supprimé)
- **Éditeur Destination** : Nom, ID, DevelopmentTeam (recevra toutes les données)
- **Solutions à déplacer** : Liste de toutes les solutions avec leurs IDs
- **Données liées aux Solutions** : Codebases, DevelopmentMetrics, AIFeatures, ScoringSnapshots
- **Environnements à déplacer** : Liste de tous les environnements avec leurs types et solutions associées
- **Données liées aux Environnements** : SecurityProfiles, MonitoringObservability, EntityCosts, PerformanceMetrics
- **Autres données** : RoadmapItems, Documents
- **Hébergements** : Liste des hostings utilisés (seront conservés, pas de modification)
- **Total** : Nombre total d'entités qui seront déplacées

## Confirmation

Avant de fusionner, le script demande confirmation :

```
⚠️  Êtes-vous sûr de vouloir fusionner "Éditeur Source" dans "Éditeur Destination" ? (oui/non):
```

Réponses acceptées pour confirmer :
- `oui`
- `o`
- `yes`
- `y`

Toute autre réponse annule la fusion.

## Exemple d'Utilisation

```bash
cd server
npm run merge-editors -- "GI Informatique" "Cogima"
```

Sortie attendue :

```
📡 Connexion à MongoDB...
✅ Connecté à MongoDB: cluster0.xxxxx.mongodb.net

🔍 Recherche des éditeurs...
   Source: "GI Informatique"
   Destination: "Cogima"

================================================================================
📋 RÉSUMÉ DE LA FUSION DES ÉDITEURS
================================================================================

📌 Éditeur Source (sera supprimé après fusion):
   - Nom: GI Informatique
   - ID: editor-gi-informatique
   - DevelopmentTeam: 1

📌 Éditeur Destination (recevra toutes les données):
   - Nom: Cogima
   - ID: editor-cogima
   - DevelopmentTeam: 0

💼 Solutions à déplacer (2):
   1. WinLogic (solution-gi-informatique-winlogic)
   2. WinGip (solution-gi-informatique-wingip)

📦 Données liées aux Solutions à déplacer:
   - Codebases: 2
   - DevelopmentMetrics: 2
   - AIFeatures: 0
   - ScoringSnapshots: 5

🌍 Environnements à déplacer (4):
   1. WinLogic - production (env-gi-informatique-winlogic-production)
   2. WinLogic - test (env-gi-informatique-winlogic-test)
   3. WinGip - production (env-gi-informatique-wingip-production)
   4. WinGip - dev (env-gi-informatique-wingip-dev)

🔒 Données liées aux Environnements à déplacer:
   - SecurityProfiles: 4
   - MonitoringObservability: 4
   - EntityCosts: 4
   - PerformanceMetrics: 0

📋 Autres données à déplacer:
   - RoadmapItems: 3
   - Documents: 2

🏗️  Hébergements utilisés (seront conservés):
   1. OVH (hosting-ovh-1)
      Utilisé par: WinLogic, WinGip

================================================================================
📊 TOTAL: 28 entité(s) seront déplacée(s) vers "Cogima"
🗑️  L'éditeur "GI Informatique" sera supprimé après la fusion
================================================================================

⚠️  Êtes-vous sûr de vouloir fusionner "GI Informatique" dans "Cogima" ? (oui/non): oui

🔄 Début de la fusion...

✅ 2 Solution(s) déplacée(s) vers "Cogima"
✅ 2 Document(s) déplacé(s)
✅ DevelopmentTeam source déplacé vers "Cogima"
✅ Éditeur source "GI Informatique" supprimé

✅ Fusion terminée avec succès !

📊 Résumé:
   - 2 solution(s) fusionnée(s)
   - 4 environnement(s) fusionné(s)
   - Toutes les données associées ont été déplacées vers "Cogima"
   - L'éditeur "GI Informatique" a été supprimé

✅ Déconnecté de MongoDB
```

## Sécurité

- ⚠️ **Action irréversible** : La fusion est définitive et ne peut pas être annulée
- ✅ **Confirmation requise** : L'utilisateur doit explicitement confirmer avant fusion
- ✅ **Audit complet** : Toutes les données à fusionner sont listées avant confirmation
- ✅ **Vérification des noms** : Le script vérifie que les deux éditeurs existent et sont différents
- ✅ **Conservation des Hostings** : Les hostings ne sont pas modifiés, seulement listés pour information

## Gestion des DevelopmentTeams

Le script gère intelligemment les DevelopmentTeams :

- **Si le destination a déjà un DevelopmentTeam** : Le DevelopmentTeam source est supprimé (pour éviter les doublons)
- **Si le destination n'a pas de DevelopmentTeam** : Le DevelopmentTeam source est déplacé vers le destination

## Gestion des Erreurs

- Si l'un des éditeurs n'est pas trouvé, le script affiche un message d'erreur et s'arrête
- Si les deux éditeurs ont le même nom, le script refuse la fusion
- Si une erreur survient pendant la fusion, le script affiche l'erreur et s'arrête
- La connexion MongoDB est toujours fermée proprement, même en cas d'erreur

## Notes

- Les **Solutions** sont déplacées en mettant à jour leur `editorId` vers l'éditeur destination
- Les **Environnements** restent liés aux mêmes solutions (pas de modification nécessaire)
- Les **Hostings** ne sont pas modifiés (ils peuvent être partagés entre plusieurs environnements)
- Les **Documents** et **RoadmapItems** sont mis à jour pour pointer vers l'éditeur destination
- Toutes les **données liées** (Codebases, SecurityProfiles, etc.) sont automatiquement conservées car elles sont liées par leurs clés étrangères (solutionId, envId)

## Cas d'Usage

Ce script est utile pour :
- **Consolidation** : Fusionner deux éditeurs après une acquisition
- **Correction de données** : Corriger des doublons d'éditeurs
- **Réorganisation** : Réorganiser la structure des données

