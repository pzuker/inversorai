import type { Response, NextFunction } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
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

type RateLimitStoreType = 'memory' | 'supabase';

interface SupabaseRateLimitResult {
  allowed: boolean;
  remaining: number;
  reset_at: string;
}

// Singleton supabase client for rate limiting (lazy initialized)
let supabaseClient: SupabaseClient | null = null;

export function setSupabaseClientForRateLimiter(client: SupabaseClient | null): void {
  supabaseClient = client;
}

export function getSupabaseClientForRateLimiter(): SupabaseClient | null {
  return supabaseClient;
}

function getOrCreateSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  // Lazy import to avoid circular dependencies and allow mocking
  const { createSupabaseClient } = require('../../../infrastructure/supabase/createSupabaseClient.js');
  supabaseClient = createSupabaseClient();
  return supabaseClient as SupabaseClient;
}

function getRateLimitStoreType(): RateLimitStoreType {
  const storeType = process.env['RATE_LIMIT_STORE'];
  if (storeType === 'supabase') {
    return 'supabase';
  }
  return 'memory';
}

async function checkRateLimitSupabase(
  key: string,
  windowSeconds: number,
  maxRequests: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date } | null> {
  try {
    const client = getOrCreateSupabaseClient();
    const { data, error } = await client.rpc('rate_limit_check_and_increment', {
      p_key: key,
      p_window_seconds: windowSeconds,
      p_max: maxRequests,
    });

    if (error) {
      console.error('[RateLimiter] Supabase RPC error:', error.message);
      return null;
    }

    const result = data as SupabaseRateLimitResult[] | null;
    if (!result || result.length === 0) {
      console.error('[RateLimiter] Supabase RPC returned empty result');
      return null;
    }

    const row = result[0] as SupabaseRateLimitResult;
    return {
      allowed: row.allowed,
      remaining: row.remaining,
      resetAt: new Date(row.reset_at),
    };
  } catch (err) {
    console.error('[RateLimiter] Supabase call failed:', err);
    return null;
  }
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, maxRequests, resourceName } = options;
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    // Skip rate limiting when explicitly disabled (for testing)
    if (process.env['DISABLE_RATE_LIMIT'] === 'true') {
      next();
      return;
    }

    // Extract user identifier (use authenticated user.id, fallback to IP)
    const userId = req.user?.id ?? req.ip ?? req.headers['x-forwarded-for'] ?? 'anonymous';
    const assetSymbol = (req.body?.symbol ?? req.query['symbol'] ?? 'unknown') as string;

    // Key format: resource:userId:assetSymbol
    const key = `${resourceName}:${userId}:${assetSymbol}`;
    const storeType = getRateLimitStoreType();

    if (storeType === 'supabase') {
      const result = await checkRateLimitSupabase(key, windowSeconds, maxRequests);

      if (result === null) {
        // Fail-closed: if Supabase is unavailable, reject the request
        res.status(503).json({
          error: 'Service Unavailable',
          message: 'Rate limiting unavailable',
        });
        return;
      }

      if (!result.allowed) {
        const retryAfterSeconds = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);

        res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded for asset ${assetSymbol}. Try again in ${retryAfterSeconds} seconds.`,
          asset: assetSymbol,
          retryAfter: Math.max(1, retryAfterSeconds),
        });
        return;
      }

      next();
      return;
    }

    // Memory store (default)
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

// Cleanup expired entries periodically (every 10 minutes) - only for memory store
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

// For testing: clear all rate limit entries
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}
