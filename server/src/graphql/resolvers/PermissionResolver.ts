import { PermissionModel } from '../../models/Permission.model.js';
import type { UserRole } from '../../models/User.model.js';

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

      const doc = await PermissionModel.findOneAndUpdate(
        { role, operation },
        { $set: { allowed } },
        { new: true, upsert: true }
      );

      return {
        id: doc._id.toString(),
        role: doc.role,
        operation: doc.operation,
        allowed: doc.allowed,
      };
    },
  },
};

export default PermissionResolver;


