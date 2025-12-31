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
  'dataManagement.editor.technicalAssets': { model: 'Editor', field: 'assets', type: 'Asset[]', note: 'Remplace internal_it_systems' },
  'dataManagement.editor.itSecurityStrategy': { model: 'Editor', field: 'it_security_strategy', type: 'string[]' },
  'dataManagement.editor.contractsForReview': { model: 'Editor', field: 'contracts_for_review', type: '{ type: string, summary: string }[]' },
  'dataManagement.editor.technicalAssetsDesc': { model: 'Editor', field: 'assets', type: 'Asset[]', note: 'Remplace internal_it_systems' },
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
  'dataManagement.solution.ipOwnershipClear': { model: 'Solution', field: 'ip_ownership_clear', type: 'enum' },
  'dataManagement.solution.licensingModel': { model: 'Solution', field: 'licensing_model', type: 'string' },
  'dataManagement.solution.licenseComplianceAssured': { model: 'Solution', field: 'license_compliance_assured', type: 'enum' },
  'dataManagement.solution.techStack': { model: 'Solution', field: 'tech_stack', type: 'string[]' },

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
  
  // Asset fields
  'dataManagement.assets.name': { model: 'Asset', field: 'name', type: 'string' },
  'dataManagement.assets.category': { model: 'Asset', field: 'category', type: 'enum: intangible | digital_and_data | tangible | financial' },
  'dataManagement.assets.type': { model: 'Asset', field: 'type', type: 'string' },
  'dataManagement.assets.description': { model: 'Asset', field: 'description', type: 'string' },
  'dataManagement.assets.operational_purpose': { model: 'Asset', field: 'operational_purpose', type: 'string' },
  'dataManagement.assets.information_owner': { model: 'Asset', field: 'information_owner', type: 'string' },
  'dataManagement.assets.custodian': { model: 'Asset', field: 'custodian', type: 'string' },
  'dataManagement.assets.confidentiality_level': { model: 'Asset', field: 'confidentiality_level', type: 'string' },
  'dataManagement.assets.integrity_level': { model: 'Asset', field: 'integrity_level', type: 'string' },
  'dataManagement.assets.availability_level': { model: 'Asset', field: 'availability_level', type: 'string' },
  'dataManagement.assets.criticality_status': { model: 'Asset', field: 'criticality_status', type: 'boolean' },
  'dataManagement.assets.mtd_hours': { model: 'Asset', field: 'mtd_hours', type: 'number' },
  'dataManagement.assets.rpo_mtdl_hours': { model: 'Asset', field: 'rpo_mtdl_hours', type: 'number' },
  'dataManagement.assets.approval_status': { model: 'Asset', field: 'approval_status', type: 'string' },
  'dataManagement.assets.encryption_status': { model: 'Asset', field: 'encryption_status', type: 'string' },
  'dataManagement.assets.physical_location': { model: 'Asset', field: 'physical_location', type: 'string' },
  'dataManagement.assets.version_firmware': { model: 'Asset', field: 'version_firmware', type: 'string' },
  'dataManagement.assets.sbom_reference': { model: 'Asset', field: 'sbom_reference', type: 'string' },
  'dataManagement.assets.end_of_life_date': { model: 'Asset', field: 'end_of_life_date', type: 'Date' },
  'dataManagement.assets.last_inventory_date': { model: 'Asset', field: 'last_inventory_date', type: 'Date' },
  'dataManagement.assets.disposal_method': { model: 'Asset', field: 'disposal_method', type: 'string' },
  'dataManagement.assets.ownership': { model: 'Asset', field: 'ownership', type: 'string' },
  'dataManagement.assets.acceptable_use': { model: 'Asset', field: 'acceptable_use', type: 'string' },
  'dataManagement.assets.return_policy': { model: 'Asset', field: 'return_policy', type: 'string' },
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

