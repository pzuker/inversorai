import type { MarketDataPoint } from '../../domain/entities/index.js';
import type { MarketDataRepositoryPort } from '../ports/index.js';

export class PersistMarketData {
  constructor(private readonly repository: MarketDataRepositoryPort) {}

  async execute(points: MarketDataPoint[]): Promise<void> {
    if (points.length === 0) {
      throw new Error('Cannot persist empty market data');
    }

    await this.repository.save(points);
  }
}
