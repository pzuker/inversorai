import type { MarketDataProviderPort } from '../../application/ports/index.js';
import { YahooFinanceMarketDataProvider } from './YahooFinanceMarketDataProvider.js';
import { FakeMarketDataProvider } from '../providers/index.js';

export type MarketDataProviderType = 'REAL' | 'FAKE';

export function createMarketDataProvider(): MarketDataProviderPort {
  const providerType = process.env['MARKET_DATA_PROVIDER'] as MarketDataProviderType | undefined;

  if (providerType === 'REAL') {
    return new YahooFinanceMarketDataProvider();
  }

  return new FakeMarketDataProvider();
}

export function isRealProvider(provider: MarketDataProviderPort): boolean {
  return provider instanceof YahooFinanceMarketDataProvider;
}

export function isFakeProvider(provider: MarketDataProviderPort): boolean {
  return provider instanceof FakeMarketDataProvider;
}
