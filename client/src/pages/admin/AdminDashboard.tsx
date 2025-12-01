import React, { useState, useEffect } from 'react';
import { useSession } from '../../session/SessionContext';
import AdminPermissions from './AdminPermissions';
import AdminLookups from './AdminLookups';
import AdminUsers from './AdminUsers';
import AdminAuditLogs from './AdminAuditLogs';
import AdminDataManagement from './AdminDataManagement';

type AdminSection = 'permissions' | 'lookups' | 'users' | 'audit' | 'data' | 'settings';

const AdminDashboard: React.FC = () => {
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
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Accès refusé</h3>
          <p className="text-red-700">
            Vous devez être administrateur pour accéder à cette page.
          </p>
          <p className="text-red-600 text-sm mt-2">
            Rôle actuel : {user?.role || 'Non authentifié'}
          </p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'permissions' as AdminSection, label: 'Permissions', icon: '🔐', description: 'Gérer les permissions par rôle' },
    { id: 'lookups' as AdminSection, label: 'Listes de Valeurs', icon: '📋', description: 'Administrer les menus déroulants' },
    { id: 'users' as AdminSection, label: 'Utilisateurs', icon: '👥', description: 'Gérer les utilisateurs et leurs accès' },
    { id: 'data' as AdminSection, label: 'Gestion des Données', icon: '💾', description: 'Créer et modifier les éditeurs et données de test' },
    { id: 'audit' as AdminSection, label: 'Pistes d\'Audit', icon: '📊', description: 'Consulter les logs d\'audit et l\'historique des modifications' },
    { id: 'settings' as AdminSection, label: 'Paramètres', icon: '⚙️', description: 'Configuration générale (à venir)' },
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <p className="text-blue-700">Cette section sera disponible prochainement.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Module d'Administration</h2>
        <p className="text-gray-600 text-sm">
          Gérez les permissions, les listes de valeurs, les utilisateurs et les paramètres de la plateforme
        </p>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1" aria-label="Tabs">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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

