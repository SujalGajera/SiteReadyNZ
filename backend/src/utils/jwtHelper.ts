// src/utils/jwtHelper.ts — Helper functions for creating and verifying JWTs
// Keeping these in one place means the secret and signing options are never
// duplicated across controllers or middleware.

import jwt from 'jsonwebtoken';

// Shape of the data stored inside each token
export interface TokenPayload {
  id: string;   // MongoDB user document ID
  role: string; // 'manager' or 'staff' — copied here so role checks don't need a DB lookup
  orgId: string; // The workspace this user belongs to. Every query is limited to it.
}

/**
 * Creates a signed JWT containing the user's ID and role.
 * The token expires after the duration set in JWT_EXPIRES_IN (default: 7 days).
 */
export function signToken(userId: string, role: string, orgId: string): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured — cannot sign tokens');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';

  return jwt.sign({ id: userId, role, orgId } satisfies TokenPayload, secret, {
    algorithm: 'HS256',
    expiresIn,
  } as jwt.SignOptions);
}

/**
 * Verifies a JWT and returns its decoded payload.
 * Throws if the token is invalid, expired, or the secret does not match.
 * Callers should wrap this in try/catch and return 401 on failure.
 */
export function verifyToken(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured — cannot verify tokens');
  }

  // jwt.verify throws JsonWebTokenError / TokenExpiredError on failure
  // Only HS256 is accepted, so a token cannot choose a weaker or different algorithm for itself
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as TokenPayload;

  // Tokens issued before workspaces existed have no orgId. Refusing them (instead of letting a
  // missing id turn into "match everything" in a database query) forces a fresh sign-in.
  if (!decoded.orgId) {
    throw new Error('Token has no workspace. Please sign in again.');
  }
  return decoded;
}
