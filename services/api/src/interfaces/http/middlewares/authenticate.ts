import type { Request, Response, NextFunction } from 'express';
import { verifySupabaseJwt, type VerifiedUser } from '../../../infrastructure/auth/index.js';

export interface AuthenticatedRequest extends Request {
  user?: VerifiedUser;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix

  try {
    const user = await verifySupabaseJwt(token);
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
