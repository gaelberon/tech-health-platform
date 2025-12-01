// Fichier : /server/src/graphql/resolvers/DevelopmentTeamResolver.ts

// ------------------ IMPORTS ------------------

import { Document, Types } from 'mongoose'; 
// Import du modèle et de l'interface DevelopmentTeam (avec .js pour la résolution ESM)
import { DevelopmentTeamModel, IDevelopmentTeam } from '../../models/DevelopmentTeam.model.js'; 
// L'entité Editor est implicitement nécessaire pour la FK, mais pas besoin du modèle entier ici

// ------------------ INTERFACES DE TYPAGE ------------------

// 1. Interface pour les arguments de la Query getDevelopmentTeamForEditor
interface GetDevelopmentTeamArgs {
    // editorId est nécessaire car DevelopmentTeam est lié à Editor (1:1) [2]
    editorId: string; 
}

// 2. Interface pour l'Input de la Mutation updateDevelopmentTeam
// Basée sur les champs de la Due Diligence Section 6b [2, 3]
export interface UpdateDevelopmentTeamInput {
    // Clé étrangère nécessaire pour identifier l'enregistrement à mettre à jour/créer
    editorId: Types.ObjectId; 
    
    // L'équipe est-elle suffisante pour la roadmap prévue (DD Section 6b)
    team_size_adequate?: string; 
    
    // Dépendances envers des personnes clés dans l'équipe (DD Section 6b)
    key_person_dependency?: string; 
}

// ------------------ RESOLVER ------------------

const DevelopmentTeamResolver = {
    
    // Résolveurs de Requêtes Racines (Queries)
    Query: {
        
        // Query pour récupérer le profil de l'équipe de développement d'un éditeur
        getDevelopmentTeamForEditor: async (_: any, args: GetDevelopmentTeamArgs) => { 
            // Utilisation de '_: any' pour satisfaire noImplicitAny
            const { editorId } = args;
            
            // Relation 1:1 vers Editor
            return await DevelopmentTeamModel.findOne({ editorId: editorId });
        },
    },

    // Résolveurs de Mutations (Mutations)
    Mutation: {
        
        // Mutation pour créer ou mettre à jour le profil de l'équipe de développement
        updateDevelopmentTeam: async (_: any, { input }: { input: UpdateDevelopmentTeamInput }) => {
            // Utilisation de '_: any' pour satisfaire noImplicitAny
            
            // La mise à jour est cruciale pour évaluer les risques humains et la faisabilité de la roadmap
            const updatedTeam = await DevelopmentTeamModel.findOneAndUpdate(
                { editorId: input.editorId },
                { $set: input },
                { new: true, upsert: true } // Crée si n'existe pas, retourne la nouvelle version
            );
            
            return updatedTeam;
        },
    },
    
    // Résolveurs de CHAMP (Field Resolvers)
    // Non requis ici, car DevelopmentTeam est un nœud 'feuille' de Editor.
};

export default DevelopmentTeamResolver;