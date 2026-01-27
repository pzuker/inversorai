import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Middleware that generates a unique request ID for each request.
 * - Generates a UUID v4 for each incoming request
 * - Attaches it to req.requestId for use in logging/tracing
 * - Sets X-Request-Id response header for client correlation
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
