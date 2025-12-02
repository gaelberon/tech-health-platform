// Fichier : /server/src/models/Settings.model.ts

import { Schema, model, Document } from 'mongoose';

// Interface pour les paramètres de configuration
export interface ISettings extends Document {
  key: string; // Clé unique du paramètre (ex: 'company_name')
  value: string; // Valeur du paramètre
  description?: string; // Description optionnelle
  category?: string; // Catégorie du paramètre (ex: 'company', 'ui', 'system')
}

// Schéma Mongoose
const SettingsSchema = new Schema<ISettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    value: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    category: {
      type: String,
      required: false,
      default: 'general',
    },
  },
  {
    timestamps: true, // Ajoute createdAt et updatedAt
  }
);

// Exportation du modèle
export const SettingsModel = model<ISettings>('Settings', SettingsSchema, 'settings');

