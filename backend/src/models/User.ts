// src/models/User.ts — Mongoose model for application users
// Covers both email/password accounts and Google OAuth accounts.
// The same model is used for managers and staff; role controls what they can do.

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// TypeScript interface describing the shape of a User document
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string; // Optional — Google-only users have no password
  role: 'manager' | 'staff';
  googleId?: string;    // Set only when the user signs in via Google OAuth
  createdAt: Date;
  updatedAt: Date;
  comparePassword(plainTextPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true, // Normalise email to lowercase so "User@Email.com" and "user@email.com" are the same account
      trim: true,
    },
    passwordHash: {
      type: String,
      // Not required at schema level because Google OAuth users have no password.
      // select:false means queries leave it out unless they ask for it with '+passwordHash'.
      select: false,
    },
    role: {
      type: String,
      enum: ['manager', 'staff'],
      default: 'manager', // Default to manager so the first user who registers can manage equipment
    },
    googleId: {
      type: String,
      sparse: true, // Allow many documents where googleId is undefined without index conflicts
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Instance method to compare a plain-text password against the stored bcrypt hash.
// This lives on the model so the comparison logic is in one place and controllers stay thin.
userSchema.methods.comparePassword = async function (
  plainTextPassword: string
): Promise<boolean> {
  if (!this.passwordHash) {
    // If there is no hash (Google-only user), the comparison always fails
    return false;
  }
  return bcrypt.compare(plainTextPassword, this.passwordHash);
};

// Shape every user sent to the browser: expose `id` (instead of `_id`), and never
// include the password hash, the Google ID or Mongoose's version counter.
userSchema.set('toJSON', {
  transform(_doc, ret) {
    // Mongoose types `ret` as the full document, which does not allow `delete`
    const plainUser = ret as unknown as Record<string, unknown>;
    plainUser.id = String(plainUser._id);
    delete plainUser._id;
    delete plainUser.__v;
    delete plainUser.passwordHash;
    delete plainUser.googleId;
    return plainUser;
  },
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;
