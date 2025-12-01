// Fichier : /server/src/graphql/resolvers/AuditResolver.ts

import { AuditLogModel } from '../../models/AuditLog.model.js';
import { assertAuthorized } from '../authorization.js';

const AuditResolver = {
  Query: {
    // Liste les logs d'audit avec filtres
    listAuditLogs: async (
      _parent: any,
      {
        entityType,
        entityId,
        userId,
        action,
        startDate,
        endDate,
        limit = 100,
      }: {
        entityType?: string;
        entityId?: string;
        userId?: string;
        action?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
      },
      ctx: any
    ) => {
      // Seuls Admin et Supervisor peuvent consulter les logs d'audit
      assertAuthorized(ctx, 'listAuditLogs');

      const filter: any = {};

      if (entityType) filter.entityType = entityType;
      if (entityId) filter.entityId = entityId;
      if (userId) filter.userId = userId;
      if (action) filter.action = action;

      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
      }

      const logs = await AuditLogModel.find(filter)
        .sort({ timestamp: -1 })
        .limit(Math.min(limit, 1000)); // Limite de sécurité

      return logs.map((log) => {
        const logObj = log.toObject() as any;
        return {
          ...logObj,
          id: log._id.toString(),
          before: logObj.before ? JSON.stringify(logObj.before) : null,
          after: logObj.after ? JSON.stringify(logObj.after) : null,
          timestamp: logObj.timestamp.toISOString(),
          createdAt: logObj.createdAt ? logObj.createdAt.toISOString() : logObj.timestamp.toISOString(),
        };
      });
    },

    // Récupère les logs d'audit pour une entité spécifique
    getAuditLogsForEntity: async (
      _parent: any,
      { entityType, entityId }: { entityType: string; entityId: string },
      ctx: any
    ) => {
      // Seuls Admin et Supervisor peuvent consulter les logs d'audit
      assertAuthorized(ctx, 'getAuditLogsForEntity');

      const logs = await AuditLogModel.find({ entityType, entityId })
        .sort({ timestamp: -1 })
        .limit(500);

      return logs.map((log) => {
        const logObj = log.toObject() as any;
        return {
          ...logObj,
          id: log._id.toString(),
          before: logObj.before ? JSON.stringify(logObj.before) : null,
          after: logObj.after ? JSON.stringify(logObj.after) : null,
          timestamp: logObj.timestamp.toISOString(),
          createdAt: logObj.createdAt ? logObj.createdAt.toISOString() : logObj.timestamp.toISOString(),
        };
      });
    },
  },
};

export default AuditResolver;

