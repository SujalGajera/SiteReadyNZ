// src/config/passport.ts — Passport.js Google OAuth 2.0 strategy configuration
// Passport handles the OAuth handshake; we just define what to do with the
// Google profile once the user has authenticated successfully.

import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { findOrCreateGoogleUser } from '../services/authService';
import type { AppError } from '../middleware/errorHandler';
import logger from './logger';

// Google sign-in is optional while developing: passport-google-oauth20 throws at
// construction time if clientID is empty, which would stop the whole API from starting.
// So the strategy is only registered when real credentials are present.
// The placeholder text from .env.example ("your_google_client_id...") counts as "not set".
const isRealValue = (value: string | undefined): value is string =>
  Boolean(value) && !value!.startsWith('your_');

export const isGoogleAuthConfigured =
  isRealValue(process.env.GOOGLE_CLIENT_ID) && isRealValue(process.env.GOOGLE_CLIENT_SECRET);

if (!isGoogleAuthConfigured) {
  logger.warn('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set, so Google sign-in is disabled.');
}

if (isGoogleAuthConfigured) passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? '',
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: (error: unknown, user?: Express.User | false) => void
    ) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          // Google did not provide an email — cannot create a usable account
          return done(new Error('No email returned from Google OAuth'));
        }

        // Finding, linking or creating the account is a business rule, so it lives in authService
        const user = await findOrCreateGoogleUser({
          googleId: profile.id,
          email,
          // Google sends a real true/false; anything else counts as "not verified"
          emailVerified: profile.emails?.[0]?.verified === true,
          name: profile.displayName,
        });
        return done(null, user as unknown as Express.User);
      } catch (error) {
        // A refusal (unverified email, address linked elsewhere) sends the person back to the login page
        // with a message, instead of showing a raw error. Real faults still go to the error handler.
        const statusCode = (error as AppError).statusCode;
        if (statusCode !== undefined && statusCode < 500) {
          logger.warn(`Google sign-in refused: ${(error as Error).message}`);
          return done(null, false);
        }
        return done(error);
      }
    }
  )
);

export default passport;
