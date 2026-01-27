# Checklist de Despliegue — InversorAI

**Versión:** 1.0
**Referencia completa:** [docs/11_DESPLIEGUE_PRODUCCION_PASO_A_PASO.md](./11_DESPLIEGUE_PRODUCCION_PASO_A_PASO.md)

---

## 1. Supabase

- [ ] Proyecto creado
- [ ] Claves obtenidas (Settings > API):
  - [ ] Project URL
  - [ ] `anon` key (pública)
  - [ ] `service_role` key (secreta)
- [ ] Auth configurado:
  - [ ] Site URL = URL del frontend
  - [ ] Redirect URLs incluyen `/login` y `/reset-password`
- [ ] SQL aplicado:
  - [ ] `docs/db/000_core_schema.sql` (core tables)
  - [ ] `docs/db/001_rate_limit_function.sql` (si `RATE_LIMIT_STORE=supabase`)
  - [ ] `docs/db/002_audit_logs_table.sql` (si `AUDIT_LOG_PERSIST=true`)
- [ ] Tablas verificadas en Database > Tables

---

## 2. Variables de Entorno — Frontend

| Variable | Configurada |
|----------|:-----------:|
| `NEXT_PUBLIC_SUPABASE_URL` | [ ] |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | [ ] |
| `NEXT_PUBLIC_API_URL` | [ ] |

---

## 3. Variables de Entorno — Backend

| Variable | Obligatoria | Configurada |
|----------|:-----------:|:-----------:|
| `NODE_ENV=production` | **Sí** | [ ] |
| `SUPABASE_URL` | **Sí** | [ ] |
| `SUPABASE_SERVICE_ROLE_KEY` | **Sí** | [ ] |
| `OPENAI_API_KEY` | **Sí** | [ ] |
| `CORS_ORIGINS` | **Sí** | [ ] |
| `MARKET_DATA_PROVIDER=REAL` | **Sí** | [ ] |
| `PORT` | No | [ ] |
| `RATE_LIMIT_STORE` | No | [ ] |
| `AUDIT_LOG_PERSIST` | No | [ ] |
| `INITIAL_ADMIN_EMAIL` | Una vez | [ ] |
| `INITIAL_ADMIN_INVITE_REDIRECT_TO` | Una vez | [ ] |

---

## 4. Despliegue

- [ ] Backend:
  - [ ] Build: `npm run build` en `services/api`
  - [ ] Start: `node dist/interfaces/http/server.js`
  - [ ] Servidor inicia sin errores
- [ ] Frontend:
  - [ ] Build: `npm run build` en `apps/web`
  - [ ] Deploy completado
  - [ ] Página accesible

---

## 5. Bootstrap Admin

- [ ] Ejecutar `npm run bootstrap:admin` en `services/api`
- [ ] Email de invitación recibido
- [ ] Usuario puede establecer contraseña
- [ ] Usuario tiene rol ADMIN (`app_metadata.inversorai_role`)

---

## 6. Verificación Final

| Test | Pasado |
|------|:------:|
| Frontend carga correctamente | [ ] |
| Login funciona | [ ] |
| USER ve `/dashboard` | [ ] |
| ADMIN ve `/dashboard/admin` | [ ] |
| ADMIN puede ejecutar pipeline | [ ] |
| USER NO puede ejecutar pipeline (403) | [ ] |
| API rechaza sin auth (401) | [ ] |
| Password reset funciona | [ ] |
| Sin errores CORS desde browser | [ ] |

---

## Troubleshooting Rápido

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| Server no inicia: "MARKET_DATA_PROVIDER" | Variable no es `REAL` | Configurar `MARKET_DATA_PROVIDER=REAL` |
| Server no inicia: "CORS_ORIGINS" | Variable no configurada | Configurar dominio(s) del frontend |
| Reset password falla | URL no en allowlist | Agregar URL a Supabase Redirect URLs |
| Rate limit error | SQL no aplicado | Aplicar `001_rate_limit_function.sql` |

---

**Documentación completa:** [11_DESPLIEGUE_PRODUCCION_PASO_A_PASO.md](./11_DESPLIEGUE_PRODUCCION_PASO_A_PASO.md)
