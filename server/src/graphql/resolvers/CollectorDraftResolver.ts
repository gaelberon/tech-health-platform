// Fichier : /server/src/graphql/resolvers/CollectorDraftResolver.ts
// Resolver pour la gestion des brouillons de collecte

import { CollectorDraftModel } from '../../models/CollectorDraft.model.js';
import { assertAuthorized } from '../authorization.js';
import { logAudit, extractAuditContext } from '../../services/audit.service.js';

const CollectorDraftResolver = {
  Query: {
    // Lister les brouillons de l'utilisateur connecté
    listCollectorDrafts: async (
      _: any,
      args: { status?: string },
      ctx: any
    ) => {
      assertAuthorized(ctx, 'listCollectorDrafts');

      const filter: any = { userId: ctx.user.userId };
      if (args.status) {
        filter.status = args.status;
      }

      const drafts = await CollectorDraftModel.find(filter)
        .sort({ lastSavedAt: -1 })
        .limit(50); // Limiter à 50 brouillons récents

      return drafts.map((draft) => {
        const draftObj = draft.toObject();
        return {
          ...draftObj,
          lastSavedAt: draftObj.lastSavedAt?.toISOString() || new Date().toISOString(),
          createdAt: draftObj.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: draftObj.updatedAt?.toISOString() || new Date().toISOString(),
        };
      });
    },

    // Récupérer un brouillon spécifique
    getCollectorDraft: async (_: any, args: { draftId: string }, ctx: any) => {
      assertAuthorized(ctx, 'getCollectorDraft');

      const draft = await CollectorDraftModel.findOne({ draftId: args.draftId });

      if (!draft) {
        throw new Error(`Brouillon avec l'ID ${args.draftId} introuvable`);
      }

      // Vérifier que le brouillon appartient à l'utilisateur connecté
      if (draft.userId !== ctx.user.userId) {
        throw new Error('Accès refusé : ce brouillon ne vous appartient pas');
      }

      const draftObj = draft.toObject();
      return {
        ...draftObj,
        lastSavedAt: draftObj.lastSavedAt?.toISOString() || new Date().toISOString(),
        createdAt: draftObj.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: draftObj.updatedAt?.toISOString() || new Date().toISOString(),
      };
    },
  },

  Mutation: {
    // Sauvegarder un brouillon (création ou mise à jour)
    saveCollectorDraft: async (
      _: any,
      args: { input: any },
      ctx: any
    ) => {
      assertAuthorized(ctx, 'saveCollectorDraft');

      const auditContext = extractAuditContext(ctx);
      const { draftId, status, step, formData, errorMessage } = args.input;

      let draft;
      let isNew = false;

      if (draftId) {
        // Mise à jour d'un brouillon existant
        draft = await CollectorDraftModel.findOne({ draftId, userId: ctx.user.userId });

        if (!draft) {
          throw new Error(`Brouillon avec l'ID ${draftId} introuvable ou n'appartient pas à l'utilisateur`);
        }

        const beforeState = draft.toObject();
        draft = await CollectorDraftModel.findOneAndUpdate(
          { draftId, userId: ctx.user.userId },
          {
            $set: {
              status,
              step,
              formData,
              errorMessage: errorMessage || undefined,
            },
          },
          { new: true }
        );

        if (draft) {
          await logAudit(auditContext, {
            action: 'UPDATE',
            entityType: 'CollectorDraft',
            entityId: draftId,
            before: beforeState,
            after: draft.toObject(),
            description: `Mise à jour du brouillon de collecte Tech Profiler (étape ${step}, statut: ${status})`,
          });
        }
      } else {
        // Création d'un nouveau brouillon
        const count = await CollectorDraftModel.countDocuments();
        const newDraftId = `draft-${String(count + 1).padStart(4, '0')}`;

        draft = await CollectorDraftModel.create({
          draftId: newDraftId,
          userId: ctx.user.userId,
          status,
          step,
          formData,
          errorMessage: errorMessage || undefined,
        });
        isNew = true;

          await logAudit(auditContext, {
            action: 'CREATE',
            entityType: 'CollectorDraft', // Type non encore dans EntityType, sera ajouté
            entityId: newDraftId,
            after: draft.toObject(),
            description: `Création d'un nouveau brouillon de collecte Tech Profiler (étape ${step}, statut: ${status})`,
          });
      }

      if (!draft) {
        throw new Error('Erreur lors de la sauvegarde du brouillon');
      }

      const draftObj = draft.toObject();
      return {
        ...draftObj,
        lastSavedAt: draftObj.lastSavedAt?.toISOString() || new Date().toISOString(),
        createdAt: draftObj.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: draftObj.updatedAt?.toISOString() || new Date().toISOString(),
      };
    },

    // Supprimer un brouillon
    deleteCollectorDraft: async (
      _: any,
      args: { draftId: string },
      ctx: any
    ) => {
      assertAuthorized(ctx, 'deleteCollectorDraft');

      const draft = await CollectorDraftModel.findOne({
        draftId: args.draftId,
        userId: ctx.user.userId,
      });

      if (!draft) {
        throw new Error(`Brouillon avec l'ID ${args.draftId} introuvable ou n'appartient pas à l'utilisateur`);
      }

      const auditContext = extractAuditContext(ctx);
      const beforeState = draft.toObject();

      await CollectorDraftModel.deleteOne({ draftId: args.draftId, userId: ctx.user.userId });

      await logAudit(auditContext, {
        action: 'DELETE',
        entityType: 'CollectorDraft',
        entityId: args.draftId,
        before: beforeState,
        description: `Suppression du brouillon de collecte Tech Profiler`,
      });

      return true;
    },
  },
};

export default CollectorDraftResolver;

