import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';

const hasSupabaseEnv = (): boolean => {
  return !!(process.env['SUPABASE_URL'] && process.env['SUPABASE_SERVICE_ROLE_KEY']);
};

const describeIfSupabase = hasSupabaseEnv() ? describe : describe.skip;

describeIfSupabase('API Integration Tests', () => {
  const TEST_SYMBOL = 'BTC-USD';

  let app: import('express').Express;
  let supabaseClient: import('@supabase/supabase-js').SupabaseClient;

  beforeAll(async () => {
    const { createApp } = await import('../interfaces/http/app.js');
    const { createSupabaseClient } = await import('../infrastructure/supabase/index.js');

    app = createApp();
    supabaseClient = createSupabaseClient();
  });

  beforeEach(async () => {
    await supabaseClient
      .from('market_data')
      .delete()
      .eq('asset_symbol', TEST_SYMBOL);
  });

  describe('POST /api/v1/admin/pipeline/run', () => {
    const endpoint = '/api/v1/admin/pipeline/run';

    it('returns 401 without auth header', async () => {
      const response = await request(app).post(endpoint).query({ symbol: TEST_SYMBOL });
      expect(response.status).toBe(401);
    });

    it('returns 403 with USER role', async () => {
      const response = await request(app)
        .post(endpoint)
        .query({ symbol: TEST_SYMBOL })
        .set('x-user-role', 'USER');
      expect(response.status).toBe(403);
    });

    it('returns 200 with ADMIN role and includes pipeline summary', async () => {
      const response = await request(app)
        .post(endpoint)
        .query({ symbol: TEST_SYMBOL })
        .set('x-user-role', 'ADMIN');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.assetSymbol).toBe(TEST_SYMBOL);
      expect(response.body.data.ingestedCount).toBeGreaterThan(0);
    }, 30000); // Pipeline calls external APIs
  });

  describe('GET /api/v1/market-data', () => {
    const endpoint = '/api/v1/market-data';

    it('returns 401 without auth header', async () => {
      const response = await request(app).get(endpoint).query({ symbol: TEST_SYMBOL });
      expect(response.status).toBe(401);
    });

    it('returns 200 with USER role and ordered data', async () => {
      // Run pipeline to populate data
      await request(app)
        .post('/api/v1/admin/pipeline/run')
        .query({ symbol: TEST_SYMBOL })
        .set('x-user-role', 'ADMIN');

      const response = await request(app)
        .get(endpoint)
        .query({ symbol: TEST_SYMBOL })
        .set('x-user-role', 'USER');

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
