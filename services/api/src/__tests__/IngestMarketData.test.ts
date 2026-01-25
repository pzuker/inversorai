import { describe, it, expect } from 'vitest';
import { IngestMarketData } from '../application/use-cases/index.js';
import type { MarketDataProviderPort } from '../application/ports/index.js';
import type { MarketDataPoint } from '../domain/entities/index.js';

function createStubProvider(data: MarketDataPoint[]): MarketDataProviderPort {
  return {
    fetchMarketData: async () => data,
  };
}

describe('IngestMarketData', () => {
  it('returns data when provider returns non-empty list', async () => {
    const mockData: MarketDataPoint[] = [
      {
        assetSymbol: 'BTC-USD',
        timestamp: new Date('2025-01-01T00:00:00.000Z'),
        open: 100,
        high: 110,
        low: 90,
        close: 105,
        volume: 1000000,
      },
      {
        assetSymbol: 'BTC-USD',
        timestamp: new Date('2025-01-02T00:00:00.000Z'),
        open: 105,
        high: 115,
        low: 95,
        close: 110,
        volume: 1200000,
      },
    ];

    const provider = createStubProvider(mockData);
    const useCase = new IngestMarketData(provider);

    const result = await useCase.execute('BTC-USD');

    expect(result).toEqual(mockData);
    expect(result).toHaveLength(2);
  });

  it('throws error when provider returns empty list', async () => {
    const provider = createStubProvider([]);
    const useCase = new IngestMarketData(provider);

    await expect(useCase.execute('BTC-USD')).rejects.toThrow(
      'No market data found for asset: BTC-USD'
    );
  });
});
