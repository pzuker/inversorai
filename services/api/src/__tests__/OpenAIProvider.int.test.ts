import { describe, it, expect, beforeAll } from 'vitest';
import type { MarketAnalysis } from '../domain/entities/index.js';

const hasOpenAIKey = (): boolean => {
  return !!process.env['OPENAI_API_KEY'];
};

const describeIfOpenAI = hasOpenAIKey() ? describe : describe.skip;

describeIfOpenAI('OpenAIProvider Integration', () => {
  let GenerateInvestmentInsight: typeof import('../application/use-cases/index.js').GenerateInvestmentInsight;
  let OpenAIProvider: typeof import('../infrastructure/ai/index.js').OpenAIProvider;

  beforeAll(async () => {
    const useCases = await import('../application/use-cases/index.js');
    const ai = await import('../infrastructure/ai/index.js');

    GenerateInvestmentInsight = useCases.GenerateInvestmentInsight;
    OpenAIProvider = ai.OpenAIProvider;
  });

  function createTestMarketAnalysis(): MarketAnalysis {
    return {
      assetSymbol: 'BTC-USD',
      asOf: new Date('2025-01-30T00:00:00.000Z'),
      resolution: '1d',
      trend: 'BULLISH',
      signalStrength: 75,
      kpis: { rsi14: 65, priceVsSma: 5.5, volatility30d: 0.25 },
      rationale: 'Market shows bullish signals with RSI above 60 and price above SMA20.',
    };
  }

  it('generates valid recommendation and insight from OpenAI', async () => {
    const provider = new OpenAIProvider('1.0');
    const useCase = new GenerateInvestmentInsight(provider, '1.0');
    const analysis = createTestMarketAnalysis();

    const result = await useCase.execute(analysis);

    // Validate recommendation
    expect(['BUY', 'HOLD', 'SELL']).toContain(result.recommendation.action);
    expect(result.recommendation.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.recommendation.confidenceScore).toBeLessThanOrEqual(1);
    expect(['SHORT', 'MID', 'LONG']).toContain(result.recommendation.horizon);
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.recommendation.riskLevel);
    expect(result.recommendation.assetSymbol).toBe('BTC-USD');

    // Validate insight
    expect(result.insight.summary).not.toBe('');
    expect(result.insight.summary.length).toBeGreaterThan(10);
    expect(result.insight.reasoning).not.toBe('');
    expect(Array.isArray(result.insight.assumptions)).toBe(true);
    expect(Array.isArray(result.insight.caveats)).toBe(true);
    expect(result.insight.modelName).not.toBe('');
    expect(result.insight.promptVersion).toBe('1.0');
    expect(result.insight.outputSchemaVersion).toBe('1.0');
    expect(result.insight.inputSnapshotHash.length).toBeGreaterThan(0);
  }, 30000);
});
