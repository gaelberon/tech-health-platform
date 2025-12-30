import { Schema, model, Document, Types } from 'mongoose';

// L'entité AIFeatures est liée à une Solution (0..N) [2]
// Pour Mongoose, on utilise Types.ObjectId pour la référence.

// 1. Définition de l'Interface TypeScript pour l'entité
export interface IAIFeatures extends Document {
    aiId: string; // Identifiant unique (PK dans le MCD) [2]
    solutionId: Types.ObjectId; // Lien vers l'entité Solution (FK) [2]
    
    // Champs pour la Due Diligence IA (10)
    technical_type: string; // Services externes intégrés ou modèles propres entraînés [2, 3]
    quality_validation_method?: string | undefined | null; // Comment la qualité a été mesurée/validée [2, 3]
    continuous_improvement: boolean; // Existence de workflows pour l'amélioration continue [2, 3]
}

// 2. Définition du Schéma Mongoose
const AIFeaturesSchema = new Schema<IAIFeatures>({
    
    // Identifiant unique
    aiId: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    
    // Clé Étrangère vers Solution (relation 0..N) [2]
    solutionId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Solution', // 'Solution' doit correspondre au nom du modèle Solution
        required: true 
    },

    // Type technique de l'IA (Texte pour flexibilité ou Enum si l'on veut restreindre les choix)
    technical_type: { 
        type: String, 
        required: true,
        // Exemples d'implémentation vus dans les sources: Chatbot conversationnel branché sur chatgpt (Majelis), Module OCR (Inedee) [1]
    },
    
    // Méthode de validation de la qualité (texte libre pour détailler la validation)
    quality_validation_method: { 
        type: String, 
        required: false 
    },
    
    // Workflow d'amélioration continue (Boolean)
    continuous_improvement: { 
        type: Boolean, 
        required: true 
    }
}, {
    timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

// 3. Exportation du Modèle
export const AIFeaturesModel = model<IAIFeatures>('AIFeatures', AIFeaturesSchema, 'aifeatures');