import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setErrorMsg(err.message || err.networkError?.message || t('login.error'));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ variables: { email, password } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 transition-colors duration-200">
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-900 dark:text-gray-100">{t('login.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
          {t('login.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('login.email')}
            </label>
            <input
              type="email"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('login.password')}
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {errorMsg && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded px-3 py-2">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? t('common.loading') : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;


