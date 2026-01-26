import { SignJWT, generateKeyPair, exportJWK } from 'jose';
import nock from 'nock';
import { resetJwksCache } from '../../infrastructure/auth/index.js';

const TEST_ISSUER = 'http://local-issuer/auth/v1';
const TEST_JWKS_PATH = '/.well-known/jwks.json';
const TEST_KID = 'test-kid';

let privateKey: Awaited<ReturnType<typeof generateKeyPair>>['privateKey'] | null = null;
let publicJwk: object | null = null;

export async function setupJwtTestEnvironment(): Promise<void> {
  // Generate ES256 key pair
  const keyPair = await generateKeyPair('ES256');
  privateKey = keyPair.privateKey;

  // Export public key as JWK
  const jwk = await exportJWK(keyPair.publicKey);
  publicJwk = {
    ...jwk,
    kid: TEST_KID,
    use: 'sig',
    alg: 'ES256',
  };

  // Set JWT-related environment variables for test
  // Keep SUPABASE_URL as-is for the Supabase client, only override JWT verification
  process.env['SUPABASE_JWT_ISSUER'] = TEST_ISSUER;
  process.env['SUPABASE_JWKS_URL'] = `${TEST_ISSUER}${TEST_JWKS_PATH}`;

  // Reset JWKS cache to pick up new env vars
  resetJwksCache();

  // Setup nock to mock JWKS endpoint only
  nock('http://local-issuer')
    .persist()
    .get('/auth/v1/.well-known/jwks.json')
    .reply(200, { keys: [publicJwk] });
}

export function cleanupJwtTestEnvironment(): void {
  nock.cleanAll();
  resetJwksCache();
}

export interface TokenOptions {
  userId?: string;
  email?: string;
  role?: 'ADMIN' | 'USER';
}

export async function generateTestToken(options: TokenOptions = {}): Promise<string> {
  if (!privateKey) {
    throw new Error('JWT test environment not initialized. Call setupJwtTestEnvironment() first.');
  }

  const { userId = 'test-user-id', email = 'test@example.com', role } = options;

  const now = Math.floor(Date.now() / 1000);

  const payload: Record<string, unknown> = {
    sub: userId,
    email,
    iat: now,
    exp: now + 3600, // 1 hour expiry
  };

  if (role === 'ADMIN') {
    payload.app_metadata = { inversorai_role: 'ADMIN' };
  }

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'ES256', kid: TEST_KID })
    .setIssuer(TEST_ISSUER)
    .sign(privateKey);

  return token;
}

export async function generateAdminToken(): Promise<string> {
  return generateTestToken({ role: 'ADMIN', userId: 'admin-user-id', email: 'admin@example.com' });
}

export async function generateUserToken(): Promise<string> {
  return generateTestToken({ role: 'USER', userId: 'regular-user-id', email: 'user@example.com' });
}
