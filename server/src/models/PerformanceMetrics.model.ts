import { Schema, model, Document, Types } from 'mongoose';

// 1. Définition de l'Interface TypeScript pour l'entité PerformanceMetrics
export interface IPerformanceMetrics extends Document {
    metricId: string; // Identifiant unique (PK) [2]
    envId: Types.ObjectId; // Lien vers l'environnement (FK) [2]
    
    // Métriques de performance (P3) [2]
    date: Date; // Date de la mesure [2]
    active_users: number; // Nombre d'utilisateurs actifs [2]
    transactions_per_minute: number; // Volume de transactions ou fréquence d’usage [1, 3]
    avg_response_ms: number; // Temps de réponse moyen en millisecondes [2]
    incident_count: number; // Nombre d'incidents [2]
}

// 2. Définition du Schéma Mongoose
const PerformanceMetricsSchema = new Schema<IPerformanceMetrics>({
    
    // Clé Primaire (P3)
    metricId: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    
    // Clé Étrangère vers Environment
    envId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Environment', 
        required: true 
    },

    // Date de la mesure (P3)
    date: { 
        type: Date, 
        required: true 
    },
    
    // Nombre d'utilisateurs actifs (P3)
    active_users: { 
        type: Number, 
        required: false, // Peut être non renseigné
        min: 0,
        description: "Nombre d'utilisateurs actifs" 
    },
    
    // Volume/Fréquence (P3)
    transactions_per_minute: { 
        type: Number, 
        required: false,
        min: 0,
        description: "Volume de transactions ou fréquence d'usage"
    },
    
    // Temps de réponse moyen (P3)
    avg_response_ms: { 
        type: Number, 
        required: false,
        min: 0,
        description: "Temps de réponse moyen en millisecondes"
    },
    
    // Nombre d'incidents (P3)
    incident_count: { 
        type: Number, 
        required: true,
        default: 0,
        min: 0 
    }
}, {
    // Les documents PerformanceMetrics sont souvent stockés dans une collection séparée
    // pour optimiser la performance des requêtes, et peuvent bénéficier d'une TTL.
    timestamps: true
});

// 3. Exportation du Modèle
export const PerformanceMetricsModel = model<IPerformanceMetrics>('PerformanceMetrics', PerformanceMetricsSchema, 'performancemetrics');