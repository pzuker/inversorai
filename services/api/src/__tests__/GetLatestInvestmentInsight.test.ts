import { describe, it, expect, beforeEach } from 'vitest';
import type { InvestmentInsight } from '../domain/entities/index.js';
import type { InvestmentInsightRepositoryPort } from '../application/ports/index.js';
import { GetLatestInvestmentInsight } from '../application/use-cases/GetLatestInvestmentInsight.js';

class FakeInvestmentInsightRepository implements InvestmentInsightRepositoryPort {
  private insights: InvestmentInsight[] = [];

  async save(insight: InvestmentInsight): Promise<void> {
    this.insights.push(insight);
  }

  async findLatestByAsset(symbol: string): Promise<InvestmentInsight | null> {
    const matching = this.insights
      .filter((i) => i.assetSymbol === symbol)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return matching[0] ?? null;
  }

  clear(): void {
    this.insights = [];
  }
}

function createTestInsight(overrides: Partial<InvestmentInsight> = {}): InvestmentInsight {
  return {
    assetSymbol: 'BTC-USD',
    summary: 'Test summary',
    reasoning: 'Test reasoning',
    assumptions: ['assumption1'],
    caveats: ['caveat1'],
    modelName: 'gpt-4o-mini',
    modelVersion: '2024-07-18',
    promptVersion: '1.0',
    outputSchemaVersion: '1.0',
    inputSnapshotHash: 'abc123',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('GetLatestInvestmentInsight', () => {
  let repository: FakeInvestmentInsightRepository;
  let useCase: GetLatestInvestmentInsight;

  beforeEach(() => {
    repository = new FakeInvestmentInsightRepository();
    useCase = new GetLatestInvestmentInsight(repository);
  });

  it('returns null if no insights exist for the asset', async () => {
    const result = await useCase.execute('BTC-USD');
    expect(result).toBeNull();
  });

  it('returns the latest insight by createdAt', async () => {
    const older = createTestInsight({ createdAt: new Date('2025-01-01T00:00:00.000Z') });
    const newer = createTestInsight({
      createdAt: new Date('2025-01-02T00:00:00.000Z'),
      summary: 'Newer summary',
    });

    await repository.save(older);
    await repository.save(newer);

    const result = await useCase.execute('BTC-USD');

    expect(result).not.toBeNull();
    expect(result!.summary).toBe('Newer summary');
    expect(result!.createdAt).toEqual(new Date('2025-01-02T00:00:00.000Z'));
  });

  it('does not throw error with valid symbol input', async () => {
    await expect(useCase.execute('ETH-USD')).resolves.not.toThrow();
  });

  it('throws error for empty symbol', async () => {
    await expect(useCase.execute('')).rejects.toThrow('Asset symbol is required');
  });

  it('only returns insights for the requested asset', async () => {
    const btcInsight = createTestInsight({ assetSymbol: 'BTC-USD' });
    const ethInsight = createTestInsight({ assetSymbol: 'ETH-USD', summary: 'ETH summary' });

    await repository.save(btcInsight);
    await repository.save(ethInsight);

    const result = await useCase.execute('ETH-USD');

    expect(result).not.toBeNull();
    expect(result!.assetSymbol).toBe('ETH-USD');
    expect(result!.summary).toBe('ETH summary');
  });
});
