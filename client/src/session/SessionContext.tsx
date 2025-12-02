import React, { createContext, useContext } from 'react';
import { gql, useQuery, useMutation, useApolloClient } from '@apollo/client';
import type { UserRole } from '@common/types';

const ME_QUERY = gql`
  query Me {
    me {
      userId
      email
      firstName
      lastName
      phone
      profilePicture
      themePreference
      languagePreference
      role
      associatedEditorId
      associatedEditorIds
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export type SessionUser = {
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  profilePicture?: string | null;
  themePreference?: 'light' | 'dark' | null;
  languagePreference?: 'fr' | 'en' | 'de' | null;
  role: UserRole;
  associatedEditorId?: string | null;
  associatedEditorIds?: string[] | null;
};

type SessionContextValue = {
  user: SessionUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  refetch: () => void;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue>({
  user: null,
  loading: true,
  isAuthenticated: false,
  refetch: () => {},
  logout: async () => {},
});

export const useSession = () => useContext(SessionContext);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, loading, refetch } = useQuery(ME_QUERY, {
    fetchPolicy: 'network-only',
  });

  const [logoutMutation] = useMutation(LOGOUT_MUTATION);
  const apolloClient = useApolloClient();

  const user = data?.me ?? null;

  const handleRefetch = () => {
    refetch();
  };

  const handleLogout = async () => {
    try {
      // Appeler la mutation de déconnexion côté serveur
      await logoutMutation();
      // Nettoyer le cache Apollo pour supprimer toutes les données en cache
      await apolloClient.clearStore();
      // Rafraîchir la session pour mettre à jour l'état (retournera null après logout)
      await refetch();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, nettoyer le cache et rafraîchir la session
      try {
        await apolloClient.clearStore();
        await refetch();
      } catch (clearError) {
        console.error('Erreur lors du nettoyage du cache:', clearError);
        // En dernier recours, forcer un rechargement de la page
        window.location.href = '/';
      }
    }
    // Note: La réinitialisation de l'onglet actif est gérée dans App.tsx via useEffect
  };

  return (
    <SessionContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        refetch: handleRefetch,
        logout: handleLogout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};


