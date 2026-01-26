# 08 — CI/CD y Despliegue a Producción

**Proyecto:** InversorAI  
**Fecha:** 2026-01-25  
**Contexto:** Trabajo Final de Máster – Desarrollo de Sistemas con IA  

---

## 1. Propósito del Documento

Este documento describe la estrategia de despliegue del MVP y las decisiones que garantizan:

- reproducibilidad (misma versión en local y en prod),
- seguridad de credenciales,
- control de roles (ADMIN/USER) sin hardcode,
- y calidad mínima automatizada (tests relevantes).

No incluye YAML específico (GitHub Actions/Vercel), pero sí el **flujo** y los **controles**.

---

## 2. Estrategia de despliegue (MVP)

- Frontend: desplegable en Vercel (Next.js App Router).
- Backend: servicio Node/Express desplegable en entorno server (o serverless compatible).
- Base de datos e IAM: Supabase (PostgreSQL + Auth).

---

## 3. Variables y secretos

### 3.1 Frontend

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> Solo claves públicas (anon). Nunca `service_role` en frontend.

### 3.2 Backend

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (secreto, solo servidor/CI)
- `OPENAI_API_KEY`
- `MARKET_DATA_PROVIDER=REAL`

Opcionales (operación ADMIN):
- `INITIAL_ADMIN_EMAIL`
- `INITIAL_ADMIN_INVITE_REDIRECT_TO`
- `ADMIN_STEP_UP_MAX_AGE_SECONDS`
- `PASSWORD_RESET_REDIRECT_TO`

---

## 4. Bootstrap de seguridad: primer ADMIN (idempotente)

Problema: un MVP real no puede depender de “admin hardcodeado”.

Solución: un script de bootstrap crea (o promueve) el **primer ADMIN** mediante invite:

```bash
cd services/api
npm run bootstrap:admin
```

Comportamiento:

- Si ya existe un ADMIN → **noop** (idempotente).
- Si no existe:
  - Si el usuario existe → lo promueve a ADMIN (merge de `app_metadata`).
  - Si no existe → lo invita por email y luego asigna rol ADMIN.

Esto permite que producción tenga un “punto de arranque” controlado y auditable.

---

## 5. Control de calidad (CI)

Criterio pragmático para MVP:

- Backend (`services/api`):
  - `npm test` (unit + integración con mocks)
- Frontend (`apps/web`):
  - `npm run build` (type-check + build)

> No se ejecutan suites completas si el cambio es puramente documental o de UI menor. Se aplica criterio.

---

## 6. Verificación post-deploy (smoke)

Checklist mínima tras deploy:

- Login/registro en Supabase funciona en el dominio final (Site URL + Redirect allowlist).
- Endpoints de lectura (`/market-data`, `/insights/latest`, `/recommendations/latest`) responden con Bearer token.
- Endpoint admin pipeline responde:
  - 403 para USER
  - 200 para ADMIN
- Los endpoints de administración de usuarios requieren ADMIN y step-up para cambios de rol.

---

## 7. Rollback

Estrategia MVP:

- Revertir a commit anterior (git) + redeploy.
- Mantener migraciones DB compatibles hacia atrás (o documentar el rollback si hay cambios destructivos).

