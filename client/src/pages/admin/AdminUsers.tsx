import React, { useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import type { UserRole } from '@common/types';

const LIST_USERS = gql`
  query ListUsers($includeArchived: Boolean) {
    listUsers(includeArchived: $includeArchived) {
      userId
      email
      firstName
      lastName
      phone
      role
      associatedEditorId
      archived
      archivedAt
      archivedBy
      lastLoginAt
      createdAt
      updatedAt
    }
  }
`;

const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      userId
      email
      firstName
      lastName
      phone
      role
      associatedEditorId
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      userId
      email
      firstName
      lastName
      phone
      role
      associatedEditorId
    }
  }
`;

const ARCHIVE_USER = gql`
  mutation ArchiveUser($userId: ID!) {
    archiveUser(userId: $userId) {
      userId
      archived
      archivedAt
    }
  }
`;

const RESTORE_USER = gql`
  mutation RestoreUser($userId: ID!) {
    restoreUser(userId: $userId) {
      userId
      archived
      archivedAt
    }
  }
`;

const LIST_PAGE_ACCESS_PERMISSIONS = gql`
  query ListPageAccessPermissions($role: UserRole!) {
    listPageAccessPermissions(role: $role) {
      id
      role
      page
      allowed
    }
  }
`;

const SET_PAGE_ACCESS_PERMISSION = gql`
  mutation SetPageAccessPermission($role: UserRole!, $page: String!, $allowed: Boolean!) {
    setPageAccessPermission(role: $role, page: $page, allowed: $allowed) {
      id
      role
      page
      allowed
    }
  }
`;

interface User {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  associatedEditorId?: string;
  archived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

const ROLES: UserRole[] = ['Admin', 'Supervisor', 'EntityDirector', 'Editor'];
const PAGES = [
  { id: 'collector', label: 'Collecteur P1', icon: '📋' },
  { id: 'admin', label: 'Administration', icon: '⚙️' },
  { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
  { id: 'about', label: 'About', icon: 'ℹ️' },
];

const AdminUsers: React.FC = () => {
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<UserRole>('Editor');
  const [showPagePermissions, setShowPagePermissions] = useState<boolean>(false);

  const { data, loading, refetch } = useQuery(LIST_USERS, {
    variables: { includeArchived },
  });

  const [createUser, { loading: creating }] = useMutation(CREATE_USER);
  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER);
  const [archiveUserMutation] = useMutation(ARCHIVE_USER);
  const [restoreUserMutation] = useMutation(RESTORE_USER);

  // Query pour les permissions d'accès aux pages
  const { data: pagePermissionsData, loading: pagePermissionsLoading, refetch: refetchPagePermissions } = useQuery(
    LIST_PAGE_ACCESS_PERMISSIONS,
    {
      variables: { role: selectedRoleForPermissions },
      skip: !showPagePermissions, // Ne charger que si la section est visible
    }
  );

  const [setPagePermission, { loading: savingPagePermission }] = useMutation(SET_PAGE_ACCESS_PERMISSION);

  const users: User[] = data?.listUsers || [];

  // Filtrage par recherche
  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.userId.toLowerCase().includes(query)
    );
  });

  // Séparation des utilisateurs actifs et archivés
  const activeUsers = filteredUsers.filter((u) => !u.archived);
  const archivedUsers = filteredUsers.filter((u) => u.archived);

  // Formulaire de création/édition
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'Editor' as UserRole,
    associatedEditorId: '',
  });

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'Editor',
      associatedEditorId: '',
    });
    setShowCreateForm(false);
    setEditingUser(null);
  };

  const handleCreate = async () => {
    try {
      await createUser({
        variables: {
          input: {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName || null,
            lastName: formData.lastName || null,
            phone: formData.phone || null,
            role: formData.role,
            associatedEditorId: formData.associatedEditorId || null,
          },
        },
      });
      await refetch();
      resetForm();
      alert('Utilisateur créé avec succès');
    } catch (error: any) {
      alert(`Erreur lors de la création : ${error.message}`);
    }
  };

  const handleUpdate = async () => {
    if (!editingUser) return;

    try {
      await updateUser({
        variables: {
          input: {
            userId: editingUser.userId,
            email: formData.email,
            firstName: formData.firstName || null,
            lastName: formData.lastName || null,
            phone: formData.phone || null,
            role: formData.role,
            associatedEditorId: formData.associatedEditorId || null,
            password: formData.password || undefined, // Optionnel
          },
        },
      });
      await refetch();
      resetForm();
      alert('Utilisateur mis à jour avec succès');
    } catch (error: any) {
      alert(`Erreur lors de la mise à jour : ${error.message}`);
    }
  };

  const handleArchive = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir archiver cet utilisateur ?')) return;

    try {
      await archiveUserMutation({ variables: { userId } });
      await refetch();
      alert('Utilisateur archivé avec succès');
    } catch (error: any) {
      alert(`Erreur lors de l'archivage : ${error.message}`);
    }
  };

  const handleRestore = async (userId: string) => {
    try {
      await restoreUserMutation({ variables: { userId } });
      await refetch();
      alert('Utilisateur restauré avec succès');
    } catch (error: any) {
      alert(`Erreur lors de la restauration : ${error.message}`);
    }
  };

  // Gestion des permissions d'accès aux pages
  const pagePermissions = pagePermissionsData?.listPageAccessPermissions || [];
  const pagePermissionMap = new Map<string, boolean>();
  pagePermissions.forEach((p: any) => {
    pagePermissionMap.set(p.page, p.allowed);
  });

  const handleTogglePagePermission = async (page: string, allowed: boolean) => {
    try {
      await setPagePermission({
        variables: {
          role: selectedRoleForPermissions,
          page,
          allowed,
        },
      });
      await refetchPagePermissions();
    } catch (error: any) {
      alert(`Erreur lors de la mise à jour de la permission : ${error.message}`);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '', // Ne pas pré-remplir le mot de passe
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      role: user.role,
      associatedEditorId: user.associatedEditorId || '',
    });
    setShowCreateForm(true);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Chargement des utilisateurs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gestion des Utilisateurs</h3>
          <p className="text-sm text-gray-600 mt-1">
            {activeUsers.length} utilisateur{activeUsers.length !== 1 ? 's' : ''} actif{activeUsers.length !== 1 ? 's' : ''}
            {includeArchived && archivedUsers.length > 0 && (
              <span className="ml-2">
                • {archivedUsers.length} archivé{archivedUsers.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded border-gray-300"
            />
            Afficher les archivés
          </label>
          <button
            onClick={() => {
              resetForm();
              setShowCreateForm(true);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            + Nouvel utilisateur
          </button>
        </div>
      </div>

      {/* Section de gestion des permissions d'accès aux pages */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Droits d'accès aux pages</h3>
            <p className="text-sm text-gray-600 mt-1">
              Configurez les pages accessibles pour chaque rôle
            </p>
          </div>
          <button
            onClick={() => setShowPagePermissions(!showPagePermissions)}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            {showPagePermissions ? 'Masquer' : 'Afficher'} les permissions
          </button>
        </div>

        {showPagePermissions && (
          <div className="space-y-4">
            {/* Sélection du rôle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un rôle
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRoleForPermissions(role)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedRoleForPermissions === role
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Liste des permissions */}
            {pagePermissionsLoading ? (
              <div className="text-center py-4 text-gray-500">Chargement des permissions...</div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Page
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {PAGES.map((page) => {
                      const allowed = pagePermissionMap.get(page.id) ?? false;
                      return (
                        <tr key={page.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="mr-2">{page.icon}</span>
                              <span className="text-sm font-medium text-gray-900">{page.label}</span>
                              <code className="ml-3 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {page.id}
                              </code>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                allowed
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {allowed ? 'Autorisé' : 'Bloqué'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleTogglePagePermission(page.id, !allowed)}
                              disabled={savingPagePermission}
                              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                allowed
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                  : 'bg-green-50 text-green-700 hover:bg-green-100'
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
            )}
          </div>
        )}
      </div>

      {/* Barre de recherche */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par nom, email ou ID..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Formulaire de création/édition */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              {editingUser ? 'Modifier un utilisateur' : 'Créer un nouvel utilisateur'}
            </h4>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!editingUser}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rôle *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Éditeur associé (optionnel)
              </label>
              <input
                type="text"
                value={formData.associatedEditorId}
                onChange={(e) => setFormData({ ...formData, associatedEditorId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ID de l'éditeur si applicable"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              onClick={editingUser ? handleUpdate : handleCreate}
              disabled={creating || updating || !formData.email || (!editingUser && !formData.password)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating || updating ? 'Enregistrement...' : editingUser ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      {/* Liste des utilisateurs actifs */}
      {activeUsers.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900">Utilisateurs actifs</h4>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière connexion
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeUsers.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName || user.lastName
                            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                            : '—'}
                        </div>
                        <div className="text-xs text-gray-500">{user.userId}</div>
                        {user.phone && (
                          <div className="text-xs text-gray-500">{user.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'Admin'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'Supervisor'
                            ? 'bg-blue-100 text-blue-800'
                            : user.role === 'EntityDirector'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLoginAt
                        ? (() => {
                            try {
                              const date = new Date(user.lastLoginAt);
                              return isNaN(date.getTime()) ? 'Date invalide' : date.toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                            } catch (e) {
                              return 'Date invalide';
                            }
                          })()
                        : 'Jamais'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => startEdit(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleArchive(user.userId)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Archiver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Liste des utilisateurs archivés */}
      {includeArchived && archivedUsers.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900 text-gray-500">
            Utilisateurs archivés
          </h4>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden opacity-75">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Archivé le
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {archivedUsers.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-500">
                          {user.firstName || user.lastName
                            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                            : '—'}
                        </div>
                        <div className="text-xs text-gray-400">{user.userId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.archivedAt
                        ? (() => {
                            try {
                              const date = new Date(user.archivedAt);
                              return isNaN(date.getTime()) ? 'Date invalide' : date.toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              });
                            } catch (e) {
                              return 'Date invalide';
                            }
                          })()
                        : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handleRestore(user.userId)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Restaurer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredUsers.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            {searchQuery ? 'Aucun utilisateur ne correspond à votre recherche.' : 'Aucun utilisateur trouvé.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

