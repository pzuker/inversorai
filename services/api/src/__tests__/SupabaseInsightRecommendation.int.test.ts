import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import type { InvestmentInsight, Recommendation } from '../domain/entities/index.js';

const hasSupabaseEnv = (): boolean => {
  return !!(process.env['SUPABASE_URL'] && process.env['SUPABASE_SERVICE_ROLE_KEY']);
};

const describeIfSupabase = hasSupabaseEnv() ? describe : describe.skip;

describeIfSupabase('SupabaseInvestmentInsightRepository (integration)', () => {
  const TEST_SYMBOL = 'TEST-INSIGHT-BTC';

  let repository: import('../infrastructure/repositories/index.js').SupabaseInvestmentInsightRepository;
  let supabaseClient: import('@supabase/supabase-js').SupabaseClient;

  beforeAll(async () => {
    const { SupabaseInvestmentInsightRepository } = await import('../infrastructure/repositories/index.js');
    const { createSupabaseClient } = await import('../infrastructure/supabase/index.js');

    supabaseClient = createSupabaseClient();
    repository = new SupabaseInvestmentInsightRepository(supabaseClient);
  });

  beforeEach(async () => {
    await supabaseClient
      .from('investment_insights')
      .delete()
      .eq('asset_symbol', TEST_SYMBOL);
  });

  function createTestInsight(overrides: Partial<InvestmentInsight> = {}): InvestmentInsight {
    return {
      assetSymbol: TEST_SYMBOL,
      summary: 'Test summary',
      reasoning: 'Test reasoning for the recommendation',
      assumptions: ['Market continues current trend', 'No major news events'],
      caveats: ['Past performance is not indicative of future results'],
      modelName: 'gpt-4o-mini',
      modelVersion: '2024-07-18',
      promptVersion: '1.0',
      outputSchemaVersion: '1.0',
      inputSnapshotHash: 'abc123hash',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      ...overrides,
    };
  }

  it('save() inserts insight correctly', async () => {
    const insight = createTestInsight();

    await repository.save(insight);

    const { data, error } = await supabaseClient
      .from('investment_insights')
      .select('*')
      .eq('asset_symbol', TEST_SYMBOL);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0]?.payload?.summary).toBe('Test summary');
  });

  it('findLatestByAsset() returns the most recent insight', async () => {
    const older = createTestInsight({ createdAt: new Date('2025-01-01T00:00:00.000Z') });
    const newer = createTestInsight({
      createdAt: new Date('2025-01-02T00:00:00.000Z'),
      summary: 'Newer summary',
    });

    await repository.save(older);
    await repository.save(newer);

    const result = await repository.findLatestByAsset(TEST_SYMBOL);

    expect(result).not.toBeNull();
    expect(result!.summary).toBe('Newer summary');
    expect(result!.assetSymbol).toBe(TEST_SYMBOL);
  });

  it('findLatestByAsset() returns null when no insights exist', async () => {
    const result = await repository.findLatestByAsset('NON-EXISTENT');
    expect(result).toBeNull();
  });
});

describeIfSupabase('SupabaseRecommendationRepository (integration)', () => {
  const TEST_SYMBOL = 'TEST-REC-BTC';

  let repository: import('../infrastructure/repositories/index.js').SupabaseRecommendationRepository;
  let supabaseClient: import('@supabase/supabase-js').SupabaseClient;

  beforeAll(async () => {
    const { SupabaseRecommendationRepository } = await import('../infrastructure/repositories/index.js');
    const { createSupabaseClient } = await import('../infrastructure/supabase/index.js');

    supabaseClient = createSupabaseClient();
    repository = new SupabaseRecommendationRepository(supabaseClient);
  });

  beforeEach(async () => {
    await supabaseClient
      .from('recommendations')
      .delete()
      .eq('asset_symbol', TEST_SYMBOL);
  });

  function createTestRecommendation(overrides: Partial<Recommendation> = {}): Recommendation {
    return {
      assetSymbol: TEST_SYMBOL,
      action: 'BUY',
      confidenceScore: 0.85,
      horizon: 'MID',
      riskLevel: 'MEDIUM',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      ...overrides,
    };
  }

  it('save() inserts recommendation correctly', async () => {
    const recommendation = createTestRecommendation();

    await repository.save(recommendation);

    const { data, error } = await supabaseClient
      .from('recommendations')
      .select('*')
      .eq('asset_symbol', TEST_SYMBOL);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0]?.payload?.action).toBe('BUY');
  });

  it('findLatestByAsset() returns the most recent recommendation', async () => {
    const older = createTestRecommendation({ createdAt: new Date('2025-01-01T00:00:00.000Z') });
    const newer = createTestRecommendation({
      createdAt: new Date('2025-01-02T00:00:00.000Z'),
      action: 'SELL',
    });

    await repository.save(older);
    await repository.save(newer);

    const result = await repository.findLatestByAsset(TEST_SYMBOL);

    expect(result).not.toBeNull();
    expect(result!.action).toBe('SELL');
    expect(result!.assetSymbol).toBe(TEST_SYMBOL);
  });

  it('findLatestByAsset() returns null when no recommendations exist', async () => {
    const result = await repository.findLatestByAsset('NON-EXISTENT');
    expect(result).toBeNull();
  });
});
