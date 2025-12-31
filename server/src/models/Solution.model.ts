import { Schema, model, Document, Types } from 'mongoose';
import { IEditor } from './Editor.model.js'; // Importation de l'interface Editor pour le référencement

// Types Enum basés sur le dictionnaire synthétique [1]
type SolutionType = 'SaaS' | 'OnPrem' | 'Hybrid' | 'ClientHeavy';
type Criticality = 'Low' | 'Medium' | 'High' | 'Critical';

// 1. Définition de l'Interface TypeScript pour l'entité Solution
export interface ISolution extends Document {
    solutionId: string; // Identifiant unique (PK) [2]
    editorId: Types.ObjectId; // Lien vers l'éditeur (FK) [2]
    
    // Champs P1 / P2
    name: string; // Nom de la solution [1, 2]
    description: string; // Description courte [1]
    main_use_case: string; // Cas d'usage principal [1]
    type: SolutionType; // SaaS, OnPrem, etc. [1, 2]
    product_criticality: Criticality; // Criticité du produit (mapping à business_criticality) [1, 2]
    
    // Champs de Due Diligence Technique (DD)
    api_robustness: string; // Robustesse des APIs [2] (DD 1.d.1)
    api_documentation_quality: 'High' | 'Medium' | 'Low' | 'None' | 'TBD' | 'N/A'; // Qualité de la documentation des interfaces [2] (DD 1.d.2)
    ip_ownership_clear: 'Yes' | 'No' | 'TBD' | 'N/A'; // Droits de propriété clairs [2] (DD 4.a.1)
    licensing_model: string; // Modèles de licence utilisés [2] (DD 4.b.1)
    license_compliance_assured: 'Yes' | 'No' | 'TBD' | 'N/A'; // Conformité des licences tierces/Open Source [2] (DD 4.b.2)
    tech_stack: string[]; // Stack technique logicielle (langages, frameworks, bibliothèques) [P2]
    
    // Champs d'archivage
    archived?: boolean;
    archivedAt?: Date;
    archivedBy?: string; // userId de l'admin/supervisor qui a archivé
}

// 2. Définition du Schéma Mongoose
const SolutionSchema = new Schema<ISolution>({
    
    // Clé Primaire
    solutionId: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    
    // Clé Étrangère vers Editor (Relation 1:N) [3, 4]
    editorId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Editor', 
        required: true 
    },

    // Informations Générales (P1/P2)
    name: { type: String, required: true }, // P1 [2]
    description: { type: String, required: false }, // P2 [1]
    main_use_case: { type: String, required: true }, // P1 [1]
    
    type: { 
        type: String, 
        enum: ['SaaS', 'OnPrem', 'Hybrid', 'ClientHeavy'], 
        required: true,
        description: "Type (SaaS, OnPrem, Hybrid, ClientHeavy)" // P1 [1, 2]
    },
    
    product_criticality: { 
        type: String, 
        enum: ['Low', 'Medium', 'High', 'Critical'], 
        required: true,
        description: "Criticité du produit (P1)" // P1 [1, 2]
    },

    // Informations DD (API & Licences)
    api_robustness: { 
        type: String, 
        required: false,
        description: "Robustesse des APIs et des possibilités d'intégration (DD 1.d.1, AISA 8.1, 8.2)" // DD [2]
    },
    
    api_documentation_quality: { 
        type: String, 
        enum: ['High', 'Medium', 'Low', 'None', 'TBD', 'N/A'],
        required: false,
        description: "Qualité de la documentation des interfaces (DD 1.d.2, AISA 8.1)" // DD [2]
    },
    
    ip_ownership_clear: { 
        type: String, 
        enum: ['Yes', 'No', 'TBD', 'N/A'],
        required: true,
        description: "Droits de propriété clairs sur le code source (DD 4.a.1)" // DD [2]
    },
    
    licensing_model: { 
        type: String, 
        required: false,
        description: "Modèles de licence utilisés (DD 4.b.1, AISA 1.3.4)" // DD [2]
    },
    
    license_compliance_assured: { 
        type: String, 
        enum: ['Yes', 'No', 'TBD', 'N/A'],
        required: false,
        description: "Conformité des licences pour les logiciels tiers/Open Source (DD 4.b.2, AISA 1.3.4)" // DD [2]
    },
    
    tech_stack: [{ 
        type: String,
        required: false,
        description: "Stack technique logicielle (langages, frameworks, bibliothèques) - P2"
    }],
    
    // Champs d'archivage
    archived: { 
        type: Boolean, 
        default: false, 
        index: true,
        description: "Indique si la solution est archivée"
    },
    archivedAt: { 
        type: Date, 
        required: false,
        description: "Date d'archivage"
    },
    archivedBy: { 
        type: String, 
        required: false,
        description: "userId de l'admin/supervisor qui a archivé"
    }
}, {
    timestamps: true // Ajoute createdAt et updatedAt
});

// 3. Exportation du Modèle
export const SolutionModel = model<ISolution>('Solution', SolutionSchema, 'solutions');