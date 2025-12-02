# Proposition d'Enrichissement du Workflow de Collecte - Tech DD

## Objectif

Enrichir le workflow de collecte pour couvrir l'intégralité des champs de la Tech DD, tout en gardant le processus P1 simple et rapide.

## Architecture Proposée : Progressive Disclosure avec Mode Complet

### Principe

Utiliser le pattern **Progressive Disclosure** avec un **toggle "Mode Complet DD Tech"** qui permet d'activer/désactiver l'affichage des champs DD optionnels.

### Avantages

1. **Workflow P1 inchangé** : Les utilisateurs peuvent toujours soumettre rapidement avec uniquement les champs P1
2. **Enrichissement optionnel** : Les champs DD sont disponibles mais ne bloquent pas la soumission
3. **Flexibilité** : Les champs DD peuvent être remplis immédiatement ou plus tard
4. **UX claire** : Distinction visuelle entre champs P1 (requis) et champs DD (optionnels)

## Structure du Workflow Enrichi

### Workflow Actuel (P1 uniquement)

```
Étape 1: Éditeur/Solution (P1)
  ↓
Étape 2: Hébergement (P1)
  ↓
Étape 3: Sécurité (P1)
  ↓
Étape 4: Soumission
```

### Workflow Enrichi (P1 + DD)

```
Étape 1: Éditeur/Solution (P1)
  └─ [Si Mode Complet] → Section DD Éditeur/Solution
      • internal_it_systems
      • it_security_strategy
      • contracts_for_review
      • api_robustness
      • api_documentation_quality
      • ip_ownership_clear
      • licensing_model
      • license_compliance_assured

Étape 2: Hébergement (P1)
  └─ [Si Mode Complet] → Section DD Hébergement/Environnement
      • network_security_mechanisms
      • db_scaling_mechanism
      • disaster_recovery_plan
      • sla_offered
      • contact (Hosting)

Étape 3: Sécurité (P1)
  └─ [Si Mode Complet] → Section DD Sécurité
      • access_control
      • internal_audits_recent
      • centralized_monitoring
      • pentest_results_summary
      • known_security_flaws
      • incident_reporting_process

Étape 4: Soumission
  └─ [Si Mode Complet] → Section DD Complémentaire (optionnel)
      • MonitoringObservability
      • Codebase
      • DevelopmentMetrics
      • EntityCost
      • AIFeatures
      • DevelopmentTeam

Étape 5: Confirmation
```

## Implémentation Technique

### 1. État du Composant

```typescript
const [ddMode, setDdMode] = useState(false); // Toggle Mode Complet DD Tech
const [formData, setFormData] = useState({
  // Champs P1 existants
  // ...
  
  // Champs DD Éditeur
  internal_it_systems: [],
  it_security_strategy: '',
  contracts_for_review: [],
  
  // Champs DD Solution
  api_robustness: '',
  api_documentation_quality: '',
  ip_ownership_clear: false,
  licensing_model: '',
  license_compliance_assured: false,
  
  // Champs DD Environnement
  network_security_mechanisms: [],
  db_scaling_mechanism: '',
  disaster_recovery_plan: '',
  sla_offered: '',
  hostingContactName: '',
  hostingContactEmail: '',
  
  // Champs DD Sécurité
  access_control: '',
  internal_audits_recent: '',
  centralized_monitoring: false,
  pentest_results_summary: '',
  known_security_flaws: '',
  incident_reporting_process: '',
  
  // Champs DD Complémentaires (étape 4)
  perf_monitoring: '',
  log_centralization: '',
  monitoringTools: [],
  repo_location: '',
  documentation_level: '',
  code_review_process: '',
  version_control_tool: '',
  technical_debt_known: '',
  legacy_systems: '',
  third_party_dependencies: [],
  sdlc_process: '',
  devops_automation_level: '',
  planned_vs_unplanned_ratio: null,
  lead_time_for_changes_days: null,
  mttr_hours: null,
  internal_vs_external_bug_ratio: null,
  hosting_monthly: null,
  licenses_monthly: null,
  ops_hours_monthly_equiv: null,
  hidden_costs: '',
  cost_evolution_factors: '',
  modernization_investment_needs: '',
  aiFeatures: [],
  team_size_adequate: '',
  key_person_dependency: '',
});
```

### 2. Toggle Mode Complet

```tsx
// Au début du formulaire (étape 1)
<div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
  <label className="flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={ddMode}
      onChange={(e) => setDdMode(e.target.checked)}
      className="mr-2"
    />
    <span className="font-medium text-gray-900 dark:text-gray-100">
      {t('collector.ddMode.enable')}
    </span>
    <AssistanceTooltip content={t('collector.ddMode.tooltip')} />
  </label>
  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
    {t('collector.ddMode.description')}
  </p>
</div>
```

### 3. Sections DD Conditionnelles

Chaque étape P1 aura une section DD conditionnelle affichée uniquement si `ddMode === true` :

```tsx
{ddMode && (
  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
      {t('collector.dd.sectionTitle')} (Optionnel)
    </h3>
    {/* Champs DD spécifiques à cette étape */}
  </div>
)}
```

### 4. Mutation GraphQL Enrichie

La mutation `CREATE_SOLUTION_ENVIRONMENT_P1` sera étendue pour accepter les champs DD optionnels :

```graphql
mutation CreateSolutionEnvironmentP1($input: CreateSolutionEnvironmentP1Input!) {
  createSolutionEnvironmentP1(input: $input) {
    # Retourne les entités créées
  }
}
```

L'input inclura tous les champs DD, mais ils seront optionnels côté backend.

### 5. Sauvegarde des Brouillons

Les brouillons incluront automatiquement tous les champs (P1 + DD) pour permettre la reprise complète.

## Organisation des Champs DD par Catégorie

### Éditeur (DD)
- `internal_it_systems`: Array[String] - Systèmes IT internes
- `it_security_strategy`: String - Stratégie de sécurité IT
- `contracts_for_review`: Array[{type, summary}] - Contrats à réviser

### Solution (DD)
- `api_robustness`: String - Robustesse des APIs
- `api_documentation_quality`: String - Qualité de la documentation API
- `ip_ownership_clear`: Boolean - Propriété intellectuelle claire
- `licensing_model`: String - Modèle de licence
- `license_compliance_assured`: Boolean - Conformité des licences

### Environnement (DD)
- `network_security_mechanisms`: Array[String] - Mécanismes de sécurité réseau
- `db_scaling_mechanism`: String - Mécanisme de scaling BDD
- `disaster_recovery_plan`: String - Plan de reprise après sinistre
- `sla_offered`: String - SLA offert
- `hostingContactName`: String - Nom du contact hébergement
- `hostingContactEmail`: String - Email du contact hébergement

### Sécurité (DD)
- `access_control`: String - Contrôle d'accès (PAM, etc.)
- `internal_audits_recent`: String - Audits internes récents
- `centralized_monitoring`: Boolean - Monitoring centralisé
- `pentest_results_summary`: String - Résumé des résultats de pentests
- `known_security_flaws`: String - Failles de sécurité connues
- `incident_reporting_process`: String - Processus de signalement d'incidents

### Complémentaire (DD) - Étape 4
- **MonitoringObservability**: perf_monitoring, log_centralization, monitoringTools
- **Codebase**: repo_location, documentation_level, code_review_process, version_control_tool, technical_debt_known, legacy_systems, third_party_dependencies
- **DevelopmentMetrics**: sdlc_process, devops_automation_level, planned_vs_unplanned_ratio, lead_time_for_changes_days, mttr_hours, internal_vs_external_bug_ratio
- **EntityCost**: hosting_monthly, licenses_monthly, ops_hours_monthly_equiv, hidden_costs, cost_evolution_factors, modernization_investment_needs
- **AIFeatures**: aiFeatures (array)
- **DevelopmentTeam**: team_size_adequate, key_person_dependency

## Lookups Nécessaires

Les champs DD nécessiteront des lookups supplémentaires :

1. **IT Security Strategy**: Low/Medium/High/Critical
2. **API Robustness**: Low/Medium/High
3. **API Documentation Quality**: Poor/Fair/Good/Excellent
4. **Licensing Model**: Proprietary/Open Source/Mixed
5. **Network Security Mechanisms**: VPN, Firewall, IDS/IPS, WAF, etc. (multi-select)
6. **DB Scaling Mechanism**: Vertical/Horizontal/Auto-scaling/None
7. **Access Control**: None/Basic/RBAC/PAM/Advanced
8. **Monitoring Status**: Yes/Partial/No
9. **Documentation Level**: None/Basic/Good/Excellent
10. **Code Review Process**: None/Informal/Formal/Automated
11. **Version Control Tool**: Git/SVN/Mercurial/Other
12. **SDLC Process**: Waterfall/Agile/Scrum/Kanban/DevOps
13. **DevOps Automation Level**: None/Low/Medium/High

## Validation

- **Champs P1** : Validation stricte (requis)
- **Champs DD** : Validation optionnelle (format si rempli, mais pas requis)

## UX/UI

### Indicateurs Visuels

- **Badge "P1"** : Champs prioritaires (requis)
- **Badge "DD"** : Champs Due Diligence (optionnels)
- **Section repliable** : Les sections DD peuvent être repliées/dépliées
- **Progression** : La barre de progression reste basée sur les étapes P1

### Messages d'Aide

- Tooltip expliquant la différence entre P1 et DD
- Message informatif : "Les champs DD sont optionnels et peuvent être remplis plus tard"

## Migration

- Les données P1 existantes restent valides
- Les champs DD peuvent être ajoutés progressivement aux entités existantes via des mutations de mise à jour

## Prochaines Étapes

1. ✅ Créer les lookups DD nécessaires
2. ✅ Étendre le schéma GraphQL avec les inputs DD
3. ✅ Mettre à jour le CollectorStepper avec le toggle et les sections DD
4. ✅ Étendre la mutation de soumission pour inclure les champs DD
5. ✅ Mettre à jour les resolvers backend pour gérer les champs DD
6. ✅ Ajouter les traductions i18n pour les nouveaux champs

