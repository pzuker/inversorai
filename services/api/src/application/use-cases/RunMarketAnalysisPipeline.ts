import type {
  MarketDataProviderPort,
  MarketDataRepositoryPort,
  AIProviderPort,
  InvestmentInsightRepositoryPort,
  RecommendationRepositoryPort,
} from '../ports/index.js';
import { IngestMarketData } from './IngestMarketData.js';
import { PersistMarketData } from './PersistMarketData.js';
import { ComputeIndicators } from './ComputeIndicators.js';
import { AnalyzeMarketTrends } from './AnalyzeMarketTrends.js';
import { GenerateInvestmentInsight } from './GenerateInvestmentInsight.js';

export interface PipelineDependencies {
  marketDataProvider: MarketDataProviderPort;
  marketDataRepository: MarketDataRepositoryPort;
  aiProvider: AIProviderPort;
  insightRepository: InvestmentInsightRepositoryPort;
  recommendationRepository: RecommendationRepositoryPort;
  promptVersion: string;
}

export interface PipelineSummary {
  assetSymbol: string;
  resolution: string;
  ingestedCount: number;
  indicatorComputed: boolean;
  analysisGenerated: boolean;
  insightGenerated: boolean;
  trend: string;
  recommendationAction: string;
  executedAt: Date;
}

export class RunMarketAnalysisPipeline {
  private readonly ingestMarketData: IngestMarketData;
  private readonly persistMarketData: PersistMarketData;
  private readonly computeIndicators: ComputeIndicators;
  private readonly analyzeMarketTrends: AnalyzeMarketTrends;
  private readonly generateInvestmentInsight: GenerateInvestmentInsight;
  private readonly insightRepository: InvestmentInsightRepositoryPort;
  private readonly recommendationRepository: RecommendationRepositoryPort;

  constructor(deps: PipelineDependencies) {
    this.ingestMarketData = new IngestMarketData(deps.marketDataProvider);
    this.persistMarketData = new PersistMarketData(deps.marketDataRepository);
    this.computeIndicators = new ComputeIndicators();
    this.analyzeMarketTrends = new AnalyzeMarketTrends();
    this.generateInvestmentInsight = new GenerateInvestmentInsight(deps.aiProvider, deps.promptVersion);
    this.insightRepository = deps.insightRepository;
    this.recommendationRepository = deps.recommendationRepository;
  }

  async execute(assetSymbol: string, resolution: string): Promise<PipelineSummary> {
    // Step 1: Ingest market data
    const marketData = await this.ingestMarketData.execute(assetSymbol);

    // Step 2: Persist market data
    await this.persistMarketData.execute(marketData);

    // Step 3: Compute indicators
    const indicators = this.computeIndicators.execute(marketData, resolution);

    // Step 4: Analyze market trends
    const analysis = this.analyzeMarketTrends.execute(marketData, indicators);

    // Step 5: Generate AI insight
    const { insight, recommendation } = await this.generateInvestmentInsight.execute(analysis);

    // Step 6: Persist insight and recommendation
    await this.insightRepository.save(insight);
    await this.recommendationRepository.save(recommendation);

    return {
      assetSymbol,
      resolution,
      ingestedCount: marketData.length,
      indicatorComputed: true,
      analysisGenerated: true,
      insightGenerated: true,
      trend: analysis.trend,
      recommendationAction: recommendation.action,
      executedAt: new Date(),
    };
  }
}
