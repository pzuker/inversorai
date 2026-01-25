import type { InvestmentInsight } from '../../domain/entities/index.js';
import type { InvestmentInsightRepositoryPort } from '../ports/index.js';

export class GetLatestInvestmentInsight {
  constructor(private readonly repository: InvestmentInsightRepositoryPort) {}

  async execute(assetSymbol: string): Promise<InvestmentInsight | null> {
    if (!assetSymbol || assetSymbol.trim() === '') {
      throw new Error('Asset symbol is required');
    }

    return this.repository.findLatestByAsset(assetSymbol);
  }
}
