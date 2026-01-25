import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './authenticate.js';

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  next();
}
