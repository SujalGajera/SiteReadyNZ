// src/services/authService.ts — Business rules for accounts and passwords.
// Controllers call these functions; only this file knows how passwords are hashed
// and how a login is checked (AGENT_RULES: controllers thin, services thick).
// Stored accounts are read and written through repositories/userRepository.ts (Repository pattern).

import bcrypt from 'bcryptjs';
import type { IUser, UserRole } from '../models/User';
import { userRepository } from '../repositories/userRepository';
import { AppError } from '../middleware/errorHandler';

// bcrypt cost factor. 12 is the minimum required by AGENT_RULES.
const BCRYPT_SALT_ROUNDS = 12;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

// Builds an error that errorHandler turns into the right HTTP status
function httpError(statusCode: number, message: string): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * Creates an email/password account. Throws a 409 if the email is already used.
 * The role is NOT part of the input a client can send. Public sign-up always creates a manager;
 * managers create staff accounts through the staff service, which passes "staff" here.
 */
export async function registerUser(
  input: RegisterInput,
  role: UserRole = 'manager',
  organisationId?: string
): Promise<IUser> {
  const email = input.email.trim().toLowerCase();

  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw httpError(409, 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  return userRepository.create({
    name: input.name.trim(),
    email,
    passwordHash,
    role,
    organisationId,
  });
}

/**
 * Checks an email and password. Throws the same vague 401 for "no such email" and
 * "wrong password" so an attacker cannot use the response to discover which emails exist.
 */
export async function authenticateUser(email: string, password: string): Promise<IUser> {
  // The password hash is hidden by default, so this lookup asks for it explicitly
  const user = await userRepository.findByEmailWithPassword(email.trim().toLowerCase());

  const passwordIsCorrect = user ? await user.comparePassword(password) : false;
  if (!user || !passwordIsCorrect) {
    throw httpError(401, 'Invalid email or password.');
  }

  return user;
}

/** Looks up the user a valid token belongs to. Throws 401 if the account was deleted. */
export async function getUserById(userId: string): Promise<IUser> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw httpError(401, 'This account no longer exists. Please sign in again.');
  }
  return user;
}

/**
 * The workspace id to put in this user's token. Accounts created before workspaces existed have
 * none stored; a manager's workspace then falls back to their own id, which is what new managers get.
 */
export function getOrganisationId(user: IUser): string {
  return String(user.organisationId ?? user._id);
}