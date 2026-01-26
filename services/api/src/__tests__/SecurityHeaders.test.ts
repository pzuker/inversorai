import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

describe('Security Headers', () => {
  let app: Express;

  beforeAll(async () => {
    const { createApp } = await import('../interfaces/http/app.js');
    app = createApp();
  });

  it('includes X-Content-Type-Options header', async () => {
    const response = await request(app).get('/api/v1/assets');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('includes X-Frame-Options header', async () => {
    const response = await request(app).get('/api/v1/assets');

    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('includes Referrer-Policy header', async () => {
    const response = await request(app).get('/api/v1/assets');

    expect(response.headers['referrer-policy']).toBe('no-referrer');
  });

  it('includes X-DNS-Prefetch-Control header', async () => {
    const response = await request(app).get('/api/v1/assets');

    expect(response.headers['x-dns-prefetch-control']).toBe('off');
  });

  it('includes Strict-Transport-Security header', async () => {
    const response = await request(app).get('/api/v1/assets');

    // Helmet sets HSTS by default
    expect(response.headers['strict-transport-security']).toBeDefined();
  });
});
