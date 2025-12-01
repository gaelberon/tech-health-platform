// Modèle partagé pour les utilisateurs/authentification (P1)

export type UserRole = 'Admin' | 'Supervisor' | 'EntityDirector' | 'Editor';

export interface IUser {
  userId: string;
  email: string;
  role: UserRole;
  associatedEditorId?: string; // FK logique vers un Editor/entité
}


