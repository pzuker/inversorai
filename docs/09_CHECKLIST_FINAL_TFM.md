# 09 — Checklist Final de Entrega del TFM

**Proyecto:** InversorAI
**Fecha:** 2026-01-26
**Contexto:** Trabajo Final de Máster – Desarrollo de Sistemas con IA

Este documento sirve como **verificación final** antes de la entrega del Trabajo Final de Máster.
Su objetivo es asegurar que el proyecto cumple **todos los requisitos técnicos, académicos y formales**, y que es defendible ante el tribunal.

---

## 1. Requisitos Formales del TFM

- [ ] El proyecto tiene un objetivo claro y bien definido.
- [ ] El problema abordado está justificado técnica y académicamente.
- [ ] El alcance está explícitamente delimitado.
- [ ] Se describen limitaciones y trabajo futuro.
- [ ] El lenguaje utilizado es técnico y profesional.
- [ ] No se incluyen afirmaciones no justificadas.

---

## 2. Documentación del Sistema

- [ ] Existe un README.md claro y orientado al tribunal.
- [ ] El README explica qué es el sistema y qué no es.
- [ ] El README incluye instrucciones de instalación y ejecución.
- [ ] El README describe el uso de IA y sus limitaciones.
- [ ] El README referencia correctamente la documentación adicional.
- [ ] Todos los docs están en español profesional y académico.

---

## 3. Requisitos Funcionales y No Funcionales

- [ ] Los requisitos funcionales están documentados.
- [ ] Los requisitos no funcionales están documentados.
- [ ] Los requisitos son coherentes entre sí.
- [ ] No existen requisitos implícitos sin documentar.

---

## 4. Arquitectura y Diseño

- [ ] La arquitectura general está claramente explicada.
- [ ] Se aplican principios de Clean / Hexagonal Architecture.
- [ ] Las responsabilidades están correctamente separadas.
- [ ] El dominio no depende de frameworks ni infraestructura.
- [ ] Las decisiones arquitectónicas están documentadas mediante ADRs.
- [ ] El diagrama de arquitectura (mermaid) es coherente con la implementación.

---

## 5. Decisiones Arquitectónicas (ADR)

- [ ] Cada decisión relevante tiene un ADR asociado.
- [ ] Los ADRs incluyen contexto, decisión y consecuencias.
- [ ] No hay ADRs incompletos o ambiguos.
- [ ] Las decisiones son coherentes entre sí.

---

## 6. Dominio y Casos de Uso

- [ ] El modelo de dominio está definido.
- [ ] Los casos de uso están explícitamente documentados.
- [ ] No existen endpoints sin un caso de uso asociado.
- [ ] Los flujos principales del sistema están descritos.
- [ ] La IA está integrada como parte de un caso de uso, no como lógica central.

---

## 7. Pipeline de Datos y Asincronía

- [ ] El pipeline de datos de mercado está documentado end-to-end.
- [ ] Se explica la normalización y validación de datos.
- [ ] Se describen estrategias de retries e idempotencia.
- [ ] El procesamiento asíncrono está justificado.
- [ ] Los fallos parciales están contemplados.

---

## 8. Uso de Inteligencia Artificial

- [ ] El rol de la IA está claramente delimitado.
- [ ] Los prompts están versionados (`prompt_version` en cada insight).
- [ ] Los inputs están sanitizados para prevenir prompt injection (`OpenAIProvider.ts`).
- [ ] Los outputs están validados por schema Zod (`services/api/src/application/schemas/`).
- [ ] Existe trazabilidad completa de las recomendaciones.
- [ ] Se explicitan los riesgos y mitigaciones de la IA.

---

## 9. Seguridad

### 9.1 Autenticación

- [ ] La autenticación usa Supabase Auth (email + password).
- [ ] El backend verifica JWT localmente via JWKS usando `jose` (`verifySupabaseJwt.ts`).
- [ ] El endpoint JWKS es `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`.
- [ ] Headers de request incluyen `Authorization: Bearer <token>`.

### 9.2 Autorización (RBAC)

- [ ] El rol se deriva de `app_metadata.inversorai_role` (no del cliente).
- [ ] El rol por defecto es USER cuando `app_metadata` no existe.
- [ ] Endpoints ADMIN están protegidos por middleware `requireAdmin`.
- [ ] No es posible demover al último ADMIN (protección en `SetUserRole.ts`).

### 9.3 Step-up Authentication

- [ ] Cambios de rol requieren token reciente (`requireRecentAuth.ts`).
- [ ] Si el token no es reciente, responde 401 con `code: REAUTH_REQUIRED`.
- [ ] La ventana de tiempo es configurable via `ADMIN_STEP_UP_MAX_AGE_SECONDS`.

### 9.4 Controles Adicionales

- [ ] Helmet headers configurados (`app.ts`).
- [ ] CORS allowlist obligatorio en producción (`config/cors.ts`).
- [ ] Body size limit de 1MB (`express.json({ limit: '1mb' })`).
- [ ] Rate limiting en endpoints de pipeline (`rateLimiter.ts`).
- [ ] Fake providers bloqueados en producción (`createMarketDataProvider.ts`).
- [ ] Request ID tracking (`requestId.ts`, header `X-Request-Id`).
- [ ] Error handler centralizado con logs estructurados (`errorHandler.ts`).

### 9.5 Gobernanza ADMIN

- [ ] El primer ADMIN se crea via script idempotente (`npm run bootstrap:admin`).
- [ ] Audit logging de acciones administrativas (`adminAuditLogger.ts`).
- [ ] Persistencia opcional de audit logs (`AUDIT_LOG_PERSIST=true`).

---

## 10. Testing y Calidad

### 10.1 Estrategia

- [ ] Existe una estrategia de testing definida (`docs/07_TESTING_Y_CALIDAD.md`).
- [ ] Se describen distintos niveles de testing (unit, integration, E2E).
- [ ] El dominio y los casos de uso están testeados.
- [ ] El uso de IA tiene una estrategia de testing específica.

### 10.2 Tests de Seguridad

- [ ] Tests de headers de seguridad (`SecurityHeaders.test.ts`).
- [ ] Tests de CORS (`Cors.test.ts`).
- [ ] Tests de body size limit (`BodySizeLimit.test.ts`).
- [ ] Tests de guardrails de producción (`ProductionGuardrails.test.ts`).
- [ ] Tests de RBAC y step-up auth (`AdminUserManagement.test.ts`).
- [ ] Tests de rate limiting (`RateLimiter.test.ts`).
- [ ] Tests de request ID y error handler (`RequestIdAndErrorHandler.test.ts`).

### 10.3 Cobertura

- [ ] Reporte de cobertura generado (`npm run test:coverage`).
- [ ] Artefacto de cobertura subido en CI (`coverage/lcov.info`).

---

## 11. CI/CD y Producción

### 11.1 Pipeline CI

- [ ] CI configurado en `.github/workflows/ci.yml`.
- [ ] CI green (todos los tests pasan).
- [ ] `npm audit --omit=dev --audit-level=high` pasa sin vulnerabilidades high/critical.
- [ ] Dependabot configurado (`.github/dependabot.yml`).
- [ ] Tests de integración skippeados en CI (sin secrets).

### 11.2 Producción

- [ ] Variables de entorno documentadas (`.env.example`).
- [ ] `MARKET_DATA_PROVIDER=REAL` obligatorio en producción.
- [ ] `CORS_ORIGINS` obligatorio en producción (no `*`).
- [ ] `NODE_ENV=production` configurado.
- [ ] `service_role` key NUNCA en frontend.

### 11.3 Deploy

- [ ] El despliegue a producción está documentado.
- [ ] El deploy incluye bootstrap del primer ADMIN.
- [ ] Configuración de Supabase documentada (`docs/SUPABASE_CONFIG.md`).
- [ ] Existe estrategia de rollback.

---

## 12. Evaluabilidad del Proyecto

- [ ] El proyecto puede ejecutarse en modo demo.
- [ ] Los flujos principales pueden demostrarse.
- [ ] La arquitectura puede explicarse sin ejecutar código.
- [ ] El guion de defensa está preparado (`docs/10_GUION_DEFENSA_ORAL.md`).

---

## 13. Coherencia Global

- [ ] No hay contradicciones entre documentos.
- [ ] Los conceptos se usan de forma consistente (USER/ADMIN, pipeline, providers).
- [ ] Los nombres y términos están alineados.
- [ ] No hay decisiones implícitas sin justificar.
- [ ] No hay referencias a términos obsoletos (ADMIN_EMAIL, x-user-role, etc.).

---

## 14. Preparación para la Defensa

- [ ] Puedo explicar el problema en menos de 2 minutos.
- [ ] Puedo justificar cada decisión arquitectónica clave.
- [ ] Sé explicar por qué NO se ejecuta trading real.
- [ ] Puedo explicar cómo controlo los riesgos de la IA.
- [ ] Puedo explicar cómo pasaría esto a producción real.
- [ ] Puedo demostrar el flujo de reautenticación para cambios de rol.

---

## 15. Verificación Técnica Final

### Ejecutar localmente:

```bash
# 1. Instalar dependencias
npm ci

# 2. Auditoría de seguridad
npm audit --omit=dev --audit-level=high

# 3. Tests backend con cobertura
cd services/api
npm run test:coverage

# 4. Build backend
npm run build

# 5. Tests frontend
cd ../apps/web
npm test

# 6. Build frontend
npm run build
```

### Verificar:

- [ ] Todos los comandos ejecutan sin errores.
- [ ] No hay warnings de seguridad high/critical.
- [ ] Cobertura generada en `services/api/coverage/`.
- [ ] Builds generan artefactos correctamente.

---

## 16. Estado Final

- [ ] El proyecto cumple los requisitos del máster.
- [ ] El proyecto es técnicamente defendible.
- [ ] El proyecto demuestra aprendizaje real.
- [ ] El proyecto está listo para ser entregado.

---

**Conclusión:**
Si todos los puntos anteriores están marcados, el Trabajo Final de Máster está en condiciones óptimas para su entrega y defensa ante el tribunal.

---
