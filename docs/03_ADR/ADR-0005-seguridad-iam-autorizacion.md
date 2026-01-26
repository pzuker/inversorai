# ADR-0005 — Seguridad, Identidad (IAM) y Autorización

**Estado:** Aprobado  
**Fecha:** 2026-01-25  
**Decisores:** Equipo InversorAI  
**Contexto:** Trabajo Final de Máster – Desarrollo de Sistemas con IA  

---

## 1. Contexto

InversorAI es un MVP desplegado en producción con **usuarios reales**. Aunque no ejecuta trading, expone:

- endpoints autenticados,
- funcionalidad ADMIN sensible (ejecución de pipeline y gobernanza),
- e integración con servicios externos (datos de mercado, IA).

Por lo tanto, seguridad e IAM no son “un extra”: son parte del diseño.

---

## 2. Decisión

### 2.1 Identidad y autenticación

- Se delega identidad a **Supabase Auth** (email + password).
- El frontend envía tokens como `Authorization: Bearer <JWT>`.

### 2.2 Verificación de JWT en backend (no confiar en el cliente)

- El backend verifica el JWT **localmente** usando el **JWKS** del proyecto (firma ES256).
- No se aceptan headers alternativos de rol ni “claims inventados” por el cliente.
- Token ausente o inválido ⇒ **401 Unauthorized**.

### 2.3 Autorización (RBAC)

- Roles: `ADMIN` y `USER`.
- La fuente de verdad del rol es `app_metadata.inversorai_role` en Supabase:
  - `ADMIN` / `USER` (default: `USER`).
- `requireAdmin` protege endpoints sensibles.

### 2.4 Step-up auth para cambios de privilegios

- Cambios de rol requieren **token reciente**, medido por claim `iat`.
- Si no cumple: **401** con `code: "REAUTH_REQUIRED"`.

### 2.5 Gobernanza: primer ADMIN sin hardcode

- Se elimina cualquier dependencia de “admin por email hardcodeado”.
- Se incorpora un **bootstrap idempotente** (runner de deploy) que:
  - detecta si ya existe un ADMIN,
  - si no existe, invita/promueve al email inicial,
  - y asigna `app_metadata.inversorai_role=ADMIN`.

---

## 3. Motivación

Esta decisión permite:

- Un MVP real con seguridad verificable por tribunal.
- Separación clara entre UI (presentación) y backend (enforcement).
- Minimizar superficie de ataque:
  - sin confiar en headers de rol,
  - sin exponer llaves privilegiadas al frontend.
- Gobernanza operativa (primer admin) sin pasos manuales frágiles.

---

## 4. Consecuencias

### 4.1 Positivas

- Seguridad coherente con OWASP en lo relevante del MVP:
  - autenticación fuerte (JWT),
  - control de acceso server-side,
  - principio de mínimo privilegio,
  - protección ante abuso (rate limiting),
  - step-up para cambios de privilegio.
- Idempotencia en bootstrap: repetible en CI/CD.

### 4.2 Costos / trade-offs

- El backend requiere acceso a `SUPABASE_SERVICE_ROLE_KEY` (secreto de servidor).
- Se defiere MFA para evitar fricción y sobreingeniería en el MVP.

---

## 5. MFA (decisión explícita para el MVP)

- **MFA no se habilita en el MVP** por criterio de alcance y fricción.
- Se documenta como trabajo futuro razonable.

Mitigaciones vigentes en el MVP:

- JWT verificado localmente (JWKS),
- RBAC server-side,
- step-up auth para cambios de rol,
- restricciones de último admin,
- secretos aislados en backend/CI.

---

## 6. Referencias internas

- Endpoints ADMIN: `/api/v1/admin/*`
- Script de bootstrap: `services/api (npm run bootstrap:admin)`
- Rol: `app_metadata.inversorai_role`

