import { Schema, model, Document } from 'mongoose';
import type { UserRole } from './User.model.js';

export interface IPermission extends Document {
  role: UserRole;
  operation: string;
  allowed: boolean;
}

const PermissionSchema = new Schema<IPermission>(
  {
    role: {
      type: String,
      enum: ['Admin', 'Supervisor', 'EntityDirector', 'Editor'],
      required: true,
    },
    operation: { type: String, required: true },
    allowed: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

PermissionSchema.index({ role: 1, operation: 1 }, { unique: true });

export const PermissionModel = model<IPermission>('Permission', PermissionSchema, 'permissions');


