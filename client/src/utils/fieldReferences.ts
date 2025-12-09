/**
 * Mapping des champs du formulaire vers les références au modèle de données
 * Format: { translationKey: { model: string, field: string, type: string } }
 */

export interface FieldReference {
  model: string;
  field: string;
  type: string;
}

export const FIELD_REFERENCES: Record<string, FieldReference> = {
  // Editor fields (using dataManagement.form.* keys)
  'dataManagement.form.name': { model: 'Editor', field: 'name', type: 'string' },
  'dataManagement.form.country': { model: 'Editor', field: 'country', type: 'string' },
  'dataManagement.form.size': { model: 'Editor', field: 'size', type: 'enum: Micro | SME | Mid | Enterprise' },
  'dataManagement.form.businessCriticality': { model: 'Editor', field: 'business_criticality', type: 'enum: Low | Medium | High | Critical' },
  'dataManagement.form.description': { model: 'Solution', field: 'description', type: 'string' },
  'dataManagement.form.type': { model: 'Solution', field: 'type', type: 'enum: SaaS | OnPrem | Hybrid | ClientHeavy' },
  'dataManagement.form.mainUseCase': { model: 'Solution', field: 'main_use_case', type: 'string' },
  'dataManagement.form.productCriticality': { model: 'Solution', field: 'product_criticality', type: 'enum: Low | Medium | High | Critical' },
  
  // Editor fields (using dataManagement.editor.* keys)
  'dataManagement.editor.name': { model: 'Editor', field: 'name', type: 'string' },
  'dataManagement.editor.country': { model: 'Editor', field: 'country', type: 'string' },
  'dataManagement.editor.size': { model: 'Editor', field: 'size', type: 'enum: Micro | SME | Mid | Enterprise' },
  'dataManagement.editor.businessCriticality': { model: 'Editor', field: 'business_criticality', type: 'enum: Low | Medium | High | Critical' },
  'dataManagement.editor.internalItSystems': { model: 'Editor', field: 'internal_it_systems', type: 'string[]' },
  'dataManagement.editor.itSecurityStrategy': { model: 'Editor', field: 'it_security_strategy', type: 'string[]' },
  'dataManagement.editor.contractsForReview': { model: 'Editor', field: 'contracts_for_review', type: '{ type: string, summary: string }[]' },
  'dataManagement.editor.internalItSystemsList': { model: 'Editor', field: 'internal_it_systems', type: 'string[]' },
  'dataManagement.editor.itSecurityStrategyDesc': { model: 'Editor', field: 'it_security_strategy', type: 'string[]' },
  'dataManagement.editor.contractType': { model: 'Editor', field: 'contracts_for_review[].type', type: 'string' },
  'dataManagement.editor.contractSummary': { model: 'Editor', field: 'contracts_for_review[].summary', type: 'string' },

  // Solution fields
  'dataManagement.solution.name': { model: 'Solution', field: 'name', type: 'string' },
  'dataManagement.solution.description': { model: 'Solution', field: 'description', type: 'string' },
  'dataManagement.solution.mainUseCase': { model: 'Solution', field: 'main_use_case', type: 'string' },
  'dataManagement.solution.type': { model: 'Solution', field: 'type', type: 'enum: SaaS | OnPrem | Hybrid | ClientHeavy' },
  'dataManagement.solution.productCriticality': { model: 'Solution', field: 'product_criticality', type: 'enum: Low | Medium | High | Critical' },
  'dataManagement.solution.apiRobustness': { model: 'Solution', field: 'api_robustness', type: 'string' },
  'dataManagement.solution.apiDocumentationQuality': { model: 'Solution', field: 'api_documentation_quality', type: 'enum: High | Medium | Low | None' },
  'dataManagement.solution.ipOwnershipClear': { model: 'Solution', field: 'ip_ownership_clear', type: 'boolean' },
  'dataManagement.solution.licensingModel': { model: 'Solution', field: 'licensing_model', type: 'string' },
  'dataManagement.solution.licenseComplianceAssured': { model: 'Solution', field: 'license_compliance_assured', type: 'boolean' },

  // Environment fields
  'dataManagement.environment.envType': { model: 'Environment', field: 'env_type', type: 'enum: production | test | dev | backup' },
  'dataManagement.environment.redundancy': { model: 'Environment', field: 'redundancy', type: 'enum: none | minimal | geo-redundant | high' },
  'dataManagement.environment.deploymentType': { model: 'Environment', field: 'deployment_type', type: 'enum: monolith | microservices | hybrid' },
  'dataManagement.environment.virtualization': { model: 'Environment', field: 'virtualization', type: 'enum: physical | VM | container | k8s' },
  'dataManagement.environment.techStack': { model: 'Environment', field: 'tech_stack', type: 'string[]' },
  'dataManagement.environment.dataTypes': { model: 'Environment', field: 'data_types', type: 'enum[]: Personal | Sensitive | Health | Financial | Synthetic' },
  'dataManagement.environment.networkSecurity': { model: 'Environment', field: 'network_security_mechanisms', type: 'string[]' },
  'dataManagement.environment.dbScaling': { model: 'Environment', field: 'db_scaling_mechanism', type: 'string' },
  'dataManagement.environment.disasterRecovery': { model: 'Environment', field: 'disaster_recovery_plan', type: 'string' },
  'dataManagement.environment.sla': { model: 'Environment', field: 'sla_offered', type: 'string' },
  'dataManagement.environment.backupExists': { model: 'Environment', field: 'backup.exists', type: 'boolean' },
  'dataManagement.environment.backupSchedule': { model: 'Environment', field: 'backup.schedule', type: 'string' },
  'dataManagement.environment.rto': { model: 'Environment', field: 'backup.rto', type: 'number' },
  'dataManagement.environment.rpo': { model: 'Environment', field: 'backup.rpo', type: 'number' },
  'dataManagement.environment.restorationTestFrequency': { model: 'Environment', field: 'backup.restoration_test_frequency', type: 'enum: annual | quarterly | never' },

  // Hosting fields
  'dataManagement.hosting.provider': { model: 'Hosting', field: 'provider', type: 'string' },
  'dataManagement.hosting.region': { model: 'Hosting', field: 'region', type: 'string' },
  'dataManagement.hosting.tier': { model: 'Hosting', field: 'tier', type: 'enum: datacenter | private | public | cloud' },
  'dataManagement.hosting.certifications': { model: 'Hosting', field: 'certifications', type: 'string[]' },
  'dataManagement.hosting.contactName': { model: 'Hosting', field: 'contact.name', type: 'string' },
  'dataManagement.hosting.contactEmail': { model: 'Hosting', field: 'contact.email', type: 'string' },

  // Security Profile fields
  'dataManagement.security.auth': { model: 'SecurityProfile', field: 'auth', type: 'enum: None | Passwords | MFA | SSO' },
  'dataManagement.security.encryptionInTransit': { model: 'SecurityProfile', field: 'encryption.in_transit', type: 'boolean' },
  'dataManagement.security.encryptionAtRest': { model: 'SecurityProfile', field: 'encryption.at_rest', type: 'boolean' },
  'dataManagement.security.encryptionDetails': { model: 'SecurityProfile', field: 'encryption.details', type: 'string' },
  'dataManagement.security.patching': { model: 'SecurityProfile', field: 'patching', type: 'enum: ad_hoc | scheduled | automated' },
  'dataManagement.security.pentestFreq': { model: 'SecurityProfile', field: 'pentest_freq', type: 'enum: never | annual | quarterly' },
  'dataManagement.security.vulnMgmt': { model: 'SecurityProfile', field: 'vuln_mgmt', type: 'enum: none | manual | automated' },
  'dataManagement.security.accessControl': { model: 'SecurityProfile', field: 'access_control', type: 'string' },
  'dataManagement.security.internalAudits': { model: 'SecurityProfile', field: 'internal_audits_recent', type: 'string' },
  'dataManagement.security.centralizedMonitoring': { model: 'SecurityProfile', field: 'centralized_monitoring', type: 'boolean' },
  'dataManagement.security.pentestResults': { model: 'SecurityProfile', field: 'pentest_results_summary', type: 'string' },
  'dataManagement.security.knownFlaws': { model: 'SecurityProfile', field: 'known_security_flaws', type: 'string' },
  'dataManagement.security.incidentProcess': { model: 'SecurityProfile', field: 'incident_reporting_process', type: 'string' },

  // Monitoring fields
  'dataManagement.monitoring.perfMonitoring': { model: 'MonitoringObservability', field: 'perf_monitoring', type: 'enum: Yes | Partial | No' },
  'dataManagement.monitoring.logCentralization': { model: 'MonitoringObservability', field: 'log_centralization', type: 'enum: Yes | Partial | No' },
  'dataManagement.monitoring.tools': { model: 'MonitoringObservability', field: 'tools', type: 'string[]' },
  'dataManagement.monitoring.alertingStrategy': { model: 'MonitoringObservability', field: 'alerting_strategy', type: 'string' },

  // Costs fields
  'dataManagement.costs.hostingMonthly': { model: 'EntityCost', field: 'hosting_monthly', type: 'number' },
  'dataManagement.costs.licensesMonthly': { model: 'EntityCost', field: 'licenses_monthly', type: 'number' },
  'dataManagement.costs.opsHoursMonthly': { model: 'EntityCost', field: 'ops_hours_monthly_equiv', type: 'number' },
  'dataManagement.costs.comments': { model: 'EntityCost', field: 'comments', type: 'string' },
  'dataManagement.costs.hiddenCosts': { model: 'EntityCost', field: 'hidden_costs', type: 'string' },
  'dataManagement.costs.costEvolution': { model: 'EntityCost', field: 'cost_evolution_factors', type: 'string' },
  'dataManagement.costs.modernizationNeeds': { model: 'EntityCost', field: 'modernization_investment_needs', type: 'string' },
  
  // Form selection fields (these don't map to specific model fields, but we can add them for consistency)
  'dataManagement.form.selectSolution': { model: 'Solution', field: 'solutionId', type: 'ID' },
  'dataManagement.form.selectEnvironment': { model: 'Environment', field: 'envId', type: 'ID' },
};

/**
 * Obtient la référence au modèle de données pour une clé de traduction
 */
export function getFieldReference(translationKey: string): FieldReference | null {
  return FIELD_REFERENCES[translationKey] || null;
}

/**
 * Formate la référence pour l'affichage
 */
export function formatFieldReference(ref: FieldReference): string {
  return `${ref.model}.${ref.field} (${ref.type})`;
}

