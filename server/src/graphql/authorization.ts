import { PermissionModel } from '../models/Permission.model.js';
import type { UserRole } from '../models/User.model.js';

export async function assertAuthorized(ctx: any, operation: string) {
  if (!ctx.user) {
    throw new Error('Non authentifié : veuillez vous connecter.');
  }

  const role: UserRole = ctx.user.role;

  // Admin a accès à tout par défaut
  if (role === 'Admin') {
    return;
  }

  const permission = await PermissionModel.findOne({ role, operation });

  if (!permission || !permission.allowed) {
    throw new Error(`Accès refusé pour l'opération ${operation} pour le rôle ${role}.`);
  }
}





