// Fichier : /server/src/config/seedSettings.ts

import { SettingsModel } from '../models/Settings.model.js';

/**
 * Initialise les paramètres par défaut dans la base de données.
 * Cette fonction est appelée au démarrage du serveur pour s'assurer
 * que les paramètres essentiels existent.
 */
export async function seedInitialSettings() {
  try {
    // Vérifier si le paramètre company_name existe déjà
    const existingCompanyName = await SettingsModel.findOne({ key: 'company_name' });
    
    if (!existingCompanyName) {
      // Créer le paramètre company_name avec la valeur par défaut
      await SettingsModel.create({
        key: 'company_name',
        value: 'mlog capital',
        description: 'Nom de l\'entreprise affiché dans le footer',
        category: 'company',
      });
      console.log('✅ Paramètre company_name initialisé avec la valeur "mlog capital"');
    } else {
      console.log('✅ Paramètre company_name existe déjà dans la base de données');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des paramètres:', error);
    // Ne pas faire échouer le démarrage du serveur si l'initialisation échoue
  }
}

