import { Schema, model, Document } from 'mongoose';
import type { UserRole } from './User.model.js';

export interface IPageAccessPermission extends Document {
  role: UserRole;
  page: string; // 'collector', 'admin', 'dashboard', 'about'
  allowed: boolean;
}

const PageAccessPermissionSchema = new Schema<IPageAccessPermission>(
  {
    role: {
      type: String,
      enum: ['Admin', 'Supervisor', 'EntityDirector', 'Editor'],
      required: true,
    },
    page: { type: String, required: true },
    allowed: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

PageAccessPermissionSchema.index({ role: 1, page: 1 }, { unique: true });

export const PageAccessPermissionModel = model<IPageAccessPermission>(
  'PageAccessPermission',
  PageAccessPermissionSchema,
  'page_access_permissions'
);

// Fonction pour initialiser les permissions par défaut
export async function initializeDefaultPagePermissions() {
  const defaultPermissions = [
    // Collector - accessible à tous
    { role: 'Admin', page: 'collector', allowed: true },
    { role: 'Supervisor', page: 'collector', allowed: true },
    { role: 'EntityDirector', page: 'collector', allowed: true },
    { role: 'Editor', page: 'collector', allowed: true },
    
    // Admin - accessible uniquement aux admins
    { role: 'Admin', page: 'admin', allowed: true },
    { role: 'Supervisor', page: 'admin', allowed: false },
    { role: 'EntityDirector', page: 'admin', allowed: false },
    { role: 'Editor', page: 'admin', allowed: false },
    
    // Dashboard - accessible à tous
    { role: 'Admin', page: 'dashboard', allowed: true },
    { role: 'Supervisor', page: 'dashboard', allowed: true },
    { role: 'EntityDirector', page: 'dashboard', allowed: true },
    { role: 'Editor', page: 'dashboard', allowed: true },
    
    // About - accessible à tous
    { role: 'Admin', page: 'about', allowed: true },
    { role: 'Supervisor', page: 'about', allowed: true },
    { role: 'EntityDirector', page: 'about', allowed: true },
    { role: 'Editor', page: 'about', allowed: true },
  ];

  for (const perm of defaultPermissions) {
    await PageAccessPermissionModel.findOneAndUpdate(
      { role: perm.role, page: perm.page },
      perm,
      { upsert: true }
    );
  }

  console.log('✅ Permissions d\'accès aux pages initialisées');
}

