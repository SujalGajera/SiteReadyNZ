// src/middleware/authMiddleware.ts — JWT authentication guard
// Every protected route passes through this middleware before the controller runs.
// It finds the token, verifies it, and attaches the decoded identity to req.user so
// downstream handlers can trust who is making the request.

import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwtHelper';
import { AUTH_COOKIE_NAME } from '../utils/authCookie';

// Passport already declares `req.user` as an (empty) Express.User interface.
// Re-declaring `user` on Request would clash with it, so we extend Express.User
// instead. After this middleware runs, req.user.id and req.user.role are typed.
declare global {
  namespace Express {
    interface User extends TokenPayload {}
  }
}

/**
 * Finds the JWT on the request. The browser app sends it in the httpOnly cookie;
 * Postman and other API clients can send `Authorization: Bearer <token>` instead.
 *
 * If both are present the header wins: a caller who set it on purpose means "act as this identity",
 * while a cookie is sent automatically and may be left over from an earlier sign-in (for example
 * a Postman cookie jar after switching from a manager to a staff account).
 */
function extractToken(req: Request): string | undefined {
  const authorizationHeader = req.headers.authorization;
  if (authorizationHeader?.startsWith('Bearer ')) {
    return authorizationHeader.slice('Bearer '.length);
  }

  return req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
}

export function requireAuthentication(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);

  if (!token) {
    // No token was sent — reject before hitting any controller logic
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  try {
    // Attach the decoded identity so route handlers can read req.user.id and req.user.role
    req.user = verifyToken(token);
    next();
  } catch {
    // verifyToken throws when the token is expired, tampered with, or uses the wrong secret
    res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }
}
