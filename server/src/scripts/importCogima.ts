/**
 * Script d'import/mise à jour des données techniques de COGIMA
 *
 * Sources fonctionnelles :
 * - `Docs/third-party-docs/251217-Rencontre_Cogima-Roadmap_Technique.pdf`
 * - `Docs/third-party-docs/Atelier Plan d'action COGIMA 2026.pdf`
 * - `Docs/third-party-docs/VWBANK France_Requirements Catalogue VF 2025-12 - 01. Non-Functional Catalog.pdf`
 *
 * Hypothèses :
 * - L'éditeur "Cogima" existe déjà en base (entité `Editor`)
 * - On crée / met à jour :
 *   - 3 Solutions distinctes : "Cogima Rappro", "Cogima Treso", "Cogima Banque"
 *   - Pour chaque solution : 2 environnements de Production (On-Premises et Hébergés)
 *   - Hosting : On-Premises (client) et Jotelulu (hébergé)
 *   - SecurityProfile, MonitoringObservability, CodeBase, DevelopmentMetrics pour chaque solution
 * - On archive la solution existante qui regroupait les 3 solutions réelles, ainsi que son environnement associé
 *
 * Usage :
 *   cd server
 *   npx ts-node --esm src/scripts/importCogima.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';

import { EditorModel } from '../models/Editor.model.js';
import { SolutionModel } from '../models/Solution.model.js';
import { HostingModel } from '../models/Hosting.model.js';
import { EnvironmentModel } from '../models/Environment.model.js';
import { SecurityProfileModel } from '../models/SecurityProfile.model.js';
import { MonitoringObservabilityModel } from '../models/MonitoringObservability.model.js';
import { CodeBaseModel } from '../models/CodeBase.model.js';
import { DevelopmentMetricsModel } from '../models/DevelopmentMetrics.model.js';
import { DevelopmentTeamModel } from '../models/DevelopmentTeam.model.js';

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL;

  if (!mongoUri) {
    console.error('❌ MONGODB_URI (ou MONGO_URL) non defini dans les variables d\'environnement.');
    process.exit(1);
  }

  console.log('🔗 Connexion à MongoDB...');
  await mongoose.connect(mongoUri as string);
  console.log(`✅ Connecté à MongoDB: ${mongoose.connection.host}`);

  try {
    // 1. Récupération de l'Editor COGIMA
    console.log('\n🔍 Recherche de l\'editeur "Cogima"...');
    const editor = await EditorModel.findOne({
      name: { $regex: /^cogima$/i },
    });

    if (!editor) {
      console.error('❌ Éditeur "Cogima" introuvable en base. Abandon du script.');
      return;
    }

    console.log(`✅ Éditeur trouvé : ${editor.name} (id=${editor._id.toString()})`);

    // 1.b Mise à jour des champs DD de l'Editor
    console.log('\n=== Étape 1.b : Mise à jour des champs DD de l\'Editor ===');

    const editorDdPayload = {
      country: editor.country || 'France',
      size: editor.size || 'Micro',
      business_criticality: 'Critical' as const,
      internal_it_systems: [
        'SVN (versionning)',
        'Redmine (gestion des tickets)',
        'Delphi 13 (IDE)',
        'Firebird 5.0 (64 bits)',
        'DevExpress',
        'FastReport',
        '/n Software',
      ],
      it_security_strategy: [
        'Framework de pilotage Mlog Capital',
        'Initiatives groupe (Chapters Cybersécurité)',
        'Processus "La Sentinelle" (chiffrement automatique des fichiers)',
        'Standards industriels certifiés (/n Software, DevExpress)',
      ],
      contracts_for_review: [
        'Hébergement - Jotelulu (hébergement pour certains clients)',
        'Composants tiers - DevExpress (abonnement annuel)',
        'Composants tiers - FastReport (abonnement annuel)',
        'Composants tiers - /n Software (abonnement annuel)',
      ],
    };

    await EditorModel.findByIdAndUpdate(editor._id, editorDdPayload, { new: true });
    console.log('🟡 Editor mis à jour avec les champs DD.');

    // 1.c DevelopmentTeam
    console.log('\n=== Étape 1.c : DevelopmentTeam ===');

    const teamId = 'COGIMA_TEAM';
    const teamPayload = {
      teamId,
      editorId: editor._id,
      team_size_adequate: 'Adequate',
      key_person_dependency: 'Dépendance aux personnes clés (Evelyne COLLIN, David, Alexandre). Équipe stable depuis 2021. Risque mitigé par mutualisation expertise Delphi/WinDev au sein du groupe Mlog Capital.',
    };

    const existingTeam = await DevelopmentTeamModel.findOne({ teamId });
    if (existingTeam) {
      await DevelopmentTeamModel.findOneAndUpdate({ teamId }, teamPayload, { new: true });
      console.log('🟡 DevelopmentTeam mis à jour.');
    } else {
      await DevelopmentTeamModel.create(teamPayload);
      console.log('🟢 DevelopmentTeam créé.');
    }

    // 2. Archiver la solution existante qui regroupait les 3 solutions
    console.log('\n=== Étape 2 : Archivage de la solution existante ===');

    const existingSolutions = await SolutionModel.find({ editorId: editor._id });
    for (const oldSolution of existingSolutions) {
      // Archiver la solution
      await SolutionModel.findByIdAndUpdate(oldSolution._id, {
        $set: {
          archived: true,
          archivedAt: new Date(),
          archivedBy: 'importCogima-script',
        },
      });
      console.log(`📦 Solution archivée : ${oldSolution.name} (solutionId=${oldSolution.solutionId})`);

      // Archiver les environnements associés
      const oldEnvironments = await EnvironmentModel.find({ solutionId: oldSolution._id as any });
      for (const oldEnv of oldEnvironments) {
        await EnvironmentModel.findByIdAndUpdate(oldEnv._id, {
          $set: {
            archived: true,
            archivedAt: new Date(),
            archivedBy: 'importCogima-script',
          },
        });
        console.log(`📦 Environment archivé : ${oldEnv.envId}`);
      }
    }

    // 3. Définition des 3 solutions
    const solutions = [
      {
        solutionId: 'COGIMA_RAPPRO',
        name: 'Cogima Rappro',
        description: 'Solution de rapprochement bancaire pour la gestion des flux EBICS et SEPA.',
        main_use_case: 'Rapprochement bancaire et gestion des flux financiers',
      },
      {
        solutionId: 'COGIMA_TRESO',
        name: 'Cogima Treso',
        description: 'Solution de trésorerie pour la gestion des flux financiers.',
        main_use_case: 'Gestion de trésorerie',
      },
      {
        solutionId: 'COGIMA_BANQUE',
        name: 'Cogima Banque',
        description: 'Solution bancaire spécialisée en flux EBICS pour banques et directions de trésorerie.',
        main_use_case: 'Gestion bancaire et flux EBICS',
      },
    ];

    // Données communes pour toutes les solutions Cogima
    const commonSolutionPayload = {
      editorId: editor._id,
      type: 'ClientHeavy' as const,
      product_criticality: 'Critical' as const,
      api_robustness: 'Cogima souhaite innover avec des APIs et la Signature dématérialisée. Architecture actuelle nécessite un refactoring pour l\'exposition des APIs (passage vers services Web).',
      api_documentation_quality: 'Low', // Documentation partielle et éparse mentionnée dans les documents
      ip_ownership_clear: 'Yes',
      licensing_model: 'Licence par client (On-Premise ou Hébergée).',
      license_compliance_assured: 'Yes',
      tech_stack: [
        'Delphi 13',
        'Firebird 5.0 (64 bits)',
        'DevExpress',
        'FastReport',
        '/n Software (version 2025)',
      ],
    };

    // Données communes pour les environnements
    const commonCodebasePayload = {
      version_control_tool: 'SVN',
      documentation_level: 'Low', // Documentation partielle et éparse mentionnée
      code_review_process: 'Revues de code systématiques, processus documenté via Redmine.',
      technical_debt_known: 'Legacy technique connu : architecture non-MVC, fonctions métiers back-office mélangées avec le middleware et les composants frontend. Refactoring nécessaire pour modernisation SaaS.',
      legacy_systems: 'Architecture monolithique legacy nécessitant un refactoring pour respecter une architecture MVC et faciliter l\'exposition d\'APIs.',
      third_party_dependencies: ['DevExpress', 'FastReport', '/n Software'],
    };

    const commonDevelopmentMetricsPayload: any = {
      sdlc_process: 'Waterfall', // Cycles en V longs mentionnés dans les documents, en cours de modernisation vers agile
      devops_automation_level: 'Partial CI', // Processus de compilation automatisé (PowerShell) mais pas de CI/CD complet
      // Les champs suivants sont requis par le modèle mais non mentionnés explicitement dans les documents
      // Utilisation de 0 pour indiquer que les données ne sont pas disponibles
      planned_vs_unplanned_ratio: 0, // Non mentionné explicitement
      lead_time_for_changes_days: 0, // Non mentionné explicitement
      mttr_hours: 0, // Non mentionné explicitement
      internal_vs_external_bug_ratio: 0, // Non mentionné explicitement
    };

    // 4. Création des 3 solutions avec leurs environnements
    for (const solutionInfo of solutions) {
      console.log(`\n=== Étape 4 : Solution "${solutionInfo.name}" ===`);

      const solutionPayload = {
        ...commonSolutionPayload,
        solutionId: solutionInfo.solutionId,
        name: solutionInfo.name,
        description: solutionInfo.description,
        main_use_case: solutionInfo.main_use_case,
      };

      let solutionDoc = await SolutionModel.findOne({ solutionId: solutionInfo.solutionId });
      if (solutionDoc) {
        solutionDoc = await SolutionModel.findOneAndUpdate({ solutionId: solutionInfo.solutionId }, solutionPayload, {
          new: true,
        });
        console.log(`🟡 Solution mise à jour : ${solutionDoc?.name} (solutionId=${solutionInfo.solutionId})`);
      } else {
        solutionDoc = await SolutionModel.create(solutionPayload);
        console.log(`🟢 Solution créée : ${solutionDoc.name} (solutionId=${solutionInfo.solutionId})`);
      }

      if (!solutionDoc) {
        throw new Error(`Solution ${solutionInfo.name} non disponible.`);
      }

      // 4.a CodeBase
      console.log(`\n=== Étape 4.a : CodeBase pour "${solutionInfo.name}" ===`);

      const codebaseId = `${solutionInfo.solutionId}_CODEBASE`;
      const codebasePayload = {
        codebaseId,
        solutionId: solutionDoc._id,
        ...commonCodebasePayload,
        repo_location: 'SVN (local)',
      };

      const existingCodebase = await CodeBaseModel.findOne({ codebaseId });
      if (existingCodebase) {
        await CodeBaseModel.findOneAndUpdate({ codebaseId }, codebasePayload, { new: true });
        console.log(`🟡 CodeBase mis à jour pour ${solutionInfo.name}.`);
      } else {
        await CodeBaseModel.create(codebasePayload);
        console.log(`🟢 CodeBase créé pour ${solutionInfo.name}.`);
      }

      // 4.b DevelopmentMetrics
      console.log(`\n=== Étape 4.b : DevelopmentMetrics pour "${solutionInfo.name}" ===`);

      const metricsId = `${solutionInfo.solutionId}_METRICS`;
      const devMetricsPayload: any = {
        metricsId,
        solutionId: solutionDoc._id,
        ...commonDevelopmentMetricsPayload,
      };

      const existingDevMetrics = await DevelopmentMetricsModel.findOne({ metricsId });
      if (existingDevMetrics) {
        await DevelopmentMetricsModel.findOneAndUpdate({ metricsId }, devMetricsPayload, {
          new: true,
        });
        console.log(`🟡 DevelopmentMetrics mis à jour pour ${solutionInfo.name}.`);
      } else {
        await DevelopmentMetricsModel.create(devMetricsPayload);
        console.log(`🟢 DevelopmentMetrics créé pour ${solutionInfo.name}.`);
      }

      // 5. Création des 2 environnements de Production pour chaque solution (On-Premises et Hébergés)
      const environments = [
        {
          envId: `${solutionInfo.solutionId}_PROD_ONPREM`,
          envType: 'production',
          hostingId: `${solutionInfo.solutionId}_HOSTING_ONPREM`,
          hostingProvider: 'Client (On-Premise)',
          hostingRegion: 'France (chez le client)',
          hostingTier: 'private' as const,
          isOnPremise: true,
        },
        {
          envId: `${solutionInfo.solutionId}_PROD_HOSTED`,
          envType: 'production',
          hostingId: `${solutionInfo.solutionId}_HOSTING_HOSTED`,
          hostingProvider: 'Jotelulu',
          hostingRegion: 'France',
          hostingTier: 'cloud' as const,
          isOnPremise: false,
        },
      ];

      for (const envInfo of environments) {
        console.log(`\n=== Étape 5 : Environment ${envInfo.envId} ===`);

        // 5.a Hosting
        const hostingPayload = {
          hostingId: envInfo.hostingId,
          provider: envInfo.hostingProvider,
          region: envInfo.hostingRegion,
          tier: envInfo.hostingTier,
          certifications: [], // Explicitement dit "None" dans les documents VWBANK
        };

        let hostingDoc = await HostingModel.findOne({ hostingId: envInfo.hostingId });
        if (hostingDoc) {
          hostingDoc = await HostingModel.findOneAndUpdate({ hostingId: envInfo.hostingId }, hostingPayload, {
            new: true,
          });
          console.log(`🟡 Hosting mis à jour : ${hostingDoc?.provider} (hostingId=${envInfo.hostingId})`);
        } else {
          hostingDoc = await HostingModel.create(hostingPayload);
          console.log(`🟢 Hosting créé : ${hostingDoc.provider} (hostingId=${envInfo.hostingId})`);
        }

        // 5.b Environment
        const environmentPayload = {
          envId: envInfo.envId,
          solutionId: solutionDoc._id,
          hostingId: envInfo.hostingId,
          env_type: envInfo.envType,
          tech_stack: ['Delphi 13', 'Firebird 5.0 (64 bits)'],
          data_types: ['Financial'],
          redundancy: 'none' as const, // Non mentionné explicitement, laissé vide selon guidelines
          backup: {
            exists: true, // Mentionné comme prioritaire dans les documents
            schedule: undefined, // Non mentionné explicitement
            rto: 0, // Non mentionné explicitement - valeur par défaut
            rpo: 0, // Non mentionné explicitement - valeur par défaut
            // restoration_test_frequency omis car non mentionné explicitement (peut être undefined selon le schéma)
          },
          disaster_recovery_plan: undefined, // Mentionné comme prioritaire mais non détaillé
          deployment_type: 'monolith' as const,
          virtualization: envInfo.isOnPremise ? ('physical' as const) : ('VM' as const),
          db_scaling_mechanism: undefined, // Non mentionné explicitement
          network_security_mechanisms: envInfo.isOnPremise
            ? undefined // Non mentionné explicitement pour On-Premise
            : ['RDP (Remote Desktop Protocol)', 'VPN'], // Mentionné pour l'hébergé chez Jotelulu
          sla_offered: undefined, // Non mentionné explicitement
        };

        let envDoc = await EnvironmentModel.findOne({ envId: envInfo.envId });
        if (envDoc) {
          envDoc = (await EnvironmentModel.findOneAndUpdate({ envId: envInfo.envId }, environmentPayload as any, {
            new: true,
          })) as any;
          console.log(`🟡 Environment mis à jour : ${envDoc?.env_type} (envId=${envInfo.envId})`);
        } else {
          envDoc = (await EnvironmentModel.create(environmentPayload as any)) as any;
          console.log(`🟢 Environment créé : ${envDoc?.env_type} (envId=${envInfo.envId})`);
        }

        if (!envDoc) {
          throw new Error(`Environment ${envInfo.envId} non disponible.`);
        }

        // 5.c SecurityProfile
        console.log(`\n=== Étape 5.c : SecurityProfile pour ${envInfo.envId} ===`);

        const secId = `${envInfo.envId}_SEC`;
        const securityPayload: any = {
          secId,
          envId: envDoc._id,
          auth: 'Passwords', // Non mentionné explicitement comme SSO, donc Passwords par défaut
          encryption: {
            in_transit: true, // Utilisation de /n Software pour TLS 1.2/1.3, SFTP, SSH
            at_rest: true, // Processus "La Sentinelle" pour chiffrement automatique des fichiers
            details:
              'In-transit : /n Software (TLS 1.2/1.3, SFTP, SSH). At-rest : Processus "La Sentinelle" (chiffrement automatique des fichiers déposés).',
          },
          patching: 'scheduled', // Mentionné comme priorité dans les documents
          pentest_freq: 'never', // Non mentionné explicitement - utilisation de 'never' pour indiquer que ce n'est pas documenté
          vuln_mgmt: 'manual', // Non mentionné explicitement comme automatisé
          internal_audits_recent: 'Audit interne réalisé par Mlog Capital en décembre 2025.',
          centralized_monitoring: false, // Non mentionné explicitement comme centralisé
          // access_control, pentest_results_summary, known_security_flaws, incident_reporting_process omis car non mentionnés explicitement
        };

        const existingSec = await SecurityProfileModel.findOne({ secId });
        if (existingSec) {
          await SecurityProfileModel.findOneAndUpdate({ secId }, securityPayload, { new: true });
          console.log(`🟡 SecurityProfile mis à jour (secId=${secId})`);
        } else {
          await SecurityProfileModel.create(securityPayload);
          console.log(`🟢 SecurityProfile créé (secId=${secId})`);
        }

        // 5.d Monitoring & Observability
        console.log(`\n=== Étape 5.d : Monitoring & Observability pour ${envInfo.envId} ===`);

        const monId = `${envInfo.envId}_MON`;
        const monitoringPayload = {
          monId,
          envId: envDoc._id,
          perf_monitoring: 'No', // Mentionné : "Pas d'outil de trace performant en Delphi pour monitorer les performances"
          log_centralization: 'No', // Non mentionné explicitement comme centralisé
          tools: [], // Pas d'outils de monitoring mentionnés explicitement
        };

        const existingMon = await MonitoringObservabilityModel.findOne({ monId });
        if (existingMon) {
          await MonitoringObservabilityModel.findOneAndUpdate({ monId }, monitoringPayload, { new: true });
          console.log(`🟡 MonitoringObservability mis à jour (monId=${monId})`);
        } else {
          await MonitoringObservabilityModel.create(monitoringPayload);
          console.log(`🟢 MonitoringObservability créé (monId=${monId})`);
        }
      }
    }

    console.log('\n✅ Import des données COGIMA terminé avec succès !');
  } catch (error: any) {
    console.error('\n❌ Erreur pendant l\'import des donnees COGIMA :', error);
    throw error;
  } finally {
    console.log('\n🔌 Déconnexion de MongoDB');
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

