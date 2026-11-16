// src/middleware/errorHandler.ts — Global Express error handler
// Registered as the last middleware in app.ts so it catches errors passed via next(error).
// Centralising error responses here means controllers never need to format error messages themselves.

import { Request, Response, NextFunction } from 'express';

// Custom error type that allows attaching an HTTP status code to any thrown error
export interface AppError extends Error {
  statusCode?: number;
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
  // Log the full error server-side so developers can diagnose issues
  console.error('❌ Unhandled error:', error);

  // Use the status code attached to the error if available, otherwise default to 500
  const statusCode = error.statusCode ?? 500;

  res.status(statusCode).json({
    error: error.message || 'An unexpected server error occurred.',
  });
}
