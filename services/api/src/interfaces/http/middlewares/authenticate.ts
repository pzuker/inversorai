import type { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    role: string;
  };
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const role = req.headers['x-user-role'] as string | undefined;

  if (!role) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  req.user = { role };
  next();
}
