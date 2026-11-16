// src/utils/authCookie.ts — Reads, writes and clears the login cookie.
//
// Why a cookie and not localStorage: an httpOnly cookie cannot be read by JavaScript,
// so a cross-site-scripting bug in the frontend cannot steal the login token
// (AGENT_RULES security checklist). The browser attaches it to requests automatically.
// Postman can still use an `Authorization: Bearer <token>` header (see authMiddleware).

import { CookieOptions, Response } from 'express';

export const AUTH_COOKIE_NAME = 'siteready_token';
export const OAUTH_STATE_COOKIE_NAME = 'siteready_oauth_state';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

// Options shared by every cookie we set
function baseOptions(): CookieOptions {
  return {
    httpOnly: true,             // JavaScript cannot read it
    secure: isProduction(),     // HTTPS-only once deployed (localhost is plain http)
    sameSite: 'lax',            // Not sent on cross-site POSTs, which blocks basic CSRF
    path: '/',
  };
}

/** Stores the signed JWT in the login cookie. Lifetime matches the token (7 days). */
export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, { ...baseOptions(), maxAge: SEVEN_DAYS_MS });
}

/** Removes the login cookie (logout). Options must match the ones used to set it. */
export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, baseOptions());
}

/** Stores the random OAuth `state` value for a few minutes while the user is at Google. */
export function setOAuthStateCookie(res: Response, state: string): void {
  res.cookie(OAUTH_STATE_COOKIE_NAME, state, { ...baseOptions(), maxAge: TEN_MINUTES_MS });
}

export function clearOAuthStateCookie(res: Response): void {
  res.clearCookie(OAUTH_STATE_COOKIE_NAME, baseOptions());
}
