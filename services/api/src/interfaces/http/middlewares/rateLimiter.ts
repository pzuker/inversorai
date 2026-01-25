import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './authenticate.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, maxRequests } = options;

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Skip rate limiting in test environment
    if (process.env['NODE_ENV'] === 'test') {
      next();
      return;
    }

    // Use IP address as rate limit key (user ID not available in current auth)
    const clientKey = req.ip ?? req.headers['x-forwarded-for'] ?? 'anonymous';
    const key = `${req.path}:${clientKey}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (entry && now < entry.resetAt) {
      if (entry.count >= maxRequests) {
        const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);

        res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
          retryAfter: retryAfterSeconds,
        });
        return;
      }

      entry.count++;
    } else {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
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
