import { describe, it, expect } from 'vitest';
import { FakeMarketDataProvider } from '../infrastructure/providers/index.js';

describe('FakeMarketDataProvider', () => {
  const provider = new FakeMarketDataProvider();

  it('returns exactly 30 points for BTC-USD', async () => {
    const data = await provider.fetchMarketData('BTC-USD');
    expect(data).toHaveLength(30);
  });

  it('is deterministic: same symbol returns same data', async () => {
    const data1 = await provider.fetchMarketData('BTC-USD');
    const data2 = await provider.fetchMarketData('BTC-USD');

    expect(data1).toHaveLength(data2.length);

    for (let i = 0; i < data1.length; i++) {
      expect(data1[i]?.timestamp.getTime()).toBe(data2[i]?.timestamp.getTime());
      expect(data1[i]?.open).toBe(data2[i]?.open);
      expect(data1[i]?.high).toBe(data2[i]?.high);
      expect(data1[i]?.low).toBe(data2[i]?.low);
      expect(data1[i]?.close).toBe(data2[i]?.close);
      expect(data1[i]?.volume).toBe(data2[i]?.volume);
    }
  });

  it('produces different data for different symbols', async () => {
    const btcData = await provider.fetchMarketData('BTC-USD');
    const aaplData = await provider.fetchMarketData('AAPL');

    const hasDifference = btcData.some((point, i) => {
      const other = aaplData[i];
      return (
        point.open !== other?.open ||
        point.high !== other?.high ||
        point.low !== other?.low ||
        point.close !== other?.close ||
        point.volume !== other?.volume
      );
    });

    expect(hasDifference).toBe(true);
  });

  it('has coherent OHLC values for each point', async () => {
    const data = await provider.fetchMarketData('BTC-USD');

    for (const point of data) {
      expect(point.low).toBeLessThanOrEqual(point.open);
      expect(point.open).toBeLessThanOrEqual(point.high);
      expect(point.low).toBeLessThanOrEqual(point.close);
      expect(point.close).toBeLessThanOrEqual(point.high);
      expect(point.volume).toBeGreaterThanOrEqual(0);
    }
  });

  it('has timestamps in UTC, strictly ascending, 24h apart', async () => {
    const data = await provider.fetchMarketData('BTC-USD');
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    for (let i = 0; i < data.length; i++) {
      const point = data[i]!;
      expect(point.timestamp).toBeInstanceOf(Date);
      expect(point.timestamp.getTime()).not.toBeNaN();

      if (i > 0) {
        const prev = data[i - 1]!;
        expect(point.timestamp.getTime()).toBeGreaterThan(prev.timestamp.getTime());
        expect(point.timestamp.getTime() - prev.timestamp.getTime()).toBe(MS_PER_DAY);
      }
    }
  });
});
