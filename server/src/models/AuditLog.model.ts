import { Schema, model, Document } from 'mongoose';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'RESTORE' | 'LOGIN' | 'LOGOUT';

export type EntityType =
  | 'User'
  | 'Lookup'
  | 'Permission'
  | 'PageAccessPermission'
  | 'Editor'
  | 'Solution'
  | 'Environment'
  | 'Hosting'
  | 'SecurityProfile'
  | 'MonitoringObservability'
  | 'EntityCost'
  | 'ScoringSnapshot'
  | 'Document'
  | 'RoadmapItem'
  | 'CodeBase'
  | 'DevelopmentMetrics'
  | 'DevelopmentTeam'
  | 'AIFeatures';

export interface IAuditLog extends Document {
  // Qui
  userId: string; // ID de l'utilisateur qui a effectué l'action
  userEmail?: string; // Email de l'utilisateur (pour faciliter les recherches)
  userRole?: string; // Rôle de l'utilisateur au moment de l'action

  // Quoi
  action: AuditAction; // Type d'action
  entityType: EntityType; // Type d'entité concernée
  entityId: string; // ID de l'entité concernée

  // Changements
  changes?: {
    field: string; // Nom du champ modifié
    oldValue: any; // Ancienne valeur
    newValue: any; // Nouvelle valeur
  }[];
  before?: any; // État complet avant (pour DELETE/ARCHIVE)
  after?: any; // État complet après (pour CREATE/UPDATE)

  // Contexte
  ipAddress?: string; // Adresse IP de l'utilisateur
  userAgent?: string; // User agent du navigateur
  description?: string; // Description libre de l'action

  // Quand
  timestamp: Date; // Timestamp de l'action (utilise createdAt par défaut)
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: false, index: true },
    userRole: { type: String, required: false },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'RESTORE', 'LOGIN', 'LOGOUT'],
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: [
        'User',
        'Lookup',
        'Permission',
        'PageAccessPermission',
        'Editor',
        'Solution',
        'Environment',
        'Hosting',
        'SecurityProfile',
        'MonitoringObservability',
        'EntityCost',
        'ScoringSnapshot',
        'Document',
        'RoadmapItem',
        'CodeBase',
        'DevelopmentMetrics',
        'DevelopmentTeam',
        'AIFeatures',
      ],
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    changes: [
      {
        field: { type: String, required: true },
        oldValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed },
      },
    ],
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    description: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true, // createdAt et updatedAt (updatedAt ne devrait jamais changer)
  }
);

// Index composés pour recherches efficaces
AuditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 }); // Pour les recherches par période

export const AuditLogModel = model<IAuditLog>('AuditLog', AuditLogSchema, 'audit_logs');

