# Script de Suppression en Cascade d'un Éditeur

## Description

Ce script permet de supprimer un éditeur et **toutes ses données associées** de manière sécurisée avec confirmation utilisateur.

## Prérequis

1. MongoDB doit être accessible (variable d'environnement `MONGO_URI` configurée)
2. Les dépendances npm doivent être installées (`npm install`)

## Utilisation

```bash
cd server
npm run delete-editor -- "Nom de l'éditeur"
```

**Important** : Le nom de l'éditeur doit être exactement celui enregistré dans la base de données (respecte la casse).

## Fonctionnement

Le script effectue les étapes suivantes :

1. **Connexion à MongoDB**
2. **Recherche de l'éditeur** par nom exact
3. **Audit complet** : Liste toutes les entités qui seront supprimées
4. **Affichage du résumé** : Affiche un rapport détaillé de ce qui sera supprimé
5. **Demande de confirmation** : L'utilisateur doit répondre "oui" pour confirmer
6. **Suppression en cascade** : Supprime toutes les données dans l'ordre approprié

## Ordre de Suppression

Le script supprime les entités dans l'ordre suivant (pour respecter les contraintes de clés étrangères) :

1. **Données liées aux Environments** :
   - SecurityProfiles
   - MonitoringObservability
   - EntityCosts

2. **Environments**

3. **Hostings** (seulement ceux qui ne sont plus utilisés par d'autres environnements)

4. **Données liées aux Solutions** :
   - Codebases
   - DevelopmentMetrics
   - AIFeatures
   - ScoringSnapshots
   - RoadmapItems (liés aux Solutions)

5. **Solutions**

6. **DevelopmentTeam** (lié à l'Editor)

7. **Documents** (liés à Editor, Solutions ou Environments)

8. **Editor** (entité principale)

## Résumé Affiché

Le script affiche un résumé détaillé incluant :

- **Éditeur** : Nom et ID
- **Équipe de développement** : Nombre de DevelopmentTeam
- **Solutions** : Liste de toutes les solutions avec leurs IDs
- **Données liées aux Solutions** : Codebases, DevelopmentMetrics, AIFeatures, ScoringSnapshots
- **Environnements** : Liste de tous les environnements avec leurs types
- **Données liées aux Environnements** : SecurityProfiles, MonitoringObservability, EntityCosts
- **Autres données** : RoadmapItems, Documents
- **Hébergements** : Liste des hostings qui seront supprimés (seulement ceux non utilisés ailleurs)
- **Total** : Nombre total d'entités qui seront supprimées

## Confirmation

Avant de supprimer, le script demande confirmation :

```
⚠️  Êtes-vous sûr de vouloir supprimer cet éditeur et toutes ses données associées ? (oui/non):
```

Réponses acceptées pour confirmer :
- `oui`
- `o`
- `yes`
- `y`

Toute autre réponse annule la suppression.

## Exemple d'Utilisation

```bash
cd server
npm run delete-editor -- "GI Informatique"
```

Sortie attendue :

```
📡 Connexion à MongoDB...
✅ Connecté à MongoDB: cluster0.xxxxx.mongodb.net

🔍 Recherche de l'éditeur "GI Informatique"...

================================================================================
📋 RÉSUMÉ DE LA SUPPRESSION EN CASCADE
================================================================================

📌 Éditeur à supprimer:
   - Nom: GI Informatique
   - ID: editor-gi-informatique

👥 Équipe de développement:
   - DevelopmentTeam: 1

💼 Solutions (2):
   1. WinLogic (solution-gi-informatique-winlogic)
   2. WinGip (solution-gi-informatique-wingip)

📦 Données liées aux Solutions:
   - Codebases: 2
   - DevelopmentMetrics: 2
   - AIFeatures: 0
   - ScoringSnapshots: 5

🌍 Environnements (4):
   1. production (env-gi-informatique-winlogic-production)
   2. test (env-gi-informatique-winlogic-test)
   3. production (env-gi-informatique-wingip-production)
   4. dev (env-gi-informatique-wingip-dev)

🔒 Données liées aux Environnements:
   - SecurityProfiles: 4
   - MonitoringObservability: 4
   - EntityCosts: 4

📋 Autres données:
   - RoadmapItems: 3
   - Documents: 2

🏗️  Hébergements à supprimer (non utilisés ailleurs) (2):
   1. OVH (hosting-ovh-1)
   2. Bleu (hosting-bleu-1)

================================================================================
📊 TOTAL: 35 entité(s) seront supprimée(s)
================================================================================

⚠️  Êtes-vous sûr de vouloir supprimer cet éditeur et toutes ses données associées ? (oui/non): oui

🗑️  Début de la suppression en cascade...

✅ 4 SecurityProfile(s) supprimé(s)
✅ 4 MonitoringObservability supprimé(s)
✅ 4 EntityCost(s) supprimé(s)
✅ 4 Environment(s) supprimé(s)
✅ Hosting "OVH" supprimé
✅ Hosting "Bleu" supprimé
✅ 2 Codebase(s) supprimé(s)
✅ 2 DevelopmentMetrics supprimé(s)
✅ 0 AIFeatures supprimé(s)
✅ 5 ScoringSnapshot(s) supprimé(s)
✅ 2 Solution(s) supprimée(s)
✅ DevelopmentTeam supprimé
✅ 5 Document(s) supprimé(s)
✅ Editor "GI Informatique" supprimé

✅ Suppression en cascade terminée avec succès !

✅ Déconnecté de MongoDB
```

## Sécurité

- ⚠️ **Action irréversible** : La suppression est définitive et ne peut pas être annulée
- ✅ **Confirmation requise** : L'utilisateur doit explicitement confirmer avant suppression
- ✅ **Audit complet** : Toutes les données à supprimer sont listées avant confirmation
- ✅ **Protection des Hostings** : Les hostings partagés avec d'autres environnements ne sont pas supprimés

## Gestion des Erreurs

- Si l'éditeur n'est pas trouvé, le script affiche un message d'erreur et s'arrête
- Si une erreur survient pendant la suppression, le script affiche l'erreur et s'arrête
- La connexion MongoDB est toujours fermée proprement, même en cas d'erreur

## Notes

- Le script est **idempotent** : Si l'éditeur n'existe pas, aucune erreur n'est levée (après vérification initiale)
- Les **Hostings** ne sont supprimés que s'ils ne sont plus utilisés par d'autres environnements
- Les **Documents** et **RoadmapItems** liés à plusieurs entités sont tous supprimés



