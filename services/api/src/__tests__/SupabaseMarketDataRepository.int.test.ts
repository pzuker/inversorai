import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import type { MarketDataPoint } from '../domain/entities/index.js';

const hasSupabaseEnv = (): boolean => {
  return !!(process.env['SUPABASE_URL'] && process.env['SUPABASE_SERVICE_ROLE_KEY']);
};

const describeIfSupabase = hasSupabaseEnv() ? describe : describe.skip;

describeIfSupabase('SupabaseMarketDataRepository (integration)', () => {
  const TEST_SYMBOL = 'TEST-INT-BTC';

  let repository: import('../infrastructure/repositories/index.js').SupabaseMarketDataRepository;
  let supabaseClient: import('@supabase/supabase-js').SupabaseClient;

  beforeAll(async () => {
    const { SupabaseMarketDataRepository } = await import('../infrastructure/repositories/index.js');
    const { createSupabaseClient } = await import('../infrastructure/supabase/index.js');

    supabaseClient = createSupabaseClient();
    repository = new SupabaseMarketDataRepository(supabaseClient);
  });

  beforeEach(async () => {
    await supabaseClient
      .from('market_data')
      .delete()
      .eq('asset_symbol', TEST_SYMBOL);
  });

  function createTestPoints(count: number): MarketDataPoint[] {
    const points: MarketDataPoint[] = [];
    for (let i = 0; i < count; i++) {
      points.push({
        assetSymbol: TEST_SYMBOL,
        timestamp: new Date(`2025-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`),
        open: 100 + i,
        high: 110 + i,
        low: 90 + i,
        close: 105 + i,
        volume: 1000000 + i * 1000,
      });
    }
    return points;
  }

  it('save() inserts points correctly', async () => {
    const points = createTestPoints(3);

    await repository.save(points);

    const { data, error } = await supabaseClient
      .from('market_data')
      .select('*')
      .eq('asset_symbol', TEST_SYMBOL)
      .order('timestamp', { ascending: true });

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
    expect(data?.[0]?.open).toBe(100);
    expect(data?.[1]?.open).toBe(101);
    expect(data?.[2]?.open).toBe(102);
  });

  it('save() is idempotent - no duplicates on repeated calls', async () => {
    const points = createTestPoints(3);

    await repository.save(points);
    await repository.save(points);

    const { data, error } = await supabaseClient
      .from('market_data')
      .select('*')
      .eq('asset_symbol', TEST_SYMBOL);

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
  });

  it('findBySymbol() returns points ordered by timestamp ascending', async () => {
    const points = createTestPoints(5);
    await repository.save(points);

    const result = await repository.findBySymbol(TEST_SYMBOL);

    expect(result).toHaveLength(5);
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1]!;
      const curr = result[i]!;
      expect(curr.timestamp.getTime()).toBeGreaterThan(prev.timestamp.getTime());
    }
    expect(result[0]?.assetSymbol).toBe(TEST_SYMBOL);
  });
});
