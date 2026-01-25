import { createHash } from 'crypto';
import type { MarketAnalysis, Recommendation, InvestmentInsight } from '../../domain/entities/index.js';
import type { AIProviderPort, AIProviderInput } from '../ports/index.js';
import { validateInvestmentInsightOutput, OUTPUT_SCHEMA_VERSION } from '../schemas/index.js';

export interface GenerateInvestmentInsightResult {
  insight: InvestmentInsight;
  recommendation: Recommendation;
}

export class GenerateInvestmentInsight {
  constructor(
    private readonly aiProvider: AIProviderPort,
    private readonly promptVersion: string
  ) {}

  async execute(analysis: MarketAnalysis): Promise<GenerateInvestmentInsightResult> {
    const input = this.buildInput(analysis);
    const inputSnapshotHash = this.computeInputHash(input);

    const rawOutput = await this.aiProvider.generateInvestmentInsight(input);

    const validationResult = validateInvestmentInsightOutput(rawOutput);
    if (!validationResult.ok) {
      throw new Error(`AI output validation failed: ${validationResult.error}`);
    }

    const output = validationResult.value;
    const now = new Date();

    const recommendation: Recommendation = {
      assetSymbol: analysis.assetSymbol,
      action: output.recommendation.action,
      confidenceScore: output.recommendation.confidenceScore,
      horizon: output.recommendation.horizon,
      riskLevel: output.recommendation.riskLevel,
      createdAt: now,
    };

    const insight: InvestmentInsight = {
      assetSymbol: analysis.assetSymbol,
      summary: output.insight.summary,
      reasoning: output.insight.reasoning,
      assumptions: output.insight.assumptions,
      caveats: output.insight.caveats,
      modelName: output.model.name,
      modelVersion: output.model.version,
      promptVersion: this.promptVersion,
      outputSchemaVersion: OUTPUT_SCHEMA_VERSION,
      inputSnapshotHash,
      createdAt: now,
    };

    return { insight, recommendation };
  }

  private buildInput(analysis: MarketAnalysis): AIProviderInput {
    return {
      assetSymbol: analysis.assetSymbol,
      asOf: analysis.asOf.toISOString(),
      resolution: analysis.resolution,
      trend: analysis.trend,
      signalStrength: analysis.signalStrength,
      kpis: analysis.kpis,
      rationale: analysis.rationale,
    };
  }

  private computeInputHash(input: AIProviderInput): string {
    const canonical = this.canonicalizeJson(input);
    return createHash('sha256').update(canonical).digest('hex');
  }

  private canonicalizeJson(obj: unknown): string {
    return JSON.stringify(obj, Object.keys(obj as object).sort());
  }
}
