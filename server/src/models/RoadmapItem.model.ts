import { Schema, model, Document, Types } from 'mongoose';

// Types Enum possibles (selon la priorisation P3)
type RoadmapType = 'refactor' | 'migration' | 'security' | 'feature' | 'compliance' | 'other';
type RoadmapStatus = 'Planned' | 'In Progress' | 'Completed' | 'Deferred';

// 1. Définition de l'Interface TypeScript pour l'entité RoadmapItem
export interface IRoadmapItem extends Document {
    roadmapId: string; // Identifiant unique (PK)
    
    // Référence Dynamique : Peut être lié à un Environment ou une Solution
    parentId: Types.ObjectId; // L'ID réel du document parent (Solution ou Environment)
    linkedTo: 'Solution' | 'Environment'; // Le type d'entité parent
    
    // Champs P3
    title: string; // Titre de l'élément de roadmap
    type: RoadmapType; // Type d'action (refactor, migration, security, feature, compliance)
    target_date: Date; // Date cible de réalisation (P3)
    status: RoadmapStatus; // Statut actuel
    impact_estimate: string; // Estimation de l'impact (P3)
}

// 2. Définition du Schéma Mongoose
const RoadmapItemSchema = new Schema<IRoadmapItem>({
    
    // Clé Primaire (P3)
    roadmapId: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    
    // Référence Dynamique (similaire à Document.model.ts) [2-4]
    linkedTo: { 
        type: String, 
        required: true, 
        enum: ['Solution', 'Environment'],
        description: "Entité parente (Solution ou Environment)" 
    },

    parentId: { 
        type: Schema.Types.ObjectId, 
        required: true 
    },
    
    // Titre et Description (P3)
    title: { 
        type: String, 
        required: true,
        description: "Titre de l'élément (ex: Redesign de tout le front)" 
    },
    
    // Type d'action (P3)
    type: { 
        type: String, 
        required: true,
        enum: ['refactor', 'migration', 'security', 'feature', 'compliance', 'other'] 
    },
    
    // Date cible (P3)
    target_date: { 
        type: Date, 
        required: false 
    },
    
    // Statut
    status: {
        type: String,
        enum: ['Planned', 'In Progress', 'Completed', 'Deferred'],
        default: 'Planned',
        required: true
    },
    
    // Estimation de l'impact (P3)
    impact_estimate: { 
        type: String, 
        required: false,
        description: "Estimation de l'impact (faible, moyen, critique) ou texte descriptif"
    }
}, {
    timestamps: true // Ajoute createdAt et updatedAt
});

// 3. Exportation du Modèle
export const RoadmapItemModel = model<IRoadmapItem>('RoadmapItem', RoadmapItemSchema, 'roadmapitems');