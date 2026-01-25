import type { Response } from 'express';
import { randomUUID } from 'crypto';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import { RunMarketAnalysisPipeline } from '../../../application/use-cases/index.js';
import { YahooFinanceMarketDataProvider } from '../../../infrastructure/market-data/index.js';
import { isValidSymbol, SUPPORTED_ASSETS } from '../../../config/assets.js';
import {
  SupabaseMarketDataRepository,
  SupabaseInvestmentInsightRepository,
  SupabaseRecommendationRepository,
} from '../../../infrastructure/repositories/index.js';
import { OpenAIProvider } from '../../../infrastructure/ai/index.js';
import { createSupabaseClient } from '../../../infrastructure/supabase/index.js';

const PROMPT_VERSION = '1.0';
const DEFAULT_RESOLUTION = '1d';

interface AuditLog {
  requestId: string;
  userRole: string;
  clientIp: string;
  assetSymbol: string;
  timestamp: string;
  result: 'success' | 'error';
  error?: string;
  duration?: number;
}

function logAudit(log: AuditLog): void {
  console.log(JSON.stringify({
    type: 'PIPELINE_AUDIT',
    ...log,
  }));
}

export class RunMarketAnalysisPipelineController {
  async run(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = randomUUID();
    const userRole = req.user?.role ?? 'unknown';
    const clientIp = req.ip ?? 'unknown';
    const startTime = Date.now();
    let symbol = '';

    try {
      symbol = (req.body?.symbol ?? req.query['symbol']) as string | undefined ?? '';

      if (!symbol) {
        logAudit({
          requestId,
          userRole,
          clientIp,
          assetSymbol: 'N/A',
          timestamp: new Date().toISOString(),
          result: 'error',
          error: 'Missing required parameter: symbol',
        });
        res.status(400).json({ error: 'Missing required parameter: symbol' });
        return;
      }

      if (!isValidSymbol(symbol)) {
        const allowedSymbols = SUPPORTED_ASSETS.map((a) => a.symbol).join(', ');
        logAudit({
          requestId,
          userRole,
          clientIp,
          assetSymbol: symbol,
          timestamp: new Date().toISOString(),
          result: 'error',
          error: `Invalid symbol. Allowed: ${allowedSymbols}`,
        });
        res.status(400).json({
          error: `Invalid symbol: ${symbol}. Allowed symbols: ${allowedSymbols}`,
        });
        return;
      }

      const resolution = (req.body?.resolution ?? req.query['resolution'] ?? DEFAULT_RESOLUTION) as string;

      // Pipeline always uses real market data provider
      const marketDataProvider = new YahooFinanceMarketDataProvider();

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

      const duration = Date.now() - startTime;

      logAudit({
        requestId,
        userRole,
        clientIp,
        assetSymbol: symbol,
        timestamp: new Date().toISOString(),
        result: 'success',
        duration,
      });

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const duration = Date.now() - startTime;

      logAudit({
        requestId,
        userRole,
        clientIp,
        assetSymbol: symbol || 'N/A',
        timestamp: new Date().toISOString(),
        result: 'error',
        error: message,
        duration,
      });

      res.status(500).json({ error: message });
    }
  }
}
