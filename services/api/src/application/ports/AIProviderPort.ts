export interface AIProviderInput {
  assetSymbol: string;
  asOf: string;
  resolution: string;
  trend: string;
  signalStrength: number;
  kpis: Record<string, number>;
  rationale: string;
}

export interface AIProviderOutput {
  recommendation: {
    action: 'BUY' | 'HOLD' | 'SELL';
    confidenceScore: number;
    horizon: 'SHORT' | 'MID' | 'LONG';
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  insight: {
    summary: string;
    reasoning: string;
    assumptions: string[];
    caveats: string[];
  };
  model: {
    name: string;
    version: string;
  };
}

export interface AIProviderPort {
  generateInvestmentInsight(input: AIProviderInput): Promise<AIProviderOutput>;
}
