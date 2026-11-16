// src/utils/jwtHelper.ts — Helper functions for creating and verifying JWTs
// Keeping these in one place means the secret and signing options are never
// duplicated across controllers or middleware.

import jwt from 'jsonwebtoken';

// Shape of the data stored inside each token
export interface TokenPayload {
  id: string;   // MongoDB user document ID
  role: string; // 'manager' or 'staff' — copied here so role checks don't need a DB lookup
}

/**
 * Creates a signed JWT containing the user's ID and role.
 * The token expires after the duration set in JWT_EXPIRES_IN (default: 7 days).
 */
export function signToken(userId: string, role: string): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured — cannot sign tokens');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';

  return jwt.sign({ id: userId, role } satisfies TokenPayload, secret, {
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
  const decoded = jwt.verify(token, secret) as TokenPayload;
  return decoded;
}
