/**
 * Script pour ajouter les traductions EN et DE aux lookups existants
 * 
 * Usage: 
 *   npm run translate-lookups
 *   ou
 *   npx ts-node --esm src/scripts/translateLookups.ts
 * 
 * Ce script:
 * 1. Se connecte à MongoDB
 * 2. Récupère tous les lookups
 * 3. Pour chaque valeur, ajoute label_en, label_de, description_en, description_de
 *    si elles n'existent pas déjà
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { LookupModel } from '../models/Lookup.model.js';

// Dictionnaire de traductions pour les termes courants
const translations: Record<string, { en: string; de: string }> = {
  // Criticité
  'Critique': { en: 'Critical', de: 'Kritisch' },
  'Élevée': { en: 'High', de: 'Hoch' },
  'Moyenne': { en: 'Medium', de: 'Mittel' },
  'Faible': { en: 'Low', de: 'Niedrig' },
  'Minimale': { en: 'Minimal', de: 'Minimal' },
  
  // Types de solutions
  'Software as a Service': { en: 'Software as a Service', de: 'Software as a Service' },
  'Logiciel en tant que Service': { en: 'Software as a Service', de: 'Software als Dienst' },
  'On-Premise': { en: 'On-Premise', de: 'On-Premise' },
  'Sur site': { en: 'On-Premise', de: 'Vor Ort' },
  'Hybride': { en: 'Hybrid', de: 'Hybrid' },
  'Client Lourd': { en: 'Client Heavy', de: 'Schwerer Client' },
  'Application Web Complète': { en: 'Full Web Application', de: 'Vollständige Webanwendung' },
  
  // Types de données
  'Données Personnelles': { en: 'Personal Data', de: 'Personenbezogene Daten' },
  'Données Sensibles': { en: 'Sensitive Data', de: 'Sensible Daten' },
  'Données de Santé': { en: 'Health Data', de: 'Gesundheitsdaten' },
  'Données Financières': { en: 'Financial Data', de: 'Finanzdaten' },
  'Données Synthétiques': { en: 'Synthetic Data', de: 'Synthetische Daten' },
  
  // Redondance
  'Aucune': { en: 'None', de: 'Keine' },
  'Géo-redondante': { en: 'Geo-redundant', de: 'Geo-redundant' },
  
  // Authentification
  'Mots de passe': { en: 'Passwords', de: 'Passwörter' },
  'Authentification Multi-Facteurs': { en: 'Multi-Factor Authentication', de: 'Multi-Faktor-Authentifizierung' },
  'Authentification Unique': { en: 'Single Sign-On', de: 'Single Sign-On' },
  'Single Sign-On': { en: 'Single Sign-On', de: 'Single Sign-On' },
  
  // Fréquences
  'Jamais': { en: 'Never', de: 'Nie' },
  'Annuel': { en: 'Annual', de: 'Jährlich' },
  'Trimestriel': { en: 'Quarterly', de: 'Vierteljährlich' },
  'Mensuel': { en: 'Monthly', de: 'Monatlich' },
  
  // Autres
  'Ad-hoc': { en: 'Ad-hoc', de: 'Ad-hoc' },
  'Régulière': { en: 'Regular', de: 'Regelmäßig' },
  'Automatique': { en: 'Automatic', de: 'Automatisch' },
};

/**
 * Traduit un texte français en anglais et allemand
 * Utilise le dictionnaire si disponible, sinon retourne le texte original
 */
function translateText(text: string): { en: string; de: string } {
  if (!text) return { en: '', de: '' };

  // Vérifier si le texte exact existe dans le dictionnaire
  if (translations[text]) {
    return translations[text];
  }

  // Si pas de traduction trouvée, retourner le texte original
  // Note: Dans un environnement de production, on pourrait utiliser une API de traduction
  // comme Google Translate API ou DeepL pour les textes non trouvés
  console.warn(`⚠️  Aucune traduction trouvée pour: "${text}"`);
  return {
    en: text,
    de: text,
  };
}

/**
 * Traduit tous les lookups
 */
async function translateLookups() {
  try {
    // Connexion à MongoDB
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      console.error('❌ ERREUR: MONGO_URI n\'est pas défini dans .env');
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les lookups
    const lookups = await LookupModel.find({});
    console.log(`📋 Trouvé ${lookups.length} lookup(s) à traduire`);

    let updatedCount = 0;
    let valueCount = 0;

    for (const lookup of lookups) {
      let lookupUpdated = false;
      const values = lookup.values || [];

      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (!value) continue; // Skip si undefined
        
        let valueUpdated = false;

        // Traduire le label si nécessaire
        const labelFr = value.label_fr || value.label;
        if (labelFr && (!value.label_en || !value.label_de)) {
          const labelTranslations = translateText(labelFr);
          if (!value.label_en) {
            value.label_en = labelTranslations.en;
            valueUpdated = true;
          }
          if (!value.label_de) {
            value.label_de = labelTranslations.de;
            valueUpdated = true;
          }
        }

        // Traduire la description si nécessaire
        const descFr = value.description_fr || value.description;
        if (descFr && (!value.description_en || !value.description_de)) {
          const descTranslations = translateText(descFr);
          if (!value.description_en) {
            value.description_en = descTranslations.en;
            valueUpdated = true;
          }
          if (!value.description_de) {
            value.description_de = descTranslations.de;
            valueUpdated = true;
          }
        }

        if (valueUpdated) {
          values[i] = value;
          lookupUpdated = true;
          valueCount++;
        }
      }

      // Sauvegarder le lookup si modifié
      if (lookupUpdated) {
        lookup.values = values;
        await lookup.save();
        updatedCount++;
        console.log(`  ✅ Mis à jour: ${lookup.key} (${values.length} valeur(s))`);
      }
    }

    console.log(`\n✅ Traduction terminée:`);
    console.log(`   - ${updatedCount} lookup(s) mis à jour`);
    console.log(`   - ${valueCount} valeur(s) traduite(s)`);

    await mongoose.disconnect();
    console.log('✅ Déconnecté de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Exécuter le script
translateLookups();

