import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import { SupabaseMarketDataRepository } from '../../../infrastructure/repositories/index.js';
import { createSupabaseClient } from '../../../infrastructure/supabase/index.js';

export class MarketDataQueryController {
  async getBySymbol(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const symbol = req.query['symbol'] as string | undefined;

      if (!symbol) {
        res.status(400).json({ error: 'Missing required query parameter: symbol' });
        return;
      }

      const supabaseClient = createSupabaseClient();
      const repository = new SupabaseMarketDataRepository(supabaseClient);

      const data = await repository.findBySymbol(symbol);

      res.status(200).json({ data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }
}
