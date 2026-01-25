import { describe, it, expect, beforeEach, beforeAll } from 'vitest';

const hasSupabaseEnv = (): boolean => {
  return !!(process.env['SUPABASE_URL'] && process.env['SUPABASE_SERVICE_ROLE_KEY']);
};

const describeIfSupabase = hasSupabaseEnv() ? describe : describe.skip;

describeIfSupabase('IngestAndPersist Orchestration (integration)', () => {
  const TEST_SYMBOL = 'TEST-ORCH-BTC';

  let supabaseClient: import('@supabase/supabase-js').SupabaseClient;
  let runIngestAndPersist: typeof import('../runners/ingestAndPersist.js').runIngestAndPersist;
  let repository: import('../infrastructure/repositories/index.js').SupabaseMarketDataRepository;

  beforeAll(async () => {
    const { createSupabaseClient } = await import('../infrastructure/supabase/index.js');
    const { SupabaseMarketDataRepository } = await import('../infrastructure/repositories/index.js');
    const runners = await import('../runners/ingestAndPersist.js');

    supabaseClient = createSupabaseClient();
    repository = new SupabaseMarketDataRepository(supabaseClient);
    runIngestAndPersist = runners.runIngestAndPersist;
  });

  beforeEach(async () => {
    await supabaseClient
      .from('market_data')
      .delete()
      .eq('asset_symbol', TEST_SYMBOL);
  });

  it('executes full flow: ingest → persist → verify', async () => {
    const result = await runIngestAndPersist(TEST_SYMBOL);

    expect(result.ingestedCount).toBeGreaterThan(0);
    expect(result.persistedCount).toBe(result.ingestedCount);

    const stored = await repository.findBySymbol(TEST_SYMBOL);

    expect(stored).toHaveLength(result.ingestedCount);

    for (let i = 1; i < stored.length; i++) {
      const prev = stored[i - 1]!;
      const curr = stored[i]!;
      expect(curr.timestamp.getTime()).toBeGreaterThan(prev.timestamp.getTime());
    }
  });
});
