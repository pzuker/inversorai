import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { authenticate, requireAdmin, requireRecentAuth, createRateLimiter } from './middlewares/index.js';
import {
  MarketDataQueryController,
  GetLatestInvestmentInsightController,
  GetLatestRecommendationController,
  RunMarketAnalysisPipelineController,
  AssetsController,
  AdminUsersListController,
  AdminSetUserRoleController,
  AdminPasswordResetController,
} from './controllers/index.js';
import { getCorsConfig } from '../../config/cors.js';

// Rate limiter: 1 request per 5 minutes per asset for pipeline
const pipelineRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 1,
  resourceName: 'pipeline',
});

export function createApp(): Express {
  const app = express();

  // Security headers (helmet defaults)
  app.use(helmet());

  app.use(cors(getCorsConfig()));
  app.use(express.json({ limit: '1mb' }));

  const marketDataQueryController = new MarketDataQueryController();
  const getLatestInsightController = new GetLatestInvestmentInsightController();
  const getLatestRecommendationController = new GetLatestRecommendationController();
  const runPipelineController = new RunMarketAnalysisPipelineController();
  const assetsController = new AssetsController();
  const adminUsersListController = new AdminUsersListController();
  const adminSetUserRoleController = new AdminSetUserRoleController();
  const adminPasswordResetController = new AdminPasswordResetController();

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

  // Admin user management endpoints
  app.get(
    '/api/v1/admin/users',
    authenticate,
    requireAdmin,
    (req, res) => adminUsersListController.list(req, res)
  );

  app.post(
    '/api/v1/admin/users/:id/role',
    authenticate,
    requireAdmin,
    requireRecentAuth,
    (req, res) => adminSetUserRoleController.setRole(req, res)
  );

  app.post(
    '/api/v1/admin/users/:id/password-reset',
    authenticate,
    requireAdmin,
    (req, res) => adminPasswordResetController.sendReset(req, res)
  );

  return app;
}
