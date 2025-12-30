// Fichier : /server/src/graphql/resolvers/DevelopmentMetricsResolver.ts

// ------------------ IMPORTS ------------------

import { Document, Types } from 'mongoose'; 
// Import du modèle et de l'interface DevelopmentMetrics (avec .js pour la résolution ESM)
import { DevelopmentMetricsModel, IDevelopmentMetrics } from '../../models/DevelopmentMetrics.model.js';
import { SolutionModel } from '../../models/Solution.model.js';
import { validateLookupValue } from '../../utils/validateLookupValue.js';

// ------------------ INTERFACES DE TYPAGE ------------------

// 1. Interface pour les arguments de la Query getDevelopmentMetrics
interface GetDevelopmentMetricsArgs {
    // solutionId est nécessaire car DevelopmentMetrics est lié à Solution (1:1)
    solutionId: string; 
}

// 2. Interface pour l'Input de la Mutation updateDevelopmentMetrics
// NOTE : Cette interface a déjà été définie dans SolutionResolver.ts. 
// Idéalement, elle devrait être dans /common/types, mais pour l'instant, 
// nous la redéfinissons ou nous l'importons si elle a été exportée du SolutionResolver.

// Pour la propreté, nous la redéfinissons ici en tant qu'interface locale :
interface UpdateDevelopmentMetricsInput {
    // Clé étrangère nécessaire pour identifier l'enregistrement à mettre à jour/créer [1, 5]
    solutionId: Types.ObjectId; 
    
    // Champs de mise à jour (P3 / Calculés) [1]
    sdlc_process?: string; // Processus de développement logiciel (Scrum, Kanban, Cascade) [1, 3]
    devops_automation_level?: string; // Degré d'automatisation des pipelines CI/CD [1, 2]
    planned_vs_unplanned_ratio?: number; // Rapport travail planifié/non planifié (bugs vs features) [1, 3]
    lead_time_for_changes_days?: number; // Délai de mise en œuvre des changements (en jours) [1, 3]
    mttr_hours?: number; // Mean Time to Restore (MTTR) [1, 8]
    internal_vs_external_bug_ratio?: number; // Proportion des bugs signalés en externe vs. interne [1, 4]
}

// ------------------ RESOLVER ------------------

const DevelopmentMetricsResolver = {
    
    // Résolveurs de Requêtes Racines (Queries)
    // (Désactivé car la Query getDevelopmentMetrics n'est pas définie dans le schéma GraphQL racine)
    Query: {},

    // Résolveurs de Mutations (Mutations)
    Mutation: {
        
        // Mutation pour créer ou mettre à jour les métriques de développement
        updateDevelopmentMetrics: async (_: any, { input }: { input: UpdateDevelopmentMetricsInput }) => {
            // Utilisation de '_: any' pour satisfaire noImplicitAny dans la Root Mutation [7]

            // Validation contre les Value Lists
            if (input.sdlc_process) {
                const isValid = await validateLookupValue('SDLC_PROCESS', input.sdlc_process);
                if (!isValid) {
                    throw new Error(`Le processus SDLC "${input.sdlc_process}" n'est pas valide. Veuillez utiliser une valeur de la liste "SDLC_PROCESS".`);
                }
            }
            if (input.devops_automation_level) {
                const isValid = await validateLookupValue('DEVOPS_AUTOMATION_LEVEL', input.devops_automation_level);
                if (!isValid) {
                    throw new Error(`Le niveau d'automatisation DevOps "${input.devops_automation_level}" n'est pas valide. Veuillez utiliser une valeur de la liste "DEVOPS_AUTOMATION_LEVEL".`);
                }
            }

            // Convertir solutionId en ObjectId si c'est une string
            let solutionIdObjectId: Types.ObjectId;
            if (typeof input.solutionId === 'string') {
                if (Types.ObjectId.isValid(input.solutionId)) {
                    // Si c'est déjà un ObjectId valide en string, le convertir
                    solutionIdObjectId = new Types.ObjectId(input.solutionId);
                } else {
                    // Sinon, chercher la solution par son solutionId (string externe)
                    const solution = await SolutionModel.findOne({ solutionId: input.solutionId });
                    if (!solution) {
                        throw new Error(`Solution avec solutionId "${input.solutionId}" non trouvée`);
                    }
                    solutionIdObjectId = solution._id;
                }
            } else {
                solutionIdObjectId = input.solutionId;
            }

            // Vérifier si des métriques existent déjà
            const existingMetrics = await DevelopmentMetricsModel.findOne({ solutionId: solutionIdObjectId });
            
            const updateData: any = {
                ...input,
                solutionId: solutionIdObjectId,
            };

            // Générer metricsId si c'est une nouvelle création
            if (!existingMetrics) {
                const metricsCount = await DevelopmentMetricsModel.countDocuments();
                updateData.metricsId = `metrics-${String(metricsCount + 1).padStart(4, '0')}`;
            }

            // La logique de mise à jour est critique car elle peut déclencher un nouveau scoring [9, 10]
            const updatedMetrics = await DevelopmentMetricsModel.findOneAndUpdate(
                { solutionId: solutionIdObjectId },
                { $set: updateData },
                { new: true, upsert: true } // Crée si n'existe pas, retourne la nouvelle version [10]
            );

            // NOTE : C'est ici, après la mise à jour, que le Scoring Engine doit être notifié 
            // pour recalculer le score global et stocker un nouveau ScoringSnapshot (P1) [7, 9].
            // (Exemple : scoringService.calculateScore(input.solutionId);)
            
            return updatedMetrics;
        },
    },
    
    // Résolveurs de CHAMP (Field Resolvers)
    // Non requis ici, car DevelopmentMetrics est un nœud 'feuille' de Solution.
};

export default DevelopmentMetricsResolver;