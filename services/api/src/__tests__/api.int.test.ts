import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import {
  setupJwtTestEnvironment,
  cleanupJwtTestEnvironment,
  generateAdminToken,
  generateUserToken,
} from './helpers/jwtTestHelper.js';

const hasSupabaseEnv = (): boolean => {
  return !!(process.env['SUPABASE_URL'] && process.env['SUPABASE_SERVICE_ROLE_KEY']);
};

const describeIfSupabase = hasSupabaseEnv() ? describe : describe.skip;

describeIfSupabase('API Integration Tests', () => {
  const TEST_SYMBOL = 'BTC-USD';
  const SUPPORTED_SYMBOLS = ['BTC-USD', 'AAPL', 'EURUSD=X'];

  let app: import('express').Express;
  let supabaseClient: import('@supabase/supabase-js').SupabaseClient;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    // Setup JWT test environment with mocked JWKS
    await setupJwtTestEnvironment();

    // Generate test tokens
    adminToken = await generateAdminToken();
    userToken = await generateUserToken();

    const { createApp } = await import('../interfaces/http/app.js');
    const { createSupabaseClient } = await import('../infrastructure/supabase/index.js');

    app = createApp();
    supabaseClient = createSupabaseClient();
  });

  afterAll(() => {
    cleanupJwtTestEnvironment();
  });

  beforeEach(async () => {
    await supabaseClient
      .from('market_data')
      .delete()
      .eq('asset_symbol', TEST_SYMBOL);
  });

  describe('GET /api/v1/assets', () => {
    const endpoint = '/api/v1/assets';

    it('returns 200 with list of supported assets', async () => {
      const response = await request(app).get(endpoint);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);

      const symbols = response.body.data.map((a: { symbol: string }) => a.symbol);
      for (const expected of SUPPORTED_SYMBOLS) {
        expect(symbols).toContain(expected);
      }

      for (const asset of response.body.data) {
        expect(asset).toHaveProperty('symbol');
        expect(asset).toHaveProperty('displayName');
        expect(asset).toHaveProperty('type');
        expect(asset).toHaveProperty('currency');
      }
    });
  });

  describe('POST /api/v1/admin/pipeline/run', () => {
    const endpoint = '/api/v1/admin/pipeline/run';

    it('returns 401 without auth header', async () => {
      const response = await request(app).post(endpoint).query({ symbol: TEST_SYMBOL });
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('returns 403 with USER token', async () => {
      const response = await request(app)
        .post(endpoint)
        .query({ symbol: TEST_SYMBOL })
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });

    it('returns 400 with invalid symbol', async () => {
      const response = await request(app)
        .post(endpoint)
        .query({ symbol: 'INVALID-SYMBOL' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid symbol');
      expect(response.body.error).toContain('Allowed symbols');
    });

    it('returns 200 with ADMIN token and includes pipeline summary', async () => {
      const response = await request(app)
        .post(endpoint)
        .query({ symbol: TEST_SYMBOL })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.assetSymbol).toBe(TEST_SYMBOL);
      expect(response.body.data.ingestedCount).toBeGreaterThan(0);
    }, 30000); // Pipeline calls external APIs
  });

  describe('POST /api/v1/admin/users/:id/role', () => {
    const endpoint = '/api/v1/admin/users/test-user-id/role';

    it('returns 400 with invalid role (SUPERADMIN)', async () => {
      const response = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'SUPERADMIN' });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/role.*ADMIN.*USER/i);
    });

    it('returns 400 with missing role', async () => {
      const response = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('returns 401 without auth header', async () => {
      const response = await request(app)
        .post(endpoint)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(401);
    });

    it('returns 403 with USER token', async () => {
      const response = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/market-data', () => {
    const endpoint = '/api/v1/market-data';

    it('returns 401 without auth header', async () => {
      const response = await request(app).get(endpoint).query({ symbol: TEST_SYMBOL });
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('returns 200 with USER token and ordered data', async () => {
      // Run pipeline to populate data (requires ADMIN)
      await request(app)
        .post('/api/v1/admin/pipeline/run')
        .query({ symbol: TEST_SYMBOL })
        .set('Authorization', `Bearer ${adminToken}`);

      const response = await request(app)
        .get(endpoint)
        .query({ symbol: TEST_SYMBOL })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      for (let i = 1; i < response.body.data.length; i++) {
        const prev = new Date(response.body.data[i - 1].timestamp);
        const curr = new Date(response.body.data[i].timestamp);
        expect(curr.getTime()).toBeGreaterThan(prev.getTime());
      }
    }, 30000); // Pipeline calls external APIs
  });
});
