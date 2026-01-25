import { IngestMarketData, PersistMarketData } from '../application/use-cases/index.js';
import { FakeMarketDataProvider } from '../infrastructure/providers/index.js';
import { SupabaseMarketDataRepository } from '../infrastructure/repositories/index.js';
import { createSupabaseClient } from '../infrastructure/supabase/index.js';

export interface IngestAndPersistResult {
  ingestedCount: number;
  persistedCount: number;
}

export async function runIngestAndPersist(assetSymbol: string): Promise<IngestAndPersistResult> {
  const supabaseClient = createSupabaseClient();

  const provider = new FakeMarketDataProvider();
  const repository = new SupabaseMarketDataRepository(supabaseClient);

  const ingestUseCase = new IngestMarketData(provider);
  const persistUseCase = new PersistMarketData(repository);

  const points = await ingestUseCase.execute(assetSymbol);
  await persistUseCase.execute(points);

  const stored = await repository.findBySymbol(assetSymbol);

  return {
    ingestedCount: points.length,
    persistedCount: stored.length,
  };
}
