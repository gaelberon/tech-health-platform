// Fichier : /client/src/i18n/config.ts
// Configuration i18next pour le multilinguisme

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import des traductions
import frTranslation from './locales/fr/translation.json';
import enTranslation from './locales/en/translation.json';
import deTranslation from './locales/de/translation.json';

// Types de langues supportées
export type SupportedLanguage = 'fr' | 'en' | 'de';

// Configuration i18next
i18n
  // Détection automatique de la langue du navigateur
  .use(LanguageDetector)
  // Passe i18n à react-i18next
  .use(initReactI18next)
  // Initialisation
  .init({
    // Langue par défaut
    fallbackLng: 'fr',
    
    // Langues supportées
    supportedLngs: ['fr', 'en', 'de'],
    
    // Ressources de traduction
    resources: {
      fr: {
        translation: frTranslation,
      },
      en: {
        translation: enTranslation,
      },
      de: {
        translation: deTranslation,
      },
    },
    
    // Options de détection
    detection: {
      // Ordre de détection : localStorage > navigator > fallback
      order: ['localStorage', 'navigator'],
      // Clé dans localStorage
      lookupLocalStorage: 'i18nextLng',
      // Ne pas mettre en cache
      caches: ['localStorage'],
    },
    
    // Options d'interpolation
    interpolation: {
      escapeValue: false, // React échappe déjà les valeurs
    },
    
    // Options de debug (désactivé en production)
    debug: false,
  });

export default i18n;

