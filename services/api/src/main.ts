import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

async function main(): Promise<void> {
  const symbol = 'BTC-USD';

  const hasSupabase = !!(process.env['SUPABASE_URL'] && process.env['SUPABASE_SERVICE_ROLE_KEY']);

  if (hasSupabase) {
    const { runIngestAndPersist } = await import('./runners/ingestAndPersist.js');
    const result = await runIngestAndPersist(symbol);
    console.log(`Ingested ${result.ingestedCount} points`);
    console.log(`Persisted ${result.persistedCount} points`);
  } else {
    const { IngestMarketData } = await import('./application/use-cases/index.js');
    const { FakeMarketDataProvider } = await import('./infrastructure/providers/index.js');

    const provider = new FakeMarketDataProvider();
    const useCase = new IngestMarketData(provider);
    const data = await useCase.execute(symbol);

    const first = data[0];
    const last = data[data.length - 1];

    console.log(`Ingested ${data.length} points for ${symbol} (no persistence - missing env vars)`);
    console.log(`First: ${first?.timestamp.toISOString()}, Last: ${last?.timestamp.toISOString()}`);
  }
}

main().catch(console.error);
