// Fichier : /server/src/graphql/resolvers/LookupResolver.ts

import { LookupModel, ILookup } from '../../models/Lookup.model.js';
import { assertAuthorized } from '../authorization.js';

const LookupResolver = {
  Query: {
    // Récupère les lookups par leurs clés (pour le frontend)
    getLookups: async (_parent: any, { keys }: { keys: string[] }, ctx: any) => {
      const lookups = await LookupModel.find({ key: { $in: keys } });
      // S'assurer que les IDs sont bien retournés
      return lookups.map(lookup => ({
        ...lookup.toObject(),
        id: lookup._id.toString(),
      }));
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
      
      // S'assurer que l'ID est bien retourné
      return {
        ...lookup.toObject(),
        id: lookup._id.toString(),
      };
    },
  },
};

export default LookupResolver;

