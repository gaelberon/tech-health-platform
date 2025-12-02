// Fichier : /client/src/components/UserMenu.tsx
// Composant menu contextuel style Google Workspace pour le profil utilisateur

import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from '../session/SessionContext';

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorElement: HTMLElement | null;
  onNavigate?: (tab: string) => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ isOpen, onClose, anchorElement, onNavigate }) => {
  const { user, logout } = useSession();
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique en dehors (mais pas sur le bouton toggle)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Ne pas fermer si on clique sur le bouton toggle dark mode
      if (target.closest('button') && target.closest('button')?.textContent?.includes('Mode')) {
        return;
      }
      
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        anchorElement &&
        !anchorElement.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      // Utiliser un délai pour permettre au toggle de se déclencher avant la fermeture
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose, anchorElement]);

  // Calculer la position du menu
  useEffect(() => {
    if (isOpen && anchorElement && menuRef.current) {
      const rect = anchorElement.getBoundingClientRect();
      const menu = menuRef.current;
      
      // Positionner le menu en bas à droite de l'élément anchor
      // Ajuster si le menu dépasse de l'écran
      const menuHeight = menu.offsetHeight || 300;
      const menuWidth = menu.offsetWidth || 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const spaceRight = window.innerWidth - rect.right;
      const spaceLeft = rect.left;
      
      menu.style.position = 'fixed';
      
      // Position verticale : préférer en bas, sinon en haut
      if (spaceBelow >= menuHeight || spaceBelow > spaceAbove) {
        menu.style.top = `${rect.bottom + 8}px`;
      } else {
        menu.style.top = `${rect.top - menuHeight - 8}px`;
      }
      
      // Position horizontale : aligner le bord droit du menu avec le bord droit de l'icône
      // Le menu s'étend vers la gauche depuis le bord droit de l'icône
      const rightPosition = window.innerWidth - rect.right;
      
      // Vérifier si le menu dépasse à gauche de l'écran
      const leftPosition = rect.right - menuWidth;
      if (leftPosition < 0) {
        // Le menu dépasse à gauche : le positionner à droite de l'écran avec une marge
        menu.style.right = '16px';
        menu.style.left = 'auto';
      } else {
        // Aligner le bord droit du menu avec le bord droit de l'icône
        menu.style.right = `${rightPosition}px`;
        menu.style.left = 'auto';
      }
    }
  }, [isOpen, anchorElement]);

  if (!isOpen || !user) return null;

  const displayName = user.firstName || user.email.split('@')[0];
  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user.firstName
    ? user.firstName[0].toUpperCase()
    : user.email[0].toUpperCase();

  // Vérifier si l'utilisateur a accès à l'administration
  const hasAdminAccess = user.role === 'Admin' || user.role === 'Supervisor';

  // Utiliser un portail pour rendre le menu en dehors du flux du document
  const menuContent = (
    <>
      {/* Overlay pour fermer le menu */}
      <div
        className="fixed inset-0 z-40"
        onClick={(e) => {
          // Ne pas fermer si on clique sur le bouton toggle
          if ((e.target as HTMLElement).closest('button[type="button"]')) {
            return;
          }
          onClose();
        }}
      />
      
      {/* Menu contextuel */}
      <div
        ref={menuRef}
        className="fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 transition-colors duration-200"
        style={{ minWidth: '280px' }}
      >
        {/* En-tête avec email */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</div>
        </div>

        {/* Titre accrocheur */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Hi, {displayName}!
          </div>
        </div>

        {/* Lien Gérer le compte */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              // TODO: Implémenter la page de gestion de profil
              alert('Fonctionnalité "Gérer le compte" en cours de développement');
              onClose();
            }}
            className="w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1.5 rounded transition-colors"
          >
            Gérer le compte
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(in progress)</span>
          </button>
        </div>

        {/* Sous-menu des fonctionnalités */}
        <div className="py-1">
          {hasAdminAccess && (
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('admin');
                }
                onClose();
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
            >
              <span className="mr-2">⚙️</span>
              Console d'administration
            </button>
          )}
          
          <button
            onClick={() => {
              // TODO: Ajouter d'autres fonctionnalités du profil
              onClose();
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
          >
            <span className="mr-2">👤</span>
            Mon profil
          </button>

        </div>

        {/* Séparateur */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

        {/* Déconnexion */}
        <div className="px-4 py-1">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full text-left px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </>
  );

  // Rendre le menu via un portail pour éviter les problèmes de layout
  return createPortal(menuContent, document.body);
};

export default UserMenu;

