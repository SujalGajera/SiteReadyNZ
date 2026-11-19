// src/middleware/errorHandler.ts — Global Express error handler
// Registered as the last middleware in app.ts so it catches errors passed via next(error).
// Centralising error responses here means controllers never format error messages themselves.

import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

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
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Database problems caused by the request (not by a server fault) become clean 4xx answers
  const mongoError = error as AppError & { code?: number; keyValue?: Record<string, unknown> };
  if (mongoError.code === 11000) {
    // A unique field (like serial number) already exists
    const field = Object.keys(mongoError.keyValue ?? {})[0] ?? 'value';
    res.status(409).json({ error: `That ${field} is already in use.` });
    return;
  }
  if (error.name === 'CastError') {
    res.status(400).json({ error: 'One of the values sent has the wrong format.' });
    return;
  }
  if (error.name === 'ValidationError') {
    res.status(400).json({ error: error.message });
    return;
  }

  const statusCode = error.statusCode ?? error.status ?? 500;

  if (statusCode >= 500) {
    // Real server faults are logged with the stack trace and enough context to find the request
    logger.error('Unhandled server error', {
      message: error.message,
      stack: error.stack,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id,
    });
    // The client only gets a generic message so internals are never leaked
    res.status(statusCode).json({ error: 'An unexpected server error occurred.' });
    return;
  }

  // Expected problems (wrong password, duplicate email, bad JSON) are safe to explain, and noted at warn level
  logger.warn(`${statusCode} ${req.method} ${req.originalUrl}: ${error.message}`);
  res.status(statusCode).json({ error: error.message });
}
