import { config } from 'dotenv';
import { resolve } from 'path';

// Load env files - this module should be imported first
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '../../.env') });
