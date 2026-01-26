import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env') });

// Disable rate limiting for tests by default (can be overridden per test)
process.env['DISABLE_RATE_LIMIT'] = 'true';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        'src/__tests__/**',
        'src/**/*.test.ts',
        'src/**/*.int.test.ts',
      ],
    },
  },
});
