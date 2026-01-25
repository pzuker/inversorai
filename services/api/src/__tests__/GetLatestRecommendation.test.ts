import { describe, it, expect, beforeEach } from 'vitest';
import type { Recommendation } from '../domain/entities/index.js';
import type { RecommendationRepositoryPort } from '../application/ports/index.js';
import { GetLatestRecommendation } from '../application/use-cases/GetLatestRecommendation.js';

class FakeRecommendationRepository implements RecommendationRepositoryPort {
  private recommendations: Recommendation[] = [];

  async save(recommendation: Recommendation): Promise<void> {
    this.recommendations.push(recommendation);
  }

  async findLatestByAsset(symbol: string): Promise<Recommendation | null> {
    const matching = this.recommendations
      .filter((r) => r.assetSymbol === symbol)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return matching[0] ?? null;
  }

  clear(): void {
    this.recommendations = [];
  }
}

function createTestRecommendation(overrides: Partial<Recommendation> = {}): Recommendation {
  return {
    assetSymbol: 'BTC-USD',
    action: 'BUY',
    confidenceScore: 0.85,
    horizon: 'MID',
    riskLevel: 'MEDIUM',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('GetLatestRecommendation', () => {
  let repository: FakeRecommendationRepository;
  let useCase: GetLatestRecommendation;

  beforeEach(() => {
    repository = new FakeRecommendationRepository();
    useCase = new GetLatestRecommendation(repository);
  });

  it('returns null if no recommendations exist for the asset', async () => {
    const result = await useCase.execute('BTC-USD');
    expect(result).toBeNull();
  });

  it('returns the latest recommendation by createdAt', async () => {
    const older = createTestRecommendation({ createdAt: new Date('2025-01-01T00:00:00.000Z') });
    const newer = createTestRecommendation({
      createdAt: new Date('2025-01-02T00:00:00.000Z'),
      action: 'SELL',
    });

    await repository.save(older);
    await repository.save(newer);

    const result = await useCase.execute('BTC-USD');

    expect(result).not.toBeNull();
    expect(result!.action).toBe('SELL');
    expect(result!.createdAt).toEqual(new Date('2025-01-02T00:00:00.000Z'));
  });

  it('does not throw error with valid symbol input', async () => {
    await expect(useCase.execute('ETH-USD')).resolves.not.toThrow();
  });

  it('throws error for empty symbol', async () => {
    await expect(useCase.execute('')).rejects.toThrow('Asset symbol is required');
  });

  it('only returns recommendations for the requested asset', async () => {
    const btcRec = createTestRecommendation({ assetSymbol: 'BTC-USD' });
    const ethRec = createTestRecommendation({ assetSymbol: 'ETH-USD', action: 'HOLD' });

    await repository.save(btcRec);
    await repository.save(ethRec);

    const result = await useCase.execute('ETH-USD');

    expect(result).not.toBeNull();
    expect(result!.assetSymbol).toBe('ETH-USD');
    expect(result!.action).toBe('HOLD');
  });
});
