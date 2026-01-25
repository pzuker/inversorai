import { describe, it, expect, beforeEach } from 'vitest';
import type { MarketDataPoint, InvestmentInsight, Recommendation } from '../domain/entities/index.js';
import type {
  MarketDataProviderPort,
  MarketDataRepositoryPort,
  AIProviderPort,
  AIProviderInput,
  AIProviderOutput,
  InvestmentInsightRepositoryPort,
  RecommendationRepositoryPort,
} from '../application/ports/index.js';
import { RunMarketAnalysisPipeline } from '../application/use-cases/RunMarketAnalysisPipeline.js';

class FakeMarketDataProvider implements MarketDataProviderPort {
  private data: MarketDataPoint[] = [];

  setData(data: MarketDataPoint[]): void {
    this.data = data;
  }

  async fetchMarketData(_symbol: string): Promise<MarketDataPoint[]> {
    return this.data;
  }
}

class FakeMarketDataRepository implements MarketDataRepositoryPort {
  public savedPoints: MarketDataPoint[] = [];

  async save(points: MarketDataPoint[]): Promise<void> {
    this.savedPoints = points;
  }

  async findBySymbol(_symbol: string): Promise<MarketDataPoint[]> {
    return this.savedPoints;
  }
}

class FakeAIProvider implements AIProviderPort {
  async generateInvestmentInsight(_input: AIProviderInput): Promise<AIProviderOutput> {
    return {
      recommendation: {
        action: 'BUY',
        confidenceScore: 0.85,
        horizon: 'MID',
        riskLevel: 'MEDIUM',
      },
      insight: {
        summary: 'Test summary from AI',
        reasoning: 'Test reasoning from AI',
        assumptions: ['Assumption 1'],
        caveats: ['Caveat 1'],
      },
      model: {
        name: 'gpt-4o-mini',
        version: '2024-07-18',
      },
    };
  }
}

class FakeInsightRepository implements InvestmentInsightRepositoryPort {
  public savedInsight: InvestmentInsight | null = null;

  async save(insight: InvestmentInsight): Promise<void> {
    this.savedInsight = insight;
  }

  async findLatestByAsset(_symbol: string): Promise<InvestmentInsight | null> {
    return this.savedInsight;
  }
}

class FakeRecommendationRepository implements RecommendationRepositoryPort {
  public savedRecommendation: Recommendation | null = null;

  async save(recommendation: Recommendation): Promise<void> {
    this.savedRecommendation = recommendation;
  }

  async findLatestByAsset(_symbol: string): Promise<Recommendation | null> {
    return this.savedRecommendation;
  }
}

function createTestMarketData(symbol: string, count: number = 30): MarketDataPoint[] {
  const points: MarketDataPoint[] = [];
  const basePrice = 100;

  for (let i = 0; i < count; i++) {
    const date = new Date('2025-01-01');
    date.setDate(date.getDate() + i);
    const price = basePrice + i * 0.5 + Math.sin(i) * 2;

    points.push({
      assetSymbol: symbol,
      timestamp: date,
      open: price - 1,
      high: price + 2,
      low: price - 2,
      close: price,
      volume: 1000000 + i * 10000,
    });
  }

  return points;
}

describe('RunMarketAnalysisPipeline', () => {
  let marketDataProvider: FakeMarketDataProvider;
  let marketDataRepository: FakeMarketDataRepository;
  let aiProvider: FakeAIProvider;
  let insightRepository: FakeInsightRepository;
  let recommendationRepository: FakeRecommendationRepository;
  let pipeline: RunMarketAnalysisPipeline;

  beforeEach(() => {
    marketDataProvider = new FakeMarketDataProvider();
    marketDataRepository = new FakeMarketDataRepository();
    aiProvider = new FakeAIProvider();
    insightRepository = new FakeInsightRepository();
    recommendationRepository = new FakeRecommendationRepository();

    pipeline = new RunMarketAnalysisPipeline({
      marketDataProvider,
      marketDataRepository,
      aiProvider,
      insightRepository,
      recommendationRepository,
      promptVersion: '1.0',
    });
  });

  it('executes the complete pipeline for a valid asset', async () => {
    const testData = createTestMarketData('BTC-USD', 30);
    marketDataProvider.setData(testData);

    const result = await pipeline.execute('BTC-USD', '1d');

    expect(result).toBeDefined();
    expect(result.assetSymbol).toBe('BTC-USD');
  });

  it('returns a summary with all required fields', async () => {
    const testData = createTestMarketData('ETH-USD', 30);
    marketDataProvider.setData(testData);

    const result = await pipeline.execute('ETH-USD', '1d');

    expect(result.ingestedCount).toBe(30);
    expect(result.indicatorComputed).toBe(true);
    expect(result.analysisGenerated).toBe(true);
    expect(result.insightGenerated).toBe(true);
  });

  it('persists market data during pipeline execution', async () => {
    const testData = createTestMarketData('BTC-USD', 30);
    marketDataProvider.setData(testData);

    await pipeline.execute('BTC-USD', '1d');

    expect(marketDataRepository.savedPoints).toHaveLength(30);
  });

  it('persists insight and recommendation', async () => {
    const testData = createTestMarketData('BTC-USD', 30);
    marketDataProvider.setData(testData);

    await pipeline.execute('BTC-USD', '1d');

    expect(insightRepository.savedInsight).not.toBeNull();
    expect(insightRepository.savedInsight!.assetSymbol).toBe('BTC-USD');
    expect(recommendationRepository.savedRecommendation).not.toBeNull();
    expect(recommendationRepository.savedRecommendation!.assetSymbol).toBe('BTC-USD');
  });

  it('does not throw error on correct flow', async () => {
    const testData = createTestMarketData('SOL-USD', 30);
    marketDataProvider.setData(testData);

    await expect(pipeline.execute('SOL-USD', '1d')).resolves.not.toThrow();
  });

  it('includes trend and recommendation action in summary', async () => {
    const testData = createTestMarketData('BTC-USD', 30);
    marketDataProvider.setData(testData);

    const result = await pipeline.execute('BTC-USD', '1d');

    expect(['BULLISH', 'BEARISH', 'NEUTRAL']).toContain(result.trend);
    expect(['BUY', 'HOLD', 'SELL']).toContain(result.recommendationAction);
  });
});
