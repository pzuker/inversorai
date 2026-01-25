import { describe, it, expect, beforeAll } from 'vitest';

const canAccessInternet = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://query1.finance.yahoo.com', {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
};

describe('YahooFinanceMarketDataProvider (integration)', async () => {
  const shouldRun = await canAccessInternet();

  if (!shouldRun) {
    it.skip('skipped - no internet connection', () => {});
    return;
  }

  let YahooFinanceMarketDataProvider: typeof import('../infrastructure/market-data/index.js').YahooFinanceMarketDataProvider;

  beforeAll(async () => {
    const module = await import('../infrastructure/market-data/index.js');
    YahooFinanceMarketDataProvider = module.YahooFinanceMarketDataProvider;
  });

  it('fetches real BTC-USD data with valid prices', async () => {
    const provider = new YahooFinanceMarketDataProvider('30d', '1d');

    const data = await provider.fetchMarketData('BTC-USD');

    expect(data.length).toBeGreaterThan(10);

    const latestPoint = data[data.length - 1]!;
    expect(latestPoint.close).toBeGreaterThan(10000);
    expect(latestPoint.assetSymbol).toBe('BTC-USD');
  });

  it('returns valid timestamps', async () => {
    const provider = new YahooFinanceMarketDataProvider('30d', '1d');

    const data = await provider.fetchMarketData('BTC-USD');

    for (const point of data) {
      expect(point.timestamp).toBeInstanceOf(Date);
      expect(point.timestamp.getTime()).toBeGreaterThan(0);
      expect(point.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    }
  });

  it('returns data sorted by timestamp ascending', async () => {
    const provider = new YahooFinanceMarketDataProvider('30d', '1d');

    const data = await provider.fetchMarketData('BTC-USD');

    for (let i = 1; i < data.length; i++) {
      expect(data[i]!.timestamp.getTime()).toBeGreaterThanOrEqual(data[i - 1]!.timestamp.getTime());
    }
  });

  it('returns valid OHLCV values', async () => {
    const provider = new YahooFinanceMarketDataProvider('30d', '1d');

    const data = await provider.fetchMarketData('BTC-USD');

    for (const point of data) {
      expect(point.open).toBeGreaterThan(0);
      expect(point.high).toBeGreaterThan(0);
      expect(point.low).toBeGreaterThan(0);
      expect(point.close).toBeGreaterThan(0);
      expect(point.volume).toBeGreaterThanOrEqual(0);
      expect(point.high).toBeGreaterThanOrEqual(point.low);
    }
  });
});
