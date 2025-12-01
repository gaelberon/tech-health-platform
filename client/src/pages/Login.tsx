import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      user {
        userId
        email
        firstName
        lastName
        role
        associatedEditorId
      }
      availableAccounts {
        userId
        email
        firstName
        lastName
        role
        associatedEditorId
      }
      requiresAccountSelection
    }
  }
`;

interface LoginProps {
  onLoggedIn?: () => void;
  onAccountSelectionRequired?: (accounts: any[]) => void;
}

const Login: React.FC<LoginProps> = ({ onLoggedIn, onAccountSelectionRequired }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [login, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      console.log('[LOGIN CLIENT] Réponse de connexion:', data);
      setErrorMsg(null);
      
      if (data.login.requiresAccountSelection) {
        // Plusieurs comptes disponibles, afficher la page de sélection
        if (onAccountSelectionRequired && data.login.availableAccounts) {
          onAccountSelectionRequired(data.login.availableAccounts);
        }
      } else {
        // Un seul compte, connexion directe
        if (onLoggedIn) {
          onLoggedIn();
        }
      }
    },
    onError: (err) => {
      console.error('[LOGIN CLIENT] Erreur:', err);
      console.error('[LOGIN CLIENT] Network error:', err.networkError);
      console.error('[LOGIN CLIENT] GraphQL errors:', err.graphQLErrors);
      setErrorMsg(err.message || err.networkError?.message || 'Erreur de connexion');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ variables: { email, password } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-2 text-center">Connexion</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Accédez au tableau de bord de scoring et au Collector P1.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {errorMsg && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;


