import React from 'react';
import { gql, useMutation } from '@apollo/client';

const SELECT_ACCOUNT = gql`
  mutation SelectAccount($userId: ID!) {
    selectAccount(userId: $userId) {
      userId
      email
      firstName
      lastName
      role
      associatedEditorId
    }
  }
`;

interface Account {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  associatedEditorId?: string;
}

interface AccountSelectionProps {
  accounts: Account[];
  onAccountSelected: () => void;
}

const AccountSelection: React.FC<AccountSelectionProps> = ({ accounts, onAccountSelected }) => {
  const [selectAccount, { loading }] = useMutation(SELECT_ACCOUNT, {
    onCompleted: () => {
      onAccountSelected();
    },
    onError: (err) => {
      console.error('[ACCOUNT_SELECTION] Erreur:', err);
      alert(`Erreur lors de la sélection du compte : ${err.message}`);
    },
  });

  const handleSelectAccount = async (userId: string) => {
    await selectAccount({ variables: { userId } });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Supervisor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'EntityDirector':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Editor':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'Administrateur';
      case 'Supervisor':
        return 'Superviseur';
      case 'EntityDirector':
        return 'Directeur d\'Entité';
      case 'Editor':
        return 'Éditeur';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-xl p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2 text-center">Sélectionner un compte</h1>
          <p className="text-sm text-gray-500 text-center">
            Vous avez plusieurs comptes associés à cet email. Veuillez choisir celui que vous souhaitez utiliser.
          </p>
        </div>

        <div className="space-y-3">
          {accounts.map((account) => (
            <button
              key={account.userId}
              onClick={() => handleSelectAccount(account.userId)}
              disabled={loading}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(
                        account.role
                      )}`}
                    >
                      {getRoleLabel(account.role)}
                    </span>
                    <span className="text-xs text-gray-500">ID: {account.userId}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {account.firstName || account.lastName
                      ? `${account.firstName || ''} ${account.lastName || ''}`.trim()
                      : account.email}
                  </div>
                  {account.firstName || account.lastName ? (
                    <div className="text-xs text-gray-500 mt-1">{account.email}</div>
                  ) : null}
                  {account.associatedEditorId && (
                    <div className="text-xs text-gray-500 mt-1">
                      Éditeur associé: {account.associatedEditorId}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Connexion en cours...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSelection;

