// src/routes/authRoutes.ts — Route definitions for authentication endpoints
// Applies express-validator rules at the route level so the controller receives
// only pre-validated data.

import { Router } from 'express';
import { body } from 'express-validator';
import passport from '../config/passport';
import { register, login, googleCallback } from '../controllers/authController';

const authRouter = Router();

// ----- Email / password registration -----
authRouter.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required'),
    body('email')
      .isEmail()
      .withMessage('A valid email address is required')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('role')
      .optional()
      .isIn(['manager', 'staff'])
      .withMessage("Role must be 'manager' or 'staff'"),
  ],
  register
);

// ----- Email / password login -----
authRouter.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('A valid email address is required')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  login
);

// ----- Google OAuth — step 1: redirect to Google -----
// passport.authenticate kicks off the OAuth flow by redirecting the browser to Google
authRouter.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// ----- Google OAuth — step 2: callback from Google -----
// Google redirects back here after the user grants permission
authRouter.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/auth/google/failed',
    session: false, // We use JWT, not Passport sessions
  }),
  googleCallback
);

export default authRouter;
