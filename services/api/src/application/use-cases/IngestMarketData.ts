import type { MarketDataPoint } from '../../domain/entities/index.js';
import type { MarketDataProviderPort } from '../ports/index.js';

export class IngestMarketData {
  constructor(private readonly marketDataProvider: MarketDataProviderPort) {}

  async execute(assetSymbol: string): Promise<MarketDataPoint[]> {
    const data = await this.marketDataProvider.fetchMarketData(assetSymbol);

    if (data.length === 0) {
      throw new Error(`No market data found for asset: ${assetSymbol}`);
    }

    return data;
  }
}
