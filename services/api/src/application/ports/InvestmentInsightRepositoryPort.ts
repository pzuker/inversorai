import type { InvestmentInsight } from '../../domain/entities/index.js';

export interface InvestmentInsightRepositoryPort {
  save(insight: InvestmentInsight): Promise<void>;
  findLatestByAsset(symbol: string): Promise<InvestmentInsight | null>;
}
