import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'Admin' | 'Supervisor' | 'EntityDirector' | 'Editor';

export interface IUser extends Document {
  userId: string;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  associatedEditorId?: string; // Pour Editor/EntityDirector (un seul éditeur)
  associatedEditorIds?: string[]; // Pour Supervisor (plusieurs éditeurs dans le portefeuille)
  archived?: boolean;
  archivedAt?: Date;
  archivedBy?: string; // userId de l'admin qui a archivé
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, index: true }, // Plus unique seul, mais unique avec role
    role: {
      type: String,
      enum: ['Admin', 'Supervisor', 'EntityDirector', 'Editor'],
      required: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    phone: { type: String, required: false },
    associatedEditorId: { type: String, required: false }, // Pour Editor/EntityDirector
    associatedEditorIds: [{ type: String }], // Pour Supervisor (portefeuille d'éditeurs)
    archived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, required: false },
    archivedBy: { type: String, required: false },
    lastLoginAt: { type: Date, required: false },
  },
  {
    timestamps: true,
  }
);

// Index composé pour garantir l'unicité de la combinaison email + rôle
UserSchema.index({ email: 1, role: 1 }, { unique: true });

export const UserModel = model<IUser>('User', UserSchema, 'users');

// Fonction pour supprimer l'ancien index unique sur email seul (si il existe)
export async function removeOldEmailUniqueIndex() {
  try {
    const collection = UserModel.collection;
    const indexes = await collection.indexes();
    
    // Chercher l'index unique sur email seul
    const oldEmailIndex = indexes.find(
      (idx: any) => 
        idx.key && 
        idx.key.email === 1 && 
        !idx.key.role && 
        idx.unique === true
    );
    
    if (oldEmailIndex && oldEmailIndex.name) {
      console.log('🗑️  Suppression de l\'ancien index unique sur email...');
      await collection.dropIndex(oldEmailIndex.name);
      console.log('✅ Ancien index unique sur email supprimé avec succès');
    }
  } catch (error: any) {
    // Si l'index n'existe pas, c'est OK
    if (error.code !== 27) { // Code 27 = IndexNotFound
      console.warn('⚠️  Erreur lors de la suppression de l\'ancien index:', error.message);
    }
  }
}

export async function ensureDefaultAdminUser() {
  const existingAdmin = await UserModel.findOne({ role: 'Admin' });
  if (existingAdmin) {
    return;
  }

  const email = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!';

  const passwordHash = await bcrypt.hash(password, 10);

  const userId = 'user-0001';

  await UserModel.create({
    userId,
    email,
    passwordHash,
    role: 'Admin',
  });

  console.log('🔐 Admin par défaut créé :');
  console.log(`   email: ${email}`);
  console.log(`   mot de passe: ${password}`);
}

