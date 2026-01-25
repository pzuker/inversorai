import express, { type Express } from 'express';
import cors from 'cors';
import { authenticate, requireAdmin } from './middlewares/index.js';
import {
  MarketDataQueryController,
  GetLatestInvestmentInsightController,
  GetLatestRecommendationController,
  RunMarketAnalysisPipelineController,
} from './controllers/index.js';

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

  // Read endpoints - use only Supabase repositories
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

  // Admin endpoint - runs full pipeline with real data
  app.post(
    '/api/v1/admin/pipeline/run',
    authenticate,
    requireAdmin,
    (req, res) => runPipelineController.run(req, res)
  );

  return app;
}
