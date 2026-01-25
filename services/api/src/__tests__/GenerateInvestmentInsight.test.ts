import { describe, it, expect } from 'vitest';
import { GenerateInvestmentInsight } from '../application/use-cases/index.js';
import type { AIProviderPort, AIProviderInput, AIProviderOutput } from '../application/ports/index.js';
import type { MarketAnalysis } from '../domain/entities/index.js';

function createStubAIProvider(output: AIProviderOutput): AIProviderPort {
  return {
    generateInvestmentInsight: async () => output,
  };
}

function createTestMarketAnalysis(): MarketAnalysis {
  return {
    assetSymbol: 'BTC-USD',
    asOf: new Date('2025-01-30T00:00:00.000Z'),
    resolution: '1d',
    trend: 'BULLISH',
    signalStrength: 75,
    kpis: { rsi14: 65, priceVsSma: 5.5 },
    rationale: 'Market shows bullish signals with RSI above 60.',
  };
}

function createValidAIOutput(): AIProviderOutput {
  return {
    recommendation: {
      action: 'BUY',
      confidenceScore: 0.75,
      horizon: 'MID',
      riskLevel: 'MEDIUM',
    },
    insight: {
      summary: 'Bullish momentum detected.',
      reasoning: 'RSI and price action suggest upward trend continuation.',
      assumptions: ['Current trend continues', 'No major news events'],
      caveats: ['High volatility expected', 'Past performance not indicative'],
    },
    model: {
      name: 'gpt-4',
      version: '2024-01-01',
    },
  };
}

describe('GenerateInvestmentInsight', () => {
  const PROMPT_VERSION = '1.0';

  describe('execute', () => {
    it('builds deterministic input for AI from MarketAnalysis', async () => {
      let capturedInput: AIProviderInput | null = null;
      const provider: AIProviderPort = {
        generateInvestmentInsight: async (input) => {
          capturedInput = input;
          return createValidAIOutput();
        },
      };

      const useCase = new GenerateInvestmentInsight(provider, PROMPT_VERSION);
      const analysis = createTestMarketAnalysis();

      await useCase.execute(analysis);

      expect(capturedInput).not.toBeNull();
      expect(capturedInput!.assetSymbol).toBe('BTC-USD');
      expect(capturedInput!.trend).toBe('BULLISH');
      expect(capturedInput!.signalStrength).toBe(75);
      expect(capturedInput!.kpis).toEqual({ rsi14: 65, priceVsSma: 5.5 });
    });

    it('returns InvestmentInsight and Recommendation on valid AI output', async () => {
      const provider = createStubAIProvider(createValidAIOutput());
      const useCase = new GenerateInvestmentInsight(provider, PROMPT_VERSION);
      const analysis = createTestMarketAnalysis();

      const result = await useCase.execute(analysis);

      expect(result.recommendation.action).toBe('BUY');
      expect(result.recommendation.confidenceScore).toBe(0.75);
      expect(result.recommendation.horizon).toBe('MID');
      expect(result.recommendation.riskLevel).toBe('MEDIUM');
      expect(result.recommendation.assetSymbol).toBe('BTC-USD');

      expect(result.insight.summary).toBe('Bullish momentum detected.');
      expect(result.insight.reasoning).toContain('RSI');
      expect(result.insight.modelName).toBe('gpt-4');
      expect(result.insight.promptVersion).toBe(PROMPT_VERSION);
      expect(result.insight.outputSchemaVersion).toBe('1.0');
    });

    it('throws error on invalid AI output', async () => {
      const invalidOutput = {
        recommendation: {
          action: 'INVALID_ACTION',
          confidenceScore: 0.5,
          horizon: 'MID',
          riskLevel: 'MEDIUM',
        },
        insight: {
          summary: 'Test',
          reasoning: 'Test',
          assumptions: [],
          caveats: [],
        },
        model: { name: 'test', version: '1.0' },
      };

      const provider: AIProviderPort = {
        generateInvestmentInsight: async () => invalidOutput as unknown as AIProviderOutput,
      };

      const useCase = new GenerateInvestmentInsight(provider, PROMPT_VERSION);
      const analysis = createTestMarketAnalysis();

      await expect(useCase.execute(analysis)).rejects.toThrow('Invalid action');
    });

    it('generates deterministic inputSnapshotHash for same MarketAnalysis', async () => {
      const provider = createStubAIProvider(createValidAIOutput());
      const useCase = new GenerateInvestmentInsight(provider, PROMPT_VERSION);
      const analysis = createTestMarketAnalysis();

      const result1 = await useCase.execute(analysis);
      const result2 = await useCase.execute(analysis);

      expect(result1.insight.inputSnapshotHash).toBe(result2.insight.inputSnapshotHash);
      expect(result1.insight.inputSnapshotHash.length).toBeGreaterThan(0);
    });

    it('generates different inputSnapshotHash for different MarketAnalysis', async () => {
      const provider = createStubAIProvider(createValidAIOutput());
      const useCase = new GenerateInvestmentInsight(provider, PROMPT_VERSION);

      const analysis1 = createTestMarketAnalysis();
      const analysis2 = { ...createTestMarketAnalysis(), signalStrength: 50 };

      const result1 = await useCase.execute(analysis1);
      const result2 = await useCase.execute(analysis2);

      expect(result1.insight.inputSnapshotHash).not.toBe(result2.insight.inputSnapshotHash);
    });
  });
});
