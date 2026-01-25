import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import { runIngestAndPersist } from '../../../runners/ingestAndPersist.js';

export class AdminIngestController {
  async ingestAndPersist(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await runIngestAndPersist('BTC-USD');

      res.status(200).json({
        ingestedCount: result.ingestedCount,
        persistedCount: result.persistedCount,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }
}
