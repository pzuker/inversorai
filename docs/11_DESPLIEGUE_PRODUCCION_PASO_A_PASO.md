# Despliegue en Producción — Paso a Paso

**Fecha:** 2026-01-27

Este documento describe el proceso completo para desplegar InversorAI en producción. Cada paso incluye verificaciones y referencias a archivos del repositorio.

---

## A) Arquitectura de Producción

InversorAI consta de dos componentes desplegables:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Frontend      │      │    Backend      │      │    Supabase     │
│   (Next.js)     │─────▶│   (Express)     │─────▶│   (Postgres)    │
│   apps/web      │      │  services/api   │      │   + Auth        │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

| Componente | Ubicación | Framework | Puerto |
|------------|-----------|-----------|--------|
| Frontend | `apps/web` | Next.js 16 | 3000 (o asignado por hosting) |
| Backend | `services/api` | Express 5 | 3001 (configurable via `PORT`) |

### Principios de seguridad

- **Frontend** usa `NEXT_PUBLIC_SUPABASE_ANON_KEY` (clave pública, expuesta al browser)
- **Backend** usa `SUPABASE_SERVICE_ROLE_KEY` (clave secreta, **NUNCA** exponer al cliente)
- **CORS**: El backend requiere `CORS_ORIGINS` configurado en producción
- **Guardrails**: El servidor rechaza iniciar si `MARKET_DATA_PROVIDER` no es `REAL` en producción

**Código referencia:** `services/api/src/interfaces/http/server.ts:11-15`

---

## B) Prerrequisitos

### Cuentas requeridas

| Servicio | Propósito | Obligatorio |
|----------|-----------|-------------|
| Supabase | Base de datos + Auth | **Sí** |
| Hosting Frontend | Vercel, Netlify, etc. | **Sí** |
| Hosting Backend | Render, Railway, VPS, etc. | **Sí** |
| OpenAI | Generación de insights IA | **Sí** (si AI habilitado) |

### Requisitos del repositorio

- **Node.js**: >= 20.0.0 (ver `package.json:17`)
- **Instalación**: Desde la raíz del monorepo:

```bash
npm install
```

Esto instala dependencias de todos los workspaces (`apps/*`, `services/*`, `packages/*`).

---

## C) Configuración de Supabase

### Paso 1: Crear proyecto Supabase

1. Ir a [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Anotar la región seleccionada (afecta latencia)

### Paso 2: Obtener claves API

En **Supabase Dashboard > Settings > API**:

| Clave | Uso | Dónde usarla |
|-------|-----|--------------|
| Project URL | URL base | Frontend y Backend |
| `anon` (public) | Cliente browser | Frontend |
| `service_role` (secret) | Servidor | Backend **SOLAMENTE** |

⚠️ **IMPORTANTE**: La clave `service_role` tiene acceso total. NUNCA exponerla en código cliente.

### Paso 3: Configurar autenticación

En **Supabase Dashboard > Authentication > URL Configuration**:

| Setting | Valor |
|---------|-------|
| Site URL | `https://tu-frontend.com` |
| Redirect URLs | Ver lista abajo |

**Redirect URLs requeridas:**
```
https://tu-frontend.com
https://tu-frontend.com/login
https://tu-frontend.com/reset-password
```

Ver **[docs/SUPABASE_CONFIG.md](./SUPABASE_CONFIG.md)** para configuración completa de Auth.

### Paso 4: Crear tablas en la base de datos

Aplicar los siguientes scripts SQL en **Supabase Dashboard > SQL Editor**:

| Orden | Archivo | Propósito | Obligatorio |
|-------|---------|-----------|-------------|
| 1 | `docs/db/000_core_schema.sql` | Tablas core (market_data, insights, recommendations) | **Sí** |
| 2 | `docs/db/001_rate_limit_function.sql` | Rate limiting distribuido | Solo si `RATE_LIMIT_STORE=supabase` |
| 3 | `docs/db/002_audit_logs_table.sql` | Audit logs persistentes | Solo si `AUDIT_LOG_PERSIST=true` |

**Procedimiento:**
1. Abrir SQL Editor en Supabase Dashboard
2. Copiar contenido del archivo SQL
3. Ejecutar
4. Verificar en Database > Tables que las tablas existen

**Verificación:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('market_data', 'investment_insights', 'recommendations');
```

---

## D) Variables de Entorno

### D.1) Frontend (apps/web)

Configurar en el panel de hosting (Vercel, Netlify, etc.):

| Variable | Valor | Obligatorio | Fuente |
|----------|-------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | **Sí** | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | **Sí** | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_API_URL` | `https://api.tu-dominio.com` | **Sí** | URL pública del backend |

**Referencia:** `.env.example:9-14`

### D.2) Backend (services/api)

Configurar en el panel de hosting (Render, Railway, etc.):

| Variable | Valor | Obligatorio | Propósito | Referencia |
|----------|-------|-------------|-----------|------------|
| `NODE_ENV` | `production` | **Sí** | Activa guardrails de producción | `.env.example:21` |
| `PORT` | `3001` | No (default 3001) | Puerto del servidor | `server.ts:25` |
| `SUPABASE_URL` | `https://xxx.supabase.co` | **Sí** | URL de Supabase | `.env.example:5` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | **Sí** | Clave secreta del servidor | `.env.example:7` |
| `SUPABASE_ANON_KEY` | `eyJ...` | No | Solo si código lo requiere | `.env.example:6` |
| `OPENAI_API_KEY` | `sk-...` | **Sí** | API key de OpenAI para IA | `.env.example:17` |
| `CORS_ORIGINS` | `https://tu-frontend.com` | **Sí** | Dominios permitidos (separados por coma) | `.env.example:31` |
| `MARKET_DATA_PROVIDER` | `REAL` | **Sí** | Guardrail: servidor no inicia si no es REAL | `.env.example:36`, `server.ts:11` |
| `RATE_LIMIT_STORE` | `supabase` o `memory` | No (default: memory) | `supabase` para múltiples instancias | `.env.example:51` |
| `AUDIT_LOG_PERSIST` | `true` o `false` | No (default: false) | Persistir audit logs en Supabase | `.env.example:57` |
| `INITIAL_ADMIN_EMAIL` | `admin@ejemplo.com` | **Sí** (una vez) | Email del primer admin | `.env.example:39` |
| `INITIAL_ADMIN_INVITE_REDIRECT_TO` | `https://tu-frontend.com/reset-password` | **Sí** (una vez) | URL de redirección post-invite | `.env.example:40` |
| `ADMIN_STEP_UP_MAX_AGE_SECONDS` | `300` | No (default: 300) | Tiempo máximo desde login para operaciones sensibles | `.env.example:43` |
| `PASSWORD_RESET_REDIRECT_TO` | `https://tu-frontend.com/reset-password` | No | URL de redirección para reset de password | `.env.example:44` |

**Notas sobre variables opcionales:**

- **`RATE_LIMIT_STORE`**: Usar `supabase` si despliegas múltiples instancias del backend. Requiere aplicar `docs/db/001_rate_limit_function.sql`.
- **`AUDIT_LOG_PERSIST`**: Activar si necesitas audit trail persistente. Requiere aplicar `docs/db/002_audit_logs_table.sql`.
- **`INITIAL_ADMIN_*`**: Solo necesarias para el bootstrap inicial. Pueden eliminarse después.

---

## E) Pasos de Despliegue

### E.1) Build del Backend

```bash
cd services/api
npm run build
```

**Salida:** `services/api/dist/`

**Archivo de entrada:** `dist/interfaces/http/server.js`

### E.2) Iniciar Backend

```bash
node dist/interfaces/http/server.js
```

El servidor:
1. Valida `MARKET_DATA_PROVIDER=REAL` (falla si no)
2. Valida `CORS_ORIGINS` configurado (falla si no en producción)
3. Inicia en el puerto `PORT` (default: 3001)

### E.3) Build y Deploy del Frontend

```bash
cd apps/web
npm run build
```

Desplegar según el proveedor:
- **Vercel**: `vercel deploy --prod`
- **Netlify**: Push a rama conectada o `netlify deploy --prod`
- **Otro**: Servir contenido de `.next/` con `npm run start`

### Ejemplo: Vercel (Frontend) + Render (Backend)

**Frontend (Vercel):**
1. Conectar repositorio a Vercel
2. Root directory: `apps/web`
3. Build command: `npm run build`
4. Output directory: `.next`
5. Configurar variables de entorno (ver D.1)

**Backend (Render):**
1. Crear Web Service
2. Root directory: `services/api`
3. Build command: `npm run build`
4. Start command: `node dist/interfaces/http/server.js`
5. Configurar variables de entorno (ver D.2)

---

## F) Bootstrap del Primer Admin

**Cuándo ejecutar:** Una sola vez, después del primer despliegue.

**Prerrequisitos:**
- Backend desplegado y corriendo
- Variables configuradas:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `INITIAL_ADMIN_EMAIL`
  - `INITIAL_ADMIN_INVITE_REDIRECT_TO`

**Comando:**

```bash
cd services/api
npm run bootstrap:admin
```

**Comportamiento:**
1. Si ya existe un ADMIN → No hace nada (idempotente)
2. Si el usuario existe pero no es ADMIN → Lo promueve a ADMIN
3. Si el usuario no existe → Envía invitación por email y configura rol ADMIN

**Resultado esperado:**
- El email recibe invitación
- El usuario establece contraseña
- Al hacer login, tiene `app_metadata.inversorai_role = 'ADMIN'`

**Código referencia:** `services/api/src/runners/bootstrapInitialAdmin.ts`

---

## G) Verificación Post-Despliegue

### Checklist ejecutable

| # | Verificación | Cómo verificar | Resultado esperado |
|---|--------------|----------------|-------------------|
| 1 | Frontend carga | Navegar a `https://tu-frontend.com` | Página de login visible |
| 2 | Login funciona | Login con credenciales válidas | Redirige a `/dashboard` |
| 3 | Dashboard USER | Como USER, acceder a `/dashboard` | Ve datos de mercado |
| 4 | Panel ADMIN | Como ADMIN, acceder a `/dashboard/admin` | Ve panel de administración |
| 5 | ADMIN lista usuarios | En panel admin, ver lista de usuarios | Lista visible |
| 6 | Pipeline funciona | ADMIN ejecuta pipeline desde panel | Insight y recomendación generados |
| 7 | USER no puede pipeline | USER intenta ejecutar pipeline | Error 403 |
| 8 | API rechaza sin auth | `curl https://api.xxx/api/v1/admin/pipeline/run` | Error 401 |
| 9 | Password reset | Solicitar reset, verificar email | Email recibido, link funciona |
| 10 | CORS correcto | Desde browser, llamar API | Sin errores CORS |

### Verificación de CORS desde browser

```javascript
// En consola del browser (F12) desde tu frontend
fetch('https://tu-api.com/api/v1/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Resultado esperado: Sin errores CORS, respuesta del health check.

---

## H) Troubleshooting

### Error: "FATAL: Production requires MARKET_DATA_PROVIDER=REAL"

**Causa:** Variable `MARKET_DATA_PROVIDER` no configurada o no es `REAL`.

**Solución:**
1. Verificar variable en hosting settings
2. Asegurar valor exacto: `REAL` (mayúsculas)
3. Reiniciar servicio

**Código:** `services/api/src/interfaces/http/server.ts:11-15`

---

### Error: "CORS_ORIGINS must be set in production"

**Causa:** Variable `CORS_ORIGINS` no configurada.

**Solución:**
1. Configurar `CORS_ORIGINS=https://tu-frontend.com`
2. Para múltiples orígenes: `CORS_ORIGINS=https://app.com,https://admin.app.com`
3. Wildcard `*` NO está permitido en producción

**Código:** `services/api/src/config/cors.ts`

---

### Error: Password reset link no funciona

**Causa:** URL no está en la allowlist de Supabase.

**Solución:**
1. Ir a Supabase Dashboard > Authentication > URL Configuration
2. Agregar `https://tu-frontend.com/reset-password` a Redirect URLs
3. Verificar que `PASSWORD_RESET_REDIRECT_TO` apunta a la URL correcta

**Referencia:** [docs/SUPABASE_CONFIG.md](./SUPABASE_CONFIG.md)

---

### Error: Rate limit store "supabase" pero tabla no existe

**Causa:** `RATE_LIMIT_STORE=supabase` pero no se aplicó el SQL.

**Solución:**
1. Aplicar `docs/db/001_rate_limit_function.sql` en SQL Editor
2. Verificar que tabla `rate_limit_buckets` existe
3. Verificar que función `rate_limit_check_and_increment` existe

---

### Error: Supabase connection failed

**Causa:** Claves incorrectas o URL mal formada.

**Solución:**
1. Verificar `SUPABASE_URL` formato: `https://xxx.supabase.co` (sin `/` final)
2. Verificar `SUPABASE_SERVICE_ROLE_KEY` copiada completamente
3. Verificar que el proyecto Supabase no está pausado

---

### Error: JWT verification failed

**Causa:** JWKS endpoint no accesible o claves rotadas.

**Solución:**
1. Verificar endpoint: `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`
2. El backend cachea JWKS; reiniciar si las claves rotaron
3. Verificar que el token no está expirado

---

## Documentación Relacionada

- [Configuración de Supabase](./SUPABASE_CONFIG.md) - Configuración detallada del dashboard
- [Audit Logging](./AUDIT_LOGGING.md) - Configuración de audit logs y GDPR
- [CI/CD y Deploy](./08_CICD_Y_DEPLOY.md) - Pipeline de CI
- [Checklist de Despliegue](./11_DEPLOYMENT_CHECKLIST.md) - Checklist resumido
