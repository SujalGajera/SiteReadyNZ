// src/utils/validation.ts — Shared helper for express-validator results.

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';

/**
 * Sends a 400 and returns true when the route's validation rules found a problem.
 * The body is `{ error, errors[] }`: one readable sentence for the UI, plus the
 * per-field detail so forms can show each message under the right input.
 */
export function rejectIfInvalid(req: Request, res: Response): boolean {
  const validationErrors = validationResult(req);
  if (validationErrors.isEmpty()) return false;

  const fieldErrors = validationErrors.array().map((issue) => ({
    field: issue.type === 'field' ? issue.path : 'request',
    message: issue.msg as string,
  }));
  res.status(400).json({ error: fieldErrors[0].message, errors: fieldErrors });
  return true;
}
