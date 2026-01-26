import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './authenticate.js';

const DEFAULT_MAX_AGE_SECONDS = 300; // 5 minutes

export function requireRecentAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const maxAgeSeconds = parseInt(
    process.env['ADMIN_STEP_UP_MAX_AGE_SECONDS'] ?? String(DEFAULT_MAX_AGE_SECONDS),
    10
  );

  const iat = req.user?.iat;

  if (!iat) {
    res.status(401).json({
      error: 'Reauthentication required',
      code: 'REAUTH_REQUIRED',
    });
    return;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const tokenAgeSeconds = nowSeconds - iat;

  if (tokenAgeSeconds > maxAgeSeconds) {
    res.status(401).json({
      error: 'Reauthentication required',
      code: 'REAUTH_REQUIRED',
    });
    return;
  }

  next();
}
