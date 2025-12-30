import { Schema, model, Document } from 'mongoose';

// 1. Définir l'interface TypeScript (optionnel mais fortement recommandé avec TS)
export interface IEditor extends Document {
    editorId: string;
    name: string;
    country: string;
    size: 'Micro' | 'SME' | 'Mid' | 'Enterprise';
    business_criticality: 'Low' | 'Medium' | 'High' | 'Critical';
    internal_it_systems: string[]; // Donnée DD
    it_security_strategy: string[]; // Donnée DD - Array de stratégies
    contracts_for_review: string[]; // Donnée DD (stockée comme texte libre "Type - Résumé")
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
    it_security_strategy: [{ type: String }], // Array de strings - Stratégies de sécurité IT
    contracts_for_review: [{ type: String }], // Stockage texte libre "Type - Résumé"
}, {
    timestamps: true // Ajoute createdAt et updatedAt
});

// 3. Exporter le Modèle
export const EditorModel = model<IEditor>('Editor', EditorSchema, 'editors');