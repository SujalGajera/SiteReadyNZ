// src/middleware/googleOAuth.ts — CSRF protection for the Google sign-in round trip.
//
// The risk: an attacker could trick a user's browser into finishing a Google sign-in that
// the attacker started, logging the user into the attacker's account. The defence is the
// OAuth `state` value. We make a random one, keep a copy in a short-lived httpOnly cookie,
// send the other copy to Google, and only accept the callback if Google returns the same value.

import { randomBytes, timingSafeEqual } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import passport, { isGoogleAuthConfigured } from '../config/passport';
import {
  OAUTH_STATE_COOKIE_NAME,
  setOAuthStateCookie,
  clearOAuthStateCookie,
} from '../utils/authCookie';

const loginErrorUrl = (code: string): string => `${process.env.CLIENT_URL}/login?error=${code}`;

/** Step 1: create the state value, remember it, and send the user to Google */
export function startGoogleSignIn(req: Request, res: Response, next: NextFunction): void {
  if (!isGoogleAuthConfigured) {
    res.redirect(loginErrorUrl('google_unavailable'));
    return;
  }

  const state = randomBytes(24).toString('hex');
  setOAuthStateCookie(res, state);

  passport.authenticate('google', { scope: ['profile', 'email'], session: false, state })(req, res, next);
}

/** Compares two strings without leaking, through timing, how many characters matched */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

/** Step 2a: reject the callback unless Google echoed back the state we issued */
export function verifyGoogleState(req: Request, res: Response, next: NextFunction): void {
  const expectedState = req.cookies?.[OAUTH_STATE_COOKIE_NAME] as string | undefined;
  const returnedState = typeof req.query.state === 'string' ? req.query.state : undefined;

  // The state is single-use, so remove it whatever the outcome
  clearOAuthStateCookie(res);

  if (!expectedState || !returnedState || !safeEqual(expectedState, returnedState)) {
    res.redirect(loginErrorUrl('oauth_state_mismatch'));
    return;
  }
  next();
}

/** Step 2b: let Passport exchange the code with Google and load or create the user */
export function completeGoogleSignIn(req: Request, res: Response, next: NextFunction): void {
  if (!isGoogleAuthConfigured) {
    res.redirect(loginErrorUrl('google_unavailable'));
    return;
  }
  passport.authenticate('google', { session: false, failureRedirect: loginErrorUrl('oauth_failed') })(req, res, next);
}
