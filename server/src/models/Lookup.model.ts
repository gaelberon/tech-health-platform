import { Schema, model, Document } from 'mongoose';

export interface ILookupValue {
  code: string; // Valeur technique (ex: 'SaaS', 'High')
  label: string; // Valeur affichée (ex: 'Software as a Service', 'Critique')
  label_fr?: string; // Traduction française optionnelle
  label_en?: string; // Traduction anglaise optionnelle
  label_de?: string; // Traduction allemande optionnelle
  description?: string; // Texte pour l'infobulle (Mode Assistance)
  description_fr?: string; // Description en français
  description_en?: string; // Description en anglais
  description_de?: string; // Description en allemand
  order?: number; // Ordre d'affichage
  active?: boolean; // Permet de désactiver une valeur sans la supprimer
}

export interface ILookup extends Document {
  key: string; // Clé technique unique (ex: 'SOLUTION_TYPES', 'BUSINESS_CRITICALITY')
  values: ILookupValue[];
  category?: string; // Criticité pour l'organisation (ex: 'P1', 'P2', 'P3')
  entity?: string; // Entité à laquelle se rapporte la liste (ex: 'Solution', 'Environment', 'Hosting', 'Security', 'Editor')
  formLabel?: string; // Nom affiché dans le formulaire (ex: 'Mode Logiciel (Type)')
  description?: string; // Description générale de ce lookup
}

const LookupValueSchema = new Schema<ILookupValue>(
  {
    code: { type: String, required: true },
    label: { type: String, required: true },
    label_fr: { type: String, required: false },
    label_en: { type: String, required: false },
    label_de: { type: String, required: false },
    description: { type: String, required: false },
    description_fr: { type: String, required: false },
    description_en: { type: String, required: false },
    description_de: { type: String, required: false },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

const LookupSchema = new Schema<ILookup>(
  {
    key: { type: String, required: true, unique: true, index: true },
    values: { type: [LookupValueSchema], required: true },
    category: { type: String, required: false, index: true }, // P1, P2, P3, etc.
    entity: { type: String, required: false, index: true }, // Solution, Environment, Hosting, etc.
    formLabel: { type: String, required: false }, // Nom dans le formulaire
    description: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

export const LookupModel = model<ILookup>('Lookup', LookupSchema, 'lookups');

