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
          id: `${selectedRole}-${operation}`,
          role: selectedRole,
          operation,
          allowed: next,
        },
      },
    });
    await refetch();
  };

  return (
    <section className="mt-8 border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Administration des permissions</h2>
          <p className="text-xs text-gray-500">
            Définissez quelles mutations P1/P2 sont autorisées pour chaque profil (RBAC).
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mr-2">Profil :</label>
          <select
            className="border rounded px-2 py-1 text-xs"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-gray-500">Chargement des permissions…</p>
      ) : (
        <table className="w-full text-left text-xs border rounded overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 font-medium text-gray-600">Mutation</th>
              <th className="px-3 py-2 font-medium text-gray-600 text-center">Autorisé ?</th>
            </tr>
          </thead>
          <tbody>
            {OPERATIONS.map((op) => {
              const allowed = permissionMap.get(op) ?? false;
              return (
                <tr key={op} className="border-t">
                  <td className="px-3 py-2">{op}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleToggle(op, !allowed)}
                      className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-medium ${
                        allowed
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                    >
                      {allowed ? 'Autorisé' : 'Bloqué'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
};

export default AdminPermissions;


