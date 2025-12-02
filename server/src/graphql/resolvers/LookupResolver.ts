// Fichier : /server/src/graphql/resolvers/LookupResolver.ts

import { LookupModel, ILookup } from '../../models/Lookup.model.js';
import { assertAuthorized } from '../authorization.js';
import { logAudit, extractAuditContext, getObjectDifferences } from '../../services/audit.service.js';

const LookupResolver = {
  Query: {
    // Récupère les lookups par leurs clés (pour le frontend)
    getLookups: async (_parent: any, { keys, lang }: { keys: string[]; lang: string }, ctx: any) => {
      const lookups = await LookupModel.find({ key: { $in: keys } });
      
      // Normaliser la langue (fr, en, de)
      const normalizedLang = lang === 'fr' || lang === 'en' || lang === 'de' ? lang : 'fr';
      
      // S'assurer que les IDs sont bien retournés et appliquer les traductions
      return lookups.map(lookup => {
        const lookupObj = lookup.toObject();
        
        // Appliquer les traductions aux valeurs
        if (lookupObj.values && Array.isArray(lookupObj.values)) {
          lookupObj.values = lookupObj.values.map((value: any) => {
            const translatedValue = { ...value };
            
            // Utiliser le label traduit si disponible, sinon le label par défaut
            if (normalizedLang === 'fr' && value.label_fr) {
              translatedValue.label = value.label_fr;
            } else if (normalizedLang === 'en' && value.label_en) {
              translatedValue.label = value.label_en;
            } else if (normalizedLang === 'de' && value.label_de) {
              translatedValue.label = value.label_de;
            }
            // Sinon, garder le label par défaut
            
            // Utiliser la description traduite si disponible
            if (normalizedLang === 'fr' && value.description_fr) {
              translatedValue.description = value.description_fr;
            } else if (normalizedLang === 'en' && value.description_en) {
              translatedValue.description = value.description_en;
            } else if (normalizedLang === 'de' && value.description_de) {
              translatedValue.description = value.description_de;
            }
            // Sinon, garder la description par défaut
            
            return translatedValue;
          });
        }
        
        return {
          ...lookupObj,
          id: lookup._id.toString(),
        };
      });
    },

    // Liste tous les lookups (pour l'administration)
    listAllLookups: async (_parent: any, { category }: { category?: string }, ctx: any) => {
      // Seuls Admin et Supervisor peuvent lister tous les lookups
      assertAuthorized(ctx, 'listAllLookups');
      
      const filter: any = {};
      if (category) {
        filter.category = category;
      }
      
      const lookups = await LookupModel.find(filter).sort({ key: 1 });
      // S'assurer que les IDs sont bien retournés
      return lookups.map(lookup => ({
        ...lookup.toObject(),
        id: lookup._id.toString(),
      }));
    },
  },

  Mutation: {
    // Met à jour un lookup (création ou modification)
    updateLookup: async (_parent: any, { input }: { input: any }, ctx: any) => {
      // Seuls Admin et Supervisor peuvent modifier les lookups
      assertAuthorized(ctx, 'updateLookup');
      
      const { key, values, category, entity, formLabel, description } = input;
      
      // Trier les valeurs par order si défini
      const sortedValues = [...values].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Récupérer l'état avant pour l'audit (si existe)
      const existingLookup = await LookupModel.findOne({ key });
      const beforeState = existingLookup ? existingLookup.toObject() : null;
      
      const lookup = await LookupModel.findOneAndUpdate(
        { key },
        {
          key,
          values: sortedValues,
          category: category || null,
          entity: entity || null,
          formLabel: formLabel || null,
          description: description || null,
        },
        { new: true, upsert: true }
      );
      
      // Enregistrer l'audit
      const auditContext = extractAuditContext(ctx);
      const afterState = lookup.toObject();
      const action = beforeState ? 'UPDATE' : 'CREATE';
      const changes = beforeState ? getObjectDifferences(beforeState, afterState) : undefined;
      
      await logAudit(auditContext, {
        action,
        entityType: 'Lookup',
        entityId: key,
        ...(changes && { changes }),
        ...(beforeState && { before: beforeState }),
        after: afterState,
        description: `${action === 'CREATE' ? 'Création' : 'Mise à jour'} du lookup ${key}`,
      });
      
      // S'assurer que l'ID est bien retourné
      return {
        ...afterState,
        id: lookup._id.toString(),
      };
    },
  },
};

export default LookupResolver;

