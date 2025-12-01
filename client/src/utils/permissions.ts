// Fichier : /client/src/utils/permissions.ts
// Système de gestion des permissions pour les pages

import type { UserRole } from '@common/types';

export type TabType = 'collector' | 'admin' | 'dashboard' | 'hosting' | 'about';

export interface TabPermission {
  tab: TabType;
  requiredRoles: UserRole[];
  label: string;
  icon: string;
}

// Métadonnées des onglets (pour l'affichage)
export const TAB_METADATA: Record<TabType, { label: string; icon: string }> = {
  collector: {
    label: 'Collecteur P1',
    icon: '📋',
  },
  admin: {
    label: 'Administration',
    icon: '⚙️',
  },
  dashboard: {
    label: 'Tableau de bord',
    icon: '📊',
  },
  hosting: {
    label: 'Hébergement',
    icon: '🏗️',
  },
  about: {
    label: 'About',
    icon: 'ℹ️',
  },
};

// Permissions par défaut (utilisées comme fallback avant le chargement depuis la DB)
const DEFAULT_PERMISSIONS: Record<TabType, UserRole[]> = {
  collector: ['Admin', 'Supervisor', 'EntityDirector', 'Editor'],
  admin: ['Admin'],
  dashboard: ['Admin', 'Supervisor', 'EntityDirector', 'Editor'],
  hosting: ['Admin', 'Supervisor', 'EntityDirector', 'Editor'],
  about: ['Admin', 'Supervisor', 'EntityDirector', 'Editor'],
};

/**
 * Vérifie si un utilisateur a accès à un onglet spécifique
 * Utilise les permissions depuis la base de données si disponibles, sinon les permissions par défaut
 */
export function hasAccessToTab(
  userRole: UserRole | null | undefined,
  tab: TabType,
  permissionsFromDB?: Map<string, boolean>
): boolean {
  if (!userRole) return false;

  // Si on a des permissions depuis la DB, les utiliser
  if (permissionsFromDB) {
    return permissionsFromDB.get(tab) === true;
  }

  // Sinon, utiliser les permissions par défaut
  return DEFAULT_PERMISSIONS[tab]?.includes(userRole) ?? false;
}

/**
 * Retourne la liste des onglets accessibles pour un rôle donné
 */
export function getAccessibleTabs(
  userRole: UserRole | null | undefined,
  permissionsFromDB?: Map<string, boolean>
): TabType[] {
  if (!userRole) return [];
  const allTabs: TabType[] = ['collector', 'admin', 'dashboard', 'hosting', 'about'];
  return allTabs.filter((tab) => hasAccessToTab(userRole, tab, permissionsFromDB));
}

/**
 * Retourne le premier onglet accessible pour un rôle (onglet par défaut)
 */
export function getDefaultTab(
  userRole: UserRole | null | undefined,
  permissionsFromDB?: Map<string, boolean>
): TabType {
  const accessibleTabs = getAccessibleTabs(userRole, permissionsFromDB);
  // Priorité : collector > dashboard > hosting > about > admin
  const priority: TabType[] = ['collector', 'dashboard', 'hosting', 'about', 'admin'];
  for (const tab of priority) {
    if (accessibleTabs.includes(tab)) {
      return tab;
    }
  }
  return 'collector'; // Fallback
}

