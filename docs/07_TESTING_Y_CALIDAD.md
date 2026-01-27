# 07 — Testing y Calidad del Software

**Proyecto:** InversorAI
**Fecha:** 2026-01-26
**Contexto:** Trabajo Final de Máster – Desarrollo de Sistemas con IA

---

## 1. Propósito del Documento

Este documento define la estrategia de testing y calidad del sistema InversorAI, con especial énfasis en:

- TDD como metodología de desarrollo,
- testing por capas (dominio, casos de uso, integración),
- testing específico para sistemas que integran IA,
- tests de regresión de seguridad,
- control de regresiones y trazabilidad.

---

## 2. Metodología de Desarrollo

Se adopta **TDD estricto** como práctica base:

- RED: escribir un test que falle y defina el comportamiento.
- GREEN: implementar lo mínimo para pasar el test.
- REFACTOR: mejorar diseño manteniendo tests verdes.

Regla operativa:
- No se incorpora una feature sin tests y sin reflejo documental mínimo cuando corresponda.

---

## 3. Comandos de Testing

### 3.1 Backend (`services/api`)

```bash
cd services/api

# Ejecutar todos los tests unitarios
npm test

# Ejecutar con cobertura
npm run test:coverage

# Ejecutar en modo watch (desarrollo)
npm run test:watch
```

Herramientas:
- **Vitest** como test runner (`vitest.config.ts`)
- **Supertest** para tests HTTP
- **nock** para mocks de llamadas HTTP externas
- Cobertura via `@vitest/coverage-v8`

### 3.2 Frontend (`apps/web`)

```bash
cd apps/web

# Ejecutar tests unitarios
npm test

# Build (incluye type-check)
npm run build
```

Herramientas:
- **Vitest** + **React Testing Library**
- **jsdom** como entorno de navegador simulado

---

## 4. Niveles de Testing

### 4.1 Tests Unitarios (dominio y aplicación)

Archivos: `services/api/src/__tests__/*.test.ts`

Tests determinísticos que se ejecutan **siempre en CI** sin dependencias externas:

| Área | Tests | Descripción |
|------|-------|-------------|
| Dominio | `FakeMarketDataProvider.test.ts` | Validación de entidades y reglas |
| Casos de uso | `IngestMarketData.test.ts`, `PersistMarketData.test.ts`, `ComputeIndicators.test.ts` | Orquestación con puertos mockeados |
| IA | `GenerateInvestmentInsight.test.ts`, `AnalyzeMarketTrends.test.ts` | Validación de schemas y flujos |
| Admin | `AdminUserManagement.test.ts`, `BootstrapInitialAdmin.test.ts` | RBAC y gobernanza de usuarios |

Características:
- Usan **fakes** y **stubs** para aislar la lógica.
- No requieren variables de entorno especiales.
- Ejecutan en milisegundos.

### 4.2 Tests de Integración (opt-in)

Archivos: `services/api/src/__tests__/*.int.test.ts`

Tests que requieren conexiones reales a servicios externos:

| Test | Requiere | Variable de Entorno |
|------|----------|---------------------|
| `SupabaseMarketDataRepository.int.test.ts` | Supabase | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `SupabaseInsightRecommendation.int.test.ts` | Supabase | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `IngestAndPersist.orch.test.ts` | Supabase | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `api.int.test.ts` | Supabase + JWKS | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `OpenAIProvider.int.test.ts` | OpenAI | `OPENAI_API_KEY` |
| `YahooFinanceMarketDataProvider.int.test.ts` | Yahoo Finance | (sin secrets, pero requiere red) |

**Mecanismo de opt-in:**

```typescript
// Ejemplo de patrón usado en tests de integración
const hasSupabaseEnv = (): boolean => {
  return !!(process.env['SUPABASE_URL'] && process.env['SUPABASE_SERVICE_ROLE_KEY']);
};

const describeIfSupabase = hasSupabaseEnv() ? describe : describe.skip;

describeIfSupabase('SupabaseMarketDataRepository (integration)', () => {
  // Tests que requieren Supabase real
});
```

Cuando faltan las variables de entorno, el test se **skipea automáticamente** con `describe.skip`, permitiendo que CI pase sin exponer credenciales.

### 4.3 Tests de Contrato

- Contrato entre aplicación e infraestructura:
  - provider de mercado (`MarketDataProviderPort`),
  - repositorios (`MarketDataRepositoryPort`),
  - proveedor de IA (`IAProviderPort`).
- Contratos de API (request/response) validados con **Zod schemas** (`services/api/src/application/schemas/`).

### 4.4 End-to-End (E2E)

- Flujo login → dashboard → disparo ADMIN → visualización datos.
- Cantidad reducida, foco en flujos críticos.

---

## 5. Tests de Regresión de Seguridad

El sistema incluye tests específicos para verificar controles de seguridad. Estos tests corren como parte del suite unitario y **no requieren secrets externos**.

### 5.1 Autenticación JWKS

Archivo: `services/api/src/__tests__/AdminUserManagement.test.ts`

- Verifica derivación de rol desde `app_metadata.inversorai_role`
- Verifica comportamiento default (USER) cuando `app_metadata` no existe

Archivo: `services/api/src/infrastructure/auth/verifySupabaseJwt.ts` (implementación)

- Verificación de JWT via JWKS de Supabase
- Usa librería `jose` para validación criptográfica

### 5.2 RBAC (Control de Acceso Basado en Roles)

Archivo: `services/api/src/__tests__/AdminUserManagement.test.ts`

| Test | Descripción |
|------|-------------|
| `derives role as ADMIN when app_metadata.inversorai_role is ADMIN` | Verifica promoción correcta |
| `derives role as USER when app_metadata.inversorai_role is not ADMIN` | Verifica rol por defecto |
| `throws LastAdminError when demoting the only admin` | Protección contra pérdida de acceso admin |

### 5.3 Step-up Authentication

Archivo: `services/api/src/__tests__/AdminUserManagement.test.ts` (sección `requireRecentAuth middleware`)

| Test | Descripción |
|------|-------------|
| `calls next() when iat is recent (within 300s default)` | Token reciente pasa |
| `returns 401 with REAUTH_REQUIRED when iat is missing` | Token sin `iat` rechazado |
| `returns 401 with REAUTH_REQUIRED when token is too old` | Token antiguo rechazado |
| `respects ADMIN_STEP_UP_MAX_AGE_SECONDS env override` | Configuración personalizable |
| `passes when token age is exactly at the limit` | Boundary condition |

Implementación: `services/api/src/interfaces/http/middlewares/requireRecentAuth.ts`

### 5.4 Guardrails de Producción

Archivo: `services/api/src/__tests__/ProductionGuardrails.test.ts`

| Test | Descripción |
|------|-------------|
| `FakeMarketDataProvider throws when NODE_ENV is production` | Fake providers bloqueados en prod |
| `createMarketDataProvider throws when NODE_ENV is production and MARKET_DATA_PROVIDER is not REAL` | Requiere provider real en prod |
| `allows FAKE provider in development` | Permite fakes en desarrollo |

Implementación: `services/api/src/infrastructure/market-data/createMarketDataProvider.ts`

### 5.5 Headers de Seguridad (Helmet)

Archivo: `services/api/src/__tests__/SecurityHeaders.test.ts`

| Header | Valor Esperado |
|--------|----------------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `no-referrer` |
| `X-DNS-Prefetch-Control` | `off` |
| `Strict-Transport-Security` | (presente) |

Implementación: `services/api/src/interfaces/http/app.ts` → `helmet()`

### 5.6 Body Size Limit

Archivo: `services/api/src/__tests__/BodySizeLimit.test.ts`

| Test | Descripción |
|------|-------------|
| `rejects JSON payload exceeding 1mb with 413 status` | Protección contra payload bombing |
| `accepts JSON payload under 1mb` | Funcionamiento normal |

Implementación: `services/api/src/interfaces/http/app.ts` → `express.json({ limit: '1mb' })`

### 5.7 CORS Allowlist

Archivo: `services/api/src/__tests__/Cors.test.ts`

| Test | Descripción |
|------|-------------|
| `throws when CORS_ORIGINS is not set (production)` | Requiere configuración explícita |
| `throws when CORS_ORIGINS is wildcard (production)` | Prohíbe `*` en producción |
| `parses multiple comma-separated origins` | Soporta múltiples dominios |
| `sets Access-Control-Allow-Origin for allowed origin` | Headers CORS correctos |
| `does not set Access-Control-Allow-Origin for disallowed origin` | Rechaza orígenes no autorizados |
| `preflight OPTIONS returns 204 and allows GET and POST methods` | Manejo correcto de preflight |

Implementación: `services/api/src/config/cors.ts`

### 5.8 Rate Limiting

Archivo: `services/api/src/__tests__/RateLimiter.test.ts`

Tests para rate limiting por usuario+asset en endpoints de pipeline:
- Verifica límite de requests por ventana de tiempo
- Soporta store en memoria (testing) o Supabase (producción)

Implementación: `services/api/src/interfaces/http/middlewares/rateLimiter.ts`

### 5.9 Request ID y Error Handler

Archivo: `services/api/src/__tests__/RequestIdAndErrorHandler.test.ts`

| Test | Descripción |
|------|-------------|
| `returns X-Request-Id header on successful requests` | Trazabilidad de requests |
| `returns unique X-Request-Id for each request` | IDs únicos (UUID v4) |
| `returns X-Request-Id header on error responses` | Trazabilidad en errores |

Implementación:
- `services/api/src/interfaces/http/middlewares/requestId.ts`
- `services/api/src/interfaces/http/middlewares/errorHandler.ts`

### 5.10 Audit Logging

Archivo: `services/api/src/__tests__/AdminAuditLogger.test.ts`

Tests de logging estructurado para acciones administrativas con campos de auditoría.

Implementación: `services/api/src/interfaces/http/audit/adminAuditLogger.ts`

---

## 6. Testing Específico de IA

### 6.1 Qué se testea

- Construcción determinística del input a IA (snapshot).
- Versionado de prompt.
- Validación estricta del output (esquema):
  - existencia de campos obligatorios,
  - tipos correctos,
  - rangos válidos (confidence_score 0..1),
  - action ∈ {BUY,HOLD,SELL}.
- Persistencia de auditoría:
  - input_snapshot_hash,
  - model_version,
  - prompt_version,
  - output_schema_version.

### 6.2 Qué no se testea

- "Si la IA acierta el mercado".
- "Si el insight es financieramente verdadero".
- Predicción futura de rentabilidad.

El objetivo de testing es asegurar que:
- el sistema usa IA de forma controlada,
- la salida es validable y auditada,
- las alucinaciones se mitigan con validación y guardrails.

### 6.3 Estrategia de tests de IA

Se definen tres tipos de pruebas:

1) **Tests unitarios de normalización/validación**
   - Dado un output, se valida que cumple el esquema.
   - Archivo: `GenerateInvestmentInsight.test.ts`

2) **Tests con stubs determinísticos**
   - `IAProviderPort` retorna respuestas predefinidas.
   - Se testea la orquestación sin depender de red.

3) **Tests de integración opt-in**
   - Con `OPENAI_API_KEY`, se prueba la llamada a un modelo real.
   - Se marca como opt-in (`describe.skip` si falta la key).
   - Archivo: `OpenAIProvider.int.test.ts`

### 6.4 Sanitización de Inputs

Archivo: `services/api/src/__tests__/Sanitize.test.ts`

Verifica que los inputs al LLM se sanitizan para prevenir prompt injection.

Implementación: `services/api/src/infrastructure/ai/OpenAIProvider.ts`

---

## 7. Cobertura y Criterios

- Cobertura mínima objetivo: **70%**, priorizando dominio y casos de uso.
- En IA, se prioriza cobertura de validación de outputs y auditoría.
- Se evita perseguir 100% de cobertura sin sentido.

Generar reporte de cobertura:

```bash
cd services/api
npm run test:coverage
```

El reporte se genera en `services/api/coverage/` con formatos:
- `lcov.info` (para CI/herramientas externas)
- HTML navegable

---

## 8. Integración Continua (CI-lite)

### 8.1 Principio: Sin Secrets en CI

El pipeline de CI ejecuta **únicamente tests unitarios** que no requieren credenciales:

- Tests de integración (`*.int.test.ts`) usan `describe.skip` cuando faltan env vars.
- Esto permite CI verde sin exponer secrets en GitHub Actions.
- Tests de integración completos se ejecutan **localmente** con `.env` configurado.

### 8.2 Qué ejecuta el CI

Ver `.github/workflows/ci.yml` para detalles completos.

| Step | Comando |
|------|---------|
| Install | `npm ci` |
| Security audit | `npm audit --omit=dev --audit-level=high` |
| Test + Coverage | `npm run test:coverage` (backend) |
| Build backend | `npm run build` (backend) |
| Test frontend | `npm test` (frontend) |
| Build frontend | `npm run build` (frontend) |

### 8.3 Ejecución Local Completa

Para ejecutar todos los tests incluyendo integración:

```bash
# 1. Configurar .env con credenciales reales
cp .env.example .env
# Editar .env con SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY

# 2. Ejecutar todos los tests
cd services/api
npm test
```

Los tests de integración se activarán automáticamente al detectar las variables de entorno.

---

## 9. Consideraciones Finales

- TDD es parte del proceso, no un agregado.
- El sistema mantiene separación estricta por capas.
- La IA se integra con disciplina: input estructurado, output validado, auditoría completa.
- Los tests de seguridad son parte del suite unitario y corren en cada CI.
- Este documento es vinculante para la evolución del sistema.

---
