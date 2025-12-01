// Fichier : /server/src/graphql/resolvers/SolutionResolver.ts

// ------------------ IMPORTS ------------------

import { Document, Types } from 'mongoose'; 
// Assurez-vous que Types et, idéalement, FilterQuery sont importés
// Import des modèles et interfaces (avec .js pour la résolution ESM)
import { SolutionModel, ISolution } from '../../models/Solution.model.js'; // P1 [2, 3]
import { DevelopmentMetricsModel, IDevelopmentMetrics } from '../../models/DevelopmentMetrics.model.js'; // 1:1 [3, 6]
import { CodeBaseModel, ICodeBase } from '../../models/CodeBase.model.js'; // 1:1 [3, 7]
import { EnvironmentModel, IEnvironment } from '../../models/Environment.model.js'; // 1:N [8]
import { AIFeaturesModel, IAIFeatures } from '../../models/AIFeatures.model.js'; // 0..N [9]
import { RoadmapItemModel, IRoadmapItem } from '../../models/RoadmapItem.model.js'; // 0..N (Polymorphe) [10]
import { DocumentModel, IDocument } from '../../models/Document.model.js'; // 0..N (Polymorphe) [11]
import { ScoringSnapshotModel, IScoringSnapshot } from '../../models/ScoringSnapshot.model.js'; // 0..N [11]

// ------------------ INTERFACES DE TYPAGE ------------------

// 1. Interface pour les arguments de la Query getSolution
interface GetSolutionArgs {
    solutionId: string; // Clé primaire (PK) [12]
}

// 2. Interface pour l'Input de la Mutation updateSolution
// Basée sur les champs principaux de Solution (DD Sections 1d, 4a, 4b)
export interface UpdateSolutionInput {
    solutionId: string;
    
    name?: string;
    description?: string; // P2
    main_use_case?: string; // P1
    type?: 'SaaS' | 'OnPrem' | 'Hybrid' | 'ClientHeavy'; // P1
    product_criticality?: 'Low' | 'Medium' | 'High' | 'Critical'; // P1
    
    // Champs DD spécifiques
    api_robustness?: string; // Robustesse des APIs [4]
    api_documentation_quality?: string; // Qualité de la documentation des interfaces [4]
    ip_ownership_clear?: boolean; // Droits de propriété clairs [4]
    licensing_model?: string; // Modèles de licence [4]
    license_compliance_assured?: boolean; // Conformité des licences tiers [4]
}

// 3. Interface pour l'Input de la Mutation updateDevelopmentMetrics (redéfinie localement ou importée)
// Nous utilisons la définition établie dans la conversation précédente [13]
export interface UpdateDevelopmentMetricsInput {
    solutionId: Types.ObjectId;
    sdlc_process?: string;
    devops_automation_level?: string;
    planned_vs_unplanned_ratio?: number;
    lead_time_for_changes_days?: number;
    mttr_hours?: number;
    internal_vs_external_bug_ratio?: number;
}


// ------------------ RESOLVER ------------------

const SolutionResolver = {
    
    // Résolveurs de Requêtes Racines (Queries)
    Query: {
        
        // Query pour récupérer une Solution par son ID (Vue DD Solution)
        getSolution: async (_: any, args: GetSolutionArgs, ctx: any) => { 
            // Utilisation de '_: any' pour satisfaire noImplicitAny [14]
            const { solutionId } = args;
            const filter: any = { solutionId: solutionId };

            // RBAC minimal : si l'utilisateur est EntityDirector ou Editor,
            // on restreint aux solutions de son éditeur associé.
            if (ctx.user && (ctx.user.role === 'EntityDirector' || ctx.user.role === 'Editor')) {
                filter.editorId = ctx.user.associatedEditorId;
            }
            return await SolutionModel.findOne(filter);
        },
    },

    // Résolveurs de Mutations (Mutations)
    Mutation: {
        
        // Mutation 1: Créer ou mettre à jour les données principales de la Solution
        updateSolution: async (_: any, { input }: { input: UpdateSolutionInput }, ctx: any) => {
            const { assertAuthorized } = await import('../authorization.js');
            await assertAuthorized(ctx, 'updateSolution');

            // Utilisation de '_: any' pour satisfaire noImplicitAny
            const { solutionId, ...updateFields } = input;
            
            // Mise à jour des informations P1 (Critique) et DD (PI, API)
            const updatedSolution = await SolutionModel.findOneAndUpdate(
                { solutionId: solutionId },
                { $set: updateFields },
                { new: true, upsert: true } // Crée si n'existe pas, retourne la nouvelle version
            );
            
            return updatedSolution;
        },

        // Mutation 2: Mise à jour des DevelopmentMetrics (déjà défini précédemment) [15]
        updateDevelopmentMetrics: async (_: any, { input }: { input: UpdateDevelopmentMetricsInput }) => {
            
            const updatedMetrics = await DevelopmentMetricsModel.findOneAndUpdate(
                { solutionId: input.solutionId },
                { $set: input },
                { new: true, upsert: true }
            );

            // Le Scoring Engine est notifié après la mise à jour des métriques (P3) [16]
            // scoringService.calculateScore(input.solutionId);
            
            return updatedMetrics;
        }
    },
    
    // Résolveurs de CHAMP (Field Resolvers) : Lient la Solution aux autres entités
    Solution: {
        
        // Lien 1:1 vers DevelopmentMetrics (P3)
        developmentMetrics: async (parent: ISolution & Document) => {
            // Le parent est l'objet Solution complet [17]
            return await DevelopmentMetricsModel.findOne({ solutionId: parent._id });
        },

        // Lien 1:1 vers Codebase (P2)
        codebase: async (parent: ISolution & Document) => {
            // La Codebase est liée à la Solution (DD Section 1) [7, 17]
            return await CodeBaseModel.findOne({ solutionId: parent._id });
        },

        // Lien 0..N vers Environment (P1)
        environments: async (parent: ISolution & Document) => {
            
            // CORRECTION DÉFINITIVE :
            // Forcer le cast de l'objet de filtre à 'any' pour contourner le typage strict de Mongoose
            
            return await EnvironmentModel.find({
                // On utilise la conversion en chaîne, car Mongoose sait la gérer à l'exécution.
                solutionId: parent._id.toString()
            } as any);
        },
        
        // Lien 0..N vers AIFeatures (P3)
        aiFeatures: async (parent: ISolution & Document) => {
            // Récupère toutes les fonctionnalités IA intégrées à la solution (DD Section 10) [9]
            return await AIFeaturesModel.find({ solutionId: parent._id });
        },

        // Lien 0..N vers RoadmapItem (Polymorphe, P3)
        roadmapItems: async (parent: ISolution & Document) => {
            // Filtre par parentId et assure que linkedTo est 'Solution'
            return await RoadmapItemModel.find({ 
                parentId: parent._id, 
                linkedTo: 'Solution' 
            }).sort({ target_date: 1 });
        },
        
        // Lien 0..N vers Document (Polymorphe, P4)
        documents: async (parent: ISolution & Document) => {
            // Filtre par parentId et assure que linkedTo est 'Solution' [11, 18]
            return await DocumentModel.find({ 
                parentId: parent._id, 
                linkedTo: 'Solution' 
            });
        },
        
        // Lien 0..N vers ScoringSnapshot (P1)
        scoringSnapshots: async (parent: ISolution & Document) => {
            // L'historique des scores est lié à la Solution [11, 18]
            return await ScoringSnapshotModel.find({ solutionId: parent._id }).sort({ date: -1 });
        }
    }
};

export default SolutionResolver;