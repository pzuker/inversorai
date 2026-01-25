import { config } from 'dotenv';
import { resolve } from 'path';
import { createApp } from './app.js';

// Try multiple locations for .env
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '../../.env') });

const PORT = process.env['PORT'] ?? 3001;

const app = createApp();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
