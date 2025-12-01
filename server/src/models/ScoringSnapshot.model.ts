import { Schema, model, Document, Types } from 'mongoose';

// Types Enum
type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'; // Définition des niveaux de risque [1, 6]

// Structure des scores par catégorie (pour l'objet imbriqué 'scores')
interface ICategoricalScores {
    security: number; // 30% [4]
    resilience: number; // 20% [4]
    observability: number; // 15% [4]
    architecture: number; // 15% [4]
    compliance: number; // 20% [4]
}

// 1. Définition de l'Interface TypeScript pour l'entité ScoringSnapshot
export interface IScoringSnapshot extends Document {
    scoreId: string; // Identifiant unique (PK) [1]
    solutionId: Types.ObjectId; // Lien vers la Solution (FK) [1]
    envId: Types.ObjectId; // Lien vers l'Environnement (FK, car le scoring est souvent lié à l'environnement Prod) [7, 8]
    
    date: Date; // Date du snapshot (P1) [1]
    
    scores: ICategoricalScores; // Scores par catégorie [1]
    global_score: number; // Score global normalisé (0-100) (P1) [1, 6]
    risk_level: RiskLevel; // Niveau de risque (Low, Medium, High, Critical) (P1) [1, 6]
    notes: string; // Recommandations automatiques ou manuelles (P1) [1, 5]
}

// 2. Définition du Schéma Mongoose
const ScoringSnapshotSchema = new Schema<IScoringSnapshot>({
    
    // Clé Primaire (P1)
    scoreId: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    
    // Clés Étrangères (P1)
    solutionId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Solution', 
        required: true 
    },
    envId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Environment', 
        required: false // Peut être global à la solution si l'environnement est non pertinent
    },

    // Date du Snapshot (P1)
    date: { 
        type: Date, 
        required: true 
    },
    
    // Scores par catégorie (Stocké comme un objet imbriqué ou 'Mixed')
    scores: { 
        type: Object, 
        required: true,
        // En Mongoose, l'utilisation de 'Object' permet de stocker des clés flexibles (comme ICategoricalScores)
        description: "Scores par catégorie (Sécurité, Résilience, etc.)"
    },
    
    // Score Global (P1)
    global_score: { 
        type: Number, 
        required: true,
        min: 0, 
        max: 100 
    },
    
    // Niveau de Risque (P1)
    risk_level: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        required: true,
        description: "Niveau de risque (Low >= 85, Medium 70-84, High 50-69, Critical < 50)" [6]
    },
    
    // Notes / Recommandations (P1)
    notes: { 
        type: String, 
        required: false,
        description: "Recommandations générées ou commentaires manuels" 
    }
}, {
    timestamps: true // Ajoute createdAt et updatedAt
});

// 3. Exportation du Modèle
export const ScoringSnapshotModel = model<IScoringSnapshot>('ScoringSnapshot', ScoringSnapshotSchema, 'scoringsnapshots');