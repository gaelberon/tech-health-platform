import { Schema, model, Document } from 'mongoose';
import { ISolution } from './Solution.model.js';

export interface ICodeBase extends Document {
    codebaseId: string; // Identifiant unique (PK)
    solutionId: ISolution['_id']; // Lien vers la Solution
    repo_location: string; // Où le code source est géré
    documentation_level: 'High' | 'Medium' | 'Low' | 'None' | 'TBD' | 'N/A'; //
    code_review_process: string; // TBD
    version_control_tool: string; // TBD
    technical_debt_known: string; // Description de la dette technique
    legacy_systems: string; // Description des systèmes hérités
    third_party_dependencies: string[]; // Dépendances externes
}

const CodeBaseSchema = new Schema<ICodeBase>({
    codebaseId: { type: String, required: true, unique: true }, // Clé Primaire
    solutionId: { type: Schema.Types.ObjectId, ref: 'Solution', required: true, unique: true }, // Relation 1:1 avec Solution
    repo_location: { 
        type: String, 
        required: true,
        description: "Localisation du dépôt de code (DD 1.c.1, AISA 6.1, 6.2)"
    },
    documentation_level: { 
        type: String, 
        enum: ['High', 'Medium', 'Low', 'None', 'TBD', 'N/A'], 
        required: true,
        description: "Niveau de documentation (DD 1.c.2, AISA 7.1, 7.2)"
    },
    code_review_process: { 
        type: String,
        description: "Processus de revue de code (DD 1.c.3, AISA 6.1, 6.2)"
    }, // Présence et qualité des revues de code
    version_control_tool: { 
        type: String,
        description: "Outil de contrôle de version (DD 1.c.4, AISA 6.1, 6.2)"
    },
    technical_debt_known: { 
        type: String,
        description: "Dette technique connue (DD 1.e.1)"
    },
    legacy_systems: { 
        type: String,
        description: "Systèmes hérités (DD 1.e.3)"
    },
    third_party_dependencies: [{ 
        type: String,
        description: "Dépendances tierces (DD 1.a.2, AISA 1.3.4, ISO 27001 A.15.1, A.15.2)"
    }]
});

export const CodeBaseModel = model<ICodeBase>('CodeBase', CodeBaseSchema, 'codebases');