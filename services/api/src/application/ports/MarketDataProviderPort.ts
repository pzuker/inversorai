import type { MarketDataPoint } from '../../domain/entities/index.js';

export interface MarketDataProviderPort {
  fetchMarketData(assetSymbol: string): Promise<MarketDataPoint[]>;
}
