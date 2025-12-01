// Fichier : /client/src/hooks/usePagePermissions.ts
// Hook pour charger les permissions d'accès aux pages depuis la base de données

import { gql, useQuery } from '@apollo/client';
import type { UserRole } from '@common/types';
import { useMemo } from 'react';

const GET_PAGE_PERMISSIONS_FOR_ROLE = gql`
  query GetPagePermissionsForRole($role: UserRole!) {
    listPageAccessPermissions(role: $role) {
      page
      allowed
    }
  }
`;

// Cache des permissions par rôle pour éviter les requêtes multiples
const permissionsCache = new Map<UserRole, Map<string, boolean>>();

export function usePagePermissions(userRole: UserRole | null | undefined) {
  const { data, loading } = useQuery(GET_PAGE_PERMISSIONS_FOR_ROLE, {
    variables: { role: userRole },
    skip: !userRole,
    fetchPolicy: 'cache-and-network', // Utiliser le cache mais aussi vérifier le réseau
  });

  const permissions = useMemo(() => {
    if (!userRole || !data?.listPageAccessPermissions) {
      return new Map<string, boolean>();
    }

    const permMap = new Map<string, boolean>();
    data.listPageAccessPermissions.forEach((p: any) => {
      permMap.set(p.page, p.allowed);
    });

    // Mettre à jour le cache
    permissionsCache.set(userRole, permMap);

    return permMap;
  }, [userRole, data]);

  return { permissions, loading };
}

/**
 * Vérifie si un utilisateur a accès à un onglet spécifique (utilise le cache si disponible)
 */
export function hasAccessToTab(userRole: UserRole | null | undefined, tab: string): boolean {
  if (!userRole) return false;

  // Vérifier d'abord le cache
  const cached = permissionsCache.get(userRole);
  if (cached) {
    return cached.get(tab) === true;
  }

  // Fallback : permissions par défaut si pas encore chargées
  // (sera remplacé par les vraies permissions une fois chargées)
  const defaultPermissions: Record<string, UserRole[]> = {
    collector: ['Admin', 'Supervisor', 'EntityDirector', 'Editor'],
    admin: ['Admin'],
    dashboard: ['Admin', 'Supervisor', 'EntityDirector', 'Editor'],
    about: ['Admin', 'Supervisor', 'EntityDirector', 'Editor'],
  };

  return defaultPermissions[tab]?.includes(userRole) ?? false;
}

