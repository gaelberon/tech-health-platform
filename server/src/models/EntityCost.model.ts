import { Schema, model, Document, Types } from 'mongoose';

// 1. Définition de l'Interface TypeScript pour l'entité EntityCost
export interface IEntityCost extends Document {
    costId: string; // Identifiant unique (PK)
    envId: Types.ObjectId; // Lien vers l'environnement (FK)
    
    // Champs P4 (CIEC initial)
    hosting_monthly: number; // Coûts mensuels d'hébergement [2]
    licenses_monthly: number; // Coûts mensuels des licences PaaS/IaaS [2]
    ops_hours_monthly_equiv: number; // Heures Ops requises (Estimation) [1]
    comments: string; // Commentaires sur les coûts [1]
    
    // Nouveaux champs DD (8.a, 8.b)
    hidden_costs: string; // Coûts cachés ou obligations contractuelles futures [2] (8.a.2)
    cost_evolution_factors: string; // Comment les coûts évoluent avec l'utilisation (tokens IA, workflows) [2] (8.a.3)
    modernization_investment_needs: string; // Investissements nécessaires pour la modernisation/croissance [2] (8.b.1)
}

// 2. Définition du Schéma Mongoose
const EntityCostSchema = new Schema<IEntityCost>({
    
    // Clé Primaire
    costId: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    
    // Clé Étrangère vers Environment (Relation 1:1, un jeu de coûts par environnement)
    envId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Environment', 
        required: true,
        unique: true // Assure qu'il n'y a qu'un seul document de coûts par Environment
    },

    // Coûts mensuels (P4)
    hosting_monthly: { 
        type: Number, 
        required: false,
        min: 0,
        description: "Coûts mensuels d'hébergement (P4)"
    },
    
    licenses_monthly: { 
        type: Number, 
        required: false,
        min: 0,
        description: "Coûts mensuels des licences PaaS/IaaS (P4)"
    },

    ops_hours_monthly_equiv: {
        type: Number,
        required: false,
        description: "Équivalent temps plein (Eqh) nécessaire pour l'opération/maintenance"
    },

    comments: {
        type: String,
        required: false
    },
    
    // Champs DD (Texte libre)
    hidden_costs: { 
        type: String, 
        required: false,
        description: "Coûts cachés ou obligations contractuelles futures (DD 8.a.2)" 
    },
    
    cost_evolution_factors: { 
        type: String, 
        required: false,
        description: "Facteurs d'évolution des coûts (tokens IA, licences, etc.) (DD 8.a.3)" 
    },
    
    modernization_investment_needs: { 
        type: String, 
        required: false,
        description: "Investissements nécessaires pour la modernisation/croissance (DD 8.b.1)" 
    }
}, {
    timestamps: true // Ajoute createdAt et updatedAt
});

// 3. Exportation du Modèle
export const EntityCostModel = model<IEntityCost>('EntityCost', EntityCostSchema, 'costs');