// Fichier : /client/src/pages/MyProfile.tsx
// Page de gestion du profil utilisateur

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useSession } from '../session/SessionContext';
import type { UserRole } from '@common/types';

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
      associatedEditorIds
      profilePicture
      themePreference
      languagePreference
    }
  }
`;

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
      associatedEditorIds
      profilePicture
      themePreference
      languagePreference
      archived
    }
  }
`;

const LIST_EDITORS_FOR_USER = gql`
  query ListEditorsForUser {
    listEditorsForUser {
      editorId
      name
      country
      size
      business_criticality
    }
  }
`;

interface MyProfileProps {
  onClose?: () => void;
}

const MyProfile: React.FC<MyProfileProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { user: currentUser, refetch: refetchSession } = useSession();
  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER);
  
  // Pour les Supervisors : charger les utilisateurs Editor de leurs éditeurs
  const { data: editorsData } = useQuery(LIST_EDITORS_FOR_USER, {
    skip: currentUser?.role !== 'Supervisor',
  });
  const { data: usersData, refetch: refetchUsers } = useQuery(LIST_USERS, {
    variables: { includeArchived: false },
    skip: currentUser?.role !== 'Supervisor',
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    profilePicture: '',
    themePreference: 'light' as 'light' | 'dark',
    languagePreference: 'fr' as 'fr' | 'en' | 'de',
  });

  const [showEditorUsers, setShowEditorUsers] = useState(false);
  const [editingEditorUser, setEditingEditorUser] = useState<any>(null);
  const [editorUserFormData, setEditorUserFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    profilePicture: '',
    themePreference: 'light' as 'light' | 'dark',
    languagePreference: 'fr' as 'fr' | 'en' | 'de',
    associatedEditorId: '',
  });

  // Initialiser le formulaire avec les données de l'utilisateur connecté
  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        phone: currentUser.phone || '',
        profilePicture: currentUser.profilePicture || '',
        themePreference: currentUser.themePreference || 'light',
        languagePreference: currentUser.languagePreference || 'fr',
      });
    }
  }, [currentUser]);

  // Filtrer les utilisateurs Editor associés aux éditeurs du Supervisor
  const supervisorEditors = editorsData?.listEditorsForUser || [];
  const supervisorEditorIds = currentUser?.associatedEditorIds || [];
  const editorUsers = usersData?.listUsers?.filter((u: any) => 
    u.role === 'Editor' && 
    u.associatedEditorId && 
    supervisorEditorIds.includes(u.associatedEditorId) &&
    !u.archived
  ) || [];

  const handleUpdateProfile = async () => {
    if (!currentUser) return;

    try {
      const input: any = {
        userId: currentUser.userId,
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        phone: formData.phone || null,
        profilePicture: formData.profilePicture || null,
        themePreference: formData.themePreference || 'light',
        languagePreference: formData.languagePreference || 'fr',
        // Ne pas inclure le rôle - l'utilisateur ne peut pas le modifier lui-même
      };

      await updateUser({ variables: { input } });
      
      // Rafraîchir la session pour appliquer les changements
      await refetchSession();
      
      // Si la langue ou le thème a changé, recharger la page
      if (formData.languagePreference !== currentUser.languagePreference) {
        window.location.reload();
      } else if (formData.themePreference !== currentUser.themePreference) {
        // Le ThemeContext détectera automatiquement le changement
      }
      
      alert(t('profile.updateSuccess'));
    } catch (error: any) {
      alert(`${t('profile.updateError')}: ${error.message}`);
    }
  };

  const handleUpdateEditorUser = async () => {
    if (!editingEditorUser) return;

    try {
      const input: any = {
        userId: editingEditorUser.userId,
        firstName: editorUserFormData.firstName || null,
        lastName: editorUserFormData.lastName || null,
        phone: editorUserFormData.phone || null,
        profilePicture: editorUserFormData.profilePicture || null,
        themePreference: editorUserFormData.themePreference || 'light',
        languagePreference: editorUserFormData.languagePreference || 'fr',
        associatedEditorId: editorUserFormData.associatedEditorId || null,
        // Ne pas permettre de changer le rôle
      };

      await updateUser({ variables: { input } });
      await refetchUsers();
      setEditingEditorUser(null);
      setEditorUserFormData({
        firstName: '',
        lastName: '',
        phone: '',
        profilePicture: '',
        themePreference: 'light',
        languagePreference: 'fr',
        associatedEditorId: '',
      });
      alert(t('profile.editorUserUpdateSuccess'));
    } catch (error: any) {
      alert(`${t('profile.editorUserUpdateError')}: ${error.message}`);
    }
  };

  const handleEditEditorUser = (editorUser: any) => {
    setEditingEditorUser(editorUser);
    setEditorUserFormData({
      firstName: editorUser.firstName || '',
      lastName: editorUser.lastName || '',
      phone: editorUser.phone || '',
      profilePicture: editorUser.profilePicture || '',
      themePreference: editorUser.themePreference || 'light',
      languagePreference: editorUser.languagePreference || 'fr',
      associatedEditorId: editorUser.associatedEditorId || '',
    });
  };

  if (!currentUser) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('profile.title')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('profile.subtitle')}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        )}
      </div>

      {/* Informations personnelles */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('profile.personalInfo')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('profile.email')}
            </label>
            <input
              type="email"
              value={currentUser.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('profile.emailReadOnly')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('profile.role')}
            </label>
            <input
              type="text"
              value={t(`roles.${currentUser.role}`)}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('profile.roleReadOnly')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('profile.firstName')}
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('profile.lastName')}
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('profile.phone')}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+33 6 12 34 56 78"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('profile.profilePicture')}
            </label>
            <div className="space-y-2">
              {formData.profilePicture && (
                <div className="mb-2">
                  <img
                    src={formData.profilePicture}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                      alert(t('profile.imageSizeError'));
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64String = reader.result as string;
                      setFormData({ ...formData, profilePicture: base64String });
                    };
                    reader.onerror = () => {
                      alert(t('profile.imageReadError'));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:text-gray-100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('profile.imageFormats')}
              </p>
              {formData.profilePicture && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, profilePicture: '' })}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  {t('profile.removePicture')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Préférences */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('profile.preferences')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('profile.themePreference')}
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="themePreference"
                  value="light"
                  checked={formData.themePreference === 'light'}
                  onChange={(e) => setFormData({ ...formData, themePreference: e.target.value as 'light' | 'dark' })}
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('profile.light')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="themePreference"
                  value="dark"
                  checked={formData.themePreference === 'dark'}
                  onChange={(e) => setFormData({ ...formData, themePreference: e.target.value as 'light' | 'dark' })}
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('profile.dark')}</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('profile.themeDesc')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('profile.languagePreference')}
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="languagePreference"
                  value="fr"
                  checked={formData.languagePreference === 'fr'}
                  onChange={(e) => setFormData({ ...formData, languagePreference: e.target.value as 'fr' | 'en' | 'de' })}
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('profile.french')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="languagePreference"
                  value="en"
                  checked={formData.languagePreference === 'en'}
                  onChange={(e) => setFormData({ ...formData, languagePreference: e.target.value as 'fr' | 'en' | 'de' })}
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('profile.english')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="languagePreference"
                  value="de"
                  checked={formData.languagePreference === 'de'}
                  onChange={(e) => setFormData({ ...formData, languagePreference: e.target.value as 'fr' | 'en' | 'de' })}
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('profile.german')}</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('profile.languageDesc')}</p>
          </div>
        </div>
      </div>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end gap-3">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            {t('common.cancel')}
          </button>
        )}
        <button
          onClick={handleUpdateProfile}
          disabled={updating}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
        >
          {updating ? t('common.loading') : t('common.save')}
        </button>
      </div>

      {/* Section pour les Supervisors : Gestion des utilisateurs Editor */}
      {currentUser.role === 'Supervisor' && supervisorEditorIds.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('profile.editorUsersManagement')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('profile.editorUsersDesc')}</p>
            </div>
            <button
              onClick={() => setShowEditorUsers(!showEditorUsers)}
              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              {showEditorUsers ? t('profile.hideEditorUsers') : t('profile.showEditorUsers')}
            </button>
          </div>

          {showEditorUsers && (
            <div className="space-y-4">
              {editorUsers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.noEditorUsers')}</p>
              ) : (
                <div className="space-y-2">
                  {editorUsers.map((editorUser: any) => {
                    const editor = supervisorEditors.find((e: any) => e.editorId === editorUser.associatedEditorId);
                    return (
                      <div
                        key={editorUser.userId}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              {editorUser.profilePicture ? (
                                <img
                                  src={editorUser.profilePicture}
                                  alt={editorUser.firstName || editorUser.email}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-medium">
                                  {(editorUser.firstName?.[0] || editorUser.email[0]).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {editorUser.firstName && editorUser.lastName
                                    ? `${editorUser.firstName} ${editorUser.lastName}`
                                    : editorUser.email}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{editorUser.email}</div>
                                {editor && (
                                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {t('profile.associatedEditor')}: {editor.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEditEditorUser(editorUser)}
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          >
                            {t('common.edit')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Formulaire d'édition d'un utilisateur Editor */}
          {editingEditorUser && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {t('profile.editEditorUser')}: {editingEditorUser.email}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('profile.firstName')}
                  </label>
                  <input
                    type="text"
                    value={editorUserFormData.firstName}
                    onChange={(e) => setEditorUserFormData({ ...editorUserFormData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('profile.lastName')}
                  </label>
                  <input
                    type="text"
                    value={editorUserFormData.lastName}
                    onChange={(e) => setEditorUserFormData({ ...editorUserFormData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('profile.phone')}
                  </label>
                  <input
                    type="tel"
                    value={editorUserFormData.phone}
                    onChange={(e) => setEditorUserFormData({ ...editorUserFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('profile.associatedEditor')}
                  </label>
                  <select
                    value={editorUserFormData.associatedEditorId}
                    onChange={(e) => setEditorUserFormData({ ...editorUserFormData, associatedEditorId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">{t('profile.selectEditor')}</option>
                    {supervisorEditors.map((editor: any) => (
                      <option key={editor.editorId} value={editor.editorId}>
                        {editor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('profile.themePreference')}
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="editorUserThemePreference"
                        value="light"
                        checked={editorUserFormData.themePreference === 'light'}
                        onChange={(e) => setEditorUserFormData({ ...editorUserFormData, themePreference: e.target.value as 'light' | 'dark' })}
                        className="w-4 h-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t('profile.light')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="editorUserThemePreference"
                        value="dark"
                        checked={editorUserFormData.themePreference === 'dark'}
                        onChange={(e) => setEditorUserFormData({ ...editorUserFormData, themePreference: e.target.value as 'light' | 'dark' })}
                        className="w-4 h-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t('profile.dark')}</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('profile.languagePreference')}
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="editorUserLanguagePreference"
                        value="fr"
                        checked={editorUserFormData.languagePreference === 'fr'}
                        onChange={(e) => setEditorUserFormData({ ...editorUserFormData, languagePreference: e.target.value as 'fr' | 'en' | 'de' })}
                        className="w-4 h-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t('profile.french')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="editorUserLanguagePreference"
                        value="en"
                        checked={editorUserFormData.languagePreference === 'en'}
                        onChange={(e) => setEditorUserFormData({ ...editorUserFormData, languagePreference: e.target.value as 'fr' | 'en' | 'de' })}
                        className="w-4 h-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t('profile.english')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="editorUserLanguagePreference"
                        value="de"
                        checked={editorUserFormData.languagePreference === 'de'}
                        onChange={(e) => setEditorUserFormData({ ...editorUserFormData, languagePreference: e.target.value as 'fr' | 'en' | 'de' })}
                        className="w-4 h-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{t('profile.german')}</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('profile.profilePicture')}
                  </label>
                  <div className="space-y-2">
                    {editorUserFormData.profilePicture && (
                      <div className="mb-2">
                        <img
                          src={editorUserFormData.profilePicture}
                          alt="Preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            alert(t('profile.imageSizeError'));
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64String = reader.result as string;
                            setEditorUserFormData({ ...editorUserFormData, profilePicture: base64String });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-700 dark:text-gray-100"
                    />
                    {editorUserFormData.profilePicture && (
                      <button
                        type="button"
                        onClick={() => setEditorUserFormData({ ...editorUserFormData, profilePicture: '' })}
                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        {t('profile.removePicture')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setEditingEditorUser(null);
                    setEditorUserFormData({
                      firstName: '',
                      lastName: '',
                      phone: '',
                      profilePicture: '',
                      themePreference: 'light',
                      languagePreference: 'fr',
                      associatedEditorId: '',
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleUpdateEditorUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  {t('common.save')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyProfile;

