# Gestion des Brouillons - Documentation

## Vue d'ensemble

Le système de gestion des brouillons permet de sauvegarder automatiquement les données saisies dans le workflow de collecte (Tech Profiler) et de reprendre un workflow interrompu ou ayant échoué.

## Fonctionnalités

### Sauvegarde Automatique

- **Déclenchement** : La sauvegarde automatique se déclenche après 2 secondes d'inactivité
- **Statut** : Les brouillons sont sauvegardés avec le statut `in_progress` pendant la saisie
- **Indicateur visuel** : Un message "💾 Sauvegarde automatique en cours..." s'affiche pendant la sauvegarde

### Statuts de Workflow

Les brouillons peuvent avoir les statuts suivants :

- **`draft`** : Brouillon initial, non encore commencé
- **`in_progress`** : Workflow en cours de saisie
- **`failed`** : Workflow ayant échoué lors de la soumission (avec message d'erreur)
- **`completed`** : Workflow complété avec succès (brouillon supprimé automatiquement)

### Reprendre un Brouillon

1. **Accès** : Cliquez sur le bouton "Voir les brouillons" dans l'en-tête du formulaire
2. **Sélection** : Choisissez un brouillon dans la liste affichée
3. **Reprise** : Le formulaire se charge automatiquement avec les données sauvegardées
4. **Position** : Vous reprenez à l'étape où vous vous étiez arrêté

### Interface de Sélection

L'interface de sélection affiche pour chaque brouillon :

- **Statut** : Badge coloré indiquant le statut (Brouillon, En cours, Échec)
- **Étape** : Étape actuelle du workflow (1/4, 2/4, etc.)
- **Nom de la solution** : Si renseigné
- **Nom de l'éditeur** : Si renseigné
- **Message d'erreur** : Pour les brouillons en échec
- **Date de sauvegarde** : Horodatage de la dernière sauvegarde

### Gestion des Erreurs

En cas d'échec lors de la soumission :

1. Le brouillon est automatiquement sauvegardé avec le statut `failed`
2. Le message d'erreur est enregistré pour consultation
3. Vous pouvez reprendre le brouillon et corriger les erreurs
4. Une fois corrigé, vous pouvez soumettre à nouveau

### Suppression

- **Automatique** : Les brouillons complétés sont supprimés automatiquement
- **Manuelle** : Vous pouvez supprimer un brouillon en cliquant sur le bouton "✕" dans l'interface de sélection

## Modèle de Données

### CollectorDraft

```typescript
{
  draftId: string;           // Identifiant unique
  userId: string;            // Utilisateur propriétaire
  status: 'draft' | 'in_progress' | 'failed' | 'completed';
  step: number;              // Étape actuelle (1-4)
  formData: object;          // Données du formulaire (JSON)
  errorMessage?: string;      // Message d'erreur si échec
  lastSavedAt: Date;         // Date de dernière sauvegarde
  createdAt: Date;
  updatedAt: Date;
}
```

## API GraphQL

### Queries

- `listCollectorDrafts(status: String)` : Liste des brouillons de l'utilisateur connecté
- `getCollectorDraft(draftId: ID!)` : Récupération d'un brouillon spécifique

### Mutations

- `saveCollectorDraft(input: SaveCollectorDraftInput!)` : Sauvegarder un brouillon
- `deleteCollectorDraft(draftId: ID!)` : Supprimer un brouillon

## Bonnes Pratiques

1. **Sauvegarde régulière** : Le système sauvegarde automatiquement, mais vous pouvez aussi sauvegarder manuellement en naviguant entre les étapes
2. **Gestion des erreurs** : Consultez toujours le message d'erreur pour comprendre pourquoi un workflow a échoué
3. **Nettoyage** : Supprimez les brouillons obsolètes pour maintenir une interface claire
4. **Reprise** : Utilisez la fonctionnalité de reprise plutôt que de recommencer depuis le début

## Sécurité

- Les brouillons sont privés : chaque utilisateur ne voit que ses propres brouillons
- Toutes les opérations sont tracées dans les pistes d'audit
- Les brouillons sont associés à l'utilisateur connecté

