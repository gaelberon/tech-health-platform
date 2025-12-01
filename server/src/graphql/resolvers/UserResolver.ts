// Fichier : /server/src/graphql/resolvers/UserResolver.ts

import { UserModel } from '../../models/User.model.js';
import { assertAuthorized } from '../authorization.js';
import bcrypt from 'bcryptjs';
import { logAudit, extractAuditContext, getObjectDifferences } from '../../services/audit.service.js';

// Fonction utilitaire pour convertir les dates en strings ISO
function serializeUserDates(userObj: any): any {
  if (userObj.lastLoginAt) {
    userObj.lastLoginAt = userObj.lastLoginAt instanceof Date 
      ? userObj.lastLoginAt.toISOString() 
      : userObj.lastLoginAt ? new Date(userObj.lastLoginAt).toISOString() : null;
  }
  if (userObj.archivedAt) {
    userObj.archivedAt = userObj.archivedAt instanceof Date 
      ? userObj.archivedAt.toISOString() 
      : userObj.archivedAt ? new Date(userObj.archivedAt).toISOString() : null;
  }
  if (userObj.createdAt) {
    userObj.createdAt = userObj.createdAt instanceof Date 
      ? userObj.createdAt.toISOString() 
      : userObj.createdAt ? new Date(userObj.createdAt).toISOString() : null;
  }
  if (userObj.updatedAt) {
    userObj.updatedAt = userObj.updatedAt instanceof Date 
      ? userObj.updatedAt.toISOString() 
      : userObj.updatedAt ? new Date(userObj.updatedAt).toISOString() : null;
  }
  return userObj;
}

const UserResolver = {
  Query: {
    // Liste tous les utilisateurs (pour l'administration)
    listUsers: async (_parent: any, { includeArchived }: { includeArchived?: boolean }, ctx: any) => {
      // Seuls Admin et Supervisor peuvent lister les utilisateurs
      assertAuthorized(ctx, 'listUsers');
      
      const filter: any = {};
      if (includeArchived !== true) {
        // Afficher uniquement les utilisateurs non archivés (archived = false ou undefined/null)
        filter.$or = [
          { archived: false },
          { archived: { $exists: false } },
          { archived: null },
        ];
      }
      
      const users = await UserModel.find(filter).sort({ createdAt: -1 });
      return users.map(user => {
        const userObj = user.toObject();
        serializeUserDates(userObj);
        return {
          ...userObj,
          passwordHash: undefined, // Ne jamais exposer le hash
        };
      });
    },

    // Récupère un utilisateur par son ID
    getUser: async (_parent: any, { userId }: { userId: string }, ctx: any) => {
      // Seuls Admin et Supervisor peuvent voir les détails d'un utilisateur
      assertAuthorized(ctx, 'getUser');
      
      const user = await UserModel.findOne({ userId });
      if (!user) {
        throw new Error(`Utilisateur avec l'ID ${userId} introuvable`);
      }
      
      const userObj = user.toObject();
      serializeUserDates(userObj);
      return {
        ...userObj,
        passwordHash: undefined, // Ne jamais exposer le hash
      };
    },
  },

  Mutation: {
    // Crée un nouvel utilisateur
    createUser: async (_parent: any, { input }: { input: any }, ctx: any) => {
      // Seuls Admin peuvent créer des utilisateurs
      assertAuthorized(ctx, 'createUser');
      
      const { email, password, firstName, lastName, phone, role, associatedEditorId } = input;
      
      // Vérifier que la combinaison email + rôle n'existe pas déjà
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await UserModel.findOne({ 
        email: normalizedEmail,
        role: role 
      });
      if (existingUser) {
        throw new Error(`Un utilisateur avec l'email ${email} et le rôle ${role} existe déjà`);
      }
      
      // Générer un userId unique (format générique, sans le rôle)
      const count = await UserModel.countDocuments();
      const userId = `user-${String(count + 1).padStart(4, '0')}`;
      
      // Hasher le mot de passe
      const passwordHash = await bcrypt.hash(password, 10);
      
      const user = await UserModel.create({
        userId,
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        role,
        associatedEditorId: associatedEditorId || null,
        archived: false,
      });

      // Enregistrer l'audit
      const auditContext = extractAuditContext(ctx);
      const userObj = user.toObject();
      serializeUserDates(userObj);
      await logAudit(auditContext, {
        action: 'CREATE',
        entityType: 'User',
        entityId: userId,
        after: { ...userObj, passwordHash: '[REDACTED]' },
        description: `Création d'un nouvel utilisateur avec le rôle ${role}`,
      });
      
      return {
        ...userObj,
        passwordHash: undefined,
      };
    },

    // Met à jour un utilisateur
    updateUser: async (_parent: any, { input }: { input: any }, ctx: any) => {
      // Seuls Admin peuvent modifier les utilisateurs
      assertAuthorized(ctx, 'updateUser');
      
      const { userId, email, firstName, lastName, phone, role, associatedEditorId, password } = input;
      
      const user = await UserModel.findOne({ userId });
      if (!user) {
        throw new Error(`Utilisateur avec l'ID ${userId} introuvable`);
      }
      
      if (user.archived) {
        throw new Error('Impossible de modifier un utilisateur archivé. Restaurez-le d\'abord.');
      }
      
      const updateData: any = {};
      
      if (email !== undefined || role !== undefined) {
        // Vérifier que la nouvelle combinaison email + rôle n'est pas déjà utilisée
        const checkEmail = email !== undefined ? email.toLowerCase().trim() : user.email;
        const checkRole = role !== undefined ? role : user.role;
        
        const existingUser = await UserModel.findOne({ 
          email: checkEmail,
          role: checkRole,
          userId: { $ne: userId }
        });
        if (existingUser) {
          throw new Error(`Un utilisateur avec l'email ${checkEmail} et le rôle ${checkRole} existe déjà`);
        }
        
        if (email !== undefined) {
          updateData.email = email.toLowerCase().trim();
        }
      }
      
      if (firstName !== undefined) updateData.firstName = firstName || null;
      if (lastName !== undefined) updateData.lastName = lastName || null;
      if (phone !== undefined) updateData.phone = phone || null;
      if (role !== undefined) updateData.role = role;
      if (associatedEditorId !== undefined) updateData.associatedEditorId = associatedEditorId || null;
      
      // Si un nouveau mot de passe est fourni, le hasher
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }
      
      // Récupérer l'état avant pour l'audit
      const beforeState = user.toObject();
      
      const updatedUser = await UserModel.findOneAndUpdate(
        { userId },
        updateData,
        { new: true }
      );
      
      if (!updatedUser) {
        throw new Error(`Erreur lors de la mise à jour de l'utilisateur ${userId}`);
      }
      
      const userObj = updatedUser.toObject();
      serializeUserDates(userObj);
      
      // Enregistrer l'audit
      const auditContext = extractAuditContext(ctx);
      const changes = getObjectDifferences(beforeState, userObj, ['passwordHash', 'updatedAt']);
      await logAudit(auditContext, {
        action: 'UPDATE',
        entityType: 'User',
        entityId: userId,
        changes,
        before: { ...beforeState, passwordHash: '[REDACTED]' },
        after: { ...userObj, passwordHash: '[REDACTED]' },
        description: `Mise à jour de l'utilisateur ${userId}`,
      });
      
      const { passwordHash, ...userWithoutPassword } = userObj;
      
      return userWithoutPassword;
    },

    // Archive un utilisateur (soft delete)
    archiveUser: async (_parent: any, { userId }: { userId: string }, ctx: any) => {
      // Seuls Admin peuvent archiver des utilisateurs
      assertAuthorized(ctx, 'archiveUser');
      
      const user = await UserModel.findOne({ userId });
      if (!user) {
        throw new Error(`Utilisateur avec l'ID ${userId} introuvable`);
      }
      
      if (user.archived) {
        throw new Error('Cet utilisateur est déjà archivé');
      }
      
      // Récupérer l'état avant pour l'audit
      const beforeState = user.toObject();
      
      const archivedUser = await UserModel.findOneAndUpdate(
        { userId },
        {
          archived: true,
          archivedAt: new Date(),
          archivedBy: ctx.user.userId,
        },
        { new: true }
      );
      
      if (!archivedUser) {
        throw new Error(`Erreur lors de l'archivage de l'utilisateur ${userId}`);
      }
      
      const userObj = archivedUser.toObject();
      serializeUserDates(userObj);
      
      // Enregistrer l'audit
      const auditContext = extractAuditContext(ctx);
      await logAudit(auditContext, {
        action: 'ARCHIVE',
        entityType: 'User',
        entityId: userId,
        before: { ...beforeState, passwordHash: '[REDACTED]' },
        after: { ...userObj, passwordHash: '[REDACTED]' },
        description: `Archivage de l'utilisateur ${userId}`,
      });
      
      const { passwordHash, ...userWithoutPassword } = userObj;
      
      return userWithoutPassword;
    },

    // Restaure un utilisateur archivé
    restoreUser: async (_parent: any, { userId }: { userId: string }, ctx: any) => {
      // Seuls Admin peuvent restaurer des utilisateurs
      assertAuthorized(ctx, 'restoreUser');
      
      const user = await UserModel.findOne({ userId });
      if (!user) {
        throw new Error(`Utilisateur avec l'ID ${userId} introuvable`);
      }
      
      if (!user.archived) {
        throw new Error('Cet utilisateur n\'est pas archivé');
      }
      
      // Récupérer l'état avant pour l'audit
      const beforeState = user.toObject();
      
      const restoredUser = await UserModel.findOneAndUpdate(
        { userId },
        {
          archived: false,
          archivedAt: null,
          archivedBy: null,
        },
        { new: true }
      );
      
      if (!restoredUser) {
        throw new Error(`Erreur lors de la restauration de l'utilisateur ${userId}`);
      }
      
      const userObj = restoredUser.toObject();
      serializeUserDates(userObj);
      
      // Enregistrer l'audit
      const auditContext = extractAuditContext(ctx);
      await logAudit(auditContext, {
        action: 'RESTORE',
        entityType: 'User',
        entityId: userId,
        before: { ...beforeState, passwordHash: '[REDACTED]' },
        after: { ...userObj, passwordHash: '[REDACTED]' },
        description: `Restauration de l'utilisateur ${userId}`,
      });
      
      const { passwordHash, ...userWithoutPassword } = userObj;
      
      return userWithoutPassword;
    },
  },
};

export default UserResolver;

