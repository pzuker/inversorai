# Sistema y Requisitos

**Proyecto:** InversorAI  
**Versión:** 2.0  
**Fecha:** 2026-01-27  
**Contexto:** Trabajo Final de Máster — Desarrollo de Sistemas con IA

---

## 1. Descripción del Sistema

**InversorAI** es una plataforma fullstack de análisis de mercados financieros que integra inteligencia artificial de forma **controlada, trazable y auditable**.

### 1.1 Capacidades Principales

| Capacidad | Descripción |
|-----------|-------------|
| **Ingesta de datos** | OHLCV desde Yahoo Finance para STOCK, CRYPTO y FX |
| **Indicadores técnicos** | RSI, MACD, volatilidad, Sharpe Ratio |
| **Análisis de tendencias** | Consolidación determinística de señales |
| **Insights con IA** | Recomendaciones BUY/HOLD/SELL explicables |
| **Dashboard web** | Visualización responsive con Next.js |
| **API REST** | Endpoints versionados y autenticados |
| **Seguridad RBAC** | Roles USER/ADMIN con JWT verificado localmente |

### 1.2 Activos Soportados (MVP)

| Símbolo | Tipo | Mercado | Verificación Externa |
|---------|------|---------|---------------------|
| `BTC-USD` | Crypto | 24/7 | Google Finance, CoinMarketCap |
| `AAPL` | Stock | NYSE | Google Finance, Yahoo Finance |
| `EURUSD=X` | FX | 24/5 | Google Finance, xe.com |

---

## 2. Actores del Sistema

### 2.1 Usuario Final (USER)

**Descripción:** Usuario autenticado que consume análisis e insights.

**Permisos:**
- ✓ Autenticarse en el sistema
- ✓ Visualizar dashboard con datos de mercado
- ✓ Consultar indicadores técnicos
- ✓ Ver insights y recomendaciones
- ✗ Ejecutar pipeline de análisis
- ✗ Gestionar usuarios

### 2.2 Administrador (ADMIN)

**Descripción:** Usuario con control global del sistema.

**Permisos:** Todo lo del USER, más:
- ✓ Ejecutar pipeline bajo demanda
- ✓ Listar usuarios del sistema
- ✓ Cambiar roles de usuarios (con step-up auth)
- ✓ Enviar emails de reset de contraseña
- ✓ Acceder a auditoría

**Restricciones:**
- Rate limiting: 1 ejecución / 5 min por (admin, asset)
- Step-up auth: Token reciente requerido para cambios de rol
- Protección: No puede demover al último ADMIN

### 2.3 Sistema (Pipeline)

**Descripción:** Orquestación de casos de uso ejecutada por ADMIN.

**Flujo:**
```
IngestMarketData → ComputeIndicators → AnalyzeMarketTrends → GenerateInsight → Persist
```

### 2.4 Identity Provider

**Descripción:** Supabase Auth como proveedor de identidad.

**Responsabilidades:**
- Autenticación de usuarios (email/password)
- Emisión de JWT firmados
- Gestión de sesiones
- Recovery de contraseña

---

## 3. Requisitos Funcionales

### RF-01: Ingesta de Datos de Mercado

| Aspecto | Especificación |
|---------|----------------|
| **Descripción** | Obtener OHLCV desde Yahoo Finance bajo demanda |
| **Disparador** | ADMIN ejecuta pipeline |
| **Datos** | Open, High, Low, Close, Volume |
| **Formato** | Timestamps UTC, estructura normalizada |
| **Validación** | Schema Zod, rangos válidos |

**Criterios de Aceptación:**
- [ ] Soporta STOCK, CRYPTO y FX
- [ ] Datos persisten en PostgreSQL
- [ ] Timestamps en UTC
- [ ] Errores de red manejados con retry

---

### RF-02: Cálculo de Indicadores Técnicos

| Aspecto | Especificación |
|---------|----------------|
| **Descripción** | Calcular indicadores desde datos OHLCV |
| **Indicadores** | RSI(14), MACD(12,26,9), volatilidad(30d), Sharpe(30d) |
| **Precisión** | Mínimo 8 decimales |
| **Reproducibilidad** | Mismo input → mismo output |

**Criterios de Aceptación:**
- [ ] Fórmulas documentadas
- [ ] Cálculos determinísticos
- [ ] Indicadores persistidos con timestamp

---

### RF-03: Generación de Insights con IA

| Aspecto | Especificación |
|---------|----------------|
| **Descripción** | Generar insight y recomendación mediante LLM |
| **Input** | MarketAnalysis estructurado |
| **Output** | InvestmentInsight + Recommendation |
| **Validación** | Schema Zod estricto |

**Output esperado:**

```typescript
{
  // Insight (explicación)
  summary: string,
  reasoning: string,
  assumptions: string[],
  caveats: string[],
  
  // Recommendation (acción)
  action: "BUY" | "HOLD" | "SELL",
  confidence_score: 0-1,
  risk_level: "LOW" | "MEDIUM" | "HIGH",
  horizon: "SHORT" | "MID" | "LONG"
}
```

**Criterios de Aceptación:**
- [ ] Prompt versionado (`prompt_version` persistido)
- [ ] Input hasheado (`input_snapshot_hash` persistido)
- [ ] Output validado contra schema
- [ ] Outputs inválidos rechazados y loggeados

---

### RF-04: Dashboard Web

| Aspecto | Especificación |
|---------|----------------|
| **Framework** | Next.js con App Router |
| **Auth** | Supabase Auth con JWT |
| **Responsividad** | Desktop y tablet |
| **Performance** | TTI < 3 segundos en 4G |

**Vistas:**
- `/dashboard` - Panel de usuario con datos de mercado
- `/dashboard/admin` - Panel de administración (ADMIN only)
- `/login`, `/register` - Autenticación
- `/reset-password` - Recuperación de contraseña

**Criterios de Aceptación:**
- [ ] Autenticación obligatoria para `/dashboard/*`
- [ ] ADMIN ve panel de administración
- [ ] USER no puede acceder a rutas ADMIN (redirect)
- [ ] Gráficos con datos reales

---

### RF-05: API REST

| Aspecto | Especificación |
|---------|----------------|
| **Versionado** | `/api/v1/*` |
| **Auth** | `Authorization: Bearer <JWT>` |
| **Formato** | JSON |
| **Documentación** | OpenAPI 3.0 |

**Endpoints principales:**

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/v1/market-data/:symbol` | USER | Datos de mercado |
| GET | `/api/v1/indicators/:symbol` | USER | Indicadores técnicos |
| GET | `/api/v1/insights/latest` | USER | Último insight |
| GET | `/api/v1/recommendations/latest` | USER | Última recomendación |
| POST | `/api/v1/admin/pipeline/run` | ADMIN | Ejecutar pipeline |
| GET | `/api/v1/admin/users` | ADMIN | Listar usuarios |
| POST | `/api/v1/admin/users/:id/role` | ADMIN | Cambiar rol |

---

### RF-06: Autenticación y Autorización

| Aspecto | Especificación |
|---------|----------------|
| **Provider** | Supabase Auth |
| **Tokens** | JWT firmados con ES256 |
| **Verificación** | Local via JWKS (librería `jose`) |
| **Roles** | `app_metadata.inversorai_role`: USER (default) / ADMIN |

**Criterios de Aceptación:**
- [ ] JWT verificado localmente sin llamadas externas
- [ ] Rol derivado de `app_metadata`, no de headers
- [ ] Default a USER si no hay rol definido
- [ ] Step-up auth para operaciones sensibles

---

### RF-07: Auditoría

| Aspecto | Especificación |
|---------|----------------|
| **Eventos** | Login, cambio de rol, ejecución de pipeline, errores |
| **Campos** | requestId, userId, action, timestamp, details |
| **Persistencia** | Opcional en Supabase (`AUDIT_LOG_PERSIST=true`) |
| **Retención** | Mínimo 1 año |

---

## 4. Requisitos No Funcionales

### RNF-01: Seguridad

| Control | Implementación |
|---------|----------------|
| JWT/JWKS | Verificación local con `jose` |
| RBAC | Roles USER/ADMIN en middleware |
| Step-up Auth | Token reciente para cambios de rol |
| CORS | Allowlist explícita, wildcard prohibido |
| Headers | Helmet (CSP, X-Frame-Options, etc.) |
| Body limit | 1MB máximo |
| Rate limiting | Por (admin, asset) en pipeline |
| Audit logging | JSON estructurado |

### RNF-02: Performance

| Métrica | Objetivo |
|---------|----------|
| API p95 | < 200ms |
| Dashboard TTI | < 3 segundos |
| Pipeline completo | < 30 segundos |

### RNF-03: Disponibilidad

| Métrica | Objetivo |
|---------|----------|
| Uptime | 99.5% mensual |
| Recovery | < 1 hora para incidentes críticos |

### RNF-04: Mantenibilidad

| Aspecto | Implementación |
|---------|----------------|
| Tests | 180+ tests, cobertura > 70% |
| TypeScript | Strict mode |
| Linting | ESLint + Prettier en CI |
| Documentación | ADRs para decisiones clave |

### RNF-05: Observabilidad

| Aspecto | Implementación |
|---------|----------------|
| Request tracking | UUID por request (X-Request-Id) |
| Logs | Estructurados JSON |
| Errores | Centralizados con requestId |
| Health checks | `/health` endpoint |

---

## 5. Restricciones

### 5.1 Técnicas

| Restricción | Justificación |
|-------------|---------------|
| Node.js/TypeScript | Stack del máster |
| PostgreSQL | Requerido por Supabase |
| Sin trading real | Control de riesgo legal |

### 5.2 Académicas

| Restricción | Justificación |
|-------------|---------------|
| Alcance MVP | Tiempo limitado del TFM |
| Documentación completa | Requisito de evaluación |
| Despliegue funcional | Demostración ante tribunal |

---

## 6. Supuestos

| Supuesto | Impacto si Falla |
|----------|------------------|
| Yahoo Finance disponible | Pipeline no puede ejecutar |
| Supabase disponible | Sin autenticación ni persistencia |
| OpenAI disponible | Sin generación de insights |
| Usuario conoce finanzas básicas | UX puede ser confusa |

---

## 7. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Yahoo Finance cambia API | Media | Alto | Abstracción de providers |
| IA genera alucinaciones | Media | Alto | Validación Zod + disclaimers |
| Brecha de seguridad | Baja | Crítico | OWASP, tests de regresión |
| Costos de OpenAI | Media | Medio | Rate limiting, caché |

---

## 8. Glosario

| Término | Definición |
|---------|------------|
| OHLCV | Open, High, Low, Close, Volume |
| RSI | Relative Strength Index |
| MACD | Moving Average Convergence Divergence |
| Sharpe Ratio | Retorno ajustado por riesgo |
| JWT | JSON Web Token |
| JWKS | JSON Web Key Set |
| RBAC | Role-Based Access Control |
| Step-up Auth | Re-autenticación para operaciones sensibles |
| TDD | Test-Driven Development |
| ADR | Architecture Decision Record |

---

## 9. Control de Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2025-01-24 | Versión inicial |
| 1.1 | 2025-01-24 | Clarificaciones IAM |
| 2.0 | 2026-01-27 | Reestructuración completa, mejor narrativa |

---

*Documento vinculante para la implementación del sistema.*
