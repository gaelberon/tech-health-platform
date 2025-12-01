import { Schema, model, Document } from 'mongoose';

// 1. Définir l'interface TypeScript (optionnel mais fortement recommandé avec TS)
export interface IEditor extends Document {
    editorId: string;
    name: string;
    country: string;
    size: 'Micro' | 'SME' | 'Mid' | 'Enterprise';
    business_criticality: 'Low' | 'Medium' | 'High' | 'Critical';
    internal_it_systems: string[]; // Donnée DD
    it_security_strategy: string; // Donnée DD
    contracts_for_review: { type: string, summary: string }[]; // Donnée DD
}

// 2. Définir le Schéma Mongoose
const EditorSchema = new Schema<IEditor>({
    editorId: { type: String, required: true, unique: true }, // PK
    name: { type: String, required: true }, // P1
    country: { type: String, required: false }, // P2
    size: { type: String, enum: ['Micro', 'SME', 'Mid', 'Enterprise'], required: false }, // P2
    business_criticality: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true }, // P1

    // Nouveaux champs DD
    internal_it_systems: [{ type: String }], // Array of strings
    it_security_strategy: { type: String }, // Texte DD
    contracts_for_review: [{ // Array d'objets pour les contrats
        type: String,
        summary: String
    }]
}, {
    timestamps: true // Ajoute createdAt et updatedAt
});

// 3. Exporter le Modèle
export const EditorModel = model<IEditor>('Editor', EditorSchema, 'editors');