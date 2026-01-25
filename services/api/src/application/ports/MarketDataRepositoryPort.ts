import type { MarketDataPoint } from '../../domain/entities/index.js';

export interface MarketDataRepositoryPort {
  save(points: MarketDataPoint[]): Promise<void>;
  findBySymbol(assetSymbol: string): Promise<MarketDataPoint[]>;
}
