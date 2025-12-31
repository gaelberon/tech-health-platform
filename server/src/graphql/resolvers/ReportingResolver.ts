// Fichier : /server/src/graphql/resolvers/ReportingResolver.ts
// Resolver pour la génération de rapports

import { EditorModel } from '../../models/Editor.model.js';
import { SolutionModel } from '../../models/Solution.model.js';
import { EnvironmentModel } from '../../models/Environment.model.js';
import { SecurityProfileModel } from '../../models/SecurityProfile.model.js';
import { HostingModel } from '../../models/Hosting.model.js';
import { CodeBaseModel } from '../../models/CodeBase.model.js';
import { DevelopmentMetricsModel } from '../../models/DevelopmentMetrics.model.js';
import { MonitoringObservabilityModel } from '../../models/MonitoringObservability.model.js';
import { AssetModel } from '../../models/Asset.model.js';

// Mapping des champs AISA avec leurs références
const AISA_FIELD_MAPPING: Record<string, { 
  reference: string; 
  description: string; 
  entity: string;
  field: string;
}> = {
  // Editor fields - AISA references 1.1.1 to 7.1.2
  '1.1.1': { reference: '1.1.1', description: 'Information Security Policies', entity: 'Editor', field: 'information_security_policy' },
  '1.2.1': { reference: '1.2.1', description: 'Information security managed within the organization', entity: 'Editor', field: 'it_security_strategy' },
  '1.2.2': { reference: '1.2.2', description: 'Information security responsibilities organized', entity: 'Editor', field: 'information_security_roles' },
  '1.2.3': { reference: '1.2.3', description: 'Information security requirements considered in projects', entity: 'Editor', field: 'information_security_in_projects' },
  '1.2.4': { reference: '1.2.4', description: 'Responsibilities between external IT service providers and the own organization defined', entity: 'Editor', field: 'external_it_service_provider_responsibilities' },
  '1.3.1_asset_name': { reference: '1.3.1', description: 'Information assets identified and recorded', entity: 'Asset', field: 'name' },
  '1.3.1_operational': { reference: '1.3.1', description: 'Operational purpose of information assets', entity: 'Asset', field: 'operational_purpose' },
  '1.3.1_owner': { reference: '1.3.1', description: 'Information owner (Risk Owner)', entity: 'Asset', field: 'information_owner' },
  '1.3.1_custodian': { reference: '1.3.1', description: 'Custodian (technical maintenance responsible)', entity: 'Asset', field: 'custodian' },
  '1.3.1_inventory': { reference: '1.3.1', description: 'Last inventory date', entity: 'Asset', field: 'last_inventory_date' },
  '1.3.1_description': { reference: '1.3.1', description: 'Asset description', entity: 'Asset', field: 'description' },
  '1.3.2_classification': { reference: '1.3.2', description: 'Information assets classified and managed in terms of their protection needs', entity: 'Asset', field: 'confidentiality_level' },
  '1.3.2_integrity': { reference: '1.3.2', description: 'Integrity level', entity: 'Asset', field: 'integrity_level' },
  '1.3.2_availability': { reference: '1.3.2', description: 'Availability level', entity: 'Asset', field: 'availability_level' },
  '1.3.2_criticality': { reference: '1.3.2', description: 'Criticality status', entity: 'Asset', field: 'criticality_status' },
  '1.3.2_mtd': { reference: '1.3.2', description: 'Max Tolerable Downtime (MTD) in hours', entity: 'Asset', field: 'mtd_hours' },
  '1.3.2_rpo': { reference: '1.3.2', description: 'Recovery Point Objective / Maximum Tolerable Data Loss (RPO/MTDL) in hours', entity: 'Asset', field: 'rpo_mtdl_hours' },
  '1.3.3': { reference: '1.3.3', description: 'Only evaluated and approved external IT services are used', entity: 'Editor', field: 'external_it_service_evaluation' },
  '1.3.4_approval': { reference: '1.3.4', description: 'Approval status of assets', entity: 'Asset', field: 'approval_status' },
  '3.1.3_location': { reference: '3.1.3', description: 'Physical location of assets', entity: 'Asset', field: 'physical_location' },
  '3.1.3_disposal': { reference: '3.1.3', description: 'Disposal method for assets', entity: 'Asset', field: 'disposal_method' },
  '3.1.3_version': { reference: '3.1.3', description: 'Version/Firmware of assets', entity: 'Asset', field: 'version_firmware' },
  '3.1.4_encryption': { reference: '3.1.4', description: 'Encryption status (mobile assets)', entity: 'Asset', field: 'encryption_status' },
  '3.1.4_sbom': { reference: '3.1.4', description: 'SBOM Reference (Software Bill of Materials)', entity: 'Asset', field: 'sbom_reference' },
  '3.1.4_eol': { reference: '3.1.4', description: 'End of Life Date', entity: 'Asset', field: 'end_of_life_date' },
  '3.2': { reference: '3.2', description: 'Ownership of Assets', entity: 'Asset', field: 'ownership' },
  '3.3': { reference: '3.3', description: 'Acceptable Use of Assets', entity: 'Asset', field: 'acceptable_use' },
  '3.4': { reference: '3.4', description: 'Return of Assets', entity: 'Asset', field: 'return_policy' },
  '1.4.1': { reference: '1.4.1', description: 'Information security risks managed', entity: 'Editor', field: 'information_security_risk_management' },
  '1.5.1': { reference: '1.5.1', description: 'Compliance with information security in procedures and processes', entity: 'Editor', field: 'information_security_compliance_procedures' },
  '1.5.2': { reference: '1.5.2', description: 'ISMS reviewed by an independent authority', entity: 'Editor', field: 'isms_reviewed_by_independent_authority' },
  '1.6.1': { reference: '1.6.1', description: 'Information security relevant events or observations reported', entity: 'Editor', field: 'security_incident_management' },
  '1.6.2': { reference: '1.6.2', description: 'Reported security events managed', entity: 'Editor', field: 'security_incident_management' },
  '1.6.3': { reference: '1.6.3', description: 'Organization prepared to handle crisis situations', entity: 'Editor', field: 'security_incident_management' },
  '2.1.1': { reference: '2.1.1', description: 'Qualification of employees for sensitive work fields ensured', entity: 'Editor', field: 'employee_qualification_for_sensitive_work' },
  '2.1.2': { reference: '2.1.2', description: 'All staff contractually bound to comply with information security policies', entity: 'Editor', field: 'staff_contractually_bound_to_security_policies' },
  '2.1.3': { reference: '2.1.3', description: 'Staff made aware of and trained with respect to the risks', entity: 'Editor', field: 'security_awareness_training' },
  '2.1.4': { reference: '2.1.4', description: 'Mobile work regulated', entity: 'Editor', field: 'mobile_work_policy' },
  '6.1.1': { reference: '6.1.1', description: 'Information security ensured among contractors and cooperation partners', entity: 'Editor', field: 'supplier_security_management' },
  '6.1.2': { reference: '6.1.2', description: 'Non-disclosure regarding the exchange of information contractually agreed', entity: 'Editor', field: 'supplier_security_management' },
  '7.1.1': { reference: '7.1.1', description: 'Compliance with regulatory and contractual provisions ensured', entity: 'Editor', field: 'compliance_with_regulatory_provisions' },
  '7.1.2': { reference: '7.1.2', description: 'Protection of personally identifiable data considered when implementing information security', entity: 'Editor', field: 'personal_data_protection' },
  
  // Solution fields - AISA references
  '1.3.4': { reference: '1.3.4', description: 'Only evaluated and approved software is used', entity: 'Solution', field: 'license_compliance_assured' },
  
  // ISO 27001 references (referenced by AISA but not directly AISA)
  'ISO_8.1': { reference: 'ISO 27001 A.8.1', description: 'API robustness and integration capabilities', entity: 'Solution', field: 'api_robustness' },
  'ISO_8.2': { reference: 'ISO 27001 A.8.2', description: 'API documentation quality', entity: 'Solution', field: 'api_documentation_quality' },
  
  // Environment fields - AISA references
  '1.3.2': { reference: '1.3.2', description: 'Information assets classified and managed in terms of their protection needs', entity: 'Environment', field: 'data_types' },
  '3.1.1': { reference: '3.1.1', description: 'Security zones managed to protect information assets', entity: 'Environment', field: 'security_zones_managed' },
  '3.1.3': { reference: '3.1.3', description: 'Handling of supporting assets managed', entity: 'Environment', field: 'virtualization' },
  '3.1.4': { reference: '3.1.4', description: 'Handling of mobile IT devices and mobile data storage devices managed', entity: 'Environment', field: 'virtualization' },
  '5.2.2': { reference: '5.2.2', description: 'Development and testing environments separated from operational environments', entity: 'Environment', field: 'env_type' },
  '5.2.6_env': { reference: '5.2.6', description: 'Network of the organization managed', entity: 'Environment', field: 'network_security_mechanisms' },
  '5.2.7': { reference: '5.2.7', description: 'Continuity planning for IT services in place', entity: 'Environment', field: 'disaster_recovery_plan' },
  '5.2.8': { reference: '5.2.8', description: 'Backup and recovery of data and IT services ensured', entity: 'Environment', field: 'backup' },
  '5.2.9': { reference: '5.2.9', description: 'Backup and recovery details', entity: 'Environment', field: 'backup' },
  '5.3.1': { reference: '5.3.1', description: 'Information security considered in new or further developed IT systems', entity: 'Environment', field: 'deployment_type' },
  '5.3.2': { reference: '5.3.2', description: 'Requirements for network services defined', entity: 'Environment', field: 'network_services_requirements' },
  '5.3.3': { reference: '5.3.3', description: 'Return and secure removal of information assets from external IT services regulated', entity: 'Environment', field: 'information_assets_removal_policy' },
  '5.3.4': { reference: '5.3.4', description: 'Information protected in shared external IT services', entity: 'Environment', field: 'shared_external_it_services_protection' },
  
  // SecurityProfile fields - AISA references
  '4.1.1': { reference: '4.1.1', description: 'Use of identification means managed', entity: 'SecurityProfile', field: 'auth' },
  '4.1.2': { reference: '4.1.2', description: 'User access to IT services and IT systems secured', entity: 'SecurityProfile', field: 'auth' },
  '4.1.3': { reference: '4.1.3', description: 'User accounts and login information securely managed and applied', entity: 'SecurityProfile', field: 'access_control' },
  '4.2.1': { reference: '4.2.1', description: 'Access rights assigned and managed', entity: 'SecurityProfile', field: 'access_control' },
  '5.1.1': { reference: '5.1.1', description: 'Use of cryptographic procedures managed', entity: 'SecurityProfile', field: 'encryption' },
  '5.1.2': { reference: '5.1.2', description: 'Information protected during transfer', entity: 'SecurityProfile', field: 'encryption' },
  '5.2.1': { reference: '5.2.1', description: 'Changes managed', entity: 'SecurityProfile', field: 'change_management' },
  '5.2.3': { reference: '5.2.3', description: 'IT systems protected against malware', entity: 'SecurityProfile', field: 'malware_protection' },
  '5.2.4': { reference: '5.2.4', description: 'Event logs recorded and analysed', entity: 'SecurityProfile', field: 'centralized_monitoring' },
  '5.2.5': { reference: '5.2.5', description: 'Vulnerabilities identified and addressed', entity: 'SecurityProfile', field: 'vuln_mgmt' },
  '5.2.6_sec': { reference: '5.2.6', description: 'IT systems and services technically checked (system and service audit)', entity: 'SecurityProfile', field: 'pentest_freq' },
  
  // ISO 27001 references (referenced by AISA but not directly AISA)
  // Note: References 8.x, 9.x, 10.x, 12.x, 15.x, 16.x, 18.x come from ISO 27001, not directly from AISA document
  'ISO_9.1': { reference: 'ISO 27001 A.9.1', description: 'Access control mechanisms', entity: 'SecurityProfile', field: 'access_control' },
  'ISO_9.2': { reference: 'ISO 27001 A.9.2', description: 'Access control details', entity: 'SecurityProfile', field: 'access_control' },
  'ISO_9.5': { reference: 'ISO 27001 A.9.5', description: 'Privileged access rights', entity: 'SecurityProfile', field: 'access_control' },
  'ISO_10.1': { reference: 'ISO 27001 A.10.1', description: 'Cryptographic controls', entity: 'SecurityProfile', field: 'encryption' },
  'ISO_10.2': { reference: 'ISO 27001 A.10.2', description: 'Key management', entity: 'SecurityProfile', field: 'key_management' },
  'ISO_12.1': { reference: 'ISO 27001 A.12.1', description: 'Vulnerability management', entity: 'SecurityProfile', field: 'vuln_mgmt' },
  'ISO_12.2': { reference: 'ISO 27001 A.12.2', description: 'Vulnerability management details', entity: 'SecurityProfile', field: 'vuln_mgmt' },
  'ISO_12.3': { reference: 'ISO 27001 A.12.3', description: 'Known security flaws', entity: 'SecurityProfile', field: 'known_security_flaws' },
  'ISO_12.4': { reference: 'ISO 27001 A.12.4', description: 'Performance monitoring', entity: 'MonitoringObservability', field: 'perf_monitoring' },
  'ISO_12.5': { reference: 'ISO 27001 A.12.5', description: 'Log centralization', entity: 'MonitoringObservability', field: 'log_centralization' },
  'ISO_12.7': { reference: 'ISO 27001 A.12.7', description: 'Penetration test frequency', entity: 'SecurityProfile', field: 'pentest_freq' },
  'ISO_16.1': { reference: 'ISO 27001 A.16.1', description: 'Information Security Incident Management', entity: 'SecurityProfile', field: 'incident_reporting_process' },
  'ISO_16.2': { reference: 'ISO 27001 A.16.2', description: 'Information Security Incident Reporting', entity: 'SecurityProfile', field: 'incident_reporting_process' },
  'ISO_16.3': { reference: 'ISO 27001 A.16.3', description: 'Information Security Incident Response', entity: 'SecurityProfile', field: 'incident_reporting_process' },
  'ISO_18.1': { reference: 'ISO 27001 A.18.1', description: 'Compliance with Legal and Contractual Requirements', entity: 'SecurityProfile', field: 'internal_audits_recent' },
  'ISO_18.2': { reference: 'ISO 27001 A.18.2', description: 'Information Security Reviews', entity: 'SecurityProfile', field: 'internal_audits_recent' },
  
  // Hosting fields - ISO 27001 references (certifications are partially covered by ISO 27001 A.18.1, A.18.2)
  'ISO_18.1_hosting': { reference: 'ISO 27001 A.18.1', description: 'Compliance with Legal and Contractual Requirements (Certifications)', entity: 'Hosting', field: 'certifications' },
  
  // CodeBase fields - ISO 27001 references (referenced by AISA but not directly AISA)
  'ISO_15.1': { reference: 'ISO 27001 A.15.1', description: 'Information Security in Supplier Relationships', entity: 'CodeBase', field: 'third_party_dependencies' },
  'ISO_15.2': { reference: 'ISO 27001 A.15.2', description: 'Supplier Service Delivery Management', entity: 'CodeBase', field: 'third_party_dependencies' },
  
  // DevelopmentMetrics fields - Note: These are primarily DD Tech fields, not directly AISA mapped
  // MTTR relates to incident response (ISO 27001 A.16.1, A.16.2 referenced by AISA)
};

// Fonction pour échapper les valeurs CSV
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  // Si la valeur contient des virgules, des guillemets ou des sauts de ligne, l'entourer de guillemets
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    // Échapper les guillemets en les doublant
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

// Fonction pour formater une valeur pour le CSV
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  if (Array.isArray(value)) {
    return value.join('; ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

// Fonction pour générer le CSV
async function generateAisaCsv(editorId: string): Promise<string> {
  // Récupérer l'éditeur avec toutes ses données
  const editor = await EditorModel.findOne({ editorId });
  if (!editor) {
    throw new Error(`Éditeur avec l'ID ${editorId} non trouvé`);
  }

  // Récupérer toutes les solutions de l'éditeur (exclure les archivées)
  const solutions = await SolutionModel.find({ 
    editorId: editor._id,
    $or: [{ archived: { $ne: true } }, { archived: { $exists: false } }]
  });
  
  // Récupérer tous les environnements pour ces solutions (exclure les archivés)
  const solutionIds = solutions.map(s => s._id);
  const environments = await EnvironmentModel.find({ 
    solutionId: { $in: solutionIds as any },
    $or: [{ archived: { $ne: true } }, { archived: { $exists: false } }]
  });
  
  // Récupérer les profils de sécurité
  const envIds = environments.map(e => e._id);
  const securityProfiles = await SecurityProfileModel.find({ envId: { $in: envIds as any } });
  
  // Récupérer les hébergements
  const hostingIds = [...new Set(environments.map(e => e.hostingId))];
  const hostings = await HostingModel.find({ hostingId: { $in: hostingIds as any } });
  
  // Récupérer les codebases
  const codebases = await CodeBaseModel.find({ solutionId: { $in: solutionIds as any } });
  
  // Récupérer les métriques de développement
  const developmentMetrics = await DevelopmentMetricsModel.find({ solutionId: { $in: solutionIds as any } });
  
  // Récupérer les observabilités
  const monitoringObservabilities = await MonitoringObservabilityModel.find({ envId: { $in: envIds as any } });
  
  // Récupérer tous les assets de l'éditeur (exclure les archivés)
  const assets = await AssetModel.find({
    editorId: editor._id,
    $or: [{ archived: { $ne: true } }, { archived: { $exists: false } }]
  });

  // Créer le CSV
  const rows: string[] = [];
  
  // En-tête
  rows.push('Référence AISA,Description,Entité,Champ,Valeur,Solution,Environnement');
  
  // Fonction pour ajouter une ligne
  const addRow = (ref: string, desc: string, entity: string, field: string, value: any, solutionName?: string, envName?: string) => {
    rows.push([
      escapeCsvValue(ref),
      escapeCsvValue(desc),
      escapeCsvValue(entity),
      escapeCsvValue(field),
      escapeCsvValue(formatValue(value)),
      escapeCsvValue(solutionName || ''),
      escapeCsvValue(envName || '')
    ].join(','));
  };

  // Traiter les champs Editor
  for (const [ref, mapping] of Object.entries(AISA_FIELD_MAPPING)) {
    if (mapping.entity === 'Editor') {
      let value = (editor as any)[mapping.field];
      // Gérer les tableaux (comme it_security_strategy)
      if (Array.isArray(value) && value.length > 0) {
        value = value.join('; ');
      }
      if (value !== undefined && value !== null && value !== '' && value !== '[]') {
        addRow(ref, mapping.description, mapping.entity, mapping.field, value);
      }
    }
  }

  // Traiter les champs Asset
  for (const asset of assets) {
    for (const [ref, mapping] of Object.entries(AISA_FIELD_MAPPING)) {
      if (mapping.entity === 'Asset') {
        let value = (asset as any)[mapping.field];
        
        // Gérer les dates (format ISO string)
        if (value instanceof Date) {
          value = value.toISOString().split('T')[0]; // Format YYYY-MM-DD
        }
        
        // Gérer les booléens (afficher true/false comme texte)
        if (typeof value === 'boolean') {
          value = value ? 'Yes' : 'No';
        }
        
        // Gérer les nombres (afficher avec unité si applicable)
        if (typeof value === 'number') {
          if (mapping.field === 'mtd_hours') {
            value = `${value} hours`;
          } else if (mapping.field === 'rpo_mtdl_hours') {
            value = `${value} hours`;
          }
        }
        
        // Inclure les valeurs même si elles sont false (pour criticality_status)
        // mais exclure undefined, null et chaînes vides
        if (value !== undefined && value !== null && value !== '') {
          addRow(ref, mapping.description, mapping.entity, mapping.field, value, '', asset.name);
        }
      }
    }
  }

  // Traiter les champs Solution (seulement les solutions non archivées)
  for (const solution of solutions) {
    // Vérifier que la solution n'est pas archivée
    if (solution.archived === true) {
      continue;
    }
    
    for (const [ref, mapping] of Object.entries(AISA_FIELD_MAPPING)) {
      if (mapping.entity === 'Solution') {
        const value = (solution as any)[mapping.field];
        if (value !== undefined && value !== null && value !== '') {
          addRow(ref, mapping.description, mapping.entity, mapping.field, value, solution.name);
        }
      }
    }
    
    // Traiter les codebases
    const codebase = codebases.find(cb => cb.solutionId.toString() === solution._id.toString());
    if (codebase) {
      for (const [ref, mapping] of Object.entries(AISA_FIELD_MAPPING)) {
        if (mapping.entity === 'CodeBase') {
          const value = (codebase as any)[mapping.field];
          if (value !== undefined && value !== null && value !== '') {
            addRow(ref, mapping.description, mapping.entity, mapping.field, value, solution.name);
          }
        }
      }
    }
    
    // Traiter les métriques de développement
    const metrics = developmentMetrics.find(dm => dm.solutionId.toString() === solution._id.toString());
    if (metrics) {
      for (const [ref, mapping] of Object.entries(AISA_FIELD_MAPPING)) {
        if (mapping.entity === 'DevelopmentMetrics') {
          const value = (metrics as any)[mapping.field];
          if (value !== undefined && value !== null && value !== '') {
            addRow(ref, mapping.description, mapping.entity, mapping.field, value, solution.name);
          }
        }
      }
    }
  }

  // Traiter les champs Environment (seulement les environnements non archivés)
  for (const environment of environments) {
    // Vérifier que l'environnement n'est pas archivé
    if (environment.archived === true) {
      continue;
    }
    
    // Vérifier que la solution associée n'est pas archivée
    const solution = solutions.find(s => s._id.toString() === environment.solutionId.toString());
    if (!solution || solution.archived === true) {
      continue;
    }
    
    const securityProfile = securityProfiles.find(sp => sp.envId.toString() === environment._id.toString());
    const hosting = hostings.find(h => h.hostingId === environment.hostingId);
    const monitoring = monitoringObservabilities.find(mo => mo.envId.toString() === environment._id.toString());
    
    const envName = `${environment.env_type}_${solution?.name || 'Unknown'}`;
    
    for (const [ref, mapping] of Object.entries(AISA_FIELD_MAPPING)) {
      if (mapping.entity === 'Environment') {
        let value: any;
        if (mapping.field === 'backup') {
          value = environment.backup ? `Exists: ${environment.backup.exists}, Schedule: ${environment.backup.schedule || 'N/A'}, RTO: ${environment.backup.rto || 'N/A'}h, RPO: ${environment.backup.rpo || 'N/A'}h` : 'N/A';
        } else {
          value = (environment as any)[mapping.field];
        }
        if (value !== undefined && value !== null && value !== '') {
          addRow(ref, mapping.description, mapping.entity, mapping.field, value, solution?.name, envName);
        }
      } else if (mapping.entity === 'SecurityProfile' && securityProfile) {
        let value: any;
        if (mapping.field === 'encryption') {
          value = securityProfile.encryption ? `In Transit: ${securityProfile.encryption.in_transit}, At Rest: ${securityProfile.encryption.at_rest}, Details: ${securityProfile.encryption.details || 'N/A'}` : 'N/A';
        } else {
          value = (securityProfile as any)[mapping.field];
        }
        if (value !== undefined && value !== null && value !== '') {
          addRow(ref, mapping.description, mapping.entity, mapping.field, value, solution?.name, envName);
        }
      } else if (mapping.entity === 'Hosting' && hosting) {
        const value = (hosting as any)[mapping.field];
        if (value !== undefined && value !== null && value !== '') {
          addRow(ref, mapping.description, mapping.entity, mapping.field, value, solution?.name, envName);
        }
      } else if (mapping.entity === 'MonitoringObservability' && monitoring) {
        const value = (monitoring as any)[mapping.field];
        if (value !== undefined && value !== null && value !== '') {
          addRow(ref, mapping.description, mapping.entity, mapping.field, value, solution?.name, envName);
        }
      }
    }
  }

  return rows.join('\n');
}

const ReportingResolver = {
  Mutation: {
    generateAisaReport: async (_: any, { editorId }: { editorId: string }, ctx: any) => {
      const { assertAuthorized } = await import('../authorization.js');
      await assertAuthorized(ctx, 'generateAisaReport');

      try {
        const csvContent = await generateAisaCsv(editorId);
        const filename = `AISA_Report_${editorId}_${new Date().toISOString().split('T')[0]}.csv`;
        
        return {
          csvContent,
          filename,
        };
      } catch (error: any) {
        throw new Error(`Erreur lors de la génération du rapport AISA: ${error.message}`);
      }
    },
  },
};

export default ReportingResolver;

