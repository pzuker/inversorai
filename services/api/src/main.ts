import { IngestMarketData } from './application/use-cases/index.js';
import { FakeMarketDataProvider } from './infrastructure/providers/index.js';

async function main(): Promise<void> {
  const symbol = 'BTC-USD';

  const provider = new FakeMarketDataProvider();
  const useCase = new IngestMarketData(provider);

  const data = await useCase.execute(symbol);

  const first = data[0];
  const last = data[data.length - 1];

  console.log(`Ingested ${data.length} points for ${symbol}`);
  console.log(`First: ${first?.timestamp.toISOString()}, Last: ${last?.timestamp.toISOString()}`);
  if (first) {
    console.log(`Sample: ${first.timestamp.toISOString()} O:${first.open} H:${first.high} L:${first.low} C:${first.close} V:${first.volume}`);
  }
}

main().catch(console.error);
