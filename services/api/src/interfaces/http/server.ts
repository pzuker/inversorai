// Load environment variables first
import './env.js';

import { createApp } from './app.js';

const PORT = process.env['PORT'] ?? 3001;

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MARKET_DATA_PROVIDER: ${process.env['MARKET_DATA_PROVIDER']}`);
});

// Keep the process alive
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
