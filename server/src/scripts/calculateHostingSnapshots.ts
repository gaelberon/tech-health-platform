/**
 * Script de calcul de snapshots de bilan hosting pour un ou plusieurs éditeurs
 * 
 * Usage: 
 *   npm run calculate-hosting-snapshots -- "Éditeur 1" "Éditeur 2" ...
 *   ou
 *   node dist/scripts/calculateHostingSnapshots.js "Éditeur 1" "Éditeur 2"
 * 
 * Ce script:
 * 1. Se connecte à MongoDB
 * 2. Recherche les éditeurs par nom
 * 3. Pour chaque éditeur, trouve toutes les solutions
 * 4. Pour chaque solution, trouve les environnements de production (ou le premier disponible)
 * 5. Calcule le score en utilisant le ScoringEngineService
 * 6. Crée des ScoringSnapshots avec collection_type='snapshot'
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { EditorModel } from '../models/Editor.model.js';
import { SolutionModel } from '../models/Solution.model.js';
import { EnvironmentModel } from '../models/Environment.model.js';
import { ScoringSnapshotModel } from '../models/ScoringSnapshot.model.js';
import { ScoringEngineService } from '../services/ScoringEngine.service.js';

/**
 * Génère un ID unique pour un snapshot
 */
function generateScoreId(solutionId: string, envId: string, collectionType: 'snapshot' | 'DD'): string {
  const timestamp = Date.now();
  return `score-${collectionType}-${solutionId}-${envId}-${timestamp}`;
}

/**
 * Trouve l'environnement de production ou le premier disponible pour une solution
 */
async function findEnvironmentForScoring(solutionId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId | null> {
  // Priorité : production > test > dev > backup
  const env = await EnvironmentModel.findOne({
    solutionId,
    env_type: 'production'
  } as any).exec();

  if (env) return env._id;

  // Si pas de production, chercher test
  const testEnv = await EnvironmentModel.findOne({
    solutionId,
    env_type: 'test'
  } as any).exec();

  if (testEnv) return testEnv._id;

  // Si pas de test, prendre le premier disponible
  const anyEnv = await EnvironmentModel.findOne({ solutionId } as any).exec();
  return anyEnv ? anyEnv._id : null;
}

/**
 * Calcule et enregistre un snapshot pour une solution
 */
async function calculateSnapshotForSolution(
  solutionId: mongoose.Types.ObjectId,
  solutionName: string,
  collectionType: 'snapshot' | 'DD'
): Promise<boolean> {
  try {
    // Trouver l'environnement à scorer
    const envId = await findEnvironmentForScoring(solutionId);
    
    if (!envId) {
      console.warn(`⚠️  Aucun environnement trouvé pour la solution "${solutionName}" (${solutionId})`);
      return false;
    }

    // Utiliser le ScoringEngineService pour calculer le score
    // Note: Le ScoringEngineService crée un snapshot, mais sans scoreId ni collection_type
    // On va l'utiliser pour calculer les scores, puis créer notre propre snapshot
    const scoringEngine = new ScoringEngineService();
    
    let tempSnapshot;
    try {
      tempSnapshot = await scoringEngine.calculateAndRecordScore(solutionId, envId);
    } catch (error: any) {
      // Si la création échoue (probablement à cause du scoreId manquant), on ne peut pas continuer
      console.warn(`⚠️  Impossible de calculer le score pour "${solutionName}": ${error.message}`);
      return false;
    }

    if (!tempSnapshot) {
      console.warn(`⚠️  Impossible de calculer le score pour "${solutionName}" - données manquantes`);
      return false;
    }

    // Supprimer le snapshot temporaire (créé sans collection_type ni scoreId valide)
    try {
      await ScoringSnapshotModel.deleteOne({ _id: tempSnapshot._id });
    } catch (deleteError: any) {
      // Si la suppression échoue, ce n'est pas grave, on continue
      console.warn(`⚠️  Impossible de supprimer le snapshot temporaire: ${deleteError.message}`);
    }

    // Créer le snapshot avec le bon collection_type et scoreId
    const scoreId = generateScoreId(solutionId.toString(), envId.toString(), collectionType);
    const date = new Date();

    const newSnapshot = await ScoringSnapshotModel.create({
      scoreId,
      solutionId,
      envId,
      date,
      collection_type: collectionType,
      global_score: tempSnapshot.global_score,
      risk_level: tempSnapshot.risk_level,
      scores: tempSnapshot.scores,
      notes: tempSnapshot.notes
    });

    console.log(`✅ Snapshot ${collectionType} créé pour "${solutionName}" - Score: ${newSnapshot.global_score}, Risque: ${newSnapshot.risk_level}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Erreur lors du calcul pour "${solutionName}":`, error.message);
    return false;
  }
}

/**
 * Fonction principale
 */
async function calculateHostingSnapshots() {
  try {
    // Récupérer les noms des éditeurs depuis les arguments
    const editorNames = process.argv.slice(2);

    if (editorNames.length === 0) {
      console.error('❌ Erreur: Veuillez fournir au moins un nom d\'éditeur');
      console.log('Usage: npm run calculate-hosting-snapshots -- "Éditeur 1" "Éditeur 2" ...');
      console.log('Exemple: npm run calculate-hosting-snapshots -- "GI Informatique" "Cogima"');
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

    // Rechercher les éditeurs
    console.log(`🔍 Recherche de ${editorNames.length} éditeur(s)...\n`);
    
    const editors: Array<{ name: string; editorId: string; _id: mongoose.Types.ObjectId }> = [];
    const notFound: string[] = [];

    for (const editorName of editorNames) {
      const trimmedName = editorName.trim();
      const editor = await EditorModel.findOne({
        name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });

      if (editor) {
        editors.push({
          name: editor.name,
          editorId: editor.editorId,
          _id: editor._id
        });
        console.log(`✅ Éditeur trouvé: "${editor.name}" (${editor.editorId})`);
      } else {
        notFound.push(editorName);
        console.log(`❌ Éditeur non trouvé: "${editorName}"`);
      }
    }

    if (notFound.length > 0) {
      console.log('\n💡 Éditeurs disponibles dans la base de données (20 premiers):');
      const allEditors = await EditorModel.find({}).select('name editorId').limit(20);
      allEditors.forEach((ed, idx) => {
        console.log(`   ${idx + 1}. "${ed.name}" (ID: ${ed.editorId})`);
      });
    }

    if (editors.length === 0) {
      console.log('\n❌ Aucun éditeur trouvé. Arrêt du script.');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Pour chaque éditeur, trouver les solutions et calculer les snapshots
    console.log(`\n📊 Calcul des snapshots de bilan hosting...\n`);

    let totalSolutions = 0;
    let successfulSnapshots = 0;
    let failedSnapshots = 0;

    for (const editor of editors) {
      console.log(`\n📌 Traitement de l'éditeur: "${editor.name}"`);
      
      const solutions = await SolutionModel.find({ editorId: editor._id });
      console.log(`   ${solutions.length} solution(s) trouvée(s)`);

      for (const solution of solutions) {
        totalSolutions++;
        const success = await calculateSnapshotForSolution(
          solution._id,
          solution.name,
          'snapshot'
        );
        
        if (success) {
          successfulSnapshots++;
        } else {
          failedSnapshots++;
        }
      }
    }

    // Résumé
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(80));
    console.log(`   Éditeurs traités: ${editors.length}`);
    console.log(`   Solutions trouvées: ${totalSolutions}`);
    console.log(`   Snapshots créés avec succès: ${successfulSnapshots}`);
    console.log(`   Échecs: ${failedSnapshots}`);
    console.log('='.repeat(80) + '\n');

    // Fermeture de la connexion
    await mongoose.connection.close();
    console.log('✅ Déconnecté de MongoDB');
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Erreur lors du calcul des snapshots:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Exécution du script
calculateHostingSnapshots();

