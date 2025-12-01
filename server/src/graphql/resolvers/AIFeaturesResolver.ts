// Fichier : /server/src/graphql/resolvers/AIFeaturesResolver.ts

// ------------------ IMPORTS ------------------

import { Document, Types } from 'mongoose'; // [4]
// Import du modèle et de l'interface AIFeatures (avec .js pour la résolution ESM)
import { AIFeaturesModel, IAIFeatures } from '../../models/AIFeatures.model.js'; 

// ------------------ INTERFACES DE TYPAGE ------------------

// 1. Interface pour les arguments de la Query listAIFeaturesForSolution
interface GetAIFeaturesArgs {
    solutionId: string; // Identifiant de la Solution pour filtrer [2]
}

// 2. Interface pour l'Input de la Mutation createAIFeature
// Cette structure est basée sur les champs de l'entité AIFeatures (DD Section 10) [2, 5]
export interface CreateAIFeatureInput {
    // La solutionId est nécessaire pour la clé étrangère
    solutionId: Types.ObjectId; 
    
    // Champs DD Section 10 [2, 5]
    technical_type: string; // Services externes ou modèles propres entraînés [2, 5]
    quality_validation_method?: string; // Comment la qualité a été mesurée/validée [2, 5]
    continuous_improvement: boolean; // Existence de workflows pour l'amélioration continue [2, 5]
}

// ------------------ RESOLVER ------------------

const AIFeaturesResolver = {
    
    // Résolveurs de Requêtes Racines (Queries)
    Query: {
        
        // Query pour lister toutes les fonctionnalités IA attachées à une solution
        listAIFeaturesForSolution: async (_: any, args: GetAIFeaturesArgs) => { 
            // Nous utilisons '_: any' pour satisfaire noImplicitAny [Previous Interaction]
            const { solutionId } = args;
            
            // Relation 0..N vers Solution [2]
            return await AIFeaturesModel.find({ solutionId: solutionId });
        },
    },

    // Résolveurs de Mutations (Mutations)
    Mutation: {
        
        // Mutation pour créer ou mettre à jour une nouvelle fonctionnalité IA (DD Section 10)
        createAIFeature: async (_: any, { input }: { input: CreateAIFeatureInput }) => {
            // Nous utilisons '_: any' pour satisfaire noImplicitAny [Previous Interaction]
            
            // 1. Nettoyage : Créer un objet ne contenant pas de clés 'undefined'
            const inputToSave: any = {
                solutionId: input.solutionId,
                technical_type: input.technical_type,
                quality_validation_method: input.quality_validation_method,
                continuous_improvement: input.continuous_improvement,
            };
            
            // Copie des champs définis
            for (const key in input) {
                if (input[key as keyof CreateAIFeatureInput] !== undefined) {
                    inputToSave[key] = input[key as keyof CreateAIFeatureInput];
                }
            }

            // Le modèle crée automatiquement un aiId [2]
            const newFeature = await AIFeaturesModel.create(inputToSave);

            return newFeature;
        },
        
        // NOTE: Une mutation pour "updateAIFeature" serait nécessaire si nous voulions 
        // mettre à jour une IA spécifique en utilisant son 'aiId' comme identifiant unique.
    },
    
    // Résolveurs de CHAMP (Field Resolvers)
    // Non requis ici car AIFeatures est généralement un nœud terminal (feuille) 
    // dans le graphe de données de la DD technique.
};

export default AIFeaturesResolver;