// src/config/passport.ts — Passport.js Google OAuth 2.0 strategy configuration
// Passport handles the OAuth handshake; we just define what to do with the
// Google profile once the user has authenticated successfully.

import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import User from '../models/User';

// Google sign-in is optional while developing: passport-google-oauth20 throws at
// construction time if clientID is empty, which would stop the whole API from starting.
// So the strategy is only registered when real credentials are present.
// The placeholder text from .env.example ("your_google_client_id...") counts as "not set".
const isRealValue = (value: string | undefined): value is string =>
  Boolean(value) && !value!.startsWith('your_');

export const isGoogleAuthConfigured =
  isRealValue(process.env.GOOGLE_CLIENT_ID) && isRealValue(process.env.GOOGLE_CLIENT_SECRET);

if (!isGoogleAuthConfigured) {
  console.warn('⚠️  GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google sign-in is disabled.');
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

        // Look for an existing user by Google ID first, then by email.
        // This handles the case where the same person registers via email first
        // and then later signs in with Google using the same address.
        let existingUser = await User.findOne({ googleId: profile.id });

        if (!existingUser) {
          existingUser = await User.findOne({ email });
        }

        if (existingUser) {
          // Link the Google ID to an existing email account if not already linked
          if (!existingUser.googleId) {
            existingUser.googleId = profile.id;
            await existingUser.save();
          }
          return done(null, existingUser as unknown as Express.User);
        }

        // First-time Google sign-in — create a new account for this person
        const newUser = await User.create({
          name: profile.displayName,
          email,
          googleId: profile.id,
          // No passwordHash because this user will only ever sign in via Google
        });

        return done(null, newUser as unknown as Express.User);
      } catch (error) {
        return done(error);
      }
    }
  )
);

export default passport;
