import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { parseCorsOrigins, validateCorsConfig } from '../config/cors.js';

describe('CORS Configuration', () => {
  let originalNodeEnv: string | undefined;
  let originalCorsOrigins: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env['NODE_ENV'];
    originalCorsOrigins = process.env['CORS_ORIGINS'];
  });

  afterEach(() => {
    // Restore original env vars
    if (originalNodeEnv !== undefined) {
      process.env['NODE_ENV'] = originalNodeEnv;
    } else {
      delete process.env['NODE_ENV'];
    }

    if (originalCorsOrigins !== undefined) {
      process.env['CORS_ORIGINS'] = originalCorsOrigins;
    } else {
      delete process.env['CORS_ORIGINS'];
    }
  });

  describe('parseCorsOrigins', () => {
    describe('in production', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'production';
      });

      it('throws when CORS_ORIGINS is not set', () => {
        delete process.env['CORS_ORIGINS'];

        expect(() => parseCorsOrigins()).toThrow('CORS_ORIGINS must be set in production');
      });

      it('throws when CORS_ORIGINS is empty', () => {
        process.env['CORS_ORIGINS'] = '';

        expect(() => parseCorsOrigins()).toThrow('CORS_ORIGINS must be set in production');
      });

      it('throws when CORS_ORIGINS is whitespace only', () => {
        process.env['CORS_ORIGINS'] = '   ';

        expect(() => parseCorsOrigins()).toThrow('CORS_ORIGINS must be set in production');
      });

      it('throws when CORS_ORIGINS is wildcard', () => {
        process.env['CORS_ORIGINS'] = '*';

        expect(() => parseCorsOrigins()).toThrow('CORS_ORIGINS cannot be "*" in production');
      });

      it('parses single origin', () => {
        process.env['CORS_ORIGINS'] = 'https://myapp.com';

        const origins = parseCorsOrigins();

        expect(origins).toEqual(['https://myapp.com']);
      });

      it('parses multiple comma-separated origins', () => {
        process.env['CORS_ORIGINS'] = 'https://myapp.com,https://admin.myapp.com';

        const origins = parseCorsOrigins();

        expect(origins).toEqual(['https://myapp.com', 'https://admin.myapp.com']);
      });

      it('trims whitespace from origins', () => {
        process.env['CORS_ORIGINS'] = '  https://myapp.com  ,  https://admin.myapp.com  ';

        const origins = parseCorsOrigins();

        expect(origins).toEqual(['https://myapp.com', 'https://admin.myapp.com']);
      });

      it('filters empty strings from origins', () => {
        process.env['CORS_ORIGINS'] = 'https://myapp.com,,https://admin.myapp.com';

        const origins = parseCorsOrigins();

        expect(origins).toEqual(['https://myapp.com', 'https://admin.myapp.com']);
      });
    });

    describe('in non-production', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'development';
      });

      it('returns default localhost origins when CORS_ORIGINS is not set', () => {
        delete process.env['CORS_ORIGINS'];

        const origins = parseCorsOrigins();

        expect(origins).toEqual(['http://localhost:3000', 'http://127.0.0.1:3000']);
      });

      it('returns default localhost origins when CORS_ORIGINS is empty', () => {
        process.env['CORS_ORIGINS'] = '';

        const origins = parseCorsOrigins();

        expect(origins).toEqual(['http://localhost:3000', 'http://127.0.0.1:3000']);
      });

      it('uses CORS_ORIGINS when provided', () => {
        process.env['CORS_ORIGINS'] = 'http://localhost:8080';

        const origins = parseCorsOrigins();

        expect(origins).toEqual(['http://localhost:8080']);
      });

      it('allows wildcard in non-production', () => {
        process.env['CORS_ORIGINS'] = '*';

        const origins = parseCorsOrigins();

        expect(origins).toEqual(['*']);
      });
    });

    describe('when NODE_ENV is not set', () => {
      beforeEach(() => {
        delete process.env['NODE_ENV'];
      });

      it('returns default localhost origins', () => {
        delete process.env['CORS_ORIGINS'];

        const origins = parseCorsOrigins();

        expect(origins).toEqual(['http://localhost:3000', 'http://127.0.0.1:3000']);
      });
    });
  });

  describe('validateCorsConfig', () => {
    it('throws in production when CORS_ORIGINS is not set', () => {
      process.env['NODE_ENV'] = 'production';
      delete process.env['CORS_ORIGINS'];

      expect(() => validateCorsConfig()).toThrow('CORS_ORIGINS must be set in production');
    });

    it('does not throw in development without CORS_ORIGINS', () => {
      process.env['NODE_ENV'] = 'development';
      delete process.env['CORS_ORIGINS'];

      expect(() => validateCorsConfig()).not.toThrow();
    });
  });
});

describe('CORS Middleware Integration', () => {
  let originalNodeEnv: string | undefined;
  let originalCorsOrigins: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env['NODE_ENV'];
    originalCorsOrigins = process.env['CORS_ORIGINS'];
    // Set to development to avoid fail-fast
    process.env['NODE_ENV'] = 'development';
  });

  afterEach(() => {
    if (originalNodeEnv !== undefined) {
      process.env['NODE_ENV'] = originalNodeEnv;
    } else {
      delete process.env['NODE_ENV'];
    }

    if (originalCorsOrigins !== undefined) {
      process.env['CORS_ORIGINS'] = originalCorsOrigins;
    } else {
      delete process.env['CORS_ORIGINS'];
    }
  });

  it('sets Access-Control-Allow-Origin for allowed origin', async () => {
    process.env['CORS_ORIGINS'] = 'http://example.com';

    // Need to re-import app after setting env
    const { createApp } = await import('../interfaces/http/app.js');
    const app = createApp();

    const response = await request(app)
      .get('/api/v1/assets')
      .set('Origin', 'http://example.com');

    expect(response.headers['access-control-allow-origin']).toBe('http://example.com');
  });

  it('does not set Access-Control-Allow-Origin for disallowed origin', async () => {
    process.env['CORS_ORIGINS'] = 'http://example.com';

    const { createApp } = await import('../interfaces/http/app.js');
    const app = createApp();

    const response = await request(app)
      .get('/api/v1/assets')
      .set('Origin', 'http://evil.com');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows requests without Origin header', async () => {
    process.env['CORS_ORIGINS'] = 'http://example.com';

    const { createApp } = await import('../interfaces/http/app.js');
    const app = createApp();

    const response = await request(app).get('/api/v1/assets');

    expect(response.status).toBe(200);
  });

  it('uses default localhost origins in development', async () => {
    delete process.env['CORS_ORIGINS'];
    process.env['NODE_ENV'] = 'development';

    const { createApp } = await import('../interfaces/http/app.js');
    const app = createApp();

    const response = await request(app)
      .get('/api/v1/assets')
      .set('Origin', 'http://localhost:3000');

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('handles preflight OPTIONS requests', async () => {
    process.env['CORS_ORIGINS'] = 'http://example.com';

    const { createApp } = await import('../interfaces/http/app.js');
    const app = createApp();

    const response = await request(app)
      .options('/api/v1/assets')
      .set('Origin', 'http://example.com')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.headers['access-control-allow-origin']).toBe('http://example.com');
    expect(response.headers['access-control-allow-methods']).toContain('GET');
  });

  it('preflight OPTIONS returns 204 and allows GET and POST methods', async () => {
    process.env['CORS_ORIGINS'] = 'http://example.com';

    const { createApp } = await import('../interfaces/http/app.js');
    const app = createApp();

    const response = await request(app)
      .options('/api/v1/market-data')
      .set('Origin', 'http://example.com')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

    // Preflight should return 204 No Content (or 200 depending on cors config)
    expect([200, 204]).toContain(response.status);

    // Should echo back the allowed origin
    expect(response.headers['access-control-allow-origin']).toBe('http://example.com');

    // Should include both GET and POST in allowed methods
    const allowedMethods = response.headers['access-control-allow-methods'];
    expect(allowedMethods).toContain('GET');
    expect(allowedMethods).toContain('POST');

    // Should allow credentials
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('preflight OPTIONS rejects disallowed origin', async () => {
    process.env['CORS_ORIGINS'] = 'http://example.com';

    const { createApp } = await import('../interfaces/http/app.js');
    const app = createApp();

    const response = await request(app)
      .options('/api/v1/market-data')
      .set('Origin', 'http://malicious.com')
      .set('Access-Control-Request-Method', 'POST');

    // Should not set Access-Control-Allow-Origin for disallowed origin
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
