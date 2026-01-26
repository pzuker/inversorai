import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './authenticate.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
  symbol: string;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  resourceName: string;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, maxRequests, resourceName } = options;

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Skip rate limiting in test environment
    if (process.env['NODE_ENV'] === 'test') {
      next();
      return;
    }

    // Extract user identifier (use authenticated user.id, fallback to IP)
    const userId = req.user?.id ?? req.ip ?? req.headers['x-forwarded-for'] ?? 'anonymous';
    const assetSymbol = (req.body?.symbol ?? req.query['symbol'] ?? 'unknown') as string;

    // Key format: resource:userId:assetSymbol
    const key = `${resourceName}:${userId}:${assetSymbol}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (entry && now < entry.resetAt) {
      if (entry.count >= maxRequests) {
        const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);

        res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded for asset ${assetSymbol}. Try again in ${retryAfterSeconds} seconds.`,
          asset: assetSymbol,
          retryAfter: retryAfterSeconds,
        });
        return;
      }

      entry.count++;
    } else {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
        symbol: assetSymbol,
      });
    }

    next();
  };
}

// Cleanup expired entries periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);
