import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

export type UserRole = 'ADMIN' | 'USER';

export interface VerifiedUser {
  id: string;
  email?: string;
  role: UserRole;
  iat?: number;
}

interface AppMetadata {
  inversorai_role?: string;
}

interface SupabaseJwtPayload extends JWTPayload {
  sub?: string;
  email?: string;
  app_metadata?: AppMetadata;
}

// Singleton JWKS - created once and reused
let jwksInstance: ReturnType<typeof createRemoteJWKSet> | null = null;
let currentJwksUrl: string | null = null;

function getJwks(jwksUrl: string): ReturnType<typeof createRemoteJWKSet> {
  if (!jwksInstance || currentJwksUrl !== jwksUrl) {
    jwksInstance = createRemoteJWKSet(new URL(jwksUrl));
    currentJwksUrl = jwksUrl;
  }
  return jwksInstance;
}

export async function verifySupabaseJwt(token: string): Promise<VerifiedUser> {
  const supabaseUrl = process.env['SUPABASE_URL'];
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is required');
  }

  const issuer = process.env['SUPABASE_JWT_ISSUER'] ?? `${supabaseUrl}/auth/v1`;
  const jwksUrl = process.env['SUPABASE_JWKS_URL'] ?? `${issuer}/.well-known/jwks.json`;
  const audience = process.env['SUPABASE_JWT_AUDIENCE'];

  const jwks = getJwks(jwksUrl);

  const verifyOptions: { issuer: string; audience?: string } = { issuer };
  if (audience) {
    verifyOptions.audience = audience;
  }

  const { payload } = await jwtVerify(token, jwks, verifyOptions);
  const claims = payload as SupabaseJwtPayload;

  if (!claims.sub) {
    throw new Error('JWT missing required claim: sub');
  }

  const appMetadata = claims.app_metadata;
  const role: UserRole = appMetadata?.inversorai_role === 'ADMIN' ? 'ADMIN' : 'USER';

  return {
    id: claims.sub,
    email: claims.email,
    role,
    iat: claims.iat,
  };
}

// For testing: reset the JWKS singleton
export function resetJwksCache(): void {
  jwksInstance = null;
  currentJwksUrl = null;
}
