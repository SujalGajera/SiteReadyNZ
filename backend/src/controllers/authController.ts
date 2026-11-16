// src/controllers/authController.ts — Handles user registration, login, and Google OAuth
// Controllers are thin: they validate the HTTP request, call the appropriate
// service or model, and return the response. No business logic lives here.

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';

import User, { IUser } from '../models/User';
import { signToken } from '../utils/jwtHelper';

/**
 * POST /auth/register
 * Creates a new user account with an email and hashed password.
 * Returns a JWT and the user object (without passwordHash).
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Reject the request immediately if express-validator found any problems
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res.status(400).json({ errors: validationErrors.array() });
      return;
    }

    const { name, email, password, role } = req.body as {
      name: string;
      email: string;
      password: string;
      role?: 'manager' | 'staff';
    };

    // Check if an account with this email already exists before attempting to create one
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    // Hash the password with bcrypt — 12 salt rounds is the AGENT_RULES minimum
    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role ?? 'manager',
    });

    // Sign a JWT for the new user so they are immediately logged in after registering
    const token = signToken(newUser.id as string, newUser.role);

    // Status 201 — a new resource was created
    res.status(201).json({ token, user: newUser });
  } catch (error) {
    next(error); // Pass unexpected errors to the global error handler
  }
}

/**
 * POST /auth/login
 * Verifies email + password and returns a JWT on success.
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res.status(400).json({ errors: validationErrors.array() });
      return;
    }

    const { email, password } = req.body as { email: string; password: string };

    // Find the user and explicitly select passwordHash — it is excluded by toJSON but
    // we need it here to do the comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+passwordHash'
    );

    if (!user) {
      // Use a vague error message to avoid revealing which emails are registered
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const passwordIsCorrect = await user.comparePassword(password);
    if (!passwordIsCorrect) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signToken(user.id as string, user.role);

    // Status 200 — successful read/action, no new resource created
    res.status(200).json({ token, user });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /auth/google/callback
 * Called by Passport after Google OAuth succeeds.
 * Signs a JWT for the Google-authenticated user and redirects the browser
 * back to the frontend with the token in the query string.
 */
export function googleCallback(
  req: Request,
  res: Response
): void {
  // Passport attaches the user to req.user after the Google strategy runs
  const user = req.user as IUser;

  if (!user) {
    // If Passport did not attach a user, the OAuth flow failed
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    return;
  }

  const token = signToken(user.id as string, user.role);

  // Redirect the browser to the frontend dashboard with the token.
  // The frontend reads the token from the URL and stores it.
  res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
}
