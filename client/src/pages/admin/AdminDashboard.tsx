import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../../session/SessionContext';
import AdminPermissions from './AdminPermissions';
import AdminLookups from './AdminLookups';
import AdminUsers from './AdminUsers';
import AdminAuditLogs from './AdminAuditLogs';
import AdminDataManagement from './AdminDataManagement';

type AdminSection = 'permissions' | 'lookups' | 'users' | 'audit' | 'data' | 'settings';

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useSession();
  const [activeSection, setActiveSection] = useState<AdminSection>('permissions');

  // Vérification de sécurité : seuls les admins peuvent accéder
  useEffect(() => {
    if (user && user.role !== 'Admin') {
      console.error('[SECURITY] Tentative d\'accès non autorisé à AdminDashboard par', user.role);
    }
  }, [user]);

  // Si l'utilisateur n'est pas admin, afficher un message d'erreur
  if (!user || user.role !== 'Admin') {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">{t('admin.accessDenied')}</h3>
          <p className="text-red-700 dark:text-red-300">
            {t('admin.adminRequired')}
          </p>
          <p className="text-red-600 dark:text-red-400 text-sm mt-2">
            {t('admin.currentRole')}: {user?.role ? t(`roles.${user.role}`) : t('admin.notAuthenticated')}
          </p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'permissions' as AdminSection, label: t('admin.sections.permissions.label'), icon: '🔐', description: t('admin.sections.permissions.description') },
    { id: 'lookups' as AdminSection, label: t('admin.sections.lookups.label'), icon: '📋', description: t('admin.sections.lookups.description') },
    { id: 'users' as AdminSection, label: t('admin.sections.users.label'), icon: '👥', description: t('admin.sections.users.description') },
    { id: 'data' as AdminSection, label: t('admin.sections.data.label'), icon: '💾', description: t('admin.sections.data.description') },
    { id: 'audit' as AdminSection, label: t('admin.sections.audit.label'), icon: '📊', description: t('admin.sections.audit.description') },
    { id: 'settings' as AdminSection, label: t('admin.sections.settings.label'), icon: '⚙️', description: t('admin.sections.settings.description') },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'permissions':
        return <AdminPermissions />;
      case 'lookups':
        return <AdminLookups />;
      case 'users':
        return <AdminUsers />;
      case 'data':
        return <AdminDataManagement />;
      case 'audit':
        return <AdminAuditLogs />;
      case 'settings':
        return (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
            <p className="text-blue-700 dark:text-blue-300">{t('admin.sections.settings.comingSoon')}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('admin.moduleTitle')}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {t('admin.moduleDesc')}
        </p>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-1" aria-label="Tabs">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu de la section active */}
      <div className="mt-6">{renderContent()}</div>
    </div>
  );
};

export default AdminDashboard;

