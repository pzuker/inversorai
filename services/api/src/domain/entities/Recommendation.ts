export type RecommendationAction = 'BUY' | 'HOLD' | 'SELL';
export type RecommendationHorizon = 'SHORT' | 'MID' | 'LONG';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Recommendation {
  assetSymbol: string;
  action: RecommendationAction;
  confidenceScore: number;
  horizon: RecommendationHorizon;
  riskLevel: RiskLevel;
  createdAt: Date;
}
