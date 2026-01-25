import { describe, it, expect } from 'vitest';
import { IngestMarketData, PersistMarketData } from '../application/use-cases/index.js';
import { FakeMarketDataProvider } from '../infrastructure/providers/index.js';
import type { MarketDataRepositoryPort } from '../application/ports/index.js';
import type { MarketDataPoint } from '../domain/entities/index.js';

class FakeMarketDataRepository implements MarketDataRepositoryPort {
  private storage: Map<string, MarketDataPoint> = new Map();

  private makeKey(point: MarketDataPoint): string {
    return `${point.assetSymbol}:${point.timestamp.getTime()}`;
  }

  async save(points: MarketDataPoint[]): Promise<void> {
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
}

describe('Orchestration: Ingest → Persist', () => {
  it('ingested data ends up persisted in repository', async () => {
    const provider = new FakeMarketDataProvider();
    const repository = new FakeMarketDataRepository();

    const ingestUseCase = new IngestMarketData(provider);
    const persistUseCase = new PersistMarketData(repository);

    const ingestedData = await ingestUseCase.execute('BTC-USD');
    await persistUseCase.execute(ingestedData);

    const persistedData = await repository.findBySymbol('BTC-USD');

    expect(persistedData).toHaveLength(ingestedData.length);
    expect(persistedData[0]?.assetSymbol).toBe('BTC-USD');
    expect(persistedData[0]?.timestamp.getTime()).toBe(ingestedData[0]?.timestamp.getTime());
  });
});
