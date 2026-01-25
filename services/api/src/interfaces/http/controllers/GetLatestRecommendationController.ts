import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import { GetLatestRecommendation } from '../../../application/use-cases/index.js';
import { SupabaseRecommendationRepository } from '../../../infrastructure/repositories/index.js';
import { createSupabaseClient } from '../../../infrastructure/supabase/index.js';

export class GetLatestRecommendationController {
  async handle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const symbol = req.query['symbol'] as string | undefined;

      if (!symbol) {
        res.status(400).json({ error: 'Missing required query parameter: symbol' });
        return;
      }

      const supabaseClient = createSupabaseClient();
      const repository = new SupabaseRecommendationRepository(supabaseClient);
      const useCase = new GetLatestRecommendation(repository);

      const recommendation = await useCase.execute(symbol);

      if (!recommendation) {
        res.status(404).json({ error: `No recommendation found for symbol: ${symbol}` });
        return;
      }

      res.status(200).json({ data: recommendation });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }
}
