import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import { RunMarketAnalysisPipeline } from '../../../application/use-cases/index.js';
import { createMarketDataProvider, isFakeProvider } from '../../../infrastructure/market-data/index.js';
import {
  SupabaseMarketDataRepository,
  SupabaseInvestmentInsightRepository,
  SupabaseRecommendationRepository,
} from '../../../infrastructure/repositories/index.js';
import { OpenAIProvider } from '../../../infrastructure/ai/index.js';
import { createSupabaseClient } from '../../../infrastructure/supabase/index.js';

const PROMPT_VERSION = '1.0';
const DEFAULT_RESOLUTION = '1d';

export class RunMarketAnalysisPipelineController {
  async run(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const symbol = (req.body?.symbol ?? req.query['symbol']) as string | undefined;

      if (!symbol) {
        res.status(400).json({ error: 'Missing required parameter: symbol' });
        return;
      }

      const resolution = (req.body?.resolution ?? req.query['resolution'] ?? DEFAULT_RESOLUTION) as string;

      const marketDataProvider = createMarketDataProvider();

      // Production guardrail: prevent fake provider in production
      if (process.env['NODE_ENV'] === 'production' && isFakeProvider(marketDataProvider)) {
        throw new Error('FakeMarketDataProvider cannot be used in production');
      }

      const supabaseClient = createSupabaseClient();

      const pipeline = new RunMarketAnalysisPipeline({
        marketDataProvider,
        marketDataRepository: new SupabaseMarketDataRepository(supabaseClient),
        aiProvider: new OpenAIProvider(PROMPT_VERSION),
        insightRepository: new SupabaseInvestmentInsightRepository(supabaseClient),
        recommendationRepository: new SupabaseRecommendationRepository(supabaseClient),
        promptVersion: PROMPT_VERSION,
      });

      const summary = await pipeline.execute(symbol, resolution);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }
}
