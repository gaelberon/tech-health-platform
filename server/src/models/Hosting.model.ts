import { Schema, model, Document } from 'mongoose';

// Définitions des types Enum possibles
type TierType = 'datacenter' | 'private' | 'public' | 'cloud';

// 1. Définition de l'Interface TypeScript pour l'entité Hosting
export interface IHosting extends Document {
    hostingId: string; // Identifiant unique (PK)
    
    // Champs P1 et P2
    provider: string; // Fournisseur Cloud ou On-Prem (OVH, Azure, GCP, Bleu, OnPrem, etc.) [2, 5]
    region: string; // Pays/Région d'hébergement [2, 5]
    tier: TierType; // Type de l'hébergement (Datacenter/Private/Public/Cloud) [2]
    
    // Champs P2 et P3
    certifications: string[]; // Liste des certifications obtenues (ISO27001, HDS, SOC2, etc.) [2, 5]
    contact: { 
        name: string, 
        email: string 
    }; // Contact technique (P4) [2]
}

// 2. Définition du Schéma Mongoose
const HostingSchema = new Schema<IHosting>({
    
    // Clé Primaire (P1)
    hostingId: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    
    // Informations Générales (P1)
    provider: { 
        type: String, 
        required: true,
        description: "Fournisseur Cloud ou On-Prem (OVH, Azure, GCP, AWS, Bleu, OnPrem, etc.)" 
    },
    
    region: { 
        type: String, 
        required: true,
        description: "Pays/Région d'hébergement (utile pour la conformité RGPD)" 
    },
    
    tier: { 
        type: String, 
        enum: ['datacenter', 'private', 'public', 'cloud'], 
        required: true,
        description: "Tier (datacenter/private/public/cloud)" 
    },

    // Certifications (P2)
    certifications: [{ 
        type: String, 
        description: "Liste des certifications (ISO27001, HDS, SOC2, etc.) (P2/P3, AISA 5.1.1, 5.2.1, 18.1)"
    }],
    
    // Contact (P4)
    contact: {
        type: {
            name: { type: String },
            email: { type: String }
        },
        required: false 
    }
}, {
    timestamps: true // Ajoute createdAt et updatedAt
});

// 3. Exportation du Modèle
export const HostingModel = model<IHosting>('Hosting', HostingSchema, 'hostings');