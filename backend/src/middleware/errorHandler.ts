// src/middleware/errorHandler.ts — Global Express error handler
// Registered as the last middleware in app.ts so it catches errors passed via next(error).
// Centralising error responses here means controllers never format error messages themselves.

import { Request, Response, NextFunction } from 'express';

// Custom error type that allows attaching an HTTP status code to any thrown error.
// `status` is what body-parser uses (for example 400 on malformed JSON).
export interface AppError extends Error {
  statusCode?: number;
  status?: number;
}

/**
 * globalErrorHandler must have exactly four parameters for Express to treat it
 * as an error-handling middleware rather than a regular route handler.
 */
export function globalErrorHandler(
  error: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = error.statusCode ?? error.status ?? 500;

  if (statusCode >= 500) {
    // Real server faults get the full stack trace in the log for debugging
    console.error('❌ Unhandled error:', error);
    // The client only gets a generic message so internals are never leaked
    res.status(statusCode).json({ error: 'An unexpected server error occurred.' });
    return;
  }

  // Expected problems (wrong password, duplicate email, bad JSON) are safe to explain
  res.status(statusCode).json({ error: error.message });
}
