import { PermissionModel } from '../../models/Permission.model.js';
import { PageAccessPermissionModel } from '../../models/PageAccessPermission.model.js';
import type { UserRole } from '../../models/User.model.js';
import { logAudit, extractAuditContext, getObjectDifferences } from '../../services/audit.service.js';

const REQUIRE_ADMIN_MESSAGE = 'Accès refusé : cette opération est réservée aux administrateurs.';

const PermissionResolver = {
  Query: {
    listRolePermissions: async (_: any, { role }: { role: UserRole }, ctx: any) => {
      if (!ctx.user || ctx.user.role !== 'Admin') {
        throw new Error(REQUIRE_ADMIN_MESSAGE);
      }
      const docs = await PermissionModel.find({ role }).sort({ operation: 1 });
      return docs.map((p) => ({
        id: p._id.toString(),
        role: p.role,
        operation: p.operation,
        allowed: p.allowed,
      }));
    },
    listPageAccessPermissions: async (_: any, { role }: { role: UserRole }, ctx: any) => {
      if (!ctx.user || ctx.user.role !== 'Admin') {
        throw new Error(REQUIRE_ADMIN_MESSAGE);
      }
      const docs = await PageAccessPermissionModel.find({ role }).sort({ page: 1 });
      return docs.map((p) => ({
        id: p._id.toString(),
        role: p.role,
        page: p.page,
        allowed: p.allowed,
      }));
    },
  },
  Mutation: {
    setRolePermission: async (
      _: any,
      { role, operation, allowed }: { role: UserRole; operation: string; allowed: boolean },
      ctx: any
    ) => {
      if (!ctx.user || ctx.user.role !== 'Admin') {
        throw new Error(REQUIRE_ADMIN_MESSAGE);
      }

      // Récupérer l'état avant pour l'audit
      const beforeState = await PermissionModel.findOne({ role, operation });
      
      const doc = await PermissionModel.findOneAndUpdate(
        { role, operation },
        { $set: { allowed } },
        { new: true, upsert: true }
      );

      // Enregistrer l'audit
      const auditContext = extractAuditContext(ctx);
      const afterState = doc.toObject();
      const action = beforeState ? 'UPDATE' : 'CREATE';
      const changes = beforeState ? getObjectDifferences(beforeState.toObject(), afterState) : undefined;
      
      await logAudit(auditContext, {
        action,
        entityType: 'Permission',
        entityId: `${role}:${operation}`,
        ...(changes && { changes }),
        ...(beforeState && { before: beforeState.toObject() }),
        after: afterState,
        description: `${action === 'CREATE' ? 'Création' : 'Modification'} de la permission ${operation} pour le rôle ${role}`,
      });

      return {
        id: doc._id.toString(),
        role: doc.role,
        operation: doc.operation,
        allowed: doc.allowed,
      };
    },
    setPageAccessPermission: async (
      _: any,
      { role, page, allowed }: { role: UserRole; page: string; allowed: boolean },
      ctx: any
    ) => {
      if (!ctx.user || ctx.user.role !== 'Admin') {
        throw new Error(REQUIRE_ADMIN_MESSAGE);
      }

      // Récupérer l'état avant pour l'audit
      const beforeState = await PageAccessPermissionModel.findOne({ role, page });
      
      const doc = await PageAccessPermissionModel.findOneAndUpdate(
        { role, page },
        { $set: { allowed } },
        { new: true, upsert: true }
      );

      // Enregistrer l'audit
      const auditContext = extractAuditContext(ctx);
      const afterState = doc.toObject();
      const action = beforeState ? 'UPDATE' : 'CREATE';
      const changes = beforeState ? getObjectDifferences(beforeState.toObject(), afterState) : undefined;
      
      await logAudit(auditContext, {
        action,
        entityType: 'PageAccessPermission',
        entityId: `${role}:${page}`,
        ...(changes && { changes }),
        ...(beforeState && { before: beforeState.toObject() }),
        after: afterState,
        description: `${action === 'CREATE' ? 'Création' : 'Modification'} de la permission d'accès à la page ${page} pour le rôle ${role}`,
      });

      return {
        id: doc._id.toString(),
        role: doc.role,
        page: doc.page,
        allowed: doc.allowed,
      };
    },
  },
};

export default PermissionResolver;


