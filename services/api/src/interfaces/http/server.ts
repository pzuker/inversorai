import { config } from 'dotenv';
import { resolve } from 'path';
import { createApp } from './app.js';

config({ path: resolve(process.cwd(), '.env') });

const PORT = process.env['PORT'] ?? 3000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
