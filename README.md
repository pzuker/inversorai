# InversorAI

> **Plataforma de Análisis Financiero con IA Explicable**

[![CI](https://img.shields.io/badge/CI-passing-brightgreen)]()
[![Tests](https://img.shields.io/badge/tests-180%2B-blue)]()
[![Security Audit](https://img.shields.io/badge/security-PASS-brightgreen)]()

---

## ¿Qué es InversorAI?

**InversorAI** es una plataforma full-stack de análisis de mercados financieros que combina **datos de mercado reales** (Crypto, Acciones y FX) con **análisis cuantitativo** e **inteligencia artificial** para generar **insights y recomendaciones de inversión explicables**.

El sistema está diseñado siguiendo principios de **Clean Architecture**, **TDD** y **separación estricta de responsabilidades**, con un enfoque claro en **calidad académica, robustez técnica y experiencia de usuario profesional**.

> **El foco de este proyecto es la ingeniería del sistema, no predecir el mercado.**

Este proyecto corresponde al **Trabajo Final de Máster (TFM)** del Máster en Desarrollo con Inteligencia Artificial.

---

## Objetivos del Proyecto

| Objetivo | Cómo se logra |
|----------|---------------|
| Analizar activos financieros reales | Datos de Yahoo Finance (CRYPTO, STOCK, FX) |
| Automatizar ingesta de datos | Pipeline bajo demanda con rate limiting |
| Calcular indicadores técnicos | RSI, MACD, volatilidad, Sharpe Ratio |
| Generar análisis con IA explicable | Prompts versionados, outputs validados |
| Ofrecer recomendaciones defendibles | BUY/HOLD/SELL con confidence score |
| Demostrar buenas prácticas | Clean Architecture, TDD, seguridad production-grade |

---

## Activos Soportados (MVP)

| Tipo | Símbolo | Descripción | Verificación Externa |
|------|---------|-------------|---------------------|
| Crypto | `BTC-USD` | Bitcoin | Google Finance, CoinMarketCap |
| Stock | `AAPL` | Apple Inc. | Google Finance, Yahoo Finance |
| FX | `EURUSD=X` | Euro / Dólar USD | Google Finance, xe.com |

Todos los precios e históricos provienen de **Yahoo Finance** y son **verificables externamente**.

---

## Arquitectura

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    Next.js + App Router                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          BACKEND                                 │
│                   Node.js + Express                             │
│     ┌─────────────────────────────────────────────────────┐    │
│     │                Clean Architecture                     │    │
│     │  Domain → Application → Infrastructure → Interfaces  │    │
│     └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Supabase  │      │Yahoo Finance│      │   OpenAI    │
│ Postgres+Auth│     │    OHLCV    │      │   GPT-4     │
└─────────────┘      └─────────────┘      └─────────────┘
```

### Principio Clave

> Los providers externos (Yahoo/OpenAI) se usan **solo para ingesta y escritura**; la UI siempre lee desde **PostgreSQL** como fuente de verdad.

### Separación de Capas

| Capa | Responsabilidad | Ejemplo |
|------|-----------------|---------|
| **Dominio** | Entidades y reglas de negocio | `Asset`, `MarketDataPoint`, `Recommendation` |
| **Aplicación** | Casos de uso y orquestación | `IngestMarketData`, `GenerateInsight` |
| **Infraestructura** | Providers externos y persistencia | `YahooFinanceProvider`, `OpenAIProvider` |
| **Interfaces** | API REST y frontend | Express routes, Next.js pages |

---

## Pipeline de Análisis

```
IngestMarketData → ComputeIndicators → AnalyzeMarketTrends → GenerateInsight → Persist
```

| Etapa | Descripción | Output |
|-------|-------------|--------|
| **Ingest** | OHLCV desde Yahoo Finance | `MarketDataPoint[]` |
| **Compute** | RSI, MACD, volatilidad, Sharpe | `IndicatorSet` |
| **Analyze** | Tendencia determinística | `MarketAnalysis` |
| **Generate** | IA con output validado | `InvestmentInsight` + `Recommendation` |
| **Persist** | Auditable en PostgreSQL | Trazabilidad completa |

**Ejecución:** `POST /api/v1/admin/pipeline/run` (requiere rol ADMIN)

---

## Inteligencia Artificial

El sistema utiliza IA de forma **controlada y auditable**:

| Control | Implementación |
|---------|----------------|
| **Prompts versionados** | `prompt_version` persistido con cada insight |
| **Input sanitizado** | Prevención de prompt injection |
| **Output validado** | Schema Zod estricto |
| **Trazabilidad** | `input_snapshot_hash`, `model_version`, `timestamp` |

### Output de IA

```typescript
{
  action: "BUY" | "HOLD" | "SELL",
  confidence_score: 0.75,      // 0-1
  risk_level: "MEDIUM",        // LOW | MEDIUM | HIGH
  reasoning: "RSI indica momentum positivo...",
  assumptions: [...],
  caveats: [...]
}
```

### Filosofía

> "No testeo si la IA tiene razón. Testeo que el sistema use la IA correctamente."

---

## Seguridad

### Autenticación y Autorización

| Control | Implementación |
|---------|----------------|
| **Auth Provider** | Supabase Auth (email + password) |
| **JWT Verification** | Local via JWKS usando librería `jose` |
| **RBAC** | Roles USER (lectura) y ADMIN (lectura + pipeline + gestión) |
| **Role Source** | `app_metadata.inversorai_role` en JWT (default: USER) |
| **Step-up Auth** | Re-autenticación para cambios de rol (token < 5 min) |

### Controles de Seguridad

| Control | Implementación | Test de Regresión |
|---------|----------------|-------------------|
| Helmet headers | CSP, X-Frame-Options, etc. | `SecurityHeaders.test.ts` |
| CORS allowlist | Via `CORS_ORIGINS` (wildcard prohibido) | `Cors.test.ts` |
| Body size limit | 1MB máximo | `BodySizeLimit.test.ts` |
| Rate limiting | Por (admin, asset) en pipeline | `RateLimiter.test.ts` |
| Production guardrails | Fake providers bloqueados | `ProductionGuardrails.test.ts` |
| Request tracking | UUID por request (`X-Request-Id`) | `RequestIdAndErrorHandler.test.ts` |
| Audit logging | JSON estructurado, persistencia opcional | `AdminAuditLogger.test.ts` |

### Gobernanza de Admins

- Bootstrap del primer ADMIN: `npm run bootstrap:admin` (idempotente)
- Protección contra demover al último ADMIN (error 409)
- Step-up auth para operaciones sensibles (401 `REAUTH_REQUIRED`)

### Auditoría de Seguridad

El sistema pasó una auditoría completa: **PASS**

Ver: [`docs/audit/00_EXEC_SUMMARY.md`](docs/audit/00_EXEC_SUMMARY.md)

---

## Testing y Calidad

### Estrategia

- **TDD** como metodología de desarrollo
- Tests unitarios para dominio y casos de uso
- Tests de integración **opt-in** (requieren secrets)
- Tests de regresión de seguridad en CI

### Comandos

```bash
cd services/api
npm test                    # Tests unitarios (180+)
npm run test:coverage       # Con cobertura
npm run test:watch          # Modo desarrollo
```

### Cobertura

| Tipo | Cantidad | CI |
|------|----------|-----|
| Unitarios | 180+ | ✅ Siempre |
| Integración | 10+ | ⏭️ Opt-in (requiere secrets) |
| Seguridad | 20+ | ✅ Siempre |

### CI-lite Policy

El CI ejecuta **solo tests unitarios** sin secrets externos. Los tests de integración usan `describe.skip` cuando faltan variables de entorno, permitiendo CI verde sin exponer credenciales.

---

## Stack Tecnológico

### Backend

| Tecnología | Uso |
|------------|-----|
| Node.js + TypeScript | Runtime y lenguaje |
| Express 5 | Framework HTTP |
| Supabase | PostgreSQL + Auth |
| Yahoo Finance | Datos de mercado |
| OpenAI | Generación de insights |
| Vitest | Testing |
| Zod | Validación de schemas |

### Frontend

| Tecnología | Uso |
|------------|-----|
| Next.js 14+ | Framework (App Router) |
| TailwindCSS + shadcn/ui | Estilos y componentes |
| Recharts | Visualización de datos |
| React Testing Library | Testing |

### Infraestructura

- Monorepo con npm workspaces
- Separación backend / frontend
- Preparado para despliegue en producción

---

## Ejecución en Local

### Requisitos

- Node.js 20+
- npm 10+
- Cuenta en Supabase
- API Key de OpenAI

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/[usuario]/inversorai.git
cd inversorai

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

### Ejecutar

```bash
# Backend (puerto 3001)
cd services/api
npm run dev

# Frontend (puerto 3000)
cd apps/web
npm run dev
```

Acceder a: http://localhost:3000

---

## Variables de Entorno

### Backend (secretos)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...          # SECRETO
OPENAI_API_KEY=...                      # SECRETO
MARKET_DATA_PROVIDER=REAL               # Obligatorio en producción
NODE_ENV=production
CORS_ORIGINS=https://app.inversorai.com

# Opcionales
RATE_LIMIT_STORE=supabase               # memory | supabase
AUDIT_LOG_PERSIST=true                  # Persistir audit logs
ADMIN_STEP_UP_MAX_AGE_SECONDS=300       # Ventana de reauth
```

### Frontend (públicas)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=https://api.inversorai.com
```

---

## Estructura del Proyecto

```
inversorai/
├── apps/
│   └── web/                        # Frontend Next.js
├── services/
│   └── api/                        # Backend Node.js
│       ├── src/
│       │   ├── domain/             # Entidades y reglas
│       │   ├── application/        # Casos de uso
│       │   ├── infrastructure/     # Providers, repos
│       │   └── interfaces/         # HTTP, middlewares
│       └── __tests__/              # Tests
├── docs/                           # Documentación
│   ├── 03_ADR/                     # Decisiones arquitectónicas
│   ├── audit/                      # Auditoría de seguridad
│   └── slides/                     # Presentación
└── package.json
```

---

## Documentación

### Documentos Principales

| Documento | Descripción |
|-----------|-------------|
| [00_INDICE.md](docs/00_INDICE.md) | Índice y ruta de lectura |
| [01_SISTEMA_Y_REQUISITOS.md](docs/01_SISTEMA_Y_REQUISITOS.md) | Requisitos funcionales y no funcionales |
| [02_VISION_Y_ALCANCE.md](docs/02_VISION_Y_ALCANCE.md) | Visión, objetivos y alcance del MVP |
| [06_PIPELINE.md](docs/06_PIPELINE.md) | Pipeline de datos end-to-end |
| [07_TESTING.md](docs/07_TESTING.md) | Estrategia TDD y calidad |

### ADRs (Architecture Decision Records)

| ADR | Decisión |
|-----|----------|
| [ADR-0001](docs/03_ADR/ADR-0001-stack-y-plataformas.md) | Stack tecnológico y plataformas |
| [ADR-0002](docs/03_ADR/ADR-0002-proveedor-datos-mercado.md) | Proveedor de datos de mercado |
| [ADR-0004](docs/03_ADR/ADR-0004-ia-prompting-trazabilidad.md) | IA, prompting y trazabilidad |
| [ADR-0005](docs/03_ADR/ADR-0005-seguridad-iam-autorizacion.md) | Seguridad, IAM y autorización |

### Configuración y Operación

| Documento | Descripción |
|-----------|-------------|
| [SUPABASE_CONFIG.md](docs/SUPABASE_CONFIG.md) | Configuración de Supabase |
| [AUDIT_LOGGING.md](docs/AUDIT_LOGGING.md) | Audit logging y GDPR |
| [12_DEPLOYMENT_CHECKLIST.md](docs/12_DEPLOYMENT_CHECKLIST.md) | Checklist de despliegue |

---

## Despliegue

| Componente | Plataforma |
|------------|------------|
| Frontend | Vercel / Netlify |
| Backend | Render / Railway |
| Database | Supabase (Managed) |

Ver runbook completo: [`docs/12_DESPLIEGUE_PRODUCCION_PASO_A_PASO.md`](docs/12_DESPLIEGUE_PRODUCCION_PASO_A_PASO.md)

---

## Disclaimer

- Fuente de datos: **Yahoo Finance**
- Los análisis e insights **no constituyen asesoramiento financiero**
- El sistema tiene **fines educativos y demostrativos**
- **No se ejecutan operaciones reales** de trading

---

## Estado del Proyecto

- ✅ MVP completo y funcional
- ✅ Desplegado en producción
- ✅ Auditoría de seguridad: PASS
- ✅ 180+ tests unitarios
- ✅ Documentación completa
- ✅ Preparado para evaluación académica

---

## Autor

Trabajo Final de Máster (TFM)  
**Máster en Desarrollo con Inteligencia Artificial**

---

> **"InversorAI no busca predecir el mercado, busca demostrar cómo se construyen sistemas serios cuando hay IA involucrada."**
