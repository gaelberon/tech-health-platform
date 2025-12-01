import { Schema, model, Document, Types } from 'mongoose';

// Définitions des types Enum possibles pour les champs DD
type SdlcProcess = 'Scrum' | 'Kanban' | 'Waterfall' | 'Agile' | 'Hybrid';
type AutomationLevel = 'None' | 'Manual' | 'Partial CI' | 'Full CI/CD';

// 1. Définition de l'Interface TypeScript pour l'entité
export interface IDevelopmentMetrics extends Document {
    metricsId: string; // Identifiant unique (PK)
    solutionId: Types.ObjectId; // Lien vers l'entité Solution (FK)
    
    // Métriques DD (Section 6c, 2d, 5b, 7a du DD)
    sdlc_process: SdlcProcess; // Processus de développement logiciel [1]
    devops_automation_level: AutomationLevel; // Degré d'automatisation CI/CD [1]
    
    // Ratios et délais (Calculés sur les 18 derniers mois)
    planned_vs_unplanned_ratio: number; // Rapport travail planifié/non planifié (en pourcentage, ex: 0.85 pour 85%) [1, 3]
    lead_time_for_changes_days: number; // Délai de mise en œuvre des changements (en jours) [1, 3]
    mttr_hours: number; // Mean Time to Restore (MTTR), en heures [1, 2]
    internal_vs_external_bug_ratio: number; // Proportion des bugs signalés en externe vs. interne (en pourcentage) [1, 4]
}

// 2. Définition du Schéma Mongoose
const DevelopmentMetricsSchema = new Schema<IDevelopmentMetrics>({
    
    // Clé Primaire
    metricsId: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    
    // Clé Étrangère vers Solution (Relation 1:1, un jeu de métriques par solution)
    solutionId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Solution', 
        required: true,
        unique: true // Assure qu'il n'y a qu'un seul document DevelopmentMetrics par Solution
    },

    // Processus et Automatisation
    sdlc_process: { 
        type: String, 
        enum: ['Scrum', 'Kanban', 'Waterfall', 'Agile', 'Hybrid'], 
        required: true,
        description: "Processus de développement logiciel (Scrum, Kanban, Cascade, etc.) [1, 3]" 
    },
    
    devops_automation_level: { 
        type: String, 
        enum: ['None', 'Manual', 'Partial CI', 'Full CI/CD'], 
        required: true,
        description: "Degré d'automatisation des pipelines CI/CD [1, 5]"
    },
    
    // Métriques temporelles et de ratio (stockées en tant que nombres)
    planned_vs_unplanned_ratio: { 
        type: Number, 
        required: true,
        min: 0,
        max: 1 
    },
    
    lead_time_for_changes_days: { 
        type: Number, 
        required: true,
        min: 0 
    },
    
    mttr_hours: { 
        type: Number, 
        required: true,
        min: 0 
    },
    
    internal_vs_external_bug_ratio: { 
        type: Number, 
        required: true,
        min: 0,
        max: 1 
    }
}, {
    timestamps: true // Ajoute createdAt et updatedAt
});

// 3. Exportation du Modèle
export const DevelopmentMetricsModel = model<IDevelopmentMetrics>('DevelopmentMetrics', DevelopmentMetricsSchema, 'developmentmetrics');