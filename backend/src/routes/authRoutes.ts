// src/routes/authRoutes.ts — URL definitions for authentication.
// Validation rules sit next to each route so it is obvious what each endpoint accepts.

import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { register, login, logout, getCurrentUser, googleCallback } from '../controllers/authController';
import { requireAuthentication } from '../middleware/authMiddleware';
import { startGoogleSignIn, verifyGoogleState, completeGoogleSignIn } from '../middleware/googleOAuth';

const authRouter = Router();

// Slows down password guessing: at most 20 register/login attempts per IP every 15 minutes
const credentialsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

// bcrypt only reads the first 72 bytes of a password, so longer ones are rejected
const passwordRules = body('password')
  .isLength({ min: 8, max: 72 })
  .withMessage('Password must be between 8 and 72 characters');

// ----- Email and password -----
authRouter.post(
  '/register',
  credentialsRateLimit,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }).withMessage('Name is too long'),
    body('email').trim().isEmail().withMessage('A valid email address is required'),
    passwordRules,
    body('role').optional().isIn(['manager', 'staff']).withMessage("Role must be 'manager' or 'staff'"),
  ],
  register
);

authRouter.post(
  '/login',
  credentialsRateLimit,
  [
    body('email').trim().isEmail().withMessage('A valid email address is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

authRouter.post('/logout', logout);

// Returns the signed-in user. The frontend calls this on page load to restore the session.
authRouter.get('/me', requireAuthentication, getCurrentUser);

// ----- Google OAuth 2.0 -----
authRouter.get('/google', startGoogleSignIn);
authRouter.get('/google/callback', verifyGoogleState, completeGoogleSignIn, googleCallback);

export default authRouter;
