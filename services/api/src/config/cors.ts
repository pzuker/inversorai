import type { CorsOptions } from 'cors';

const DEFAULT_DEV_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

export interface CorsConfig {
  origins: string[];
  credentials: boolean;
}

/**
 * Parse CORS_ORIGINS environment variable into an array of allowed origins.
 * - Comma-separated list of origins
 * - Trims whitespace and filters empty strings
 * - In production: requires explicit configuration (throws if missing)
 * - In non-production: defaults to localhost origins
 */
export function parseCorsOrigins(): string[] {
  const envValue = process.env['CORS_ORIGINS'];
  const isProduction = process.env['NODE_ENV'] === 'production';

  // Production requires explicit CORS_ORIGINS
  if (isProduction) {
    if (!envValue || envValue.trim() === '') {
      throw new Error(
        'CORS_ORIGINS must be set in production. ' +
        'Provide a comma-separated list of allowed origins (e.g., https://myapp.com)'
      );
    }

    const origins = envValue
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin !== '');

    // Wildcard not allowed in production
    if (origins.includes('*')) {
      throw new Error(
        'CORS_ORIGINS cannot be "*" in production. ' +
        'Provide explicit origins for security.'
      );
    }

    return origins;
  }

  // Non-production: use env if provided, otherwise default to localhost
  if (envValue && envValue.trim() !== '') {
    return envValue
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin !== '');
  }

  return DEFAULT_DEV_ORIGINS;
}

/**
 * Get CORS configuration for Express middleware.
 * - Validates origins against allowlist
 * - Supports requests without Origin header (server-to-server/curl)
 */
export function getCorsConfig(): CorsOptions {
  const allowedOrigins = parseCorsOrigins();

  return {
    origin: (origin, callback) => {
      // Allow requests with no Origin header (server-to-server, curl, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Check if origin is in the allowlist
      if (allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        // Origin not allowed - do not set ACAO header
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  };
}

/**
 * Validate CORS configuration at startup.
 * Call this during server initialization to fail-fast in production
 * if CORS_ORIGINS is not configured.
 */
export function validateCorsConfig(): void {
  // This will throw in production if CORS_ORIGINS is missing
  parseCorsOrigins();
}
