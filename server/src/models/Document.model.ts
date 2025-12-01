import { Schema, model, Document, Types } from 'mongoose';

// Types d'entités parentes possibles
type LinkedEntityType = 'Editor' | 'Solution' | 'Environment';

// Types de documents supportés (selon la priorisation P4)
type DocumentType = 'diagram' | 'pentest' | 'contract' | 'audit' | 'report' | 'other';

// 1. Définition de l'Interface TypeScript pour l'entité
export interface IDocument extends Document {
    docId: string; // Identifiant unique (PK) [2]
    
    // Référence Dynamique :
    parentId: Types.ObjectId; // L'ID réel du document parent (Editor, Solution, ou Environment)
    linkedTo: LinkedEntityType; // Le type d'entité parent (pour la lookup) [2]
    
    type: DocumentType; // Type de document (diagramme, pentest, contrat, etc.) [2]
    url_or_hash: string; // Localisation du fichier (URL S3, Hash, ou chemin GridFS) [2]
    upload_date: Date; // Date de l'ajout [2]
}

// 2. Définition du Schéma Mongoose
const DocumentSchema = new Schema<IDocument>({
    
    // Clé Primaire
    docId: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    
    // Champ utilisé par Mongoose pour le référencement dynamique
    linkedTo: { 
        type: String, 
        required: true, 
        enum: ['Editor', 'Solution', 'Environment'], // Entité parente [2]
        description: "Entité parente (Editor/Solution/Environment)" 
    },

    // Champ pour stocker l'ID de la référence réelle (FK)
    parentId: { 
        type: Schema.Types.ObjectId, 
        required: true 
    },
    
    // Type du document
    type: { 
        type: String, 
        required: true,
        enum: ['diagram', 'pentest', 'contract', 'audit', 'report', 'other'], // Types documentés [2]
        description: "Type de document (diagram/pentest/contract, etc.)" 
    },
    
    // Localisation ou identifiant du fichier
    url_or_hash: { 
        type: String, 
        required: true 
    },
    
    // Date d'upload
    upload_date: { 
        type: Date, 
        required: true 
    }
}, {
    timestamps: true // Ajoute createdAt et updatedAt
});

// 3. Exportation du Modèle
export const DocumentModel = model<IDocument>('Document', DocumentSchema, 'documents');