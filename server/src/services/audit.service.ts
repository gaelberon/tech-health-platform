// Fichier : /server/src/services/audit.service.ts
// Service pour enregistrer les actions d'audit

import { AuditLogModel, AuditAction, EntityType, IAuditLog } from '../models/AuditLog.model.js';

export interface AuditContext {
  userId: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditData {
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  before?: any;
  after?: any;
  description?: string;
}

/**
 * Enregistre une action d'audit dans la base de données
 */
export async function logAudit(context: AuditContext, data: AuditData): Promise<void> {
  try {
    const auditData: any = {
      userId: context.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      timestamp: new Date(),
    };

    if (context.userEmail) auditData.userEmail = context.userEmail;
    if (context.userRole) auditData.userRole = context.userRole;
    if (data.changes) auditData.changes = data.changes;
    if (data.before) auditData.before = data.before;
    if (data.after) auditData.after = data.after;
    if (context.ipAddress) auditData.ipAddress = context.ipAddress;
    if (context.userAgent) auditData.userAgent = context.userAgent;
    if (data.description) auditData.description = data.description;

    await AuditLogModel.create(auditData);
  } catch (error) {
    // Ne pas faire échouer l'opération principale si l'audit échoue
    // Mais logger l'erreur pour investigation
    console.error('[AUDIT] Erreur lors de l\'enregistrement de l\'audit:', error);
  }
}

/**
 * Compare deux objets et retourne les différences
 */
export function getObjectDifferences(before: any, after: any, excludeFields: string[] = []): Array<{
  field: string;
  oldValue: any;
  newValue: any;
}> {
  const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

  for (const key of allKeys) {
    if (excludeFields.includes(key)) continue;

    const oldVal = before?.[key];
    const newVal = after?.[key];

    // Comparaison profonde pour les objets
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field: key,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }

  return changes;
}

/**
 * Extrait les informations utilisateur depuis le contexte GraphQL
 */
export function extractAuditContext(ctx: any, req?: any): AuditContext {
  return {
    userId: ctx.user?.userId || 'system',
    userEmail: ctx.user?.email,
    userRole: ctx.user?.role,
    ipAddress: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get?.('user-agent'),
  };
}

