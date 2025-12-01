// Fichier : /server/src/graphql/resolvers/EntityCostResolver.ts

// ------------------ IMPORTS ------------------

import { Document, Types } from 'mongoose'; 
// Import du modèle et de l'interface EntityCost (avec .js pour la résolution ESM)
import { EntityCostModel, IEntityCost } from '../../models/EntityCost.model.js'; 

// ------------------ INTERFACES DE TYPAGE ------------------

// 1. Interface pour les arguments de la Query getEntityCostForEnvironment
interface GetEntityCostArgs {
    // envId est nécessaire car EntityCost est lié à Environment (1:1)
    envId: string; 
}

// 2. Interface pour l'Input de la Mutation updateEntityCost
// Basée sur les champs de la Due Diligence Section 8 [2, 3]
export interface UpdateEntityCostInput {
    // Clé étrangère nécessaire pour identifier l'enregistrement à mettre à jour/créer
    envId: Types.ObjectId; 
    
    // Coûts mensuels P4 [1]
    hosting_monthly?: number; 
    licenses_monthly?: number; 
    ops_hours_monthly_equiv?: number; 
    comments?: string;
    
    // Champs DD spécifiques [2, 3]
    hidden_costs?: string; // Coûts cachés ou obligations contractuelles futures (DD Section 8a)
    cost_evolution_factors?: string; // Facteurs d'évolution des coûts (tokens IA, workflows) (DD Section 8a)
    modernization_investment_needs?: string; // Investissements nécessaires pour la modernisation/croissance (DD Section 8b)
}

// ------------------ RESOLVER ------------------

const EntityCostResolver = {
    
    // Résolveurs de Requêtes Racines (Queries)
    Query: {
        
        // Query pour récupérer le profil de coûts d'un environnement spécifique
        getEntityCostForEnvironment: async (_: any, args: GetEntityCostArgs) => { 
            // Utilisation de '_: any' pour satisfaire noImplicitAny
            const { envId } = args;
            
            // Relation 1:1 vers Environment
            return await EntityCostModel.findOne({ envId: envId });
        },
    },

    // Résolveurs de Mutations (Mutations)
    Mutation: {
        
        // Mutation pour créer ou mettre à jour le profil de coûts (P4)
        updateEntityCost: async (_: any, { input }: { input: UpdateEntityCostInput }, ctx: any) => {
            const { assertAuthorized } = await import('../authorization.js');
            await assertAuthorized(ctx, 'updateEntityCost');

            // Les coûts d'hébergement (P4) sont un point sensible (OVH est cher pour Inedee, 8k Euros/mois) [5]
            const updatedCosts = await EntityCostModel.findOneAndUpdate(
                { envId: input.envId },
                { $set: input },
                { new: true, upsert: true } // Crée si n'existe pas, retourne la nouvelle version
            );
            
            return updatedCosts;
        },
    },
    
    // Résolveurs de CHAMP (Field Resolvers)
    // Non requis ici, car EntityCost est un nœud 'feuille' de Environment.
};

export default EntityCostResolver;