import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Types pour les onglets
type AboutTab = 'overview' | 'data-model' | 'audit-trail' | 'hosting-view' | 'user-profile' | 'collector-workflow';

// Composants personnalisés pour le rendu Markdown
const MarkdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">
      {children}
    </h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-3 mb-2">
      {children}
    </h4>
  ),
  p: ({ children }: any) => (
    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
      {children}
    </p>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc mb-4 ml-6 space-y-2">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal mb-4 ml-6 space-y-2">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="text-gray-700 dark:text-gray-300 mb-1 pl-2">
      {children}
    </li>
  ),
  strong: ({ children }: any) => (
    <strong className="font-semibold text-gray-900 dark:text-gray-100">
      {children}
    </strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-gray-700 dark:text-gray-300">
      {children}
    </em>
  ),
  code: (props: any) => {
    const { inline, children, className, ...rest } = props;
    
    // Dans react-markdown v10, la prop 'inline' est true pour les backticks simples
    // Si on a une className avec 'language-', c'est définitivement un bloc de code
    const isCodeBlock = className?.includes('language-') || className?.includes('hljs');
    
    // Si c'est un bloc de code (triple backticks avec langage)
    if (isCodeBlock) {
      return (
        <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono mb-4" {...rest}>
          {children}
        </code>
      );
    }
    
    // Si inline est explicitement false, c'est un bloc (mais sans langage)
    if (inline === false) {
      return (
        <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono mb-4" {...rest}>
          {children}
        </code>
      );
    }
    
    // Par défaut, traiter comme code inline (backticks simples dans le texte)
    // C'est le cas le plus courant : `Scoring Engine`, `ScoringSnapshot`, etc.
    return (
      <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200" {...rest}>
        {children}
      </code>
    );
  },
  pre: ({ children }: any) => {
    // Le pre contient toujours un code pour les blocs de code (triple backticks)
    // Le code à l'intérieur sera stylisé par le composant code ci-dessus
    return (
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
        {children}
      </pre>
    );
  },
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 italic text-gray-600 dark:text-gray-400 my-4">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto mb-6">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-gradient-to-r from-blue-500 to-teal-500 dark:from-blue-600 dark:to-teal-600">
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
      {children}
    </tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
      {children}
    </td>
  ),
  hr: () => (
    <hr className="border-gray-300 dark:border-gray-600 my-8" />
  ),
};

const About: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AboutTab>('overview');
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [auditContent, setAuditContent] = useState<string>('');
  const [hostingViewContent, setHostingViewContent] = useState<string>('');
  const [userProfileContent, setUserProfileContent] = useState<string>('');
  const [collectorWorkflowContent, setCollectorWorkflowContent] = useState<string>('');

  // Charger le README.md
  useEffect(() => {
    fetch('/README.md')
      .then((res) => res.text())
      .then((text) => setReadmeContent(text))
      .catch((err) => {
        console.error('Erreur lors du chargement du README:', err);
        setReadmeContent('# Tech Health Platform\n\nContenu du README non disponible.');
      });
  }, []);

  // Charger AUDIT_TRAIL_BEST_PRACTICES.md
  useEffect(() => {
    fetch('/docs/AUDIT_TRAIL_BEST_PRACTICES.md')
      .then((res) => res.text())
      .then((text) => setAuditContent(text))
      .catch((err) => {
        console.error('Erreur lors du chargement de la doc audit:', err);
        setAuditContent('# Pistes d\'Audit\n\nDocumentation non disponible.');
      });
  }, []);

  // Charger HOSTING_VIEW.md
  useEffect(() => {
    fetch('/docs/HOSTING_VIEW.md')
      .then((res) => res.text())
      .then((text) => setHostingViewContent(text))
      .catch((err) => {
        console.error('Erreur lors du chargement de la doc hosting view:', err);
        setHostingViewContent('# Vue d\'Hébergement\n\nDocumentation non disponible.');
      });
  }, []);

  // Charger USER_PROFILE_MANAGEMENT.md
  useEffect(() => {
    fetch('/docs/USER_PROFILE_MANAGEMENT.md')
      .then((res) => res.text())
      .then((text) => setUserProfileContent(text))
      .catch((err) => {
        console.error('Erreur lors du chargement de la doc user profile:', err);
        setUserProfileContent('# Gestion des Profils Utilisateur\n\nDocumentation non disponible.');
      });
  }, []);

  // Charger COLLECTOR_WORKFLOW.md
  useEffect(() => {
    fetch('/docs/COLLECTOR_WORKFLOW.md')
      .then((res) => res.text())
      .then((text) => setCollectorWorkflowContent(text))
      .catch((err) => {
        console.error('Erreur lors du chargement de la doc collector workflow:', err);
        setCollectorWorkflowContent('# Workflow de Collecte des Données\n\nDocumentation non disponible.');
      });
  }, []);

  const tabs = [
    { id: 'overview' as AboutTab, label: 'Vue d\'ensemble', icon: '📖' },
    { id: 'data-model' as AboutTab, label: 'Données collectées', icon: '📊' },
    { id: 'audit-trail' as AboutTab, label: 'Pistes d\'audit', icon: '🔍' },
    { id: 'hosting-view' as AboutTab, label: 'Vue d\'hébergement', icon: '🏗️' },
    { id: 'user-profile' as AboutTab, label: 'Gestion des profils', icon: '👤' },
    { id: 'collector-workflow' as AboutTab, label: 'Workflow de collecte', icon: '📋' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="markdown-content">
            {/* Logo uniquement dans Vue d'ensemble */}
            <div className="text-center space-y-4 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-center">
                <img
                  src="/Final_visual.png"
                  alt="Tech Health Platform Logo"
                  className="w-full max-w-sm md:max-w-md lg:max-w-lg h-auto object-contain"
                />
              </div>
            </div>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
              {readmeContent || 'Chargement...'}
            </ReactMarkdown>
          </div>
        );
      case 'data-model':
        return <DataModelContent />;
      case 'audit-trail':
        return (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
              {auditContent || 'Chargement...'}
            </ReactMarkdown>
          </div>
        );
      case 'hosting-view':
        return (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
              {hostingViewContent || 'Chargement...'}
            </ReactMarkdown>
          </div>
        );
      case 'user-profile':
        return (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
              {userProfileContent || 'Chargement...'}
            </ReactMarkdown>
          </div>
        );
      case 'collector-workflow':
        return (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
              {collectorWorkflowContent || 'Chargement...'}
            </ReactMarkdown>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header sans logo (logo uniquement dans Vue d'ensemble) */}
      <div className="text-center space-y-4 py-6">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Tech Health Platform</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Standardized Technical Health Assessment and Monitoring Platform
        </p>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg transition-colors">
        <nav className="flex space-x-1 px-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8 transition-colors">
        {renderTabContent()}
      </div>

      {/* Footer note */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
      </div>
    </div>
  );
};

// Composant pour l'onglet "Données collectées"
const DataModelContent: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  const entities = [
    {
      id: 'editor',
      name: 'Editor',
      priority: 'P1/P2',
      description: 'Éditeur de logiciels (entité racine)',
      fields: [
        { name: 'editorId', type: 'string', priority: 'P1', required: true, description: 'Identifiant unique' },
        { name: 'name', type: 'string', priority: 'P1', required: true, description: 'Nom de l\'éditeur' },
        { name: 'country', type: 'string', priority: 'P2', required: false, description: 'Pays' },
        { name: 'size', type: 'enum', priority: 'P2', required: false, description: 'Taille (Micro/SME/Mid/Enterprise)' },
        { name: 'business_criticality', type: 'enum', priority: 'P1', required: true, description: 'Criticité métier (Low/Medium/High/Critical)' },
        { name: 'internal_it_systems', type: 'string[]', priority: 'DD', required: false, description: 'Systèmes IT internes' },
        { name: 'it_security_strategy', type: 'string', priority: 'DD', required: false, description: 'Stratégie de sécurité IT' },
        { name: 'contracts_for_review', type: 'object[]', priority: 'DD', required: false, description: 'Contrats à réviser' },
      ],
    },
    {
      id: 'solution',
      name: 'Solution',
      priority: 'P1/P2',
      description: 'Solution logicielle développée par l\'éditeur',
      fields: [
        { name: 'solutionId', type: 'string', priority: 'P1', required: true, description: 'Identifiant unique' },
        { name: 'editorId', type: 'ObjectId', priority: 'P1', required: true, description: 'Référence vers Editor' },
        { name: 'name', type: 'string', priority: 'P1', required: true, description: 'Nom de la solution' },
        { name: 'description', type: 'string', priority: 'P2', required: false, description: 'Description' },
        { name: 'main_use_case', type: 'string', priority: 'P1', required: true, description: 'Cas d\'usage principal' },
        { name: 'type', type: 'enum', priority: 'P1', required: true, description: 'Type (SaaS/OnPrem/Hybrid/ClientHeavy)' },
        { name: 'product_criticality', type: 'enum', priority: 'P1', required: true, description: 'Criticité produit' },
        { name: 'api_robustness', type: 'string', priority: 'DD', required: false, description: 'Robustesse des APIs' },
        { name: 'api_documentation_quality', type: 'enum', priority: 'DD', required: false, description: 'Qualité documentation API' },
        { name: 'ip_ownership_clear', type: 'boolean', priority: 'DD', required: true, description: 'Propriété intellectuelle claire' },
        { name: 'licensing_model', type: 'string', priority: 'DD', required: false, description: 'Modèle de licence' },
        { name: 'license_compliance_assured', type: 'boolean', priority: 'DD', required: false, description: 'Conformité licences' },
      ],
    },
    {
      id: 'environment',
      name: 'Environment',
      priority: 'P1/P2',
      description: 'Environnement d\'exécution (Production, Test, Dev, Backup)',
      fields: [
        { name: 'envId', type: 'string', priority: 'P1', required: true, description: 'Identifiant unique' },
        { name: 'solutionId', type: 'ObjectId', priority: 'P1', required: true, description: 'Référence vers Solution' },
        { name: 'hostingId', type: 'string', priority: 'P1', required: true, description: 'Référence vers Hosting' },
        { name: 'env_type', type: 'enum', priority: 'P1', required: true, description: 'Type (production/test/dev/backup)' },
        { name: 'deployment_type', type: 'enum', priority: 'P2', required: false, description: 'Type de déploiement (monolith/microservices/hybrid)' },
        { name: 'tech_stack', type: 'string[]', priority: 'P2', required: false, description: 'Stack technique (langages, BDD, frameworks)' },
        { name: 'data_types', type: 'enum[]', priority: 'P1', required: true, description: 'Types de données (Personal/Sensitive/Health/Financial)' },
        { name: 'redundancy', type: 'enum', priority: 'P1', required: true, description: 'Niveau de redondance (none/minimal/geo-redundant/high)' },
        { name: 'backup', type: 'object', priority: 'P1', required: true, description: 'Détails de sauvegarde (exists, rto, rpo, restoration_test_frequency)' },
        { name: 'disaster_recovery_plan', type: 'string', priority: 'DD', required: false, description: 'Plan de reprise après sinistre' },
        { name: 'network_security_mechanisms', type: 'string[]', priority: 'DD', required: false, description: 'Mécanismes de sécurité réseau' },
        { name: 'db_scaling_mechanism', type: 'string', priority: 'DD', required: false, description: 'Mécanisme de scaling BDD' },
        { name: 'sla_offered', type: 'string', priority: 'P3', required: false, description: 'SLA offert' },
      ],
    },
    {
      id: 'hosting',
      name: 'Hosting',
      priority: 'P1/P2/P3',
      description: 'Informations d\'hébergement',
      fields: [
        { name: 'hostingId', type: 'string', priority: 'P1', required: true, description: 'Identifiant unique' },
        { name: 'provider', type: 'string', priority: 'P1', required: true, description: 'Fournisseur (OVH, Azure, GCP, AWS, etc.)' },
        { name: 'region', type: 'string', priority: 'P1', required: true, description: 'Région/Pays d\'hébergement' },
        { name: 'tier', type: 'enum', priority: 'P1', required: true, description: 'Niveau (datacenter/private/public/cloud)' },
        { name: 'certifications', type: 'string[]', priority: 'P2/P3', required: false, description: 'Certifications (ISO27001, HDS, SOC2, etc.)' },
        { name: 'contact', type: 'object', priority: 'P4', required: false, description: 'Contact technique (name, email)' },
      ],
    },
    {
      id: 'securityprofile',
      name: 'SecurityProfile',
      priority: 'P1/P2/P3',
      description: 'Profil de sécurité (critique pour scoring Sécurité 30%)',
      fields: [
        { name: 'secId', type: 'string', priority: 'P1', required: true, description: 'Identifiant unique' },
        { name: 'envId', type: 'ObjectId', priority: 'P1', required: true, description: 'Référence vers Environment' },
        { name: 'auth', type: 'enum', priority: 'P1', required: true, description: 'Authentification (None/Passwords/MFA/SSO)' },
        { name: 'encryption', type: 'object', priority: 'P1', required: true, description: 'Chiffrement (in_transit, at_rest, details)' },
        { name: 'patching', type: 'enum', priority: 'P2', required: true, description: 'Gestion des patchs (ad_hoc/scheduled/automated)' },
        { name: 'pentest_freq', type: 'enum', priority: 'P3', required: true, description: 'Fréquence pentests (never/annual/quarterly)' },
        { name: 'vuln_mgmt', type: 'enum', priority: 'P2', required: true, description: 'Gestion vulnérabilités (none/manual/automated)' },
        { name: 'access_control', type: 'string', priority: 'P2', required: false, description: 'Contrôle d\'accès (ex: PAM)' },
        { name: 'internal_audits_recent', type: 'string', priority: 'DD', required: false, description: 'Audits internes récents' },
        { name: 'centralized_monitoring', type: 'boolean', priority: 'DD', required: false, description: 'Monitoring centralisé' },
        { name: 'pentest_results_summary', type: 'string', priority: 'DD', required: false, description: 'Résumé résultats pentests' },
        { name: 'known_security_flaws', type: 'string', priority: 'DD', required: false, description: 'Failles connues' },
        { name: 'incident_reporting_process', type: 'string', priority: 'DD', required: false, description: 'Processus signalement incidents' },
      ],
    },
    {
      id: 'monitoringobservability',
      name: 'MonitoringObservability',
      priority: 'P2',
      description: 'Observabilité et monitoring (critique pour scoring Observabilité 15%)',
      fields: [
        { name: 'monId', type: 'string', priority: 'P2', required: true, description: 'Identifiant unique' },
        { name: 'envId', type: 'ObjectId', priority: 'P2', required: true, description: 'Référence vers Environment' },
        { name: 'perf_monitoring', type: 'enum', priority: 'P2', required: true, description: 'Monitoring performance (Yes/Partial/No)' },
        { name: 'log_centralization', type: 'enum', priority: 'P2', required: true, description: 'Centralisation logs (Yes/Partial/No)' },
        { name: 'tools', type: 'string[]', priority: 'P2', required: false, description: 'Outils (Prometheus, Grafana, ELK, Datadog, etc.)' },
        { name: 'alerting_strategy', type: 'string', priority: 'DD', required: false, description: 'Stratégie d\'alerting' },
      ],
    },
    {
      id: 'entitycost',
      name: 'EntityCost',
      priority: 'P4',
      description: 'Coûts associés à un environnement',
      fields: [
        { name: 'costId', type: 'string', priority: 'P4', required: true, description: 'Identifiant unique' },
        { name: 'envId', type: 'ObjectId', priority: 'P4', required: true, description: 'Référence vers Environment' },
        { name: 'hosting_monthly', type: 'number', priority: 'P4', required: false, description: 'Coûts mensuels hébergement' },
        { name: 'licenses_monthly', type: 'number', priority: 'P4', required: false, description: 'Coûts mensuels licences' },
        { name: 'ops_hours_monthly_equiv', type: 'number', priority: 'P4', required: false, description: 'Heures Ops mensuelles (équivalent)' },
        { name: 'comments', type: 'string', priority: 'P4', required: false, description: 'Commentaires' },
        { name: 'hidden_costs', type: 'string', priority: 'DD', required: false, description: 'Coûts cachés' },
        { name: 'cost_evolution_factors', type: 'string', priority: 'DD', required: false, description: 'Facteurs d\'évolution' },
        { name: 'modernization_investment_needs', type: 'string', priority: 'DD', required: false, description: 'Besoins investissement modernisation' },
      ],
    },
    {
      id: 'codebase',
      name: 'CodeBase',
      priority: 'DD',
      description: 'Informations sur le code source',
      fields: [
        { name: 'codebaseId', type: 'string', priority: 'DD', required: true, description: 'Identifiant unique' },
        { name: 'solutionId', type: 'ObjectId', priority: 'DD', required: true, description: 'Référence vers Solution' },
        { name: 'repo_location', type: 'string', priority: 'DD', required: true, description: 'Localisation du dépôt' },
        { name: 'documentation_level', type: 'enum', priority: 'DD', required: true, description: 'Niveau documentation (High/Medium/Low/None)' },
        { name: 'code_review_process', type: 'string', priority: 'DD', required: false, description: 'Processus de revue de code' },
        { name: 'version_control_tool', type: 'string', priority: 'DD', required: false, description: 'Outil de contrôle de version' },
        { name: 'technical_debt_known', type: 'string', priority: 'DD', required: false, description: 'Dette technique connue' },
        { name: 'legacy_systems', type: 'string', priority: 'DD', required: false, description: 'Systèmes hérités' },
        { name: 'third_party_dependencies', type: 'string[]', priority: 'DD', required: false, description: 'Dépendances tierces' },
      ],
    },
    {
      id: 'developmentmetrics',
      name: 'DevelopmentMetrics',
      priority: 'P3',
      description: 'Métriques DevOps (4 métriques clés)',
      fields: [
        { name: 'metricsId', type: 'string', priority: 'P3', required: true, description: 'Identifiant unique' },
        { name: 'solutionId', type: 'ObjectId', priority: 'P3', required: true, description: 'Référence vers Solution' },
        { name: 'sdlc_process', type: 'enum', priority: 'P3', required: true, description: 'Processus SDLC (Scrum/Kanban/Waterfall/Agile/Hybrid)' },
        { name: 'devops_automation_level', type: 'enum', priority: 'P3', required: true, description: 'Niveau automatisation CI/CD (None/Manual/Partial CI/Full CI/CD)' },
        { name: 'planned_vs_unplanned_ratio', type: 'number', priority: 'P3', required: true, description: 'Ratio travail planifié/non planifié (0-1)' },
        { name: 'lead_time_for_changes_days', type: 'number', priority: 'P3', required: true, description: 'Délai mise en œuvre changements (jours)' },
        { name: 'mttr_hours', type: 'number', priority: 'P3', required: true, description: 'Mean Time to Restore (heures)' },
        { name: 'internal_vs_external_bug_ratio', type: 'number', priority: 'P3', required: true, description: 'Ratio bugs internes/externes (0-1)' },
      ],
    },
    {
      id: 'developmentteam',
      name: 'DevelopmentTeam',
      priority: 'DD',
      description: 'Équipe de développement',
      fields: [
        { name: 'teamId', type: 'string', priority: 'DD', required: true, description: 'Identifiant unique' },
        { name: 'editorId', type: 'ObjectId', priority: 'DD', required: true, description: 'Référence vers Editor' },
        { name: 'team_size_adequate', type: 'string', priority: 'DD', required: true, description: 'Taille équipe adéquate' },
        { name: 'key_person_dependency', type: 'string', priority: 'DD', required: false, description: 'Dépendances personnes clés' },
      ],
    },
    {
      id: 'aifeatures',
      name: 'AIFeatures',
      priority: 'DD',
      description: 'Fonctionnalités IA',
      fields: [
        { name: 'aiId', type: 'string', priority: 'DD', required: true, description: 'Identifiant unique' },
        { name: 'solutionId', type: 'ObjectId', priority: 'DD', required: true, description: 'Référence vers Solution' },
        { name: 'technical_type', type: 'string', priority: 'DD', required: true, description: 'Type technique (services externes vs modèles propres)' },
        { name: 'quality_validation_method', type: 'string', priority: 'DD', required: false, description: 'Méthode validation qualité' },
        { name: 'continuous_improvement', type: 'boolean', priority: 'DD', required: true, description: 'Amélioration continue' },
      ],
    },
    {
      id: 'scoringsnapshot',
      name: 'ScoringSnapshot',
      priority: 'P1',
      description: 'Instantané de scoring (résultat du moteur de scoring)',
      fields: [
        { name: 'scoreId', type: 'string', priority: 'P1', required: true, description: 'Identifiant unique' },
        { name: 'solutionId', type: 'ObjectId', priority: 'P1', required: true, description: 'Référence vers Solution' },
        { name: 'envId', type: 'ObjectId', priority: 'P1', required: false, description: 'Référence vers Environment (souvent Prod)' },
        { name: 'date', type: 'Date', priority: 'P1', required: true, description: 'Date du snapshot' },
        { name: 'global_score', type: 'number', priority: 'P1', required: true, description: 'Score global (0-100)' },
        { name: 'risk_level', type: 'enum', priority: 'P1', required: true, description: 'Niveau de risque (Low/Medium/High/Critical)' },
        { name: 'scores', type: 'object', priority: 'P1', required: true, description: 'Scores par catégorie (Security, Resilience, Observability, Architecture, Compliance)' },
        { name: 'notes', type: 'string', priority: 'P1', required: false, description: 'Notes et recommandations' },
      ],
    },
    {
      id: 'roadmapitem',
      name: 'RoadmapItem',
      priority: 'P3',
      description: 'Élément de roadmap',
      fields: [
        { name: 'roadmapId', type: 'string', priority: 'P3', required: true, description: 'Identifiant unique' },
        { name: 'parentId', type: 'ObjectId', priority: 'P3', required: true, description: 'Référence Solution ou Environment' },
        { name: 'linkedTo', type: 'enum', priority: 'P3', required: true, description: 'Type parent (Solution/Environment)' },
        { name: 'title', type: 'string', priority: 'P3', required: true, description: 'Titre' },
        { name: 'type', type: 'enum', priority: 'P3', required: true, description: 'Type (refactor/migration/security/feature/compliance)' },
        { name: 'target_date', type: 'Date', priority: 'P3', required: false, description: 'Date cible' },
        { name: 'status', type: 'enum', priority: 'P3', required: true, description: 'Statut (Planned/In Progress/Completed/Deferred)' },
        { name: 'impact_estimate', type: 'string', priority: 'P3', required: false, description: 'Estimation impact' },
      ],
    },
    {
      id: 'document',
      name: 'Document',
      priority: 'P4',
      description: 'Document associé (diagramme, pentest, contrat, etc.)',
      fields: [
        { name: 'docId', type: 'string', priority: 'P4', required: true, description: 'Identifiant unique' },
        { name: 'parentId', type: 'ObjectId', priority: 'P4', required: true, description: 'Référence Editor, Solution ou Environment' },
        { name: 'linkedTo', type: 'enum', priority: 'P4', required: true, description: 'Type parent (Editor/Solution/Environment)' },
        { name: 'type', type: 'enum', priority: 'P4', required: true, description: 'Type (diagram/pentest/contract/audit/report)' },
        { name: 'url_or_hash', type: 'string', priority: 'P4', required: true, description: 'URL ou hash du fichier' },
        { name: 'upload_date', type: 'Date', priority: 'P4', required: true, description: 'Date d\'upload' },
      ],
    },
  ];

  const selectedEntityData = entities.find((e) => e.id === selectedEntity);

  const getPriorityColor = (priority: string) => {
    if (priority.startsWith('P1')) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
    if (priority.startsWith('P2')) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
    if (priority.startsWith('P3')) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    if (priority.startsWith('P4')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Modèle de Données</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Description complète des entités et des champs collectés pour l'évaluation de la santé technique.
          Les priorités P1 à P4 indiquent l'importance pour le scoring, tandis que DD indique les données de Due Diligence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des entités */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Entités</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {entities.map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => setSelectedEntity(entity.id)}
                  className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    selectedEntity === entity.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500 dark:border-blue-400'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{entity.name}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(entity.priority)}`}>
                      {entity.priority}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Détails de l'entité sélectionnée */}
        <div className="lg:col-span-2">
          {selectedEntityData ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedEntityData.name}</h3>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(selectedEntityData.priority)}`}>
                    {selectedEntityData.priority}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">{selectedEntityData.description}</p>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Champs</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Champ
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Priorité
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Requis
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedEntityData.fields.map((field, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{field.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs text-gray-800 dark:text-gray-200">{field.type}</code>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(field.priority)}`}>
                              {field.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {field.required ? (
                              <span className="text-red-600 dark:text-red-400 font-medium">Oui</span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">Non</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{field.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center transition-colors">
              <p className="text-gray-500 dark:text-gray-400">Sélectionnez une entité pour voir ses champs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default About;
