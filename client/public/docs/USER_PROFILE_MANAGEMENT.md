# Gestion des Profils Utilisateur

## Vue d'ensemble

La plateforme Tech Health Platform offre une gestion complète des profils utilisateur avec des fonctionnalités avancées de personnalisation et de sécurité.

## Fonctionnalités Principales

### 1. Informations de Base

Chaque utilisateur dispose des informations suivantes :
- **Identifiant unique** : Format `user-XXXX` (généré automatiquement)
- **Email** : Adresse email (peut être partagée entre plusieurs comptes avec des rôles différents)
- **Prénom et Nom** : Informations personnelles
- **Rôle** : Admin, Supervisor, EntityDirector, ou Editor
- **Photo de profil** : Image stockée en base64 dans MongoDB (format similaire à Google Workspace)

### 2. Photos de Profil

#### Stockage
- **Format** : Base64 encodé
- **Taille maximale** : 10 MB par image
- **Recommandation** : Images carrées (ratio 1:1) pour un meilleur rendu
- **Stockage** : Directement dans le document utilisateur MongoDB

#### Utilisation
- Affichage dans le header de l'application (en haut à droite)
- Affichage dans le menu contextuel utilisateur
- Affichage dans la console d'administration
- **Fallback** : Si aucune photo n'est définie, affichage des initiales (prénom + nom)

### 3. Préférence de Thème

#### Fonctionnalité
La plateforme supporte deux thèmes visuels :
- **Mode clair (Light)** : Interface avec fond clair et texte sombre
- **Mode sombre (Dark)** : Interface avec fond sombre et texte clair

#### Configuration
- **Stockage** : La préférence de thème est stockée dans le profil utilisateur en base de données
- **Priorité** : La préférence utilisateur a la priorité absolue sur toute autre configuration
- **Application** : Le thème est appliqué automatiquement lors de la connexion
- **Gestion** : Modifiable uniquement via la console d'administration (section Utilisateurs)

#### Technique
- **Framework** : Tailwind CSS v4 avec variante `dark:` basée sur la classe `dark` sur l'élément `<html>`
- **Configuration** : Déclaration explicite `@custom-variant dark` requise pour Tailwind v4
- **Persistance** : Synchronisation avec `localStorage` pour éviter le flash de thème au chargement

### 4. Associations et Permissions

#### Éditeurs Associés
- **Supervisor** : Peut être associé à plusieurs éditeurs (`associatedEditorIds`)
- **EntityDirector** : Associé à un seul éditeur (`associatedEditorId`)
- **Editor** : Associé à un seul éditeur (`associatedEditorId`)
- **Admin** : Pas d'association (accès à tous les éditeurs)

#### Droits d'Accès aux Pages
- Configuration granulaire des pages accessibles par rôle
- Pages disponibles : Dashboard, Tech Profiler, Hosting, About, Administration
- Gestion via la console d'administration (section Permissions > Droits d'accès aux pages)

### 5. Multi-Comptes par Email

#### Fonctionnalité
Un même email peut être associé à plusieurs comptes avec des rôles différents. Par exemple :
- `user@example.com` avec rôle `Admin`
- `user@example.com` avec rôle `Editor`

#### Sélection de Compte
Lors de la connexion, si plusieurs comptes sont disponibles pour un email :
- Affichage d'une page de sélection de compte
- Présentation des comptes disponibles avec leur rôle
- Sélection du compte souhaité
- Si un seul compte : redirection directe vers le dashboard

## Gestion via la Console d'Administration

### Accès
La gestion des utilisateurs est accessible via :
- **Menu utilisateur** (icône en haut à droite) > **Administration**
- Section **Utilisateurs** dans le module d'administration

### Actions Disponibles

#### Création d'Utilisateur
1. Cliquer sur **"+ Nouvel utilisateur"**
2. Remplir le formulaire :
   - Email (requis)
   - Prénom et Nom
   - Rôle (requis)
   - Photo de profil (optionnel, upload base64)
   - Préférence de thème (Light/Dark, par défaut : Light)
   - Éditeurs associés (si Supervisor, EntityDirector, ou Editor)
   - Droits d'accès aux pages
3. Cliquer sur **"Créer"**

#### Modification d'Utilisateur
1. Dans la liste des utilisateurs, cliquer sur **"Modifier"**
2. Modifier les champs souhaités
3. Cliquer sur **"Mettre à jour"**
4. **Note** : Si vous modifiez votre propre préférence de thème, la page se recharge automatiquement pour appliquer le nouveau thème

#### Archivage
- Les utilisateurs peuvent être archivés (soft delete)
- Les utilisateurs archivés ne peuvent plus se connecter
- Possibilité de restaurer un utilisateur archivé

#### Filtres
- **Utilisateurs actifs** : Affiche uniquement les utilisateurs non archivés
- **Utilisateurs archivés** : Affiche uniquement les utilisateurs archivés
- **Recherche** : Recherche par email, nom, prénom, ou rôle

## Bonnes Pratiques

### Photos de Profil
- Utiliser des images de petite taille (< 500 KB recommandé)
- Format carré (1:1) pour un meilleur rendu
- Formats supportés : PNG, JPG, JPEG, WebP

### Préférence de Thème
- La préférence est personnelle et stockée dans le profil
- Chaque utilisateur peut avoir sa propre préférence
- Le thème est appliqué immédiatement après modification (si vous modifiez votre propre profil)

### Sécurité
- Seuls les **Admin** peuvent gérer les utilisateurs
- Les mots de passe ne sont jamais affichés ni modifiables via l'interface
- Les utilisateurs archivés conservent leurs données pour l'audit

## Architecture Technique

### Modèle de Données (User)
```typescript
{
  userId: string;              // Format: user-XXXX
  email: string;               // Unique avec role (index composite)
  role: UserRole;              // Admin | Supervisor | EntityDirector | Editor
  firstName?: string;
  lastName?: string;
  profilePicture?: string;      // Base64 encodé
  themePreference?: 'light' | 'dark';  // Préférence de thème
  associatedEditorId?: string; // Pour EntityDirector/Editor
  associatedEditorIds?: string[]; // Pour Supervisor
  archived: boolean;           // Soft delete
  lastLogin?: Date;
  // ... autres champs
}
```

### GraphQL Schema
- **Query** : `me` - Récupère l'utilisateur connecté avec toutes ses informations
- **Mutations** :
  - `createUser` - Création d'un utilisateur
  - `updateUser` - Mise à jour d'un utilisateur
  - `archiveUser` - Archivage d'un utilisateur
  - `restoreUser` - Restauration d'un utilisateur archivé

### Frontend
- **SessionContext** : Gestion de la session utilisateur et récupération des données
- **ThemeContext** : Application du thème basé sur la préférence utilisateur
- **AdminUsers** : Composant d'administration des utilisateurs

## Dépannage

### Le thème ne s'applique pas correctement
1. Vérifier que la préférence est bien enregistrée dans le profil utilisateur
2. Vider le cache du navigateur (Cmd+Shift+R ou Ctrl+Shift+R)
3. Vérifier dans la console du navigateur les logs `[ThemeContext]`
4. S'assurer que Tailwind CSS v4 est correctement configuré avec `@custom-variant dark`

### La photo de profil ne s'affiche pas
1. Vérifier que l'image est bien encodée en base64
2. Vérifier la taille de l'image (< 10 MB)
3. Vérifier dans la console du navigateur les erreurs éventuelles
4. S'assurer que le serveur accepte les requêtes de grande taille (body parser limit configuré)

### Impossible de modifier un utilisateur
1. Vérifier que vous êtes connecté en tant qu'Admin
2. Vérifier que l'utilisateur n'est pas archivé (si vous essayez de modifier un utilisateur archivé)
3. Vérifier les permissions dans la console d'administration

