// src/middleware/roleGuard.ts — Role-based access control middleware factory
// Returns a middleware function that only allows users whose role matches
// the required role. Always stack this AFTER requireAuthentication because
// it depends on req.user being set.

import { Request, Response, NextFunction } from 'express';

/**
 * requireRole('manager') returns a middleware that blocks any request
 * where req.user.role is not 'manager', responding with 403 Forbidden.
 *
 * Usage: router.post('/equipment', requireAuthentication, requireRole('manager'), controller)
 */
export function requireRole(allowedRole: string) {
  return function checkRole(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      // This guard should always run after requireAuthentication — if req.user is missing
      // it means the middleware was applied in the wrong order
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    if (req.user.role !== allowedRole) {
      // The user is authenticated but does not have the required role
      res.status(403).json({
        error: `Access denied. This action requires the '${allowedRole}' role.`,
      });
      return;
    }

    // Role matches — let the request through to the controller
    next();
  };
}
