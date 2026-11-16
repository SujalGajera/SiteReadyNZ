// src/middleware/authMiddleware.ts — JWT authentication guard
// Every protected route must pass through this middleware before the controller runs.
// It reads the Bearer token, verifies it, and attaches the decoded user identity
// to req.user so downstream handlers can trust who is making the request.

import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwtHelper';

// Passport already declares `req.user` as an (empty) Express.User interface.
// Re-declaring `user` on Request would clash with it, so we extend Express.User
// instead. After this middleware runs, req.user.id and req.user.role are typed.
declare global {
  namespace Express {
    interface User extends TokenPayload {}
  }
}

export function requireAuthentication(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    // No token was sent — reject before hitting any controller logic
    res.status(401).json({ error: 'Authentication required. Please include a Bearer token.' });
    return;
  }

  // The header format is "Bearer <token>" — extract just the token part
  const token = authorizationHeader.split(' ')[1];

  try {
    const decodedPayload = verifyToken(token);
    // Attach the decoded identity so route handlers can read req.user.id and req.user.role
    req.user = decodedPayload;
    next();
  } catch {
    // verifyToken throws when the token is expired, tampered with, or uses the wrong secret
    res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}
