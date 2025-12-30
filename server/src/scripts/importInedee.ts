/**
 * Script d'import/mise à jour des données techniques d'INEDEE
 *
 * Source fonctionnelle : `Docs/third-party-docs/Données techniques d'INEDEE.pdf`
 *
 * Hypothèses :
 * - L'éditeur "INEDEE" existe déjà en base (entité `Editor`)
 * - On crée / met à jour :
 *   - Solution  : "ERP Inedee"
 *   - Hosting   : Hébergement Armonie / Equinix
 *   - Environment : Environnement de Production de l'ERP
 *   - SecurityProfile : Profil de sécurité de l'environnement de prod
 *   - MonitoringObservability : Monitoring & observabilité de l'environnement de prod
 *   - CodeBase : Informations sur le code source
 *   - DevelopmentMetrics : Métriques de développement
 *
 * Usage :
 *   cd server
 *   npx ts-node --esm src/scripts/importInedee.ts
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

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL;

  if (!mongoUri) {
    console.error('❌ MONGODB_URI (ou MONGO_URL) non défini dans les variables d’environnement.');
    process.exit(1);
  }

  console.log('🔗 Connexion à MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✅ Connecté à MongoDB');

  try {
    // 1. Récupération de l'Editor INEDEE
    console.log('🔍 Recherche de l’éditeur "INEDEE"...');
    const editor = await EditorModel.findOne({
      name: { $regex: /^inedee$/i },
    });

    if (!editor) {
      console.error('❌ Éditeur "INEDEE" introuvable en base. Abandon du script.');
      return;
    }

    console.log(`✅ Éditeur trouvé : ${editor.name} (id=${editor._id.toString()})`);

    // 1.b Mise à jour des champs DD de l'Editor (internal_it_systems, it_security_strategy, contracts_for_review)
    console.log('\n=== Étape 1.b : Mise à jour des champs DD de l’Editor ===');

    const editorDdPayload = {
      country: editor.country || 'France',
      size: editor.size || 'SME',
      business_criticality: 'Critical' as const,
      internal_it_systems: [
        'Microsoft 365',
        'SharePoint',
        'Microsoft Azure',
        'ERP Inedee (usage interne)',
        'Firewall Fortinet',
        'Antivirus / EDR WithSecure',
        'GLPI (inventaire)',
        'Cryptr (SSO)',
        'Gandi (DNS)',
        'Digiforma (formation)',
        'Sylae (paie)',
        'Mindee (OCR)',
        'Universign (signature)',
      ],
      it_security_strategy: [
        'Certification ISO 27001 en cours (cible décembre 2024)',
        'Politique de sécurité de l’information',
        'Politique de gestion des incidents de sécurité',
        'Politique de patch management',
        'Analyse de risque (PIA CNIL, EBIOS / ISO 27005)',
      ],
      // Le schéma Mongoose courant pour contracts_for_review est un tableau de chaînes ;
      // on sérialise donc chaque contrat sous forme de chaîne descriptive pour éviter les erreurs de cast.
      contracts_for_review: [
        'Hébergement - Contrat avec Armonie (hébergement PA3/PA4, services Cockpit ITSM).',
        'Infogérance - Contrat avec Solutions Informatiques (infogérance, patching, veille sécurité).',
        'SSO - Contrat avec Cryptr (SSO).',
        'OCR - Contrat avec Mindee (OCR).',
        'Banque - Contrat avec Generix (EBICS).',
        'Télécom - Contrat avec Orange (télécom).',
        'Formation - Contrat avec Digiforma (plateforme de formation).',
        'Comptabilité - Contrat avec FBC Expertise (comptabilité).',
        'Audit M365/Azure - Contrat avec Eliade (revue Microsoft 365/Azure).',
      ],
    };

    await EditorModel.findByIdAndUpdate(editor._id, editorDdPayload, { new: true });
    console.log('🟡 Editor mis à jour avec les champs DD (internal_it_systems, it_security_strategy, contracts_for_review).');

    // 2. Solution ERP Inedee
    console.log('\n=== Étape 2 : Solution "ERP Inedee" ===');

    const solutionId = 'ERP_INEDEE';
    const solutionFilter = { solutionId };

    const existingSolution = await SolutionModel.findOne(solutionFilter);

    const solutionPayload = {
      solutionId,
      editorId: editor._id,
      name: 'ERP Inedee',
      description:
        'ERP de gestion commerciale, de projet et de comptabilité intégrée pour les agences de communication (SaaS 100% Cloud).',
      main_use_case:
        'ERP de Gestion Commerciale, Gestion de Projet et Comptabilité intégrée pour les agences de communication.',
      type: 'SaaS' as const,
      product_criticality: 'Critical' as const,
      api_robustness:
        'APIs internes principalement utilisées pour l’intégration avec les systèmes partenaires (Mindee, Universign, etc.).',
      api_documentation_quality: 'Medium',
      ip_ownership_clear: 'Yes',
      licensing_model: 'Licence SaaS par client (abonnement récurrent).',
      license_compliance_assured: 'Yes',
      tech_stack: [
        'PHP',
        'IBM i (AS/400) V7R5',
        'SQL / DB2400',
        'PDF.js v3.11.174',
        'Classes internes $V, $DCL, $DB, $DSP, $PGM, $JS, $FTP, $IFS',
      ],
    };

    let solutionDoc;
    if (existingSolution) {
      solutionDoc = await SolutionModel.findOneAndUpdate(solutionFilter, solutionPayload, {
        new: true,
      });
      console.log(`🟡 Solution mise à jour : ${solutionDoc?.name} (solutionId=${solutionId})`);
    } else {
      solutionDoc = await SolutionModel.create(solutionPayload);
      console.log(`🟢 Solution créée : ${solutionDoc.name} (solutionId=${solutionId})`);
    }

    // 3. Hosting (Armonie / Equinix)
    console.log('\n=== Étape 3 : Hosting Armonie / Equinix ===');

    const hostingId = 'ERP_INEDEE_HOSTING';
    const hostingFilter = { hostingId };

    const hostingPayload = {
      hostingId,
      provider: 'Armonie (Equinix & Iron Mountain)',
      region: 'France - PA3 Equinix Saint-Denis (Prod) & PA4 Equinix Pantin (Backup)',
      tier: 'datacenter' as const,
      certifications: [
        'ISO 27001',
        'SOC 1 Type II',
        'SOC 2 Type II',
        'PCI DSS',
        'HDA',
        'ISO 9001',
        'ISAE 3402',
        'ISO 27001 (Iron Mountain)',
      ],
      contact: {
        name: 'Contact technique Armonie',
        email: 'support@armonie.fr',
      },
    };

    const existingHosting = await HostingModel.findOne(hostingFilter);
    let hostingDoc;
    if (existingHosting) {
      hostingDoc = await HostingModel.findOneAndUpdate(hostingFilter, hostingPayload, {
        new: true,
      });
      console.log(`🟡 Hosting mis à jour : ${hostingDoc?.provider} (hostingId=${hostingId})`);
    } else {
      hostingDoc = await HostingModel.create(hostingPayload);
      console.log(`🟢 Hosting créé : ${hostingDoc.provider} (hostingId=${hostingId})`);
    }

    // 4. Environment (Production)
    console.log('\n=== Étape 4 : Environment Production ERP Inedee ===');

    if (!solutionDoc) {
      throw new Error("Solution ERP Inedee non disponible, impossible de créer l'environnement.");
    }

    const envId = 'ERP_INEDEE_PROD';
    const envFilter = { envId };

    const environmentPayload = {
      envId,
      solutionId: solutionDoc._id,
      hostingId: hostingId,
      env_type: 'production',
      tech_stack: ['IBM i (AS/400) V7R5', 'DB2400'],
      data_types: ['Personal', 'Financial'],
      redundancy: 'geo-redundant' as const,
      backup: {
        exists: true,
        // RTO/RPO convertis en heures (approximation)
        rto: 0.25, // 15 minutes via Hyperswap
        rpo: 24, // Max 24h de perte de données
        restoration_test_frequency: 'annual',
        schedule:
          'Quotidien (7 jours), Hebdomadaire (2 semaines), Mensuel (1 an), Annuel (2 ans, sauvegardes chez Iron Mountain)',
      },
      disaster_recovery_plan: 'Tested',
      deployment_type: 'monolith' as const,
      virtualization: 'physical' as const,
      db_scaling_mechanism: 'Verticale',
      network_security_mechanisms: [
        'Pare-feu (Fortinet)',
        'VPN IPsec (entre FW Inedee et DC Equinix)',
        'Reverse Proxy',
        'VLANs par client',
      ],
      sla_offered: 'Disponibilité 99,5% (24/7/365, hors maintenance planifiée).',
    };

    const existingEnv = await EnvironmentModel.findOne(envFilter);
    let envDoc;
    if (existingEnv) {
      envDoc = await EnvironmentModel.findOneAndUpdate(envFilter, environmentPayload as any, {
        new: true,
      });
      console.log(`🟡 Environment mis à jour : ${envDoc?.env_type} (envId=${envId})`);
    } else {
      envDoc = (await EnvironmentModel.create(environmentPayload as any)) as any;
      console.log(`🟢 Environment créé : ${envDoc.env_type} (envId=${envId})`);
    }

    // 5. SecurityProfile
    console.log('\n=== Étape 5 : SecurityProfile ERP Inedee ===');

    if (!envDoc) {
      throw new Error("Environment ERP Inedee non disponible, impossible de créer le SecurityProfile.");
    }

    const secId = 'ERP_INEDEE_SEC';
    const secFilter = { secId };

    const securityPayload = {
      secId,
      envId: envDoc._id,
      auth: 'SSO',
      encryption: {
        in_transit: true,
        at_rest: true,
        details:
          'In-transit : HTTPS/TLS 1.2 minimum. At-rest : chiffrement des postes de travail (BitLocker). Chiffrement AS/400 non précisé.',
      },
      patching: 'scheduled',
      pentest_freq: 'annual',
      vuln_mgmt: 'manual',
      access_control:
        'RBAC par profils (Admin, Comptable, Développeur, etc.), principe du moindre privilège, revue trimestrielle des accès.',
      internal_audits_recent:
        'Pentest mai 2024 avec corrections des vulnérabilités critiques (RCE, XSS, SQLi, vol de session).',
      centralized_monitoring: true,
      pentest_results_summary:
        'Plusieurs failles critiques corrigées. Certaines faiblesses acceptées/à corriger (mots de passe < 15 caractères, workflows non validés côté serveur, déblocage après bruteforce).',
      known_security_flaws:
        'Faiblesses de complexité des mots de passe, absence de validation serveur sur certains workflows, gestion incomplète du déblocage de compte après brute-force.',
      incident_reporting_process:
        'Procédure documentée (ticketing, classification, escalade). Outils : Cockpit ITSM (Armonie) et Zendesk (Eliade/SI). Notification CNIL sous 72h / responsable de traitement sous 48h.',
    };

    const existingSec = await SecurityProfileModel.findOne(secFilter);
    if (existingSec) {
      await SecurityProfileModel.findOneAndUpdate(secFilter, securityPayload, { new: true });
      console.log(`🟡 SecurityProfile mis à jour (secId=${secId})`);
    } else {
      await SecurityProfileModel.create(securityPayload);
      console.log(`🟢 SecurityProfile créé (secId=${secId})`);
    }

    // 6. Monitoring & Observability
    console.log('\n=== Étape 6 : Monitoring & Observability ===');

    const monId = 'ERP_INEDEE_MON';
    const monFilter = { monId };

    const monitoringPayload = {
      monId,
      envId: envDoc._id,
      perf_monitoring: 'Yes',
      log_centralization: 'Yes',
      tools: ['Other' as 'Other'],
      alerting_strategy:
        'Supervision 24/7/365 via Cockpit ITSM (Armonie), EDR WithSecure, GLPI pour l’inventaire, Microsoft Defender/Purview/Sentinel pour M365/Azure.',
    };

    const existingMon = await MonitoringObservabilityModel.findOne(monFilter);
    if (existingMon) {
      await MonitoringObservabilityModel.findOneAndUpdate(monFilter, monitoringPayload as any, {
        new: true,
      });
      console.log(`🟡 MonitoringObservability mis à jour (monId=${monId})`);
    } else {
      await MonitoringObservabilityModel.create(monitoringPayload as any);
      console.log(`🟢 MonitoringObservability créé (monId=${monId})`);
    }

    // 7. CodeBase
    console.log('\n=== Étape 7 : CodeBase ERP Inedee ===');

    const codebaseId = 'ERP_INEDEE_CODEBASE';
    const codebaseFilter = { codebaseId };

    const codebasePayload = {
      codebaseId,
      solutionId: solutionDoc._id,
      repo_location: '/phlsoft/phldev (accès SFTP via WinSCP)',
      documentation_level: 'Medium',
      code_review_process:
        'Revue de code principalement informelle ; formalisation progressive dans le cadre de la certification ISO 27001.',
      version_control_tool: 'Gestion de code interne sur IBM i / répertoires partagés.',
      technical_debt_known:
        'Dette technique élevée : utilisation de eval() (≈82 occurrences), code historique AS/400, vulnérabilités applicatives relevées lors du pentest de mai 2024.',
      legacy_systems: 'Applications sur IBM i (AS/400).',
      third_party_dependencies: ['Mindee', 'Universign', 'Cryptr', 'WithSecure EDR'],
    };

    const existingCodebase = await CodeBaseModel.findOne(codebaseFilter);
    if (existingCodebase) {
      await CodeBaseModel.findOneAndUpdate(codebaseFilter, codebasePayload, { new: true });
      console.log(`🟡 CodeBase mis à jour (codebaseId=${codebaseId})`);
    } else {
      await CodeBaseModel.create(codebasePayload);
      console.log(`🟢 CodeBase créé (codebaseId=${codebaseId})`);
    }

    // 8. DevelopmentMetrics
    console.log('\n=== Étape 8 : DevelopmentMetrics ERP Inedee ===');

    const metricsId = 'ERP_INEDEE_METRICS';
    const metricsFilter = { metricsId };

    const metricsPayload = {
      metricsId,
      solutionId: solutionDoc._id,
      sdlc_process: 'Hybrid',
      devops_automation_level: 'Partial CI',
      planned_vs_unplanned_ratio: 0.5, // Estimation raisonnable en l’absence de métrique exacte
      lead_time_for_changes_days: 7, // Estimation : quelques jours entre DEV et PROD
      mttr_hours: 24, // Délai de correction pour incident critique
      internal_vs_external_bug_ratio: 0.5, // 50/50 (approximation)
    };

    const existingMetrics = await DevelopmentMetricsModel.findOne(metricsFilter);
    if (existingMetrics) {
      await DevelopmentMetricsModel.findOneAndUpdate(metricsFilter, metricsPayload, { new: true });
      console.log(`🟡 DevelopmentMetrics mis à jour (metricsId=${metricsId})`);
    } else {
      await DevelopmentMetricsModel.create(metricsPayload);
      console.log(`🟢 DevelopmentMetrics créé (metricsId=${metricsId})`);
    }

    console.log('\n✅ Import des données techniques d’INEDEE terminé avec succès.');
  } catch (err) {
    console.error('❌ Erreur pendant l’import des données INEDEE :');
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
  }
}

// Lancer le script si exécuté directement
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('importInedee.ts')) {
  main().catch((err) => {
    console.error('❌ Erreur inattendue :', err);
    process.exit(1);
  });
}


