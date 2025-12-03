# Workflow de Collecte des Données - Bilan Tech Instantané

## Vue d'ensemble

Le **Bilan Tech Instantané** (anciennement "Tech Profiler") est un formulaire multi-étapes qui permet de collecter les données critiques (P1) nécessaires au calcul du score de santé technique d'une solution. Ce document décrit le workflow complet, de la saisie des données jusqu'à la génération du snapshot de scoring initial.

> 📊 **Référence** : Pour une description complète des entités et des champs collectés, consultez la section [Modèle de Données](#data-model) dans la documentation.

---

## Architecture du Workflow

### 1. Phase de Saisie (Frontend)

#### 1.1. Formulaire Multi-Étapes

Le formulaire est divisé en **4 étapes principales** :

- **Étape 1 : Éditeur**
  - Sélection d'un éditeur existant ou création d'un nouveau
  - Informations collectées : nom, criticité métier, pays, taille

- **Étape 2 : Solution**
  - Informations sur la solution technique
  - Informations collectées : nom, type (SaaS/OnPrem/Hybrid), criticité produit, cas d'usage principal, description

- **Étape 3 : Environnement & Hébergement**
  - Configuration de l'environnement de production
  - Informations collectées :
    - Hébergement : fournisseur, région, niveau (datacenter/private/public/cloud), certifications
    - Environnement : type (production/test/dev), types de données, redondance, sauvegarde (RTO/RPO), stack technique

- **Étape 4 : Sécurité**
  - Profil de sécurité de l'environnement
  - Informations collectées : authentification, chiffrement (en transit/au repos), patching, fréquence de pentest, gestion des vulnérabilités

#### 1.2. Sauvegarde Automatique des Brouillons

**Mécanisme** :
- À chaque modification dans le formulaire, une sauvegarde automatique est déclenchée après un délai de **2 secondes** (debounce)
- Le brouillon est sauvegardé dans la collection `collector_drafts` avec :
  - `draftId` : Identifiant unique généré à partir d'un ObjectId MongoDB (format `draft-{ObjectId}`)
  - `userId` : Identifiant de l'utilisateur connecté
  - `status` : Statut du brouillon (`draft`, `in_progress`, `failed`, `completed`)
  - `step` : Étape actuelle (1-4)
  - `formData` : Données du formulaire au format JSON
  - `lastSavedAt` : Timestamp de la dernière sauvegarde

**Gestion des Collisions** :
- Le `draftId` est généré à partir d'un ObjectId MongoDB pour garantir l'unicité
- En cas de collision rare (moins de 0.01% de probabilité), le système réessaie jusqu'à 5 fois avec un nouvel ObjectId

**Récupération** :
- Lors du chargement de la page, le système récupère automatiquement le dernier brouillon non complété de l'utilisateur
- L'utilisateur peut reprendre sa saisie exactement où il s'était arrêté

---

### 2. Phase de Soumission (Backend)

#### 2.1. Mutation GraphQL `submitP1Data`

Lorsque l'utilisateur clique sur "Soumettre", la mutation GraphQL `submitP1Data` est appelée avec toutes les données collectées.

**Autorisation** :
- Tous les utilisateurs authentifiés peuvent soumettre des données P1

**Processus de Traitement** :

##### Étape 1 : Création/Mise à jour de l'Éditeur

```typescript
// Recherche d'un éditeur existant par nom
let editor = await EditorModel.findOne({ name: args.editor.name });

if (!editor) {
  // Création d'un nouvel éditeur
  editorId = `editor-${String(count + 1).padStart(4, '0')}`;
  editor = await EditorModel.create({
    editorId,
    name: args.editor.name,
    business_criticality: args.editor.business_criticality,
    country: args.editor.country,
    size: args.editor.size,
  });
} else {
  // Mise à jour de l'éditeur existant
  editor = await EditorModel.findOneAndUpdate(
    { editorId },
    { $set: { business_criticality, country, size } },
    { new: true }
  );
}
```

**Entité créée/mise à jour** : `Editor`
- `editorId` : Identifiant unique (format `editor-0001`, `editor-0002`, etc.)
- `name` : Nom de l'éditeur
- `business_criticality` : Criticité métier (Low/Medium/High/Critical)
- `country` : Pays (optionnel)
- `size` : Taille (Micro/SME/Mid/Enterprise, optionnel)

##### Étape 2 : Création/Mise à jour du Profil d'Hébergement

```typescript
const hostingId = `hosting-${editorId}-${Date.now()}`;
let hosting = await HostingModel.findOne({ hostingId });

if (!hosting) {
  hosting = await HostingModel.create({
    hostingId,
    provider: args.hosting.provider,
    region: args.hosting.region,
    tier: args.hosting.tier,
    certifications: args.hosting.certifications || [],
  });
}
```

**Entité créée/mise à jour** : `Hosting`
- `hostingId` : Identifiant unique (format `hosting-{editorId}-{timestamp}`)
- `provider` : Fournisseur d'hébergement
- `region` : Région géographique
- `tier` : Niveau d'hébergement (datacenter/private/public/cloud)
- `certifications` : Liste des certifications (ISO27001, HDS, SOC2, etc.)

##### Étape 3 : Création/Mise à jour de la Solution

```typescript
let solution = await SolutionModel.findOne({
  editorId: editor._id,
  name: args.solution.name,
});

if (!solution) {
  solutionId = `solution-${String(count + 1).padStart(4, '0')}`;
  solution = await SolutionModel.create({
    solutionId,
    editorId: editor._id,
    name: args.solution.name,
    type: args.solution.type,
    product_criticality: args.solution.product_criticality,
    main_use_case: args.solution.main_use_case,
    description: args.solution.description,
  });
}
```

**Entité créée/mise à jour** : `Solution`
- `solutionId` : Identifiant unique (format `solution-0001`, `solution-0002`, etc.)
- `editorId` : Référence vers l'éditeur (ObjectId)
- `name` : Nom de la solution
- `type` : Type de solution (SaaS/OnPrem/Hybrid/ClientHeavy)
- `product_criticality` : Criticité produit
- `main_use_case` : Cas d'usage principal
- `description` : Description (optionnel)

##### Étape 4 : Création/Mise à jour de l'Environnement

```typescript
const envId = `env-${solutionId}-${args.environment.env_type}-${Date.now()}`;
let environment = await EnvironmentModel.findOne({ envId });

if (!environment) {
  environment = await EnvironmentModel.create({
    envId,
    solutionId: solution._id,
    hostingId: hosting.hostingId,
    env_type: args.environment.env_type,
    data_types: args.environment.data_types,
    redundancy: args.environment.redundancy,
    backup: {
      exists: args.environment.backup.exists,
      schedule: args.environment.backup.schedule,
      rto: args.environment.backup.rto_hours,
      rpo: args.environment.backup.rpo_hours,
      restoration_test_frequency: args.environment.backup.restoration_test_frequency,
    },
    deployment_type: args.environment.deployment_type,
    virtualization: args.environment.virtualization,
    tech_stack: args.environment.tech_stack,
  });
}
```

**Entité créée/mise à jour** : `Environment`
- `envId` : Identifiant unique (format `env-{solutionId}-{env_type}-{timestamp}`)
- `solutionId` : Référence vers la solution (ObjectId)
- `hostingId` : Référence vers le profil d'hébergement
- `env_type` : Type d'environnement (production/test/dev/backup)
- `data_types` : Types de données (Personal/Sensitive/Health/Financial/Synthetic)
- `redundancy` : Niveau de redondance (none/minimal/geo-redundant/high)
- `backup` : Détails de sauvegarde (existence, planning, RTO, RPO, fréquence de test)
- `deployment_type` : Type de déploiement (monolith/microservices/hybrid)
- `virtualization` : Type de virtualisation
- `tech_stack` : Stack technique (langages, BDD, frameworks)

##### Étape 5 : Création/Mise à jour du Profil de Sécurité

```typescript
const secId = `sec-${envId}`;
let securityProfile = await SecurityProfileModel.findOne({ secId });

if (!securityProfile) {
  securityProfile = await SecurityProfileModel.create({
    secId,
    envId: environment._id,
    auth: args.security.auth,
    encryption: {
      in_transit: args.security.encryption.in_transit,
      at_rest: args.security.encryption.at_rest,
      details: args.security.encryption.details,
    },
    patching: args.security.patching || 'ad_hoc',
    pentest_freq: args.security.pentest_freq || 'never',
    vuln_mgmt: args.security.vuln_mgmt || 'none',
  });
}
```

**Entité créée/mise à jour** : `SecurityProfile`
- `secId` : Identifiant unique (format `sec-{envId}`)
- `envId` : Référence vers l'environnement (ObjectId)
- `auth` : Méthode d'authentification (None/Passwords/MFA/SSO)
- `encryption` : Détails du chiffrement (en transit, au repos, détails)
- `patching` : Stratégie de patching (ad_hoc/scheduled/automated)
- `pentest_freq` : Fréquence de pentest (never/annual/quarterly)
- `vuln_mgmt` : Gestion des vulnérabilités (none/manual/automated)

##### Étape 6 : Création du Snapshot de Scoring Initial

```typescript
const scoreId = `score-${solutionId}-${Date.now()}`;
const scoringSnapshot = await ScoringSnapshotModel.create({
  scoreId,
  solutionId: solution._id,
  envId: environment._id,
  date: new Date(),
  scores: {
    security: 0,      // Sera calculé par le Scoring Engine
    resilience: 0,
    observability: 0,
    architecture: 0,
    compliance: 0,
  },
  global_score: 0,   // Sera calculé par le Scoring Engine
  risk_level: 'Low', // Sera calculé par le Scoring Engine
  notes: 'Snapshot initial créé via Tech Profiler. Le scoring sera calculé par le Scoring Engine.',
});
```

**Entité créée** : `ScoringSnapshot`
- `scoreId` : Identifiant unique (format `score-{solutionId}-{timestamp}`)
- `solutionId` : Référence vers la solution (ObjectId)
- `envId` : Référence vers l'environnement (ObjectId)
- `date` : Date de création du snapshot
- `scores` : Scores par catégorie (initialisés à 0, seront calculés par le Scoring Engine)
- `global_score` : Score global (initialisé à 0)
- `risk_level` : Niveau de risque (initialisé à 'Low')
- `notes` : Notes explicatives

**⚠️ Important** : Le snapshot initial est créé avec des scores à 0. Le calcul réel des scores doit être déclenché par le **Scoring Engine** après la création du snapshot.

---

### 3. Phase de Calcul du Score (Scoring Engine)

#### 3.1. Déclenchement du Scoring Engine

**État Actuel** :
- Le snapshot initial est créé avec des scores à 0
- Le Scoring Engine n'est **pas encore automatiquement déclenché** après la soumission des données P1

**Amélioration Recommandée** :
- Après la création du snapshot initial, appeler automatiquement le Scoring Engine :
  ```typescript
  const scoringEngine = new ScoringEngineService();
  await scoringEngine.calculateAndRecordScore(solution._id, environment._id);
  ```

#### 3.2. Calcul des Scores

Le Scoring Engine calcule les scores selon la pondération suivante :

- **Sécurité** : 30% (basé sur `SecurityProfile`)
- **Résilience** : 20% (basé sur `Environment.backup`, `redundancy`)
- **Observabilité** : 15% (basé sur `MonitoringObservability`)
- **Architecture** : 15% (basé sur `Environment.deployment_type`, `tech_stack`)
- **Conformité** : 20% (basé sur `Hosting.certifications`, `SecurityProfile`)

#### 3.3. Mise à jour du Snapshot

Une fois les scores calculés, le snapshot est mis à jour avec :
- Les scores par catégorie
- Le score global (0-100)
- Le niveau de risque (Low/Medium/High/Critical)
- Les recommandations automatiques

---

## Audit et Traçabilité

Toutes les opérations sont enregistrées dans les **pistes d'audit** :

- **Création d'éditeur** : `CREATE` sur `Editor`
- **Création de solution** : `CREATE` sur `Solution`
- **Création d'environnement** : `CREATE` sur `Environment`
- **Création de profil d'hébergement** : `CREATE` sur `Hosting`
- **Création de profil de sécurité** : `CREATE` sur `SecurityProfile`
- **Création de snapshot** : `CREATE` sur `ScoringSnapshot`
- **Sauvegarde de brouillon** : `CREATE` ou `UPDATE` sur `CollectorDraft`

Chaque entrée d'audit contient :
- L'utilisateur qui a effectué l'action
- La date et l'heure
- L'état avant/après (pour les mises à jour)
- Une description de l'action

---

## Points d'Amélioration Identifiés

### 1. Génération des Identifiants

**Problème Actuel** :
- Les identifiants pour `Editor` et `Solution` utilisent `countDocuments()` qui peut créer des collisions en cas de requêtes simultanées
- Les identifiants pour `Hosting`, `Environment`, `SecurityProfile` utilisent des timestamps qui peuvent créer des collisions

**Recommandation** :
- Utiliser des ObjectId MongoDB pour tous les identifiants (comme pour `draftId`)
- Format : `editor-{ObjectId}`, `solution-{ObjectId}`, etc.

### 2. Déclenchement Automatique du Scoring Engine

**Problème Actuel** :
- Le Scoring Engine n'est pas automatiquement déclenché après la soumission des données P1
- Les snapshots sont créés avec des scores à 0

**Recommandation** :
- Appeler automatiquement `ScoringEngineService.calculateAndRecordScore()` après la création du snapshot initial
- Ou créer un job asynchrone pour calculer les scores en arrière-plan

### 3. Gestion des Erreurs

**Problème Actuel** :
- Si une erreur survient au milieu du processus, certaines entités peuvent être créées sans que le processus soit complété

**Recommandation** :
- Implémenter une transaction MongoDB pour garantir l'atomicité
- En cas d'erreur, rollback de toutes les créations

### 4. Validation des Données

**Problème Actuel** :
- La validation des données est principalement effectuée côté frontend
- Pas de validation stricte côté backend pour certains champs

**Recommandation** :
- Ajouter une validation stricte côté backend avec des schémas de validation (Joi, Zod, etc.)
- Valider les enums, les formats, les contraintes de longueur

### 5. Gestion des Doublons

**Problème Actuel** :
- La détection de doublons se fait uniquement par nom pour `Editor` et `Solution`
- Pas de gestion des cas où plusieurs éditeurs/solutions ont le même nom

**Recommandation** :
- Implémenter une logique de fusion intelligente
- Permettre à l'utilisateur de choisir entre créer un nouveau ou utiliser un existant

---

## Diagramme de Séquence

```
[Utilisateur] → [Frontend] → [GraphQL API] → [MongoDB]
     |              |              |              |
     |-- Saisie     |              |              |
     |-- Auto-save  |-- saveCollectorDraft()     |
     |              |              |-- CREATE/UPDATE CollectorDraft
     |              |              |              |
     |-- Soumettre  |-- submitP1Data()           |
     |              |              |              |
     |              |              |-- 1. CREATE/UPDATE Editor
     |              |              |-- 2. CREATE/UPDATE Hosting
     |              |              |-- 3. CREATE/UPDATE Solution
     |              |              |-- 4. CREATE/UPDATE Environment
     |              |              |-- 5. CREATE/UPDATE SecurityProfile
     |              |              |-- 6. CREATE ScoringSnapshot (scores = 0)
     |              |              |              |
     |              |              |-- [TODO] Appeler Scoring Engine
     |              |              |-- [TODO] UPDATE ScoringSnapshot avec scores réels
     |              |              |              |
     |              |←-- Retour    |              |
     |←-- Confirmation             |              |
```

---

## Conclusion

Le workflow de collecte des données P1 est fonctionnel mais peut être amélioré pour :
1. Garantir l'unicité des identifiants
2. Calculer automatiquement les scores après la soumission
3. Gérer les erreurs de manière transactionnelle
4. Valider strictement les données côté backend
5. Améliorer la gestion des doublons

Ces améliorations permettront de rendre le système plus robuste, plus fiable et plus maintenable.

