import type { Request, Response, NextFunction } from 'express';

interface ErrorLogEntry {
  type: 'ERROR';
  requestId: string;
  route: string;
  method: string;
  status: number;
  message: string;
  timestamp: string;
  stack?: string;
}

/**
 * Centralized error handler middleware.
 * - Logs structured JSON error for operability
 * - Returns sanitized error response (no stack trace in production)
 * - Must be registered AFTER all routes
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = (err as any).status || (err as any).statusCode || 500;
  const isProduction = process.env['NODE_ENV'] === 'production';

  const logEntry: ErrorLogEntry = {
    type: 'ERROR',
    requestId: req.requestId || 'unknown',
    route: req.path,
    method: req.method,
    status,
    message: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  };

  // Include stack trace in logs for non-production environments
  if (!isProduction && err.stack) {
    logEntry.stack = err.stack;
  }

  // Log structured JSON line
  console.error(JSON.stringify(logEntry));

  // Send sanitized response to client
  const responseBody: { error: string; message: string; requestId: string; stack?: string } = {
    error: status >= 500 ? 'Internal Server Error' : 'Request Error',
    message: isProduction && status >= 500 ? 'An unexpected error occurred' : err.message,
    requestId: req.requestId || 'unknown',
  };

  // Include stack trace in response only in development
  if (!isProduction && err.stack) {
    responseBody.stack = err.stack;
  }

  res.status(status).json(responseBody);
}
