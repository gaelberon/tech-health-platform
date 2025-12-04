/**
 * Script de suppression en cascade d'un éditeur et de toutes ses données associées
 * 
 * Usage: 
 *   npm run delete-editor -- "Nom de l'éditeur"
 *   ou
 *   node dist/scripts/deleteEditor.js "Nom de l'éditeur"
 * 
 * Ce script:
 * 1. Se connecte à MongoDB
 * 2. Recherche l'éditeur par nom
 * 3. Liste toutes les entités qui seront supprimées (audit)
 * 4. Demande confirmation à l'utilisateur
 * 5. Supprime en cascade toutes les données liées
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import * as readline from 'readline';
import { EditorModel } from '../models/Editor.model.js';
import { SolutionModel } from '../models/Solution.model.js';
import { HostingModel } from '../models/Hosting.model.js';
import { EnvironmentModel } from '../models/Environment.model.js';
import { SecurityProfileModel } from '../models/SecurityProfile.model.js';
import { MonitoringObservabilityModel } from '../models/MonitoringObservability.model.js';
import { EntityCostModel } from '../models/EntityCost.model.js';
import { DevelopmentTeamModel } from '../models/DevelopmentTeam.model.js';
import { CodeBaseModel } from '../models/CodeBase.model.js';
import { DevelopmentMetricsModel } from '../models/DevelopmentMetrics.model.js';
import { AIFeaturesModel } from '../models/AIFeatures.model.js';
import { ScoringSnapshotModel } from '../models/ScoringSnapshot.model.js';
import { RoadmapItemModel } from '../models/RoadmapItem.model.js';
import { DocumentModel } from '../models/Document.model.js';
import { PerformanceMetricsModel } from '../models/PerformanceMetrics.model.js';

interface DeletionSummary {
  editor: {
    name: string;
    editorId: string;
    _id: mongoose.Types.ObjectId;
  } | null;
  developmentTeam: number;
  solutions: Array<{
    solutionId: string;
    name: string;
    _id: mongoose.Types.ObjectId;
  }>;
  codebases: number;
  developmentMetrics: number;
  aiFeatures: number;
  scoringSnapshots: number;
  environments: Array<{
    envId: string;
    env_type: string;
    _id: mongoose.Types.ObjectId;
  }>;
  securityProfiles: number;
  monitoringObservability: number;
  entityCosts: number;
  roadmapItems: number;
  documents: number;
  performanceMetrics: number;
  hostingsToDelete: Array<{
    hostingId: string;
    provider: string;
  }>;
}

/**
 * Crée une interface readline pour les entrées utilisateur
 */
function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Pose une question à l'utilisateur et retourne la réponse
 */
function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Affiche le résumé de ce qui sera supprimé
 */
function displaySummary(summary: DeletionSummary): void {
  console.log('\n' + '='.repeat(80));
  console.log('📋 RÉSUMÉ DE LA SUPPRESSION EN CASCADE');
  console.log('='.repeat(80));
  
  if (!summary.editor) {
    console.log('❌ Éditeur non trouvé');
    return;
  }

  console.log(`\n📌 Éditeur à supprimer:`);
  console.log(`   - Nom: ${summary.editor.name}`);
  console.log(`   - ID: ${summary.editor.editorId}`);

  console.log(`\n👥 Équipe de développement:`);
  console.log(`   - DevelopmentTeam: ${summary.developmentTeam}`);

  console.log(`\n💼 Solutions (${summary.solutions.length}):`);
  summary.solutions.forEach((sol, idx) => {
    console.log(`   ${idx + 1}. ${sol.name} (${sol.solutionId})`);
  });

  if (summary.solutions.length > 0) {
    console.log(`\n📦 Données liées aux Solutions:`);
    console.log(`   - Codebases: ${summary.codebases}`);
    console.log(`   - DevelopmentMetrics: ${summary.developmentMetrics}`);
    console.log(`   - AIFeatures: ${summary.aiFeatures}`);
    console.log(`   - ScoringSnapshots: ${summary.scoringSnapshots}`);
  }

  console.log(`\n🌍 Environnements (${summary.environments.length}):`);
  summary.environments.forEach((env, idx) => {
    console.log(`   ${idx + 1}. ${env.env_type} (${env.envId})`);
  });

  if (summary.environments.length > 0) {
    console.log(`\n🔒 Données liées aux Environnements:`);
    console.log(`   - SecurityProfiles: ${summary.securityProfiles}`);
    console.log(`   - MonitoringObservability: ${summary.monitoringObservability}`);
    console.log(`   - EntityCosts: ${summary.entityCosts}`);
  }

  console.log(`\n📋 Autres données:`);
  console.log(`   - RoadmapItems: ${summary.roadmapItems}`);
  console.log(`   - Documents: ${summary.documents}`);
  console.log(`   - PerformanceMetrics: ${summary.performanceMetrics}`);

  if (summary.hostingsToDelete.length > 0) {
    console.log(`\n🏗️  Hébergements à supprimer (non utilisés ailleurs) (${summary.hostingsToDelete.length}):`);
    summary.hostingsToDelete.forEach((hosting, idx) => {
      console.log(`   ${idx + 1}. ${hosting.provider} (${hosting.hostingId})`);
    });
  }

  const total = 1 + // Editor
                summary.developmentTeam +
                summary.solutions.length +
                summary.codebases +
                summary.developmentMetrics +
                summary.aiFeatures +
                summary.scoringSnapshots +
                summary.environments.length +
                summary.securityProfiles +
                summary.monitoringObservability +
                summary.entityCosts +
                summary.roadmapItems +
                summary.documents +
                summary.performanceMetrics +
                summary.hostingsToDelete.length;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 TOTAL: ${total} entité(s) seront supprimée(s)`);
  console.log('='.repeat(80) + '\n');
}

/**
 * Collecte toutes les informations sur ce qui sera supprimé
 */
async function collectDeletionSummary(editorName: string): Promise<DeletionSummary> {
  const summary: DeletionSummary = {
    editor: null,
    developmentTeam: 0,
    solutions: [],
    codebases: 0,
    developmentMetrics: 0,
    aiFeatures: 0,
    scoringSnapshots: 0,
    environments: [],
    securityProfiles: 0,
    monitoringObservability: 0,
    entityCosts: 0,
  roadmapItems: 0,
  documents: 0,
  performanceMetrics: 0,
  hostingsToDelete: []
  };

  // 1. Rechercher l'éditeur (recherche insensible à la casse et avec trim)
  const trimmedName = editorName.trim();
  
  // Recherche avec regex insensible à la casse pour gérer les variations
  const editor = await EditorModel.findOne({
    name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
  });
  
  if (!editor) {
    return summary;
  }

  summary.editor = {
    name: editor.name,
    editorId: editor.editorId,
    _id: editor._id
  };

  // 2. DevelopmentTeam
  const developmentTeam = await DevelopmentTeamModel.findOne({ editorId: editor._id });
  if (developmentTeam) {
    summary.developmentTeam = 1;
  }

  // 3. Solutions
  const solutions = await SolutionModel.find({ editorId: editor._id });
  summary.solutions = solutions.map(sol => ({
    solutionId: sol.solutionId,
    name: sol.name,
    _id: sol._id
  }));

  const solutionIds = solutions.map(sol => sol._id);

  // 4. Données liées aux Solutions
  if (solutionIds.length > 0) {
    summary.codebases = await CodeBaseModel.countDocuments({ solutionId: { $in: solutionIds } } as any);
    summary.developmentMetrics = await DevelopmentMetricsModel.countDocuments({ solutionId: { $in: solutionIds } } as any);
    summary.aiFeatures = await AIFeaturesModel.countDocuments({ solutionId: { $in: solutionIds } } as any);
    summary.scoringSnapshots = await ScoringSnapshotModel.countDocuments({ solutionId: { $in: solutionIds } } as any);

    // RoadmapItems liés aux Solutions
    summary.roadmapItems += await RoadmapItemModel.countDocuments({
      parentId: { $in: solutionIds },
      linkedTo: 'Solution'
    } as any);

    // Documents liés aux Solutions
    summary.documents += await DocumentModel.countDocuments({
      parentId: { $in: solutionIds },
      linkedTo: 'Solution'
    } as any);
  }

  // 5. Environments
  const environments = await EnvironmentModel.find({ solutionId: { $in: solutionIds } } as any);
  summary.environments = environments.map(env => ({
    envId: env.envId,
    env_type: env.env_type,
    _id: env._id
  }));

  const environmentIds = environments.map(env => env._id);

  // 6. Données liées aux Environments
  if (environmentIds.length > 0) {
    summary.securityProfiles = await SecurityProfileModel.countDocuments({ envId: { $in: environmentIds } } as any);
    summary.monitoringObservability = await MonitoringObservabilityModel.countDocuments({ envId: { $in: environmentIds } } as any);
    summary.entityCosts = await EntityCostModel.countDocuments({ envId: { $in: environmentIds } } as any);

    // RoadmapItems liés aux Environments
    summary.roadmapItems += await RoadmapItemModel.countDocuments({
      parentId: { $in: environmentIds },
      linkedTo: 'Environment'
    } as any);

    // Documents liés aux Environments
    summary.documents += await DocumentModel.countDocuments({
      parentId: { $in: environmentIds },
      linkedTo: 'Environment'
    } as any);

    // PerformanceMetrics liés aux Environments
    summary.performanceMetrics = await PerformanceMetricsModel.countDocuments({
      envId: { $in: environmentIds }
    } as any);

    // Hostings à supprimer (seulement ceux qui ne sont plus utilisés)
    const hostingIds = [...new Set(environments.map(env => env.hostingId))];
    for (const hostingId of hostingIds) {
      // Vérifier si ce hosting est utilisé par d'autres environnements
      const otherEnvs = await EnvironmentModel.countDocuments({
        hostingId,
        _id: { $nin: environmentIds }
      } as any);

      if (otherEnvs === 0) {
        const hosting = await HostingModel.findOne({ hostingId });
        if (hosting) {
          summary.hostingsToDelete.push({
            hostingId: hosting.hostingId,
            provider: hosting.provider
          });
        }
      }
    }
  }

  // 7. Documents liés à l'Editor
  summary.documents += await DocumentModel.countDocuments({
    parentId: editor._id,
    linkedTo: 'Editor'
  });

  return summary;
}

/**
 * Supprime toutes les entités en cascade
 */
async function deleteCascade(summary: DeletionSummary): Promise<void> {
  if (!summary.editor) {
    throw new Error('Aucun éditeur à supprimer');
  }

  console.log('\n🗑️  Début de la suppression en cascade...\n');

  // 1. Supprimer les données liées aux Environments
  const solutionIds = summary.solutions.map(sol => sol._id);
  const environments = await EnvironmentModel.find({ solutionId: { $in: solutionIds } } as any);
  const environmentIds = environments.map(env => env._id);

  if (environmentIds.length > 0) {
    await SecurityProfileModel.deleteMany({ envId: { $in: environmentIds } } as any);
    console.log(`✅ ${summary.securityProfiles} SecurityProfile(s) supprimé(s)`);

    await MonitoringObservabilityModel.deleteMany({ envId: { $in: environmentIds } } as any);
    console.log(`✅ ${summary.monitoringObservability} MonitoringObservability supprimé(s)`);

    await EntityCostModel.deleteMany({ envId: { $in: environmentIds } } as any);
    console.log(`✅ ${summary.entityCosts} EntityCost(s) supprimé(s)`);

    await PerformanceMetricsModel.deleteMany({ envId: { $in: environmentIds } } as any);
    console.log(`✅ ${summary.performanceMetrics} PerformanceMetrics supprimé(s)`);
  }

  // 2. Supprimer les Environments
  await EnvironmentModel.deleteMany({ solutionId: { $in: solutionIds } } as any);
  console.log(`✅ ${summary.environments.length} Environment(s) supprimé(s)`);

  // 3. Supprimer les Hostings non utilisés
  for (const hosting of summary.hostingsToDelete) {
    await HostingModel.deleteOne({ hostingId: hosting.hostingId });
    console.log(`✅ Hosting "${hosting.provider}" supprimé`);
  }

  // 4. Supprimer les données liées aux Solutions
  if (solutionIds.length > 0) {
    await CodeBaseModel.deleteMany({ solutionId: { $in: solutionIds } } as any);
    console.log(`✅ ${summary.codebases} Codebase(s) supprimé(s)`);

    await DevelopmentMetricsModel.deleteMany({ solutionId: { $in: solutionIds } } as any);
    console.log(`✅ ${summary.developmentMetrics} DevelopmentMetrics supprimé(s)`);

    await AIFeaturesModel.deleteMany({ solutionId: { $in: solutionIds } } as any);
    console.log(`✅ ${summary.aiFeatures} AIFeatures supprimé(s)`);

    await ScoringSnapshotModel.deleteMany({ solutionId: { $in: solutionIds } } as any);
    console.log(`✅ ${summary.scoringSnapshots} ScoringSnapshot(s) supprimé(s)`);

    await RoadmapItemModel.deleteMany({
      parentId: { $in: solutionIds },
      linkedTo: 'Solution'
    } as any);
  }

  // 5. Supprimer les Solutions
  await SolutionModel.deleteMany({ editorId: summary.editor._id });
  console.log(`✅ ${summary.solutions.length} Solution(s) supprimée(s)`);

  // 6. Supprimer DevelopmentTeam
  if (summary.developmentTeam > 0) {
    await DevelopmentTeamModel.deleteOne({ editorId: summary.editor._id });
    console.log(`✅ DevelopmentTeam supprimé`);
  }

  // 7. Supprimer les Documents liés à l'Editor
  await DocumentModel.deleteMany({
    parentId: summary.editor._id,
    linkedTo: 'Editor'
  });

  // Supprimer les Documents liés aux Solutions et Environments
  const allParentIds = [
    summary.editor._id,
    ...solutionIds,
    ...environmentIds
  ];
  await DocumentModel.deleteMany({
    parentId: { $in: allParentIds }
  } as any);
  console.log(`✅ ${summary.documents} Document(s) supprimé(s)`);

  // 8. Supprimer l'Editor
  await EditorModel.deleteOne({ _id: summary.editor._id });
  console.log(`✅ Editor "${summary.editor.name}" supprimé`);

  console.log('\n✅ Suppression en cascade terminée avec succès !\n');
}

/**
 * Fonction principale
 */
async function deleteEditor() {
  try {
    // Récupérer le nom de l'éditeur depuis les arguments
    const editorName = process.argv[2];

    if (!editorName) {
      console.error('❌ Erreur: Veuillez fournir le nom de l\'éditeur à supprimer');
      console.log('Usage: npm run delete-editor -- "Nom de l\'éditeur"');
      process.exit(1);
    }

    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    const MONGO_URI = process.env.MONGO_URI;

    if (!MONGO_URI) {
      console.error("❌ ERREUR FATALE: La variable d'environnement MONGO_URI n'est pas définie.");
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log(`✅ Connecté à MongoDB: ${mongoose.connection.host}\n`);

    // Collecter les informations
    console.log(`🔍 Recherche de l'éditeur "${editorName}"...`);
    const summary = await collectDeletionSummary(editorName);

    if (!summary.editor) {
      console.log(`❌ Aucun éditeur trouvé avec le nom "${editorName}"`);
      
      // Afficher les éditeurs disponibles pour aider au debug
      const allEditors = await EditorModel.find({}).select('name editorId').limit(20);
      if (allEditors.length > 0) {
        console.log('\n💡 Éditeurs disponibles dans la base de données (20 premiers):');
        allEditors.forEach((ed, idx) => {
          console.log(`   ${idx + 1}. "${ed.name}" (ID: ${ed.editorId})`);
        });
      }
      
      await mongoose.connection.close();
      process.exit(1);
    }

    // Afficher le résumé
    displaySummary(summary);

    // Demander confirmation
    const rl = createReadlineInterface();
    const answer = await askQuestion(
      rl,
      '⚠️  Êtes-vous sûr de vouloir supprimer cet éditeur et toutes ses données associées ? (oui/non): '
    );

    rl.close();

    if (answer.toLowerCase() !== 'oui' && answer.toLowerCase() !== 'o' && answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('\n❌ Suppression annulée par l\'utilisateur');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Effectuer la suppression
    await deleteCascade(summary);

    // Fermeture de la connexion
    await mongoose.connection.close();
    console.log('✅ Déconnecté de MongoDB');
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Erreur lors de la suppression:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Exécution du script
deleteEditor();

