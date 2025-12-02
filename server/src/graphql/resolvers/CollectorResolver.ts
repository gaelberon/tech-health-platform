// Fichier : /server/src/graphql/resolvers/CollectorResolver.ts
// Resolver pour la collecte initiale P1 depuis le Tech Profiler

import { EditorModel } from '../../models/Editor.model.js';
import { SolutionModel } from '../../models/Solution.model.js';
import { HostingModel } from '../../models/Hosting.model.js';
import { EnvironmentModel } from '../../models/Environment.model.js';
import { SecurityProfileModel } from '../../models/SecurityProfile.model.js';
import { ScoringSnapshotModel } from '../../models/ScoringSnapshot.model.js';
import { assertAuthorized } from '../authorization.js';
import { logAudit, extractAuditContext } from '../../services/audit.service.js';

// Interfaces pour les inputs P1 + DD (Due Diligence)
export interface EditorInputP1 {
  name: string;
  business_criticality: string;
  country?: string;
  size?: string;
  // Champs DD (optionnels)
  internal_it_systems?: string[];
  it_security_strategy?: string;
  contracts_for_review?: Array<{ type: string; summary?: string }>;
}

export interface SolutionInputP1 {
  name: string;
  type: string;
  product_criticality: string;
  main_use_case: string;
  description?: string;
  // Champs DD (optionnels)
  api_robustness?: string;
  api_documentation_quality?: string;
  ip_ownership_clear?: boolean;
  licensing_model?: string;
  license_compliance_assured?: boolean;
}

export interface HostingInputP1 {
  provider: string;
  region: string;
  tier: string;
  certifications?: string[];
  // Champs DD (optionnels)
  contact?: { name: string; email: string };
}

export interface BackupInputP1 {
  exists: boolean;
  schedule?: string;
  rto_hours?: number;
  rpo_hours?: number;
  restoration_test_frequency?: string;
}

export interface EnvironmentInputP1 {
  env_type: string;
  data_types: string[];
  redundancy: string;
  backup: BackupInputP1;
  deployment_type?: string;
  virtualization?: string;
  tech_stack?: string[];
  // Champs DD (optionnels)
  network_security_mechanisms?: string[];
  db_scaling_mechanism?: string;
  disaster_recovery_plan?: string;
  sla_offered?: string;
}

export interface EncryptionInputP1 {
  in_transit: boolean;
  at_rest: boolean;
  details?: string;
}

export interface SecurityInputP1 {
  auth: string;
  encryption: EncryptionInputP1;
  patching?: string;
  pentest_freq?: string;
  vuln_mgmt?: string;
  // Champs DD (optionnels)
  access_control?: string;
  internal_audits_recent?: string;
  centralized_monitoring?: boolean;
  pentest_results_summary?: string;
  known_security_flaws?: string;
  incident_reporting_process?: string;
}

const CollectorResolver = {
  Mutation: {
    submitP1Data: async (
      _: any,
      args: {
        editor: EditorInputP1;
        solution: SolutionInputP1;
        hosting: HostingInputP1;
        environment: EnvironmentInputP1;
        security: SecurityInputP1;
      },
      ctx: any
    ) => {
      // Autorisation : tous les utilisateurs authentifiés peuvent soumettre des données P1
      assertAuthorized(ctx, 'submitP1Data');

      const auditContext = extractAuditContext(ctx);

      try {
        // 1. Créer ou mettre à jour l'Editor
        let editor = await EditorModel.findOne({ name: args.editor.name });
        let editorId: string;
        let isNewEditor = false;

        if (!editor) {
          // Générer un editorId unique
          const count = await EditorModel.countDocuments();
          editorId = `editor-${String(count + 1).padStart(4, '0')}`;
          
          const editorData: any = {
            editorId,
            name: args.editor.name,
            business_criticality: args.editor.business_criticality,
          };
          if (args.editor.country) editorData.country = args.editor.country;
          if (args.editor.size) editorData.size = args.editor.size;
          // Champs DD (optionnels)
          if (args.editor.internal_it_systems && args.editor.internal_it_systems.length > 0) {
            editorData.internal_it_systems = args.editor.internal_it_systems;
          }
          if (args.editor.it_security_strategy) {
            editorData.it_security_strategy = args.editor.it_security_strategy;
          }
          if (args.editor.contracts_for_review && args.editor.contracts_for_review.length > 0) {
            editorData.contracts_for_review = args.editor.contracts_for_review;
          }
          const createdEditor = await EditorModel.create(editorData);
          editor = (Array.isArray(createdEditor) ? createdEditor[0] : createdEditor) || null;
          isNewEditor = true;

          if (editor) {
            await logAudit(auditContext, {
              action: 'CREATE',
              entityType: 'Editor',
              entityId: editorId,
              after: editor.toObject(),
              description: `Création d'un nouvel éditeur via Tech Profiler`,
            });
          }
        } else {
          editorId = editor.editorId;
          // Mise à jour des champs P1 + DD
          const updateData: any = {
            business_criticality: args.editor.business_criticality,
          };
          if (args.editor.country) updateData.country = args.editor.country;
          if (args.editor.size) updateData.size = args.editor.size;
          // Champs DD (optionnels) - ne mettre à jour que si fournis
          if (args.editor.internal_it_systems !== undefined) {
            updateData.internal_it_systems = args.editor.internal_it_systems;
          }
          if (args.editor.it_security_strategy !== undefined) {
            updateData.it_security_strategy = args.editor.it_security_strategy;
          }
          if (args.editor.contracts_for_review !== undefined) {
            updateData.contracts_for_review = args.editor.contracts_for_review;
          }

          const beforeState = editor.toObject();
          editor = await EditorModel.findOneAndUpdate(
            { editorId },
            { $set: updateData },
            { new: true }
          );

          if (editor) {
            await logAudit(auditContext, {
              action: 'UPDATE',
              entityType: 'Editor',
              entityId: editorId,
              before: beforeState,
              after: editor.toObject(),
              description: `Mise à jour de l'éditeur via Tech Profiler`,
            });
          }
        }

        if (!editor) {
          throw new Error('Erreur lors de la création/mise à jour de l\'éditeur');
        }

        // 2. Créer ou mettre à jour le Hosting
        const hostingId = `hosting-${editorId}-${Date.now()}`;
        let hosting = await HostingModel.findOne({ hostingId });
        
        if (!hosting) {
          const hostingData: any = {
            hostingId,
            provider: args.hosting.provider,
            region: args.hosting.region,
            tier: args.hosting.tier,
            certifications: args.hosting.certifications || [],
          };
          // Champs DD (optionnels)
          if (args.hosting.contact) {
            hostingData.contact = args.hosting.contact;
          }
          const createdHosting = await HostingModel.create(hostingData);
          hosting = (Array.isArray(createdHosting) ? createdHosting[0] : createdHosting) || null;

          if (hosting) {
            await logAudit(auditContext, {
              action: 'CREATE',
              entityType: 'Hosting',
              entityId: hostingId,
              after: hosting.toObject(),
              description: `Création d'un profil d'hébergement via Tech Profiler`,
            });
          }
        } else {
          const beforeState = hosting.toObject();
          const hostingUpdateData: any = {
            provider: args.hosting.provider,
            region: args.hosting.region,
            tier: args.hosting.tier,
            certifications: args.hosting.certifications || [],
          };
          // Champs DD (optionnels) - ne mettre à jour que si fournis
          if (args.hosting.contact !== undefined) {
            hostingUpdateData.contact = args.hosting.contact;
          }
          hosting = await HostingModel.findOneAndUpdate(
            { hostingId },
            { $set: hostingUpdateData },
            { new: true }
          );

          if (hosting) {
            await logAudit(auditContext, {
              action: 'UPDATE',
              entityType: 'Hosting',
              entityId: hostingId,
              before: beforeState,
              after: hosting.toObject(),
              description: `Mise à jour du profil d'hébergement via Tech Profiler`,
            });
          }
        }

        if (!hosting) {
          throw new Error('Erreur lors de la création/mise à jour du hosting');
        }

        // 3. Créer ou mettre à jour la Solution
        let solution = await SolutionModel.findOne({
          editorId: editor._id,
          name: args.solution.name,
        });
        let solutionId: string;
        let isNewSolution = false;

        if (!solution) {
          const count = await SolutionModel.countDocuments();
          solutionId = `solution-${String(count + 1).padStart(4, '0')}`;
          
          const solutionData: any = {
            solutionId,
            editorId: editor._id,
            name: args.solution.name,
            type: args.solution.type,
            product_criticality: args.solution.product_criticality,
            main_use_case: args.solution.main_use_case,
            ip_ownership_clear: args.solution.ip_ownership_clear !== undefined ? args.solution.ip_ownership_clear : false,
          };
          if (args.solution.description) {
            solutionData.description = args.solution.description;
          }
          // Champs DD (optionnels)
          if (args.solution.api_robustness) {
            solutionData.api_robustness = args.solution.api_robustness;
          }
          if (args.solution.api_documentation_quality) {
            solutionData.api_documentation_quality = args.solution.api_documentation_quality;
          }
          if (args.solution.licensing_model) {
            solutionData.licensing_model = args.solution.licensing_model;
          }
          if (args.solution.license_compliance_assured !== undefined) {
            solutionData.license_compliance_assured = args.solution.license_compliance_assured;
          }
          const createdSolution = await SolutionModel.create(solutionData);
          solution = (Array.isArray(createdSolution) ? createdSolution[0] : createdSolution) || null;
          isNewSolution = true;

          if (solution) {
            await logAudit(auditContext, {
              action: 'CREATE',
              entityType: 'Solution',
              entityId: solutionId,
              after: solution.toObject(),
              description: `Création d'une nouvelle solution via Tech Profiler`,
            });
          }
        } else {
          solutionId = solution.solutionId;
          const beforeState = solution.toObject();
          const updateData: any = {
            type: args.solution.type,
            product_criticality: args.solution.product_criticality,
            main_use_case: args.solution.main_use_case,
          };
          if (args.solution.description) {
            updateData.description = args.solution.description;
          }
          // Champs DD (optionnels) - ne mettre à jour que si fournis
          if (args.solution.api_robustness !== undefined) {
            updateData.api_robustness = args.solution.api_robustness;
          }
          if (args.solution.api_documentation_quality !== undefined) {
            updateData.api_documentation_quality = args.solution.api_documentation_quality;
          }
          if (args.solution.ip_ownership_clear !== undefined) {
            updateData.ip_ownership_clear = args.solution.ip_ownership_clear;
          }
          if (args.solution.licensing_model !== undefined) {
            updateData.licensing_model = args.solution.licensing_model;
          }
          if (args.solution.license_compliance_assured !== undefined) {
            updateData.license_compliance_assured = args.solution.license_compliance_assured;
          }
          solution = await SolutionModel.findOneAndUpdate(
            { solutionId },
            { $set: updateData },
            { new: true }
          );

          if (solution) {
            await logAudit(auditContext, {
              action: 'UPDATE',
              entityType: 'Solution',
              entityId: solutionId,
              before: beforeState,
              after: solution.toObject(),
              description: `Mise à jour de la solution via Tech Profiler`,
            });
          }
        }

        if (!solution) {
          throw new Error('Erreur lors de la création/mise à jour de la solution');
        }

        // 4. Créer ou mettre à jour l'Environment
        const envId = `env-${solutionId}-${args.environment.env_type}-${Date.now()}`;
        let environment = await EnvironmentModel.findOne({ envId });

        if (!environment) {
          const environmentData: any = {
            envId,
            solutionId: solution._id,
            hostingId: hosting.hostingId,
            env_type: args.environment.env_type,
            data_types: args.environment.data_types,
            redundancy: args.environment.redundancy,
            backup: {
              exists: args.environment.backup.exists,
              ...(args.environment.backup.schedule && { schedule: args.environment.backup.schedule }),
              ...(args.environment.backup.rto_hours !== undefined && { rto: args.environment.backup.rto_hours }),
              ...(args.environment.backup.rpo_hours !== undefined && { rpo: args.environment.backup.rpo_hours }),
              ...(args.environment.backup.restoration_test_frequency && { restoration_test_frequency: args.environment.backup.restoration_test_frequency }),
            },
          };
          if (args.environment.deployment_type) environmentData.deployment_type = args.environment.deployment_type;
          if (args.environment.virtualization) environmentData.virtualization = args.environment.virtualization;
          if (args.environment.tech_stack && args.environment.tech_stack.length > 0) {
            environmentData.tech_stack = args.environment.tech_stack;
          }
          // Champs DD (optionnels)
          if (args.environment.network_security_mechanisms && args.environment.network_security_mechanisms.length > 0) {
            environmentData.network_security_mechanisms = args.environment.network_security_mechanisms;
          }
          if (args.environment.db_scaling_mechanism) {
            environmentData.db_scaling_mechanism = args.environment.db_scaling_mechanism;
          }
          if (args.environment.disaster_recovery_plan) {
            environmentData.disaster_recovery_plan = args.environment.disaster_recovery_plan;
          }
          if (args.environment.sla_offered) {
            environmentData.sla_offered = args.environment.sla_offered;
          }
          const createdEnvironment = await EnvironmentModel.create(environmentData);
          environment = (Array.isArray(createdEnvironment) ? createdEnvironment[0] : createdEnvironment) || null;

          if (environment) {
            await logAudit(auditContext, {
              action: 'CREATE',
              entityType: 'Environment',
              entityId: envId,
              after: environment.toObject(),
              description: `Création d'un environnement via Tech Profiler`,
            });
          }
        } else if (environment) {
          const beforeState = environment.toObject();
          const environmentUpdateData: any = {
            env_type: args.environment.env_type,
            data_types: args.environment.data_types,
            redundancy: args.environment.redundancy,
            backup: {
              exists: args.environment.backup.exists,
              ...(args.environment.backup.schedule && { schedule: args.environment.backup.schedule }),
              ...(args.environment.backup.rto_hours !== undefined && { rto: args.environment.backup.rto_hours }),
              ...(args.environment.backup.rpo_hours !== undefined && { rpo: args.environment.backup.rpo_hours }),
              ...(args.environment.backup.restoration_test_frequency && { restoration_test_frequency: args.environment.backup.restoration_test_frequency }),
            },
            deployment_type: args.environment.deployment_type || undefined,
            virtualization: args.environment.virtualization || undefined,
            tech_stack: args.environment.tech_stack || [],
          };
          // Champs DD (optionnels) - ne mettre à jour que si fournis
          if (args.environment.network_security_mechanisms !== undefined) {
            environmentUpdateData.network_security_mechanisms = args.environment.network_security_mechanisms;
          }
          if (args.environment.db_scaling_mechanism !== undefined) {
            environmentUpdateData.db_scaling_mechanism = args.environment.db_scaling_mechanism;
          }
          if (args.environment.disaster_recovery_plan !== undefined) {
            environmentUpdateData.disaster_recovery_plan = args.environment.disaster_recovery_plan;
          }
          if (args.environment.sla_offered !== undefined) {
            environmentUpdateData.sla_offered = args.environment.sla_offered;
          }
          environment = await EnvironmentModel.findOneAndUpdate(
            { envId },
            { $set: environmentUpdateData },
            { new: true }
          );

          if (environment) {
            await logAudit(auditContext, {
              action: 'UPDATE',
              entityType: 'Environment',
              entityId: envId,
              before: beforeState,
              after: environment.toObject(),
              description: `Mise à jour de l'environnement via Tech Profiler`,
            });
          }
        }

        if (!environment) {
          throw new Error('Erreur lors de la création/mise à jour de l\'environnement');
        }

        // 5. Créer ou mettre à jour le SecurityProfile
        const secId = `sec-${envId}`;
        let securityProfile = await SecurityProfileModel.findOne({ secId });

        if (!securityProfile) {
          const securityData: any = {
            secId,
            envId: environment._id,
            auth: args.security.auth,
            encryption: {
              in_transit: args.security.encryption.in_transit,
              at_rest: args.security.encryption.at_rest,
              ...(args.security.encryption.details && { details: args.security.encryption.details }),
            },
            patching: args.security.patching || 'ad_hoc',
            pentest_freq: args.security.pentest_freq || 'never',
            vuln_mgmt: args.security.vuln_mgmt || 'none',
          };
          // Champs DD (optionnels)
          if (args.security.access_control) {
            securityData.access_control = args.security.access_control;
          }
          if (args.security.internal_audits_recent) {
            securityData.internal_audits_recent = args.security.internal_audits_recent;
          }
          if (args.security.centralized_monitoring !== undefined) {
            securityData.centralized_monitoring = args.security.centralized_monitoring;
          }
          if (args.security.pentest_results_summary) {
            securityData.pentest_results_summary = args.security.pentest_results_summary;
          }
          if (args.security.known_security_flaws) {
            securityData.known_security_flaws = args.security.known_security_flaws;
          }
          if (args.security.incident_reporting_process) {
            securityData.incident_reporting_process = args.security.incident_reporting_process;
          }
          const createdSecurityProfile = await SecurityProfileModel.create(securityData);
          securityProfile = (Array.isArray(createdSecurityProfile) ? createdSecurityProfile[0] : createdSecurityProfile) || null;

          if (securityProfile) {
            await logAudit(auditContext, {
              action: 'CREATE',
              entityType: 'SecurityProfile',
              entityId: secId,
              after: securityProfile.toObject(),
              description: `Création d'un profil de sécurité via Tech Profiler`,
            });
          }
        } else {
          const beforeState = securityProfile.toObject();
          const securityUpdateData: any = {
            auth: args.security.auth,
            encryption: {
              in_transit: args.security.encryption.in_transit,
              at_rest: args.security.encryption.at_rest,
              details: args.security.encryption.details || undefined,
            },
            patching: args.security.patching || 'ad_hoc',
            pentest_freq: args.security.pentest_freq || 'never',
            vuln_mgmt: args.security.vuln_mgmt || 'none',
          };
          // Champs DD (optionnels) - ne mettre à jour que si fournis
          if (args.security.access_control !== undefined) {
            securityUpdateData.access_control = args.security.access_control;
          }
          if (args.security.internal_audits_recent !== undefined) {
            securityUpdateData.internal_audits_recent = args.security.internal_audits_recent;
          }
          if (args.security.centralized_monitoring !== undefined) {
            securityUpdateData.centralized_monitoring = args.security.centralized_monitoring;
          }
          if (args.security.pentest_results_summary !== undefined) {
            securityUpdateData.pentest_results_summary = args.security.pentest_results_summary;
          }
          if (args.security.known_security_flaws !== undefined) {
            securityUpdateData.known_security_flaws = args.security.known_security_flaws;
          }
          if (args.security.incident_reporting_process !== undefined) {
            securityUpdateData.incident_reporting_process = args.security.incident_reporting_process;
          }
          securityProfile = await SecurityProfileModel.findOneAndUpdate(
            { secId },
            { $set: securityUpdateData },
            { new: true }
          );

          if (securityProfile) {
            await logAudit(auditContext, {
              action: 'UPDATE',
              entityType: 'SecurityProfile',
              entityId: secId,
              before: beforeState,
              after: securityProfile.toObject(),
              description: `Mise à jour du profil de sécurité via Tech Profiler`,
            });
          }
        }

        if (!securityProfile) {
          throw new Error('Erreur lors de la création/mise à jour du profil de sécurité');
        }

        // 6. Déclencher le scoring (créer un ScoringSnapshot initial)
        // Pour l'instant, on crée un snapshot avec des scores par défaut
        // Le scoring engine réel devrait être appelé ici
        const scoreId = `score-${solutionId}-${Date.now()}`;
        const scoringSnapshot = await ScoringSnapshotModel.create({
          scoreId,
          solutionId: solution._id,
          envId: environment._id,
          date: new Date(),
          scores: {
            security: 0, // Sera calculé par le scoring engine
            resilience: 0,
            observability: 0,
            architecture: 0,
            compliance: 0,
          },
          global_score: 0, // Sera calculé par le scoring engine
          risk_level: 'Low', // Sera calculé par le scoring engine
          notes: 'Snapshot initial créé via Tech Profiler. Le scoring sera calculé par le Scoring Engine.',
        });

        await logAudit(auditContext, {
          action: 'CREATE',
          entityType: 'ScoringSnapshot',
          entityId: scoreId,
          after: scoringSnapshot.toObject(),
          description: `Création d'un snapshot de scoring initial via Tech Profiler`,
        });

        // Retourner toutes les entités créées/mises à jour
        if (!solution || !editor || !environment || !hosting || !securityProfile || !scoringSnapshot) {
          throw new Error('Erreur lors de la création des entités');
        }

        return {
          solution: solution.toObject(),
          editor: editor.toObject(),
          environment: environment.toObject(),
          hosting: hosting.toObject(),
          securityProfile: securityProfile.toObject(),
          scoringSnapshot: scoringSnapshot.toObject(),
        };
      } catch (error: any) {
        console.error('Erreur dans submitP1Data:', error);
        throw new Error(`Erreur lors de la soumission des données P1: ${error.message}`);
      }
    },
  },
};

export default CollectorResolver;

