import type { MarketDataPoint } from '../../domain/entities/index.js';
import type { MarketDataProviderPort } from '../../application/ports/index.js';

const BASE_DATE = new Date('2025-01-01T00:00:00.000Z');
const POINTS_COUNT = 30;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return (): number => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

export class FakeMarketDataProvider implements MarketDataProviderPort {
  async fetchMarketData(assetSymbol: string): Promise<MarketDataPoint[]> {
    const seed = hashString(assetSymbol);
    const random = seededRandom(seed);
    const points: MarketDataPoint[] = [];

    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    let basePrice = 100 + random() * 900;

    for (let i = 0; i < POINTS_COUNT; i++) {
      const timestamp = new Date(BASE_DATE.getTime() + i * MS_PER_DAY);

      const volatility = 0.02 + random() * 0.03;
      const change = (random() - 0.5) * 2 * volatility * basePrice;
      const open = basePrice;
      const close = basePrice + change;

      const highExtra = random() * volatility * basePrice;
      const lowExtra = random() * volatility * basePrice;

      const high = Math.max(open, close) + highExtra;
      const low = Math.min(open, close) - lowExtra;

      const volume = Math.floor(1000000 + random() * 9000000);

      points.push({
        assetSymbol,
        timestamp,
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume,
      });

      basePrice = close;
    }

    return points;
  }
}
