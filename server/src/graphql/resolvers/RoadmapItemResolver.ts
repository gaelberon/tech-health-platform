// Fichier : /server/src/graphql/resolvers/RoadmapItemResolver.ts

// ------------------ IMPORTS ------------------

import { Document, Types } from 'mongoose'; 
// Import du modèle et de l'interface RoadmapItem (avec .js pour la résolution ESM)
import { RoadmapItemModel, IRoadmapItem } from '../../models/RoadmapItem.model.js'; 
import { Date } from 'mongoose'; // Assure le bon typage pour les dates

// ------------------ TYPES ENUMÉRÉS ------------------

// Types pour la relation polymorphe (lié à Solution ou Environment)
type ParentEntity = 'Solution' | 'Environment'; 

// Types d'éléments de la roadmap (basés sur le MCD) [2, 4]
type RoadmapType = 'refactor' | 'migration' | 'security' | 'feature' | 'compliance' | 'other'; 
type RoadmapStatus = 'Planned' | 'In Progress' | 'Completed' | 'Deferred';

// ------------------ INTERFACES DE TYPAGE ------------------

// 1. Interface pour les arguments de la Query listRoadmapItems
interface ListRoadmapItemsArgs {
    // ID de l'entité parente (SolutionId ou EnvId)
    parentId: string; 
    // Le type d'entité pour filtrer (obligatoire pour la relation polymorphe)
    linkedTo: ParentEntity; 
}

// 2. Interface pour l'Input de la Mutation createRoadmapItem
export interface CreateRoadmapItemInput {
    parentId: Types.ObjectId; 
    linkedTo: ParentEntity;
    title: string;
    type: RoadmapType;
    //target_date: Date; // Date cible (P3)
    // CORRECTION ICI : Utiliser 'string' car c'est le format d'entrée du type GQL (date)
    target_date: string;
    status: RoadmapStatus; 
    impact_estimate?: string; // Estimation d'impact (P3)
}

// 3. Interface pour l'Input de la Mutation updateRoadmapItem
export interface UpdateRoadmapItemInput {
    roadmapId: string; // PK pour identifier l'élément à modifier
    // Utilisation de Partial pour rendre les champs de mise à jour optionnels
    parentId?: Types.ObjectId;
    linkedTo?: ParentEntity;
    title?: string;
    type?: RoadmapType;
    target_date?: Date;
    status?: RoadmapStatus;
    impact_estimate?: string;
}


// ------------------ RESOLVER ------------------

const RoadmapItemResolver = {
    
    // Résolveurs de Requêtes Racines (Queries)
    Query: {
        
        // Query pour récupérer tous les éléments de roadmap liés à une Solution ou un Environnement
        listRoadmapItems: async (_: any, args: ListRoadmapItemsArgs) => { 
            // Utilisation de '_: any' pour satisfaire noImplicitAny
            const { parentId, linkedTo } = args;
            
            // Recherche basée sur la clé étrangère et le type d'entité parente
            return await RoadmapItemModel.find({ 
                parentId: parentId,
                linkedTo: linkedTo
            }).sort({ target_date: 1 }); // Tri par date cible
        },
    },

    // Résolveurs de Mutations (Mutations)
    Mutation: {
        
        // // Mutation pour ajouter un nouvel élément de roadmap (P3)
        // createRoadmapItem: async (_: any, { input }: { input: CreateRoadmapItemInput }) => {
        //     // Utilisation de '_: any' pour satisfaire noImplicitAny
            
        //     const newItem = await RoadmapItemModel.create(input);
        //     return newItem;
        
        // Mutation pour ajouter un nouvel élément de roadmap (P3)
        createRoadmapItem: async (_: any, { input }: { input: CreateRoadmapItemInput }) => {
            // Utilisation de '_: any' pour satisfaire noImplicitAny
            
            // 1. Nettoyage de l'Input (Critique pour le mode strict)
            const inputToSave: any = {};
            
            // Copie des champs définis (ignorer les undefined)
            for (const key in input) {
                if (input[key as keyof CreateRoadmapItemInput] !== undefined) {
                    inputToSave[key] = input[key as keyof CreateRoadmapItemInput];
                }
            }
            
            // 2. Création du document avec l'objet nettoyé
            const newItem = await RoadmapItemModel.create(inputToSave); // <-- Utiliser inputToSave
            return newItem;
        },

        // Mutation pour modifier un élément de roadmap existant (changement de statut, de date)
        updateRoadmapItem: async (_: any, { input }: { input: UpdateRoadmapItemInput }) => {
            
            const { roadmapId, ...updateFields } = input;
            
            // Met à jour l'élément basé sur son ID unique
            const updatedItem = await RoadmapItemModel.findOneAndUpdate(
                { roadmapId: roadmapId },
                { $set: updateFields },
                { new: true }
            );

            // Gérer le cas où l'élément n'est pas trouvé
            if (!updatedItem) {
                throw new Error(`Roadmap Item avec l'ID ${roadmapId} non trouvé.`);
            }
            
            return updatedItem;
        }
    },
    
    // Résolveurs de CHAMP (Field Resolvers)
    // Non requis ici.
};

export default RoadmapItemResolver;