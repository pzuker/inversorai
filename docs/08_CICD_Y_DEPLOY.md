# 08 — CI/CD y Despliegue a Producción

**Proyecto:** InversorAI
**Fecha:** 2026-01-26
**Contexto:** Trabajo Final de Máster – Desarrollo de Sistemas con IA

---

## 1. Propósito del Documento

Este documento describe la estrategia de CI/CD y despliegue del sistema, incluyendo:

- Pipeline de integración continua (GitHub Actions)
- Estrategia CI-lite (sin secrets en CI)
- Gestión de dependencias (Dependabot)
- Variables de entorno y secretos
- Bootstrap de seguridad
- Verificación post-deploy

---

## 2. Pipeline de CI (GitHub Actions)

### 2.1 Archivo de Configuración

Ubicación: `.github/workflows/ci.yml`

### 2.2 Estrategia CI-lite

El pipeline ejecuta **únicamente tests unitarios**, omitiendo tests de integración que requieren secrets externos.

**Principio fundamental:** No exponer credenciales en GitHub Actions. Los tests de integración usan `describe.skip` cuando faltan las variables de entorno.

**Tests omitidos en CI (requieren secrets):**

| Test | Secret Requerido |
|------|------------------|
| `OpenAIProvider.int.test.ts` | `OPENAI_API_KEY` |
| `SupabaseMarketDataRepository.int.test.ts` | `SUPABASE_SERVICE_ROLE_KEY` |
| `SupabaseInsightRecommendation.int.test.ts` | `SUPABASE_SERVICE_ROLE_KEY` |
| `IngestAndPersist.orch.test.ts` | `SUPABASE_SERVICE_ROLE_KEY` |
| `api.int.test.ts` | `SUPABASE_SERVICE_ROLE_KEY` |

### 2.3 Steps del Pipeline

```yaml
# Triggers: push y pull_request en cualquier rama
on:
  push:
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      # 1. Checkout del código
      - uses: actions/checkout@v4

      # 2. Setup Node.js 20 con caché de npm
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      # 3. Instalación de dependencias
      - run: npm ci

      # 4. Auditoría de seguridad (solo prod, nivel high)
      - run: npm audit --omit=dev --audit-level=high

      # 5. Tests backend con cobertura
      - working-directory: services/api
        env:
          SUPABASE_URL: https://placeholder.supabase.co
        run: npm run test:coverage

      # 6. Upload de artefacto de cobertura
      - uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: services/api/coverage/lcov.info
          retention-days: 30

      # 7. Build del backend
      - working-directory: services/api
        run: npm run build

      # 8. Tests del frontend
      - working-directory: apps/web
        run: npm test

      # 9. Build del frontend
      - working-directory: apps/web
        env:
          NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder-anon-key
        run: npm run build
```

### 2.4 Variables Placeholder en CI

El CI usa URLs placeholder para permitir la inicialización de módulos sin ejecutar llamadas reales:

- `SUPABASE_URL`: Placeholder para que los imports no fallen
- `SUPABASE_SERVICE_ROLE_KEY`: **NO se proporciona** → tests de integración skippeados
- `OPENAI_API_KEY`: **NO se proporciona** → tests de integración skippeados

Esto garantiza que solo corren tests unitarios determinísticos.

---

## 3. Ejecución Local de Tests Completos

Para ejecutar **todos** los tests incluyendo integración:

```bash
# 1. Configurar credenciales reales
cp .env.example .env
# Editar .env con valores reales:
#   SUPABASE_URL=https://xxx.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=xxx
#   OPENAI_API_KEY=xxx

# 2. Ejecutar tests completos
cd services/api
npm test

# 3. Verificar cobertura
npm run test:coverage
```

Los tests de integración se **activan automáticamente** al detectar las variables de entorno configuradas.

---

## 4. Gestión de Dependencias (Dependabot)

### 4.1 Configuración

Ubicación: `.github/dependabot.yml`

### 4.2 Estrategia

Dependabot está configurado para actualizar dependencias npm semanalmente (lunes):

| Directorio | Prefijo de Commit | Límite PRs |
|------------|-------------------|------------|
| `/` (root) | `deps` | 5 |
| `/services/api` | `deps(api)` | 5 |
| `/apps/web` | `deps(web)` | 5 |

### 4.3 Beneficios

- Actualizaciones automáticas de seguridad
- Visibilidad de dependencias desactualizadas
- PRs automáticos con changelog

---

## 5. Auditoría de Seguridad

### 5.1 En CI

El pipeline ejecuta `npm audit` en cada push/PR:

```bash
npm audit --omit=dev --audit-level=high
```

- `--omit=dev`: Solo audita dependencias de producción
- `--audit-level=high`: Falla el build si hay vulnerabilidades high o critical

### 5.2 Local

```bash
# Auditoría completa
npm audit

# Solo producción
npm audit --omit=dev
```

---

## 6. Estrategia de Despliegue (MVP)

### 6.1 Arquitectura de Deploy

| Componente | Plataforma | Notas |
|------------|------------|-------|
| Frontend | Vercel | Next.js App Router, deploy automático |
| Backend | Server/Serverless | Node/Express, requiere secrets |
| Base de datos | Supabase | PostgreSQL + Auth managed |

### 6.2 Variables de Entorno

#### Frontend (públicas)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_API_URL=https://api.inversorai.com
```

> Solo claves públicas (anon). **Nunca** `service_role` en frontend.

#### Backend (secretos)

```env
# Requeridos
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx          # SECRETO
OPENAI_API_KEY=xxx                      # SECRETO
MARKET_DATA_PROVIDER=REAL               # Obligatorio en producción
NODE_ENV=production

# Seguridad
CORS_ORIGINS=https://app.inversorai.com  # Allowlist CORS

# Opcionales
RATE_LIMIT_STORE=supabase               # memory | supabase
AUDIT_LOG_PERSIST=true                  # Persistir audit logs
ADMIN_STEP_UP_MAX_AGE_SECONDS=300       # Ventana de reauth
PASSWORD_RESET_REDIRECT_TO=https://app.inversorai.com/reset-password
```

---

## 7. Bootstrap de Seguridad: Primer ADMIN

### 7.1 Problema

Un sistema en producción no puede depender de roles hardcodeados.

### 7.2 Solución

Script idempotente para crear/promover el primer ADMIN:

```bash
cd services/api
npm run bootstrap:admin
```

Requiere variables:
- `INITIAL_ADMIN_EMAIL`: Email del primer admin
- `INITIAL_ADMIN_INVITE_REDIRECT_TO`: URL de confirmación (opcional)

### 7.3 Comportamiento

1. Si ya existe un ADMIN → **noop** (idempotente)
2. Si el usuario existe → lo promueve a ADMIN
3. Si no existe → lo invita por email y asigna rol ADMIN

Implementación: `services/api/src/runners/bootstrapInitialAdmin.ts`

---

## 8. Verificación Post-Deploy (Smoke Tests)

### 8.1 Checklist Mínima

| Verificación | Endpoint | Esperado |
|--------------|----------|----------|
| Auth funciona | Supabase Auth | Login/registro OK |
| Lectura USER | `GET /api/v1/market-data` | 200 con Bearer token |
| Lectura USER | `GET /api/v1/insights/latest` | 200 con Bearer token |
| Lectura USER | `GET /api/v1/recommendations/latest` | 200 con Bearer token |
| Pipeline USER | `POST /api/v1/admin/pipeline/run` | 403 Forbidden |
| Pipeline ADMIN | `POST /api/v1/admin/pipeline/run` | 200 OK |
| Cambio rol USER | `POST /api/v1/admin/users/:id/role` | 403 Forbidden |
| Cambio rol ADMIN | `POST /api/v1/admin/users/:id/role` | Requiere reauth |
| CORS | Request desde origen no permitido | Rechazado |

### 8.2 Configuración Supabase

Verificar en Supabase Dashboard:
- **Site URL**: URL del frontend (para emails)
- **Redirect URLs**: URLs permitidas para auth redirects
- Ver: `docs/SUPABASE_CONFIG.md`

---

## 9. Rollback

### 9.1 Estrategia MVP

1. **Código**: Revertir commit + redeploy
   ```bash
   git revert <commit>
   git push
   ```

2. **Base de datos**: Migraciones compatibles hacia atrás cuando sea posible

### 9.2 Documentación de Rollback

Para cambios destructivos de DB, documentar en el PR:
- Scripts de rollback
- Impacto en datos existentes
- Ventana de tiempo requerida

---

## 10. Artefactos de CI

### 10.1 Cobertura de Tests

El CI genera y sube el archivo de cobertura como artefacto:

- **Nombre**: `backend-coverage`
- **Archivo**: `services/api/coverage/lcov.info`
- **Retención**: 30 días

Uso:
- Integración con servicios de cobertura (Codecov, Coveralls)
- Revisión manual de métricas

---
