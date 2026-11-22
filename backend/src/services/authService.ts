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

// A valid bcrypt hash (cost 12) of a random value nobody knows. Only used to spend the same time on a login
// for an email that has no account (see authenticateUser). It protects nothing, so it is safe to keep in code.
const UNKNOWN_EMAIL_HASH = '$2a$12$MB1tnR4cyIPN807T1G2i8uU.19sa9jRStOP8vVtDnKYUERMfioppe';

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

  // When the email is unknown we still do the same slow password check, against a throwaway hash.
  // Otherwise "no such email" would answer noticeably faster than "wrong password", which tells an
  // attacker which emails have accounts.
  const passwordIsCorrect = user ? await user.comparePassword(password) : await bcrypt.compare(password, UNKNOWN_EMAIL_HASH).then(() => false);
  if (!user || !passwordIsCorrect) {
    throw httpError(401, 'Invalid email or password.');
  }

  return user;
}

/** What we take from a Google profile after Google has signed the person in */
export interface GoogleIdentity {
  googleId: string;
  email: string;
  /** Google's own statement that the person has proved they own this address */
  emailVerified: boolean;
  name: string;
}

/**
 * Finds the account for a Google sign-in, linking or creating it when needed.
 * An email Google has not verified is refused, because linking by email would let someone who only
 * claims an address take over the existing account that uses it.
 */
export async function findOrCreateGoogleUser(identity: GoogleIdentity): Promise<IUser> {
  // The Google id is the safest way to recognise a returning person
  const returning = await userRepository.findByGoogleId(identity.googleId);
  if (returning) return returning;

  if (!identity.emailVerified) {
    throw httpError(403, 'Google has not verified this email address, so it cannot be used to sign in.');
  }

  const email = identity.email.trim().toLowerCase();
  const sameEmail = await userRepository.findByEmail(email);
  if (sameEmail) {
    // This address already has an account, and it belongs to a different Google person
    if (sameEmail.googleId) throw httpError(403, 'This email is already linked to another Google account.');
    // Same person who registered with a password earlier: link the two
    sameEmail.googleId = identity.googleId;
    return userRepository.save(sameEmail);
  }

  // First-time sign-in: no passwordHash, because this person only ever signs in with Google
  return userRepository.create({ name: identity.name, email, googleId: identity.googleId });
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