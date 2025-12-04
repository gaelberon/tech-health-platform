// Fichier : /client/src/utils/permissions.ts
// Système de gestion des permissions pour les pages

import type { UserRole } from '@common/types';

export type TabType = 'collector' | 'admin' | 'dashboard' | 'data-management' | 'hosting' | 'dd-tech' | 'about' | 'profile' | 'third-party-docs';

export interface TabPermission {
  tab: TabType;
  requiredRoles: UserRole[];
  label: string;
  icon: string;
}

// Métadonnées des onglets (pour l'affichage)
export const TAB_METADATA: Record<TabType, { label: string; icon: string; subtitle?: string }> = {
  collector: {
    label: 'Bilan Tech',
    subtitle: 'Snapshot',
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
  'data-management': {
    label: 'Data Management',
    icon: '💾',
  },
  hosting: {
    label: 'Hébergement',
    icon: '🏗️',
  },
  'dd-tech': {
    label: 'DD Tech',
    icon: '🔍',
  },
  about: {
    label: 'About',
    icon: 'ℹ️',
  },
  'third-party-docs': {
    label: 'Docs Tiers',
    icon: '📚',
  },
};

// Permissions par défaut (utilisées comme fallback avant le chargement depuis la DB)
const DEFAULT_PERMISSIONS: Record<TabType, UserRole[]> = {
  collector: ['Admin', 'Supervisor', 'EntityDirector', 'Editor'],
  admin: ['Admin'],
  dashboard: ['Admin', 'Supervisor', 'EntityDirector', 'Editor'],
  'data-management': ['Admin', 'Supervisor', 'EntityDirector', 'Editor'],
  hosting: ['Admin', 'Supervisor', 'EntityDirector', 'Editor'],
  'dd-tech': ['Admin', 'Supervisor', 'EntityDirector', 'Editor'],
  about: ['Admin', 'Supervisor', 'EntityDirector', 'Editor'],
  profile: ['Admin', 'Supervisor', 'EntityDirector', 'Editor'], // Tous les utilisateurs peuvent accéder à leur profil
  'third-party-docs': ['Admin'], // Uniquement les admins
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

  // Si on a des permissions depuis la DB, les utiliser (si définies)
  if (permissionsFromDB) {
    const dbPermission = permissionsFromDB.get(tab);
    // Si la permission est explicitement définie dans la DB, l'utiliser
    if (dbPermission !== undefined) {
      return dbPermission === true;
    }
    // Sinon, fallback sur les permissions par défaut
  }

  // Utiliser les permissions par défaut
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
  const allTabs: TabType[] = ['dashboard', 'data-management', 'collector', 'admin', 'hosting', 'dd-tech', 'about', 'profile', 'third-party-docs'];
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
    // Priorité : dashboard > data-management > collector > hosting > dd-tech > about > admin
    const priority: TabType[] = ['dashboard', 'data-management', 'collector', 'hosting', 'dd-tech', 'about', 'admin', 'profile', 'third-party-docs'];
  for (const tab of priority) {
    if (accessibleTabs.includes(tab)) {
      return tab;
    }
  }
  return 'dashboard'; // Fallback
}

