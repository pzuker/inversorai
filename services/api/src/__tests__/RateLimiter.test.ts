import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Response } from 'express';
import {
  createRateLimiter,
  clearRateLimitStore,
  setSupabaseClientForRateLimiter,
} from '../interfaces/http/middlewares/index.js';
import type { AuthenticatedRequest } from '../interfaces/http/middlewares/index.js';

describe('RateLimiter', () => {
  let originalDisableRateLimit: string | undefined;

  beforeEach(() => {
    originalDisableRateLimit = process.env['DISABLE_RATE_LIMIT'];
    clearRateLimitStore();
  });

  afterEach(() => {
    if (originalDisableRateLimit !== undefined) {
      process.env['DISABLE_RATE_LIMIT'] = originalDisableRateLimit;
    } else {
      delete process.env['DISABLE_RATE_LIMIT'];
    }
    clearRateLimitStore();
  });

  describe('when DISABLE_RATE_LIMIT=true', () => {
    it('calls next() without checking limits', () => {
      process.env['DISABLE_RATE_LIMIT'] = 'true';

      const rateLimiter = createRateLimiter({
        windowMs: 1000,
        maxRequests: 1,
        resourceName: 'test',
      });

      const mockReq = {
        user: { id: 'user-1', role: 'USER' },
        query: { symbol: 'BTC-USD' },
      } as unknown as AuthenticatedRequest;

      const mockRes = {} as Response;
      const mockNext = vi.fn();

      // Call multiple times - should all pass through
      rateLimiter(mockReq, mockRes, mockNext);
      rateLimiter(mockReq, mockRes, mockNext);
      rateLimiter(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(3);
    });
  });

  describe('when DISABLE_RATE_LIMIT is not set (memory store)', () => {
    let originalRateLimitStore: string | undefined;

    beforeEach(() => {
      delete process.env['DISABLE_RATE_LIMIT'];
      originalRateLimitStore = process.env['RATE_LIMIT_STORE'];
      process.env['RATE_LIMIT_STORE'] = 'memory';
    });

    afterEach(() => {
      if (originalRateLimitStore !== undefined) {
        process.env['RATE_LIMIT_STORE'] = originalRateLimitStore;
      } else {
        delete process.env['RATE_LIMIT_STORE'];
      }
    });

    it('allows requests within the limit', () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000, // 1 minute
        maxRequests: 3,
        resourceName: 'test',
      });

      const mockReq = {
        user: { id: 'user-1', role: 'USER' },
        query: { symbol: 'BTC-USD' },
      } as unknown as AuthenticatedRequest;

      const mockRes = {} as Response;
      const mockNext = vi.fn();

      // First 3 requests should pass
      rateLimiter(mockReq, mockRes, mockNext);
      rateLimiter(mockReq, mockRes, mockNext);
      rateLimiter(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(3);
    });

    it('returns 429 when limit is exceeded', () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000, // 1 minute
        maxRequests: 2,
        resourceName: 'test',
      });

      const mockReq = {
        user: { id: 'user-1', role: 'USER' },
        query: { symbol: 'BTC-USD' },
      } as unknown as AuthenticatedRequest;

      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as unknown as Response;
      const mockNext = vi.fn();

      // First 2 requests pass
      rateLimiter(mockReq, mockRes, mockNext);
      rateLimiter(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2);

      // 3rd request should be rate limited
      rateLimiter(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2); // Still 2
      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too Many Requests',
          asset: 'BTC-USD',
        })
      );
    });

    it('tracks limits per user and asset combination', () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        resourceName: 'test',
      });

      const mockRes = {} as Response;
      const mockNext = vi.fn();

      // User 1, BTC-USD
      const req1 = {
        user: { id: 'user-1', role: 'USER' },
        query: { symbol: 'BTC-USD' },
      } as unknown as AuthenticatedRequest;

      // User 1, AAPL (different asset)
      const req2 = {
        user: { id: 'user-1', role: 'USER' },
        query: { symbol: 'AAPL' },
      } as unknown as AuthenticatedRequest;

      // User 2, BTC-USD (different user)
      const req3 = {
        user: { id: 'user-2', role: 'USER' },
        query: { symbol: 'BTC-USD' },
      } as unknown as AuthenticatedRequest;

      rateLimiter(req1, mockRes, mockNext);
      rateLimiter(req2, mockRes, mockNext);
      rateLimiter(req3, mockRes, mockNext);

      // All 3 should pass because they have different keys
      expect(mockNext).toHaveBeenCalledTimes(3);
    });

    it('resets limit after window expires', async () => {
      const rateLimiter = createRateLimiter({
        windowMs: 50, // 50ms window for fast test
        maxRequests: 1,
        resourceName: 'test',
      });

      const mockReq = {
        user: { id: 'user-1', role: 'USER' },
        query: { symbol: 'BTC-USD' },
      } as unknown as AuthenticatedRequest;

      const mockRes = {} as Response;
      const mockNext = vi.fn();

      // First request passes
      rateLimiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Next request should pass (window reset)
      rateLimiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('uses IP when user is not authenticated', () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 1,
        resourceName: 'test',
      });

      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock });

      // Request without user, with IP
      const mockReq = {
        ip: '192.168.1.1',
        query: { symbol: 'BTC-USD' },
        headers: {},
      } as unknown as AuthenticatedRequest;

      const mockRes = { status: statusMock } as unknown as Response;
      const mockNext = vi.fn();

      rateLimiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      // Second request from same IP should be limited
      rateLimiter(mockReq, mockRes, mockNext);
      expect(statusMock).toHaveBeenCalledWith(429);
    });
  });

  describe('when RATE_LIMIT_STORE=supabase', () => {
    let originalRateLimitStore: string | undefined;

    beforeEach(() => {
      originalRateLimitStore = process.env['RATE_LIMIT_STORE'];
      process.env['RATE_LIMIT_STORE'] = 'supabase';
      delete process.env['DISABLE_RATE_LIMIT'];
    });

    afterEach(() => {
      if (originalRateLimitStore !== undefined) {
        process.env['RATE_LIMIT_STORE'] = originalRateLimitStore;
      } else {
        delete process.env['RATE_LIMIT_STORE'];
      }
      setSupabaseClientForRateLimiter(null);
    });

    it('calls supabase RPC with correct parameters when allowed', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: [{ allowed: true, remaining: 4, reset_at: new Date(Date.now() + 60000).toISOString() }],
        error: null,
      });

      const mockSupabaseClient = { rpc: mockRpc };
      setSupabaseClientForRateLimiter(mockSupabaseClient as any);

      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        resourceName: 'pipeline',
      });

      const mockReq = {
        user: { id: 'user-123', role: 'ADMIN' },
        body: { symbol: 'BTC-USD' },
      } as unknown as AuthenticatedRequest;

      const mockRes = {} as Response;
      const mockNext = vi.fn();

      await rateLimiter(mockReq, mockRes, mockNext);

      expect(mockRpc).toHaveBeenCalledWith('rate_limit_check_and_increment', {
        p_key: 'pipeline:user-123:BTC-USD',
        p_window_seconds: 60,
        p_max: 5,
      });
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('returns 429 when supabase reports not allowed', async () => {
      const futureResetAt = new Date(Date.now() + 30000).toISOString();
      const mockRpc = vi.fn().mockResolvedValue({
        data: [{ allowed: false, remaining: 0, reset_at: futureResetAt }],
        error: null,
      });

      const mockSupabaseClient = { rpc: mockRpc };
      setSupabaseClientForRateLimiter(mockSupabaseClient as any);

      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        resourceName: 'pipeline',
      });

      const mockReq = {
        user: { id: 'user-123', role: 'ADMIN' },
        body: { symbol: 'BTC-USD' },
      } as unknown as AuthenticatedRequest;

      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as unknown as Response;
      const mockNext = vi.fn();

      await rateLimiter(mockReq, mockRes, mockNext);

      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too Many Requests',
          asset: 'BTC-USD',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 503 when supabase RPC fails (fail-closed)', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });

      const mockSupabaseClient = { rpc: mockRpc };
      setSupabaseClientForRateLimiter(mockSupabaseClient as any);

      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        resourceName: 'pipeline',
      });

      const mockReq = {
        user: { id: 'user-123', role: 'ADMIN' },
        body: { symbol: 'BTC-USD' },
      } as unknown as AuthenticatedRequest;

      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as unknown as Response;
      const mockNext = vi.fn();

      await rateLimiter(mockReq, mockRes, mockNext);

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Service Unavailable',
        message: 'Rate limiting unavailable',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 503 when supabase RPC returns empty result', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const mockSupabaseClient = { rpc: mockRpc };
      setSupabaseClientForRateLimiter(mockSupabaseClient as any);

      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        resourceName: 'pipeline',
      });

      const mockReq = {
        user: { id: 'user-123', role: 'ADMIN' },
        body: { symbol: 'BTC-USD' },
      } as unknown as AuthenticatedRequest;

      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as unknown as Response;
      const mockNext = vi.fn();

      await rateLimiter(mockReq, mockRes, mockNext);

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 503 when supabase client throws exception', async () => {
      const mockRpc = vi.fn().mockRejectedValue(new Error('Network error'));

      const mockSupabaseClient = { rpc: mockRpc };
      setSupabaseClientForRateLimiter(mockSupabaseClient as any);

      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        resourceName: 'pipeline',
      });

      const mockReq = {
        user: { id: 'user-123', role: 'ADMIN' },
        body: { symbol: 'BTC-USD' },
      } as unknown as AuthenticatedRequest;

      const jsonMock = vi.fn();
      const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
      const mockRes = { status: statusMock } as unknown as Response;
      const mockNext = vi.fn();

      await rateLimiter(mockReq, mockRes, mockNext);

      expect(statusMock).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Service Unavailable',
        message: 'Rate limiting unavailable',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
