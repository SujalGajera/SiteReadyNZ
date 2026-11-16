// src/services/authService.ts — Business rules for accounts and passwords.
// Controllers call these functions; only this file knows how passwords are hashed
// and how a login is checked (AGENT_RULES: controllers thin, services thick).

import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import { AppError } from '../middleware/errorHandler';

// bcrypt cost factor. 12 is the minimum required by AGENT_RULES.
const BCRYPT_SALT_ROUNDS = 12;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: 'manager' | 'staff';
}

// Builds an error that errorHandler turns into the right HTTP status
function httpError(statusCode: number, message: string): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/** Creates an email/password account. Throws a 409 if the email is already used. */
export async function registerUser(input: RegisterInput): Promise<IUser> {
  const email = input.email.trim().toLowerCase();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw httpError(409, 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  return User.create({
    name: input.name.trim(),
    email,
    passwordHash,
    role: input.role ?? 'manager',
  });
}

/**
 * Checks an email and password. Throws the same vague 401 for "no such email" and
 * "wrong password" so an attacker cannot use the response to discover which emails exist.
 */
export async function authenticateUser(email: string, password: string): Promise<IUser> {
  // passwordHash is not selected by default, so ask for it explicitly here
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');

  const passwordIsCorrect = user ? await user.comparePassword(password) : false;
  if (!user || !passwordIsCorrect) {
    throw httpError(401, 'Invalid email or password.');
  }

  return user;
}

/** Looks up the user a valid token belongs to. Throws 401 if the account was deleted. */
export async function getUserById(userId: string): Promise<IUser> {
  const user = await User.findById(userId);
  if (!user) {
    throw httpError(401, 'This account no longer exists. Please sign in again.');
  }
  return user;
}
