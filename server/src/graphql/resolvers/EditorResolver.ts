// Fichier : /server/src/graphql/resolvers/EditorResolver.ts

// ------------------ IMPORTS ------------------

import { Document, Types } from 'mongoose'; 
// Import des modèles et interfaces (avec .js pour la résolution ESM)
import { EditorModel, IEditor } from '../../models/Editor.model.js'; 
import { SolutionModel, ISolution } from '../../models/Solution.model.js';
import { DevelopmentTeamModel, IDevelopmentTeam } from '../../models/DevelopmentTeam.model.js';
import { DocumentModel, IDocument } from '../../models/Document.model.js';
// NOTE : DocumentModel est utilisé car les documents peuvent être attachés à l'Editor [1, 4]


// ------------------ INTERFACES DE TYPAGE ------------------

// Type de l'objet imbriqué contracts_for_review [3]
interface ContractForReviewInput {
    type: string;
    summary: string;
}

// 1. Interface pour les arguments de la Query getEditor
interface GetEditorArgs {
    editorId: string; // ID de l'éditeur (PK)
}

// 2. Interface pour l'Input de la Mutation create/updateEditor
export interface UpdateEditorInput {
    // editorId est requis pour la mise à jour, optionnel pour la création (s'il n'est pas fourni par l'API)
    editorId?: string; 
    
    name?: string;
    country?: string;
    size?: string; // Micro/SME/Mid/Enterprise [2]
    business_criticality?: string; // P1 [2]

    // Champs DD (Section 9a, 4c) [3]
    internal_it_systems?: string[]; 
    it_security_strategy?: string; 
    contracts_for_review?: ContractForReviewInput[]; 
}

// ------------------ RESOLVER ------------------

const EditorResolver = {
    
    // Résolveurs de Requêtes Racines (Queries)
    Query: {
        
        // Query 1: Lister tous les éditeurs (Vue Portfolio)
        listEditors: async (_: any) => { 
            // Utilisation de '_: any' pour satisfaire noImplicitAny. Pas d'arguments nécessaires.
            return await EditorModel.find({});
        },

        // Query 2: Récupérer un éditeur par son ID
        getEditor: async (_: any, args: GetEditorArgs) => { 
            const { editorId } = args;
            // editorId est P1 [2]
            return await EditorModel.findOne({ editorId: editorId });
        },
    },

    // Résolveurs de Mutations (Mutations)
    Mutation: {
        
        // Mutation pour créer ou mettre à jour les données de l'éditeur
        updateEditor: async (_: any, { input }: { input: UpdateEditorInput }) => {
            // Utilisation de '_: any' pour satisfaire noImplicitAny
            
            if (!input.editorId) {
                // Création d'un nouvel éditeur (si editorId n'est pas fourni dans l'input)
                 return await EditorModel.create(input);
            }

            // Mise à jour des informations DD et générales
            const updatedEditor = await EditorModel.findOneAndUpdate(
                { editorId: input.editorId },
                { $set: input },
                { new: true, upsert: true } // Crée ou met à jour
            );
            
            return updatedEditor;
        },
    },
    
    // Résolveurs de CHAMP (Field Resolvers) : Pour lier les entités 
    // qui ne sont pas *embedded* (Solution, DevelopmentTeam, Document)
    Editor: {
        
        // Relation 1:N vers Solution [1]
        solutions: async (parent: IEditor & Document) => {
            // Utilise l'ID Mongoose interne (_id) ou editorId pour la jointure
            return await SolutionModel.find({ editorId: parent._id }); 
        },

        // Relation 1:1 vers DevelopmentTeam [5]
        developmentTeam: async (parent: IEditor & Document) => {
            // L'équipe de développement est attachée à l'éditeur (DD Section 6b)
            return await DevelopmentTeamModel.findOne({ editorId: parent._id });
        },
        
        // Relation 0..N vers Document [1, 4]
        documents: async (parent: IEditor & Document) => {
            // Filtre par parentId et s'assure que linkedTo est 'Editor'
            return await DocumentModel.find({ 
                parentId: parent._id, 
                linkedTo: 'Editor' 
            });
        }
    }
};

export default EditorResolver;