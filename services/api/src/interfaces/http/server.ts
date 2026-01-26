// Load environment variables first
import './env.js';

import { createApp } from './app.js';

// Fail-fast: production requires REAL market data provider
const isProduction = process.env['NODE_ENV'] === 'production';
const marketDataProvider = process.env['MARKET_DATA_PROVIDER'];

if (isProduction && marketDataProvider !== 'REAL') {
  console.error('FATAL: Production requires MARKET_DATA_PROVIDER=REAL');
  console.error(`Current value: ${marketDataProvider ?? '(not set)'}`);
  process.exit(1);
}

const PORT = process.env['PORT'] ?? 3001;

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MARKET_DATA_PROVIDER: ${process.env['MARKET_DATA_PROVIDER']}`);
});

// Error handling
server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
