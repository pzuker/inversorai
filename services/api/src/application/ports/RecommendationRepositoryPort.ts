import type { Recommendation } from '../../domain/entities/index.js';

export interface RecommendationRepositoryPort {
  save(recommendation: Recommendation): Promise<void>;
  findLatestByAsset(symbol: string): Promise<Recommendation | null>;
}
