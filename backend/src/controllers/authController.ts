// src/controllers/authController.ts — HTTP handlers for register, login, logout, "who am I", and Google OAuth.
// Controllers stay thin: read the request, call authService, set the cookie, send the response.

import { Request, Response, NextFunction } from 'express';

import { IUser } from '../models/User';
import { signToken } from '../utils/jwtHelper';
import { rejectIfInvalid } from '../utils/validation';
import { setAuthCookie, clearAuthCookie } from '../utils/authCookie';
import { registerUser, authenticateUser, getUserById, RegisterInput } from '../services/authService';

/**
 * Signs a token for the user, stores it in the httpOnly cookie, and returns it in the
 * body too. The body copy exists for Postman and API testing; the React app ignores it.
 */
function startSession(res: Response, user: IUser): string {
  const token = signToken(user.id as string, user.role);
  setAuthCookie(res, token);
  return token;
}

/** POST /auth/register — create an account and sign the user in (201) */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (rejectIfInvalid(req, res)) return;

    const user = await registerUser(req.body as RegisterInput);
    const token = startSession(res, user);

    res.status(201).json({ token, user });
  } catch (error) {
    next(error);
  }
}

/** POST /auth/login — check credentials and sign the user in (200) */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (rejectIfInvalid(req, res)) return;

    const { email, password } = req.body as { email: string; password: string };
    const user = await authenticateUser(email, password);
    const token = startSession(res, user);

    res.status(200).json({ token, user });
  } catch (error) {
    next(error);
  }
}

/** POST /auth/logout — remove the login cookie (204, no body) */
export function logout(_req: Request, res: Response): void {
  clearAuthCookie(res);
  res.status(204).send();
}

/**
 * GET /auth/me — returns the signed-in user. The frontend calls this on every page load
 * to restore the session, since it cannot read the httpOnly cookie itself.
 */
export async function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // requireAuthentication guarantees req.user exists on this route
    const user = await getUserById(req.user!.id);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /auth/google/callback — Passport has already verified the Google sign-in.
 * Start a session and send the browser back to the app. The token travels only in the
 * httpOnly cookie, never in the URL, so it cannot leak through browser history or logs.
 */
export function googleCallback(req: Request, res: Response): void {
  const user = req.user as unknown as IUser | undefined;

  if (!user) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    return;
  }

  startSession(res, user);
  res.redirect(`${process.env.CLIENT_URL}/`);
}
