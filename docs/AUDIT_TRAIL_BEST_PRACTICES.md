# Pistes d'Audit - Bonnes Pratiques et Implémentation

## Vue d'ensemble

Le système de pistes d'audit (audit trail) permet de tracer toutes les modifications apportées aux données de l'application, garantissant la traçabilité, la conformité et la sécurité.

## Bonnes Pratiques Implémentées

### 1. **Séparation des Données d'Audit**

✅ **Collection dédiée** : Les logs d'audit sont stockés dans une collection MongoDB séparée (`audit_logs`), garantissant :
- L'immutabilité des logs (pas de modification possible)
- La performance (pas d'impact sur les collections métier)
- La conformité (rétention indépendante)

### 2. **Enregistrement Complet des Informations**

Chaque log d'audit enregistre :

- **Qui** : `userId`, `userEmail`, `userRole`
- **Quoi** : `action` (CREATE, UPDATE, DELETE, ARCHIVE, RESTORE, LOGIN, LOGOUT)
- **Quand** : `timestamp` (date/heure précise)
- **Où** : `entityType`, `entityId` (type et ID de l'entité modifiée)
- **Comment** : 
  - `changes` : Liste des champs modifiés avec anciennes/nouvelles valeurs
  - `before` : État complet avant modification
  - `after` : État complet après modification
- **Contexte** : `ipAddress`, `userAgent`, `description`

### 3. **Indexation pour Performances**

Index MongoDB créés pour des recherches rapides :
- `{ entityType: 1, entityId: 1, timestamp: -1 }` : Recherche par entité
- `{ userId: 1, timestamp: -1 }` : Recherche par utilisateur
- `{ action: 1, timestamp: -1 }` : Recherche par type d'action
- `{ timestamp: -1 }` : Recherche par période

### 4. **Sécurité et Confidentialité**

- ✅ Les mots de passe sont **jamais** enregistrés dans les logs (`[REDACTED]`)
- ✅ Seuls les **Admin** et **Supervisor** peuvent consulter les logs
- ✅ Les logs sont **immutables** (pas de modification possible)

### 5. **Gestion des Erreurs**

- ✅ L'enregistrement d'audit **ne fait jamais échouer** l'opération principale
- ✅ Les erreurs d'audit sont loggées côté serveur pour investigation
- ✅ Mode "fail-safe" : si l'audit échoue, l'opération métier continue

### 6. **Traçabilité Complète**

Toutes les opérations critiques sont auditées :
- ✅ Création, modification, archivage, restauration d'utilisateurs
- ✅ Modification des lookups (listes de valeurs)
- ✅ Modification des permissions
- ✅ Connexions et déconnexions
- ✅ Sélection de compte (multi-rôles)

## Architecture Technique

### Modèle de Données

```typescript
interface IAuditLog {
  userId: string;              // Qui
  userEmail?: string;
  userRole?: string;
  action: AuditAction;          // Quoi
  entityType: EntityType;       // Sur quoi
  entityId: string;
  changes?: Array<{            // Détails des changements
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  before?: any;                // État avant
  after?: any;                 // État après
  ipAddress?: string;          // Contexte
  userAgent?: string;
  description?: string;
  timestamp: Date;             // Quand
}
```

### Service d'Audit

Le service `audit.service.ts` fournit :
- `logAudit()` : Fonction principale d'enregistrement
- `getObjectDifferences()` : Comparaison avant/après
- `extractAuditContext()` : Extraction du contexte utilisateur

### Intégration dans les Resolvers

L'audit est intégré dans tous les resolvers critiques :
- `UserResolver` : Création, modification, archivage, restauration
- `LookupResolver` : Modification des lookups
- `PermissionResolver` : Modification des permissions
- `AuthResolver` : Connexions, déconnexions, sélection de compte

## Interface d'Administration

### Page "Pistes d'Audit"

Accessible via : **Administration → Pistes d'Audit**

Fonctionnalités :
- ✅ Filtres avancés :
  - Par type d'entité
  - Par ID d'entité
  - Par utilisateur
  - Par action
  - Par période (date début/fin)
  - Limite de résultats
- ✅ Affichage détaillé :
  - Date/heure précise
  - Utilisateur et rôle
  - Action avec badge coloré
  - Entité concernée
  - Détails des changements (expandable)
  - Description et IP

### Requêtes GraphQL

```graphql
# Liste des logs avec filtres
query ListAuditLogs(
  $entityType: String
  $entityId: ID
  $userId: ID
  $action: String
  $startDate: String
  $endDate: String
  $limit: Int
) {
  listAuditLogs(
    entityType: $entityType
    entityId: $entityId
    userId: $userId
    action: $action
    startDate: $startDate
    endDate: $endDate
    limit: $limit
  ) {
    id
    userId
    userEmail
    userRole
    action
    entityType
    entityId
    changes { field oldValue newValue }
    before
    after
    ipAddress
    userAgent
    description
    timestamp
  }
}

# Logs pour une entité spécifique
query GetAuditLogsForEntity($entityType: String!, $entityId: ID!) {
  getAuditLogsForEntity(entityType: $entityType, entityId: $entityId) {
    # ... mêmes champs
  }
}
```

## Recommandations pour l'Extension

### Entités à Auditer (À venir)

Pour compléter le système, ajouter l'audit pour :
- ✅ `Editor` : Création, modification
- ✅ `Solution` : Création, modification
- ✅ `Environment` : Création, modification
- ✅ `ScoringSnapshot` : Création (calcul automatique)
- ✅ `Document` : Upload, suppression
- ✅ `RoadmapItem` : Création, modification, suppression

### Rétention des Données

**Recommandation** : Implémenter une politique de rétention :
- Logs d'audit : **7 ans** (conformité RGPD/ISO)
- Archivage automatique après 1 an (collection séparée)
- Suppression automatique après 7 ans (si légalement autorisé)

### Export et Rapports

**À implémenter** :
- Export CSV/PDF des logs d'audit
- Rapports périodiques (quotidien, hebdomadaire, mensuel)
- Alertes sur actions critiques (suppression, archivage)

### Performance

**Optimisations futures** :
- Indexation sur `description` pour recherche textuelle
- Pagination côté serveur pour grandes quantités
- Cache des requêtes fréquentes
- Compression des logs anciens (> 1 an)

## Conformité et Sécurité

### RGPD / ISO 27001

✅ **Traçabilité complète** : Qui a fait quoi, quand, comment
✅ **Immutabilité** : Les logs ne peuvent pas être modifiés
✅ **Accès contrôlé** : Seuls Admin/Supervisor peuvent consulter
✅ **Rétention** : Politique de rétention à définir selon exigences légales

### Audit Externe

Le système permet :
- ✅ Vérification de toutes les modifications
- ✅ Traçabilité des accès utilisateurs
- ✅ Historique complet des changements
- ✅ Preuve de conformité aux procédures

## Exemples d'Utilisation

### Rechercher toutes les modifications d'un utilisateur

```graphql
query {
  listAuditLogs(userId: "user-0001", limit: 100) {
    action
    entityType
    entityId
    timestamp
    description
  }
}
```

### Voir l'historique d'une entité

```graphql
query {
  getAuditLogsForEntity(
    entityType: "User"
    entityId: "user-0002"
  ) {
    action
    userId
    userEmail
    changes { field oldValue newValue }
    timestamp
  }
}
```

### Filtrer les connexions récentes

```graphql
query {
  listAuditLogs(
    action: "LOGIN"
    startDate: "2024-01-01T00:00:00Z"
    limit: 50
  ) {
    userId
    userEmail
    ipAddress
    timestamp
  }
}
```

## Conclusion

Le système de pistes d'audit implémenté respecte les meilleures pratiques du marché :
- ✅ Séparation des données
- ✅ Traçabilité complète
- ✅ Performance optimisée
- ✅ Sécurité renforcée
- ✅ Interface d'administration intuitive
- ✅ Extensibilité pour futures entités

Il garantit la conformité aux exigences de traçabilité et d'audit pour une application SaaS gérant des données sensibles.

