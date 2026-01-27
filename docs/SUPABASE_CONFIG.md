# Supabase Configuration Requirements

**Fecha:** 2026-01-26

This document specifies the required Supabase Dashboard settings for the InversorAI MVP. All items marked **REQUIRED** must be configured for the application to function correctly.

---

## Authentication Settings

### JWT Configuration

| Setting | Requirement | Rationale |
|---------|-------------|-----------|
| JWT Secret | **REQUIRED** - Auto-generated | Used by Supabase Auth to sign tokens |
| JWKS Endpoint | **REQUIRED** - Enabled by default | Backend verifies tokens via `/.well-known/jwks.json` |
| JWT Expiry | Recommended: 3600s (1 hour) | Balance between security and UX |

**Code Reference:** `services/api/src/infrastructure/auth/verifySupabaseJwt.ts`
- Backend fetches JWKS from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`
- Validates issuer: `{SUPABASE_URL}/auth/v1`
- Uses `jose` library for cryptographic verification (ES256)

### Site URL & Redirect URLs

| Setting | Requirement | Value |
|---------|-------------|-------|
| Site URL | **REQUIRED** | Production frontend URL (e.g., `https://app.inversorai.com`) |
| Redirect URLs | **REQUIRED** | Allowlist of valid redirect destinations |

**Required Redirect URLs:**
```
https://app.inversorai.com
https://app.inversorai.com/reset-password
https://app.inversorai.com/login
```

For development, add:
```
http://localhost:3000
http://localhost:3000/reset-password
http://localhost:3000/login
```

---

## Email Configuration

### SMTP Settings

| Setting | Requirement | Notes |
|---------|-------------|-------|
| SMTP Provider | **REQUIRED** for production | Supabase built-in has rate limits |
| Custom SMTP | Recommended | For reliable email delivery |

**Email Flows Used:**
1. User registration confirmation
2. Password reset (triggered via admin action or user request)
3. Admin invite (via bootstrap script)

### Email Templates

| Template | Requirement | Notes |
|----------|-------------|-------|
| Confirm signup | Optional customization | Default works |
| Reset password | Optional customization | Default works |
| Invite user | Optional customization | Used by bootstrap script |
| Magic link | Not used | N/A |

---

## Password Policy

### Minimum Requirements (MVP)

| Setting | Requirement | Value |
|---------|-------------|-------|
| Minimum length | **REQUIRED** | 8 characters minimum |
| Leaked password protection | Recommended | Enable if available |
| MFA | Not required for MVP | Can be enabled later |

**Note:** Password policy is enforced by Supabase Auth, not application code.

---

## Rate Limits

### Auth Rate Limits

| Endpoint | Default | Recommendation |
|----------|---------|----------------|
| Sign up | 5/hour per IP | Keep default |
| Sign in | 30/hour per IP | Keep default |
| Password reset | 5/hour per IP | Keep default |

**Note:** Application-level rate limiting is implemented separately for the pipeline endpoint (see `rateLimiter.ts`).

---

## Database Tables & RLS

### Core Application Tables

#### 1. `market_data`

```sql
CREATE TABLE market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_symbol TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset_symbol, timestamp)
);
```

**RLS Policy:**
| Role | Read | Write |
|------|------|-------|
| Authenticated (USER) | Yes | No |
| Service Role (ADMIN pipeline) | Yes | Yes |

```sql
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read market data"
  ON market_data FOR SELECT
  TO authenticated
  USING (true);
```

#### 2. `investment_insights`

```sql
CREATE TABLE investment_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_symbol TEXT NOT NULL,
  summary TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  assumptions JSONB NOT NULL DEFAULT '[]',
  caveats JSONB NOT NULL DEFAULT '[]',
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  output_schema_version TEXT NOT NULL,
  input_snapshot_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policy:**
| Role | Read | Write |
|------|------|-------|
| Authenticated (USER) | Yes | No |
| Service Role (ADMIN pipeline) | Yes | Yes |

```sql
ALTER TABLE investment_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read insights"
  ON investment_insights FOR SELECT
  TO authenticated
  USING (true);
```

#### 3. `recommendations`

```sql
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_symbol TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('BUY', 'HOLD', 'SELL')),
  confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  horizon TEXT NOT NULL CHECK (horizon IN ('SHORT', 'MID', 'LONG')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policy:**
| Role | Read | Write |
|------|------|-------|
| Authenticated (USER) | Yes | No |
| Service Role (ADMIN pipeline) | Yes | Yes |

```sql
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read recommendations"
  ON recommendations FOR SELECT
  TO authenticated
  USING (true);
```

### Optional Infrastructure Tables

#### 4. `rate_limit_buckets` (Distributed Rate Limiting)

**Required when:** `RATE_LIMIT_STORE=supabase`

**Migration file:** `docs/db/001_rate_limit_function.sql`

```sql
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  count INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_window_start
  ON rate_limit_buckets(window_start);
```

Also includes the `rate_limit_check_and_increment` function for atomic operations.

**Note:** This table is only needed if deploying multiple API instances and enabling distributed rate limiting via `RATE_LIMIT_STORE=supabase`.

#### 5. `audit_logs` (Persistent Audit Trail)

**Required when:** `AUDIT_LOG_PERSIST=true`

**Migration file:** `docs/db/002_audit_logs_table.sql`

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('success', 'error')),
  actor_id TEXT NOT NULL,
  actor_email TEXT,
  actor_role TEXT,
  target_id TEXT,
  target_email TEXT,
  request_id TEXT,
  client_ip TEXT,
  user_agent TEXT,
  error_message TEXT,
  metadata JSONB
);
```

See `docs/AUDIT_LOGGING.md` for details on retention and privacy.

---

## User Roles (app_metadata)

### Role Storage

User roles are stored in `auth.users.app_metadata.inversorai_role`:

| Value | Description |
|-------|-------------|
| `ADMIN` | Full access, can run pipeline and manage users |
| `USER` (or absent) | Read-only access to data |

**Code Reference:** `services/api/src/infrastructure/auth/verifySupabaseJwt.ts:59`

```typescript
const role: UserRole = appMetadata?.inversorai_role === 'ADMIN' ? 'ADMIN' : 'USER';
```

### Setting Admin Role

**Recommended method:** Use the bootstrap script:

```bash
cd services/api
npm run bootstrap:admin
```

Requires environment variables:
- `INITIAL_ADMIN_EMAIL`: Email of the first admin
- `INITIAL_ADMIN_INVITE_REDIRECT_TO`: Redirect URL after invite (optional)

**Alternative:** Via SQL Editor (replace USER_ID):

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"inversorai_role": "ADMIN"}'
WHERE id = 'USER_ID';
```

**Behavior:**
1. If an ADMIN already exists → noop (idempotent)
2. If user exists → promotes to ADMIN
3. If user doesn't exist → invites via email and sets ADMIN role

**Implementation:** `services/api/src/runners/bootstrapInitialAdmin.ts`

---

## API Keys

### Key Types

| Key | Usage | Exposure |
|-----|-------|----------|
| `anon` (public) | Frontend client | Public (in browser) |
| `service_role` | Backend only | **NEVER expose to client** |

**Environment Variables:**
```env
# Frontend (public)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend (secret)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Verification Checklist

Use this checklist to verify Supabase Dashboard configuration:

### Authentication
- [ ] **Settings > Authentication > URL Configuration**
  - [ ] Site URL is set to production frontend URL
  - [ ] Redirect URLs include all valid callback URLs

### Email
- [ ] **Settings > Authentication > Email**
  - [ ] Enable email confirmations (if required)
  - [ ] SMTP configured (or using Supabase default with limits understood)

### Password
- [ ] **Settings > Authentication > Security**
  - [ ] Minimum password length >= 8
  - [ ] Leaked password protection enabled (if available)

### Database
- [ ] **Database > Tables**
  - [ ] `market_data` table exists
  - [ ] `investment_insights` table exists
  - [ ] `recommendations` table exists
  - [ ] `rate_limit_buckets` table exists (if using distributed rate limiting)
  - [ ] `audit_logs` table exists (if using persistent audit logs)

### RLS
- [ ] **Database > Tables > [table] > RLS**
  - [ ] RLS enabled on `market_data`
  - [ ] RLS enabled on `investment_insights`
  - [ ] RLS enabled on `recommendations`
  - [ ] SELECT policy exists for authenticated users on each table

### Functions
- [ ] **Database > Functions** (if using distributed rate limiting)
  - [ ] `rate_limit_check_and_increment` function exists
  - [ ] `rate_limit_cleanup` function exists (optional)

### API Keys
- [ ] **Settings > API**
  - [ ] Note `anon` key for frontend
  - [ ] Note `service_role` key for backend (keep secret)
  - [ ] Note Project URL

### First Admin
- [ ] Create first user via bootstrap script or manual invite
- [ ] Verify `app_metadata.inversorai_role = 'ADMIN'` is set

---

## Security Notes

1. **Service Role Key**: Never expose in client-side code or commit to repository
2. **RLS**: Always enable RLS on tables containing user data
3. **Redirect URLs**: Keep allowlist minimal to prevent open redirect vulnerabilities
4. **Email Confirmation**: Consider enabling for production to verify user emails
5. **JWKS Verification**: The backend verifies JWTs locally using the JWKS endpoint, not by calling Supabase Auth API

---

## Related Documentation

- [Audit Logging](./AUDIT_LOGGING.md)
- [CI/CD y Deploy](./08_CICD_Y_DEPLOY.md)
- [Checklist Final](./09_CHECKLIST_FINAL.md)
