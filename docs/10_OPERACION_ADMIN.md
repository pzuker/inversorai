# 11 — Operación ADMIN y Gobernanza (MVP)

**Proyecto:** InversorAI  
**Fecha:** 2026-01-25  

---

## 1. Propósito

Este documento describe, de forma operativa, cómo se gobierna el rol **ADMIN** en el MVP:

- cómo se crea el **primer admin** sin hardcode,
- qué endpoints existen para administración,
- y qué protecciones de seguridad se aplican.

---

## 2. Modelo de rol (fuente de verdad)

- Rol almacenado en Supabase Auth: `app_metadata.inversorai_role`
  - `ADMIN` / `USER`
  - default: `USER`

> Nota: el frontend puede usar este valor para UX (mostrar/ocultar botones), pero el enforcement real es siempre server-side.

---

## 3. Bootstrap del primer ADMIN (deploy)

### 3.1 Variables

- `INITIAL_ADMIN_EMAIL` (requerida para bootstrap)
- `INITIAL_ADMIN_INVITE_REDIRECT_TO` (opcional; redirect al setear password)

### 3.2 Ejecución

```bash
cd services/api
npm run bootstrap:admin
```

### 3.3 Comportamiento (idempotente)

- Si ya existe algún ADMIN ⇒ no hace nada.
- Si no existe:
  - Si el usuario existe ⇒ lo promueve (merge de `app_metadata`).
  - Si no existe ⇒ lo invita por email y luego asigna rol ADMIN.

---

## 4. Endpoints de administración (backend)

Todos requieren:

- `Authorization: Bearer <JWT>`
- rol `ADMIN` (middleware `requireAdmin`)

### 4.1 Listar usuarios

`GET /api/v1/admin/users?page=1&perPage=50`

Devuelve lista con `{ id, email, role }`.

### 4.2 Asignar rol (promote/demote)

`POST /api/v1/admin/users/:id/role`  
Body: `{ "role": "ADMIN" | "USER" }`

Protecciones:

- **Step-up auth**: requiere token reciente (claim `iat`), configurado por `ADMIN_STEP_UP_MAX_AGE_SECONDS` (default 300s).
- Si no cumple ⇒ `401` con `code: "REAUTH_REQUIRED"`.
- **Gobernanza**: no permite demover al **último ADMIN** (`409`).

### 4.3 Reset de contraseña por email

`POST /api/v1/admin/users/:id/password-reset`  
Body opcional: `{ "redirectTo": "https://..." }`

Alternativa por env: `PASSWORD_RESET_REDIRECT_TO`.

---

## 5. “Step-up auth”: cómo se ve en la práctica (sin UI)

Interpretación simple:

1) El admin inicia sesión normalmente y obtiene un JWT.
2) Si intenta cambiar roles con un token viejo ⇒ recibe `REAUTH_REQUIRED`.
3) Solución: pedir al admin que re-inicie sesión (o refresh) y reintentar con el token nuevo.

En el MVP, esto evita un panel de “reautenticación” y sigue siendo defendible ante tribunal.

---

## 6. Qué no se implementa en el MVP (intencional)

- MFA obligatorio (se considera sobreingeniería en este punto).
- Impersonación de usuarios.
- Panel de administración completo en UI (la API existe, la UI puede agregarse post-MVP).

