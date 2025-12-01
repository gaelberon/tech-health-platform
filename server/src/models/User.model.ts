import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'Admin' | 'Supervisor' | 'EntityDirector' | 'Editor';

export interface IUser extends Document {
  userId: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  associatedEditorId?: string;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['Admin', 'Supervisor', 'EntityDirector', 'Editor'],
      required: true,
    },
    associatedEditorId: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

export const UserModel = model<IUser>('User', UserSchema, 'users');

export async function ensureDefaultAdminUser() {
  const existingAdmin = await UserModel.findOne({ role: 'Admin' });
  if (existingAdmin) {
    return;
  }

  const email = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!';

  const passwordHash = await bcrypt.hash(password, 10);

  const userId = 'admin-0001';

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

