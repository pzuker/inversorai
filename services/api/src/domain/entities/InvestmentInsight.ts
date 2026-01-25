export interface InvestmentInsight {
  assetSymbol: string;
  summary: string;
  reasoning: string;
  assumptions: string[];
  caveats: string[];
  modelName: string;
  modelVersion: string;
  promptVersion: string;
  outputSchemaVersion: string;
  inputSnapshotHash: string;
  createdAt: Date;
}
