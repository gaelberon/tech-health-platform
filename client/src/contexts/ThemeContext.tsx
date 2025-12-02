// Fichier : /client/src/contexts/ThemeContext.tsx
// Contexte pour gérer le thème (light/dark mode) - APPROCHE STANDARD TAILWIND

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from '../session/SessionContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user, loading: sessionLoading } = useSession();
  
  // Fonction pour appliquer le thème directement au DOM
  const applyThemeToDOM = (themeToApply: Theme) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    // CRITIQUE : Supprimer d'abord toutes les classes de thème
    root.classList.remove('light', 'dark');
    
    if (themeToApply === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      // Mode clair : PAS de classe 'dark'
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    
    // Sauvegarder dans localStorage pour la prochaine fois
    localStorage.setItem('theme', themeToApply);
    
    console.log('[ThemeContext] Thème appliqué:', themeToApply, '- Classe dark présente:', root.classList.contains('dark'));
  };
  
  // Initialiser avec 'light' par défaut (sera corrigé dès que la session charge)
  const [theme, setThemeState] = useState<Theme>('light');
  
  // CRITIQUE : Appliquer le thème de l'utilisateur dès que la session est disponible
  useEffect(() => {
    // Attendre que la session soit chargée
    if (sessionLoading) {
      console.log('[ThemeContext] Session en cours de chargement...');
      return;
    }
    
    // PRIORITÉ ABSOLUE : Si l'utilisateur est connecté et a une préférence, l'utiliser
    if (user?.themePreference && (user.themePreference === 'light' || user.themePreference === 'dark')) {
      const userTheme = user.themePreference;
      console.log('[ThemeContext] Utilisateur connecté, préférence:', userTheme);
      
      // Mettre à jour l'état ET appliquer immédiatement au DOM
      setThemeState(userTheme);
      applyThemeToDOM(userTheme);
    } else if (!user) {
      // Pas d'utilisateur connecté, utiliser le thème depuis localStorage ou 'light' par défaut
      const savedTheme = localStorage.getItem('theme') as Theme;
      const themeToUse = (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'light';
      console.log('[ThemeContext] Pas d\'utilisateur connecté, thème depuis localStorage:', themeToUse);
      
      setThemeState(themeToUse);
      applyThemeToDOM(themeToUse);
    } else {
      // Utilisateur connecté mais pas de préférence, utiliser 'light' par défaut
      console.log('[ThemeContext] Utilisateur connecté mais pas de préférence, utilisation de light');
      setThemeState('light');
      applyThemeToDOM('light');
    }
  }, [user?.themePreference, user, sessionLoading]);
  
  // Appliquer le thème au DOM quand l'état theme change (pour les changements manuels)
  useEffect(() => {
    // Ne pas réappliquer si c'est déjà le bon thème (évite les boucles)
    const currentHasDark = document.documentElement.classList.contains('dark');
    const shouldHaveDark = theme === 'dark';
    
    if (currentHasDark !== shouldHaveDark) {
      console.log('[ThemeContext] État theme changé, application au DOM:', theme);
      applyThemeToDOM(theme);
    }
  }, [theme]);
  
  const setTheme = (newTheme: Theme) => {
    console.log('[ThemeContext] setTheme appelé:', newTheme);
    setThemeState(newTheme);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
