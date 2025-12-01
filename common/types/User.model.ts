// Modèle partagé pour les utilisateurs/authentification (P1)

export type UserRole = 'Admin' | 'Supervisor' | 'EntityDirector' | 'Editor';

export interface IUser {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  associatedEditorId?: string; // FK logique vers un Editor/entité
  archived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}


