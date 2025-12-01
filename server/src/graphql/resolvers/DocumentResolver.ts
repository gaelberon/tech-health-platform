// Fichier : /server/src/graphql/resolvers/DocumentResolver.ts

// ------------------ IMPORTS ------------------

import { Document, Types } from 'mongoose'; 
// Import du modèle et de l'interface Document (avec .js pour la résolution ESM)
import { DocumentModel, IDocument } from '../../models/Document.model.js'; 

// ------------------ TYPES ENUMÉRÉS ------------------

// Types pour la relation polymorphe (basés sur linkedTo) [3]
type ParentEntity = 'Editor' | 'Solution' | 'Environment'; 

// Types de documents (basés sur type) [3]
type DocumentType = 'diagram' | 'pentest' | 'contract' | 'other';

// ------------------ INTERFACES DE TYPAGE ------------------

// 1. Interface pour les arguments de la Query listDocumentsByParent
interface ListDocumentsArgs {
    // L'ID de l'entité parente (EditorId, SolutionId, ou EnvId)
    parentId: string; 
    // Le type d'entité pour filtrer la collection (P4) [3]
    linkedTo: ParentEntity; 
}

// 2. Interface pour l'Input de la Mutation createDocument
export interface CreateDocumentInput {
    // Clé étrangère vers l'entité parente
    parentId: Types.ObjectId; 
    linkedTo: ParentEntity;
    
    // Type du document (diagram, pentest, contract, etc.) (P4) [3]
    type: DocumentType;
    
    // Localisation du fichier (URL ou hash de stockage S3/GridFS) (P4) [3]
    url_or_hash: string; 
    
    // upload_date n'est pas nécessaire ici si Mongoose utilise timestamps: true [3]
}

// ------------------ RESOLVER ------------------

const DocumentResolver = {
    
    // Résolveurs de Requêtes Racines (Queries)
    Query: {
        
        // Query pour récupérer tous les documents attachés à une entité parente
        listDocumentsByParent: async (_: any, args: ListDocumentsArgs) => { 
            // Utilisation de '_: any' pour satisfaire noImplicitAny
            const { parentId, linkedTo } = args;
            
            // Recherche basée sur la clé étrangère et le type d'entité
            return await DocumentModel.find({ 
                parentId: parentId,
                linkedTo: linkedTo
            });
        },
    },

    // Résolveurs de Mutations (Mutations)
    Mutation: {
        
        // Mutation pour créer un nouvel enregistrement de document (P4)
        createDocument: async (_: any, { input }: { input: CreateDocumentInput }) => {
            // Utilisation de '_: any' pour satisfaire noImplicitAny
            
            // Validation simple que l'URL/hash est fourni
            if (!input.url_or_hash) {
                throw new Error("L'URL ou le hash du document est requis.");
            }

            // Création du document
            const newDocument = await DocumentModel.create({
                parentId: input.parentId,
                linkedTo: input.linkedTo,
                type: input.type,
                url_or_hash: input.url_or_hash,
                // upload_date est géré par Mongoose timestamps si configuré
            });
            
            return newDocument;
        },
    },
    
    // Résolveurs de CHAMP (Field Resolvers)
    // Non requis ici. Si Document référençait directement Solution ou Editor, 
    // ces liens seraient résolus dans les Resolvers Solution ou Editor.
};

export default DocumentResolver;