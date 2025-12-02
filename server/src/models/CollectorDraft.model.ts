import { Schema, model, Document } from 'mongoose';

export type DraftStatus = 'draft' | 'in_progress' | 'failed' | 'completed';

export interface ICollectorDraft extends Document {
  draftId: string; // PK
  userId: string; // FK vers User
  status: DraftStatus;
  step: number; // Étape actuelle du workflow (1-4)
  
  // Données du formulaire (JSON)
  formData: {
    selectedEditorId?: string;
    useExistingEditor?: boolean;
    editorName?: string;
    editorCriticality?: string;
    editorCountry?: string;
    editorSize?: string;
    solutionName?: string;
    solutionType?: string;
    solutionCriticality?: string;
    solutionMainUseCase?: string;
    solutionDescription?: string;
    provider?: string;
    region?: string;
    hostingTier?: string;
    certifications?: string[];
    dataTypes?: string[];
    redundancy?: string;
    backupExists?: boolean;
    rto?: number;
    rpo?: number;
    restorationTestFrequency?: string;
    deploymentType?: string;
    virtualization?: string;
    techStack?: string[];
    auth?: string;
    encryptTransit?: boolean;
    encryptRest?: boolean;
    patching?: string;
    pentestFreq?: string;
    vulnMgmt?: string;
    [key: string]: any; // Pour permettre d'autres champs
  };
  
  // Métadonnées
  errorMessage?: string; // Message d'erreur si status = 'failed'
  lastSavedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CollectorDraftSchema = new Schema<ICollectorDraft>(
  {
    draftId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'in_progress', 'failed', 'completed'],
      required: true,
      default: 'draft',
      index: true,
    },
    step: { type: Number, required: true, min: 1, max: 5, default: 1 },
    formData: { type: Schema.Types.Mixed, required: true },
    errorMessage: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

// Index composé pour rechercher les brouillons d'un utilisateur par statut
CollectorDraftSchema.index({ userId: 1, status: 1 });
CollectorDraftSchema.index({ userId: 1, lastSavedAt: -1 }); // Pour trier par date

// Middleware pour mettre à jour lastSavedAt à chaque sauvegarde
CollectorDraftSchema.pre('save', async function () {
  if (this.isModified() || this.isNew) {
    (this as any).lastSavedAt = new Date();
  }
});

export const CollectorDraftModel = model<ICollectorDraft>(
  'CollectorDraft',
  CollectorDraftSchema,
  'collector_drafts'
);

