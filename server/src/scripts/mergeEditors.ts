/**
 * Script de fusion de deux éditeurs et de toutes leurs données associées
 * 
 * Usage: 
 *   npm run merge-editors -- "Éditeur Source" "Éditeur Destination"
 *   ou
 *   node dist/scripts/mergeEditors.js "Éditeur Source" "Éditeur Destination"
 * 
 * Ce script:
 * 1. Se connecte à MongoDB
 * 2. Recherche les deux éditeurs par nom
 * 3. Liste toutes les entités qui seront fusionnées (audit)
 * 4. Demande confirmation à l'utilisateur
 * 5. Fusionne toutes les données (déplace les solutions du source vers le destination)
 * 6. Supprime l'éditeur source
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

interface MergeSummary {
  sourceEditor: {
    name: string;
    editorId: string;
    _id: mongoose.Types.ObjectId;
  } | null;
  destinationEditor: {
    name: string;
    editorId: string;
    _id: mongoose.Types.ObjectId;
  } | null;
  sourceDevelopmentTeam: number;
  destinationDevelopmentTeam: number;
  solutionsToMove: Array<{
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
    solutionName: string;
    _id: mongoose.Types.ObjectId;
  }>;
  securityProfiles: number;
  monitoringObservability: number;
  entityCosts: number;
  performanceMetrics: number;
  roadmapItems: number;
  documents: number;
  hostingsToCheck: Array<{
    hostingId: string;
    provider: string;
    usedBySolutions: string[];
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
 * Affiche le résumé de ce qui sera fusionné
 */
function displaySummary(summary: MergeSummary): void {
  console.log('\n' + '='.repeat(80));
  console.log('📋 RÉSUMÉ DE LA FUSION DES ÉDITEURS');
  console.log('='.repeat(80));
  
  if (!summary.sourceEditor || !summary.destinationEditor) {
    console.log('❌ Éditeurs non trouvés');
    return;
  }

  console.log(`\n📌 Éditeur Source (sera supprimé après fusion):`);
  console.log(`   - Nom: ${summary.sourceEditor.name}`);
  console.log(`   - ID: ${summary.sourceEditor.editorId}`);
  console.log(`   - DevelopmentTeam: ${summary.sourceDevelopmentTeam}`);

  console.log(`\n📌 Éditeur Destination (recevra toutes les données):`);
  console.log(`   - Nom: ${summary.destinationEditor.name}`);
  console.log(`   - ID: ${summary.destinationEditor.editorId}`);
  console.log(`   - DevelopmentTeam: ${summary.destinationDevelopmentTeam}`);

  console.log(`\n💼 Solutions à déplacer (${summary.solutionsToMove.length}):`);
  summary.solutionsToMove.forEach((sol, idx) => {
    console.log(`   ${idx + 1}. ${sol.name} (${sol.solutionId})`);
  });

  if (summary.solutionsToMove.length > 0) {
    console.log(`\n📦 Données liées aux Solutions à déplacer:`);
    console.log(`   - Codebases: ${summary.codebases}`);
    console.log(`   - DevelopmentMetrics: ${summary.developmentMetrics}`);
    console.log(`   - AIFeatures: ${summary.aiFeatures}`);
    console.log(`   - ScoringSnapshots: ${summary.scoringSnapshots}`);
  }

  console.log(`\n🌍 Environnements à déplacer (${summary.environments.length}):`);
  summary.environments.forEach((env, idx) => {
    console.log(`   ${idx + 1}. ${env.solutionName} - ${env.env_type} (${env.envId})`);
  });

  if (summary.environments.length > 0) {
    console.log(`\n🔒 Données liées aux Environnements à déplacer:`);
    console.log(`   - SecurityProfiles: ${summary.securityProfiles}`);
    console.log(`   - MonitoringObservability: ${summary.monitoringObservability}`);
    console.log(`   - EntityCosts: ${summary.entityCosts}`);
    console.log(`   - PerformanceMetrics: ${summary.performanceMetrics}`);
  }

  console.log(`\n📋 Autres données à déplacer:`);
  console.log(`   - RoadmapItems: ${summary.roadmapItems}`);
  console.log(`   - Documents: ${summary.documents}`);

  if (summary.hostingsToCheck.length > 0) {
    console.log(`\n🏗️  Hébergements utilisés (seront conservés):`);
    summary.hostingsToCheck.forEach((hosting, idx) => {
      console.log(`   ${idx + 1}. ${hosting.provider} (${hosting.hostingId})`);
      console.log(`      Utilisé par: ${hosting.usedBySolutions.join(', ')}`);
    });
  }

  const total = summary.solutionsToMove.length +
                summary.codebases +
                summary.developmentMetrics +
                summary.aiFeatures +
                summary.scoringSnapshots +
                summary.environments.length +
                summary.securityProfiles +
                summary.monitoringObservability +
                summary.entityCosts +
                summary.performanceMetrics +
                summary.roadmapItems +
                summary.documents +
                (summary.sourceDevelopmentTeam > 0 ? 1 : 0) + // DevelopmentTeam source
                1; // Editor source

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 TOTAL: ${total} entité(s) seront déplacée(s) vers "${summary.destinationEditor.name}"`);
  console.log(`🗑️  L'éditeur "${summary.sourceEditor.name}" sera supprimé après la fusion`);
  console.log('='.repeat(80) + '\n');
}

/**
 * Collecte toutes les informations sur ce qui sera fusionné
 */
async function collectMergeSummary(sourceEditorName: string, destinationEditorName: string): Promise<MergeSummary> {
  const summary: MergeSummary = {
    sourceEditor: null,
    destinationEditor: null,
    sourceDevelopmentTeam: 0,
    destinationDevelopmentTeam: 0,
    solutionsToMove: [],
    codebases: 0,
    developmentMetrics: 0,
    aiFeatures: 0,
    scoringSnapshots: 0,
    environments: [],
    securityProfiles: 0,
    monitoringObservability: 0,
    entityCosts: 0,
    performanceMetrics: 0,
    roadmapItems: 0,
    documents: 0,
    hostingsToCheck: []
  };

  // 1. Rechercher les éditeurs (recherche insensible à la casse et avec trim)
  const trimmedSourceName = sourceEditorName.trim();
  const trimmedDestName = destinationEditorName.trim();
  
  // Recherche avec regex insensible à la casse pour gérer les variations
  const sourceEditor = await EditorModel.findOne({
    name: { $regex: new RegExp(`^${trimmedSourceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
  });
  
  const destinationEditor = await EditorModel.findOne({
    name: { $regex: new RegExp(`^${trimmedDestName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
  });

  if (!sourceEditor) {
    return summary;
  }

  if (!destinationEditor) {
    return summary;
  }

  summary.sourceEditor = {
    name: sourceEditor.name,
    editorId: sourceEditor.editorId,
    _id: sourceEditor._id
  };

  summary.destinationEditor = {
    name: destinationEditor.name,
    editorId: destinationEditor.editorId,
    _id: destinationEditor._id
  };

  // 2. DevelopmentTeams
  const sourceDevTeam = await DevelopmentTeamModel.findOne({ editorId: sourceEditor._id });
  if (sourceDevTeam) {
    summary.sourceDevelopmentTeam = 1;
  }

  const destDevTeam = await DevelopmentTeamModel.findOne({ editorId: destinationEditor._id });
  if (destDevTeam) {
    summary.destinationDevelopmentTeam = 1;
  }

  // 3. Solutions du source
  const solutions = await SolutionModel.find({ editorId: sourceEditor._id });
  summary.solutionsToMove = solutions.map(sol => ({
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
  
  // Récupérer les noms des solutions pour l'affichage
  const solutionMap = new Map(solutions.map(sol => [sol._id.toString(), sol.name]));
  
  summary.environments = environments.map(env => ({
    envId: env.envId,
    env_type: env.env_type,
    solutionName: solutionMap.get(env.solutionId.toString()) || 'Inconnu',
    _id: env._id
  }));

  const environmentIds = environments.map(env => env._id);

  // 6. Données liées aux Environments
  if (environmentIds.length > 0) {
    summary.securityProfiles = await SecurityProfileModel.countDocuments({ envId: { $in: environmentIds } } as any);
    summary.monitoringObservability = await MonitoringObservabilityModel.countDocuments({ envId: { $in: environmentIds } } as any);
    summary.entityCosts = await EntityCostModel.countDocuments({ envId: { $in: environmentIds } } as any);
    summary.performanceMetrics = await PerformanceMetricsModel.countDocuments({ envId: { $in: environmentIds } } as any);

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

    // Hostings utilisés
    const hostingIds = [...new Set(environments.map(env => env.hostingId))];
    for (const hostingId of hostingIds) {
      const hosting = await HostingModel.findOne({ hostingId });
      if (hosting) {
        // Trouver quelles solutions utilisent ce hosting
        const envsUsingHosting = environments.filter(env => env.hostingId === hostingId);
        const solutionNames = envsUsingHosting
          .map(env => solutionMap.get(env.solutionId.toString()))
          .filter((name): name is string => name !== undefined);
        
        summary.hostingsToCheck.push({
          hostingId: hosting.hostingId,
          provider: hosting.provider,
          usedBySolutions: [...new Set(solutionNames)]
        });
      }
    }
  }

  // 7. Documents liés à l'Editor source
  summary.documents += await DocumentModel.countDocuments({
    parentId: sourceEditor._id,
    linkedTo: 'Editor'
  } as any);

  return summary;
}

/**
 * Fusionne les deux éditeurs
 */
async function mergeEditors(summary: MergeSummary): Promise<void> {
  if (!summary.sourceEditor || !summary.destinationEditor) {
    throw new Error('Éditeurs manquants pour la fusion');
  }

  console.log('\n🔄 Début de la fusion...\n');

  const solutionIds = summary.solutionsToMove.map(sol => sol._id);
  const environments = await EnvironmentModel.find({ solutionId: { $in: solutionIds } } as any);
  const environmentIds = environments.map(env => env._id);

  // 1. Mettre à jour les Solutions : changer editorId vers destination
  if (solutionIds.length > 0) {
    await SolutionModel.updateMany(
      { _id: { $in: solutionIds } },
      { $set: { editorId: summary.destinationEditor._id } }
    );
    console.log(`✅ ${summary.solutionsToMove.length} Solution(s) déplacée(s) vers "${summary.destinationEditor.name}"`);
  }

  // 2. Mettre à jour les Documents liés à l'Editor source uniquement
  // Les Documents liés aux Solutions et Environments gardent leur parentId original
  const editorDocumentsCount = await DocumentModel.countDocuments({
    parentId: summary.sourceEditor._id,
    linkedTo: 'Editor'
  } as any);
  
  if (editorDocumentsCount > 0) {
    await DocumentModel.updateMany(
      { parentId: summary.sourceEditor._id, linkedTo: 'Editor' },
      { $set: { parentId: summary.destinationEditor._id } }
    );
    console.log(`✅ ${editorDocumentsCount} Document(s) lié(s) à l'éditeur déplacé(s)`);
  }
  
  // Les Documents liés aux Solutions et Environments restent inchangés
  // (ils sont automatiquement "déplacés" car leurs Solutions/Environments sont déplacés)

  // 4. Gérer le DevelopmentTeam source
  if (summary.sourceDevelopmentTeam > 0) {
    const sourceDevTeam = await DevelopmentTeamModel.findOne({ editorId: summary.sourceEditor._id });
    if (sourceDevTeam) {
      // Si le destination a déjà un DevelopmentTeam, on supprime celui du source
      // Sinon, on le déplace vers le destination
      const destDevTeam = await DevelopmentTeamModel.findOne({ editorId: summary.destinationEditor._id });
      if (destDevTeam) {
        await DevelopmentTeamModel.deleteOne({ _id: sourceDevTeam._id });
        console.log(`✅ DevelopmentTeam source supprimé (destination en a déjà un)`);
      } else {
        await DevelopmentTeamModel.updateOne(
          { _id: sourceDevTeam._id },
          { $set: { editorId: summary.destinationEditor._id } }
        );
        console.log(`✅ DevelopmentTeam source déplacé vers "${summary.destinationEditor.name}"`);
      }
    }
  }

  // 5. Supprimer l'éditeur source
  await EditorModel.deleteOne({ _id: summary.sourceEditor._id });
  console.log(`✅ Éditeur source "${summary.sourceEditor.name}" supprimé`);

  console.log('\n✅ Fusion terminée avec succès !\n');
  console.log(`📊 Résumé:`);
  console.log(`   - ${summary.solutionsToMove.length} solution(s) fusionnée(s)`);
  console.log(`   - ${summary.environments.length} environnement(s) fusionné(s)`);
  console.log(`   - Toutes les données associées ont été déplacées vers "${summary.destinationEditor.name}"`);
  console.log(`   - L'éditeur "${summary.sourceEditor.name}" a été supprimé\n`);
}

/**
 * Fonction principale
 */
async function mergeEditorsMain() {
  try {
    // Récupérer les noms des éditeurs depuis les arguments
    const sourceEditorName = process.argv[2];
    const destinationEditorName = process.argv[3];

    if (!sourceEditorName || !destinationEditorName) {
      console.error('❌ Erreur: Veuillez fournir les noms des deux éditeurs à fusionner');
      console.log('Usage: npm run merge-editors -- "Éditeur Source" "Éditeur Destination"');
      console.log('Exemple: npm run merge-editors -- "Éditeur A" "Éditeur B"');
      process.exit(1);
    }

    if (sourceEditorName === destinationEditorName) {
      console.error('❌ Erreur: Les deux éditeurs doivent être différents');
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
    console.log(`🔍 Recherche des éditeurs...`);
    console.log(`   Source: "${sourceEditorName}"`);
    console.log(`   Destination: "${destinationEditorName}"\n`);
    
    const summary = await collectMergeSummary(sourceEditorName, destinationEditorName);

    if (!summary.sourceEditor) {
      console.log(`❌ Aucun éditeur source trouvé avec le nom "${sourceEditorName}"`);
      
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

    if (!summary.destinationEditor) {
      console.log(`❌ Aucun éditeur destination trouvé avec le nom "${destinationEditorName}"`);
      
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
      `⚠️  Êtes-vous sûr de vouloir fusionner "${summary.sourceEditor.name}" dans "${summary.destinationEditor.name}" ? (oui/non): `
    );

    rl.close();

    if (answer.toLowerCase() !== 'oui' && answer.toLowerCase() !== 'o' && answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('\n❌ Fusion annulée par l\'utilisateur');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Effectuer la fusion
    await mergeEditors(summary);

    // Fermeture de la connexion
    await mongoose.connection.close();
    console.log('✅ Déconnecté de MongoDB');
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Erreur lors de la fusion:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Exécution du script
mergeEditorsMain();

