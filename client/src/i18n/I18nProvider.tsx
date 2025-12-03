// Fichier : /client/src/i18n/I18nProvider.tsx
// Provider i18n qui utilise la préférence de langue de l'utilisateur

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../session/SessionContext';
import type { SupportedLanguage } from './config';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const { user, loading } = useSession();

  useEffect(() => {
    if (!loading && user?.languagePreference) {
      const userLang = user.languagePreference as SupportedLanguage;
      // Vérifier que la langue est supportée
      if (userLang === 'fr' || userLang === 'en' || userLang === 'de') {
        if (i18n.language !== userLang) {
          i18n.changeLanguage(userLang);
        }
      }
    } else if (!loading && !user) {
      // Si pas d'utilisateur, utiliser la langue du navigateur ou fallback
      const browserLang = navigator.language.split('-')[0];
      const supportedLang = browserLang === 'fr' || browserLang === 'en' || browserLang === 'de' 
        ? browserLang as SupportedLanguage 
        : 'fr';
      if (i18n.language !== supportedLang) {
        i18n.changeLanguage(supportedLang);
      }
    }
  }, [user?.languagePreference, loading, i18n]);

  return <>{children}</>;
};


