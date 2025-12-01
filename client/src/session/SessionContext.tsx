import React, { createContext, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import type { UserRole } from '@common/types';

const ME_QUERY = gql`
  query Me {
    me {
      userId
      email
      role
      associatedEditorId
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
  role: UserRole;
  associatedEditorId?: string | null;
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

  const user = data?.me ?? null;

  const handleRefetch = () => {
    refetch();
  };

  const handleLogout = async () => {
    try {
      await logoutMutation();
      // Rafraîchir la session pour mettre à jour l'état
      await refetch();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, on rafraîchit la session
      await refetch();
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


