import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import { GetLatestInvestmentInsight } from '../../../application/use-cases/index.js';
import { SupabaseInvestmentInsightRepository } from '../../../infrastructure/repositories/index.js';
import { createSupabaseClient } from '../../../infrastructure/supabase/index.js';

export class GetLatestInvestmentInsightController {
  async handle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const symbol = req.query['symbol'] as string | undefined;

      if (!symbol) {
        res.status(400).json({ error: 'Missing required query parameter: symbol' });
        return;
      }

      const supabaseClient = createSupabaseClient();
      const repository = new SupabaseInvestmentInsightRepository(supabaseClient);
      const useCase = new GetLatestInvestmentInsight(repository);

      const insight = await useCase.execute(symbol);

      if (!insight) {
        res.status(404).json({ error: `No investment insight found for symbol: ${symbol}` });
        return;
      }

      res.status(200).json({ data: insight });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }
}
