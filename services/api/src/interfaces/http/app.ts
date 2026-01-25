import express, { type Express } from 'express';
import cors from 'cors';
import { authenticate, requireAdmin, createRateLimiter } from './middlewares/index.js';
import {
  MarketDataQueryController,
  GetLatestInvestmentInsightController,
  GetLatestRecommendationController,
  RunMarketAnalysisPipelineController,
  AssetsController,
} from './controllers/index.js';

// Rate limiter: 1 request per 5 minutes per asset for pipeline
const pipelineRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 1,
  resourceName: 'pipeline',
});

export function createApp(): Express {
  const app = express();

  app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  }));
  app.use(express.json());

  const marketDataQueryController = new MarketDataQueryController();
  const getLatestInsightController = new GetLatestInvestmentInsightController();
  const getLatestRecommendationController = new GetLatestRecommendationController();
  const runPipelineController = new RunMarketAnalysisPipelineController();
  const assetsController = new AssetsController();

  // Public endpoint - list available assets (no auth required)
  app.get('/api/v1/assets', (req, res) => assetsController.getAll(req, res));

  // Read endpoints - use only Supabase repositories (no rate limiting)
  app.get(
    '/api/v1/market-data',
    authenticate,
    (req, res) => marketDataQueryController.getBySymbol(req, res)
  );

  app.get(
    '/api/v1/insights/latest',
    authenticate,
    (req, res) => getLatestInsightController.handle(req, res)
  );

  app.get(
    '/api/v1/recommendations/latest',
    authenticate,
    (req, res) => getLatestRecommendationController.handle(req, res)
  );

  // Admin endpoint - runs full pipeline with real data (rate limited)
  app.post(
    '/api/v1/admin/pipeline/run',
    authenticate,
    requireAdmin,
    pipelineRateLimiter,
    (req, res) => runPipelineController.run(req, res)
  );

  return app;
}
