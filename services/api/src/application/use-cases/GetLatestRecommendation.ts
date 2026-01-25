import type { Recommendation } from '../../domain/entities/index.js';
import type { RecommendationRepositoryPort } from '../ports/index.js';

export class GetLatestRecommendation {
  constructor(private readonly repository: RecommendationRepositoryPort) {}

  async execute(assetSymbol: string): Promise<Recommendation | null> {
    if (!assetSymbol || assetSymbol.trim() === '') {
      throw new Error('Asset symbol is required');
    }

    return this.repository.findLatestByAsset(assetSymbol);
  }
}
