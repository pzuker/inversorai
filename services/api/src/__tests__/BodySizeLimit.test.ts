import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

describe('Request Body Size Limit', () => {
  let app: Express;

  beforeAll(async () => {
    const { createApp } = await import('../interfaces/http/app.js');
    app = createApp();
  });

  it('rejects JSON payload exceeding 1mb with 413 status', async () => {
    // Create a payload slightly over 1mb (1mb = 1048576 bytes)
    // Using a string that will exceed 1mb when JSON encoded
    const largeString = 'x'.repeat(1024 * 1024 + 1000); // ~1mb + 1kb
    const oversizedPayload = { data: largeString };

    const response = await request(app)
      .post('/api/v1/admin/pipeline/run')
      .set('Content-Type', 'application/json')
      .send(oversizedPayload);

    // Express returns 413 Payload Too Large for oversized requests
    expect(response.status).toBe(413);
  });

  it('accepts JSON payload under 1mb', async () => {
    // Create a payload under 1mb
    const normalPayload = { symbol: 'BTC-USD' };

    const response = await request(app)
      .post('/api/v1/admin/pipeline/run')
      .set('Content-Type', 'application/json')
      .send(normalPayload);

    // Should not be 413 (will be 401 due to missing auth, which is expected)
    expect(response.status).not.toBe(413);
  });
});
