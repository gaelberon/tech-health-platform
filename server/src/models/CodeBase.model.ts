import { Schema, model, Document } from 'mongoose';
import { ISolution } from './Solution.model.js';

export interface ICodeBase extends Document {
    codebaseId: string; // Identifiant unique (PK)
    solutionId: ISolution['_id']; // Lien vers la Solution
    repo_location: string; // Où le code source est géré
    documentation_level: 'High' | 'Medium' | 'Low' | 'None'; //
    code_review_process: string; // TBD
    version_control_tool: string; // TBD
    technical_debt_known: string; // Description de la dette technique
    legacy_systems: string; // Description des systèmes hérités
    third_party_dependencies: string[]; // Dépendances externes
}

const CodeBaseSchema = new Schema<ICodeBase>({
    codebaseId: { type: String, required: true, unique: true }, // Clé Primaire
    solutionId: { type: Schema.Types.ObjectId, ref: 'Solution', required: true, unique: true }, // Relation 1:1 avec Solution
    repo_location: { type: String, required: true },
    documentation_level: { type: String, enum: ['High', 'Medium', 'Low', 'None'], required: true },
    code_review_process: { type: String }, // Présence et qualité des revues de code
    version_control_tool: { type: String },
    technical_debt_known: { type: String },
    legacy_systems: { type: String },
    third_party_dependencies: [{ type: String }]
});

export const CodeBaseModel = model<ICodeBase>('CodeBase', CodeBaseSchema, 'codebases');