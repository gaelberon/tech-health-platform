import React, { useMemo, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import type { UserRole } from '@common/types';

const LIST_ROLE_PERMISSIONS = gql`
  query ListRolePermissions($role: UserRole!) {
    listRolePermissions(role: $role) {
      id
      role
      operation
      allowed
    }
  }
`;

const SET_ROLE_PERMISSION = gql`
  mutation SetRolePermission($role: UserRole!, $operation: String!, $allowed: Boolean!) {
    setRolePermission(role: $role, operation: $operation, allowed: $allowed) {
      id
      role
      operation
      allowed
    }
  }
`;

const ROLES: UserRole[] = ['Admin', 'Supervisor', 'EntityDirector', 'Editor'];

const OPERATIONS: string[] = [
  'updateSolution',
  'updateEnvironment',
  'updateSecurityProfile',
  'updateHostingProfile',
  'updateEntityCost',
  'recordScoringSnapshot',
];

const AdminPermissions: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('Supervisor');

  const { data, loading, refetch } = useQuery(LIST_ROLE_PERMISSIONS, {
    variables: { role: selectedRole },
  });

  const [setPermission, { loading: saving }] = useMutation(SET_ROLE_PERMISSION);

  const permissionMap = useMemo(() => {
    const m = new Map<string, boolean>();
    (data?.listRolePermissions ?? []).forEach((p: any) => {
      m.set(p.operation, p.allowed);
    });
    return m;
  }, [data]);

  const handleToggle = async (operation: string, next: boolean) => {
    await setPermission({
      variables: { role: selectedRole, operation, allowed: next },
      optimisticResponse: {
        setRolePermission: {
          __typename: 'RolePermission',
          id: 'temp',
          role: selectedRole,
          operation,
          allowed: next,
        },
      },
    });
    await refetch();
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement des permissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Sélectionner un rôle</h3>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedRole === role
                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Permissions pour le rôle : <span className="text-blue-600 dark:text-blue-400">{selectedRole}</span>
        </h3>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Opération
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {OPERATIONS.map((operation) => {
                const allowed = permissionMap.get(operation) ?? false;
                return (
                  <tr key={operation} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm text-gray-900 dark:text-gray-100">{operation}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          allowed
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}
                      >
                        {allowed ? 'Autorisé' : 'Bloqué'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToggle(operation, !allowed)}
                        disabled={saving}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          allowed
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30'
                            : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30'
                        } disabled:opacity-50`}
                      >
                        {allowed ? 'Bloquer' : 'Autoriser'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPermissions;


