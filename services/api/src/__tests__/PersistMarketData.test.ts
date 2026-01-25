import { describe, it, expect } from 'vitest';
import { PersistMarketData } from '../application/use-cases/index.js';
import type { MarketDataRepositoryPort } from '../application/ports/index.js';
import type { MarketDataPoint } from '../domain/entities/index.js';

class FakeMarketDataRepository implements MarketDataRepositoryPort {
  private storage: Map<string, MarketDataPoint> = new Map();
  public saveCallCount = 0;

  private makeKey(point: MarketDataPoint): string {
    return `${point.assetSymbol}:${point.timestamp.getTime()}`;
  }

  async save(points: MarketDataPoint[]): Promise<void> {
    this.saveCallCount++;
    for (const point of points) {
      const key = this.makeKey(point);
      if (!this.storage.has(key)) {
        this.storage.set(key, point);
      }
    }
  }

  async findBySymbol(assetSymbol: string): Promise<MarketDataPoint[]> {
    const result: MarketDataPoint[] = [];
    for (const point of this.storage.values()) {
      if (point.assetSymbol === assetSymbol) {
        result.push(point);
      }
    }
    return result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  getStoredCount(): number {
    return this.storage.size;
  }
}

function createTestPoints(count: number, symbol = 'BTC-USD'): MarketDataPoint[] {
  const points: MarketDataPoint[] = [];
  for (let i = 0; i < count; i++) {
    points.push({
      assetSymbol: symbol,
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

describe('PersistMarketData', () => {
  it('saves valid points to repository', async () => {
    const repository = new FakeMarketDataRepository();
    const useCase = new PersistMarketData(repository);
    const points = createTestPoints(5);

    await useCase.execute(points);

    const stored = await repository.findBySymbol('BTC-USD');
    expect(stored).toHaveLength(5);
    expect(repository.saveCallCount).toBe(1);
  });

  it('throws error when points list is empty', async () => {
    const repository = new FakeMarketDataRepository();
    const useCase = new PersistMarketData(repository);

    await expect(useCase.execute([])).rejects.toThrow(
      'Cannot persist empty market data'
    );
  });

  it('handles idempotency - no duplicates on repeated calls', async () => {
    const repository = new FakeMarketDataRepository();
    const useCase = new PersistMarketData(repository);
    const points = createTestPoints(3);

    await useCase.execute(points);
    await useCase.execute(points);

    const stored = await repository.findBySymbol('BTC-USD');
    expect(stored).toHaveLength(3);
    expect(repository.getStoredCount()).toBe(3);
  });
});
