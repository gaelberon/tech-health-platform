// Fichier : /server/src/graphql/resolvers/SettingsResolver.ts

import { SettingsModel } from '../../models/Settings.model.js';

const SettingsResolver = {
  Query: {
    // Récupérer un paramètre par sa clé
    getSetting: async (_: any, { key }: { key: string }) => {
      const setting = await SettingsModel.findOne({ key });
      return setting ? setting.value : null;
    },
    
    // Récupérer tous les paramètres
    getAllSettings: async () => {
      const settings = await SettingsModel.find({}).sort({ key: 1 });
      return settings.map((setting) => {
        const settingObj = setting.toObject() as any;
        return {
          id: settingObj._id.toString(),
          key: settingObj.key,
          value: settingObj.value,
          description: settingObj.description || null,
          category: settingObj.category || null,
          createdAt: settingObj.createdAt ? (settingObj.createdAt instanceof Date ? settingObj.createdAt.toISOString() : new Date(settingObj.createdAt).toISOString()) : new Date().toISOString(),
          updatedAt: settingObj.updatedAt ? (settingObj.updatedAt instanceof Date ? settingObj.updatedAt.toISOString() : new Date(settingObj.updatedAt).toISOString()) : new Date().toISOString(),
        };
      });
    },
  },
};

export default SettingsResolver;

