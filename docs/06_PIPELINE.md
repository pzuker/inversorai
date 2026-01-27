# Pipeline de Análisis de Mercado

**Proyecto:** InversorAI  
**Versión:** 2.0  
**Fecha:** 2026-01-27  
**Contexto:** Trabajo Final de Máster — Desarrollo de Sistemas con IA

---

## Resumen

Este documento describe el **pipeline end-to-end** del sistema: desde la obtención de datos reales de mercado hasta la generación de insights y recomendaciones con IA, garantizando trazabilidad y auditabilidad en cada etapa.

---

## 1. Principio Rector

> **"Escritura por providers, lectura desde base"**

Este principio fundamental garantiza reproducibilidad y auditabilidad:

| Operación | Fuente | Justificación |
|-----------|--------|---------------|
| **Ingesta** | Providers externos (Yahoo Finance) | Datos frescos de mercado |
| **Lectura** | PostgreSQL (Supabase) | Datos persistidos, verificables, reproducibles |

### Implicaciones

- El frontend **nunca** consulta providers externos directamente
- Todas las lecturas (dashboard, API) se realizan desde la base de datos
- Los datos son **verificables externamente** (contrastar con Google Finance)
- Ante el tribunal, se puede demostrar exactamente qué datos se usaron

---

## 2. Arquitectura del Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              PIPELINE                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │   INGEST     │───▶│   COMPUTE    │───▶│   ANALYZE    │               │
│  │  MarketData  │    │  Indicators  │    │   Trends     │               │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
│         │                   │                   │                        │
│         ▼                   ▼                   ▼                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │ Yahoo Finance│    │ RSI, MACD,   │    │ Tendencia,   │               │
│  │ OHLCV Data   │    │ Vol, Sharpe  │    │ Señales      │               │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
│                                                 │                        │
│                                                 ▼                        │
│                              ┌──────────────────────────────┐           │
│                              │      GENERATE INSIGHT        │           │
│                              │   (IA con output validado)   │           │
│                              └──────────────────────────────┘           │
│                                                 │                        │
│                                                 ▼                        │
│                              ┌──────────────────────────────┐           │
│                              │         PERSIST              │           │
│                              │   (Auditable en PostgreSQL)  │           │
│                              └──────────────────────────────┘           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Etapas del Pipeline

### Etapa 1: IngestMarketData

**Responsabilidad:** Obtener datos OHLCV desde fuentes externas.

| Aspecto | Detalle |
|---------|---------|
| **Provider** | Yahoo Finance (producción) / Fake (testing) |
| **Datos** | Open, High, Low, Close, Volume |
| **Formato** | Timestamps UTC, estructura normalizada |
| **Validación** | Schema Zod, rangos válidos |

**Código de caso de uso:** `IngestMarketDataUseCase`

```typescript
// Simplificado
const data = await marketDataProvider.fetchOHLCV(symbol, range);
const validated = MarketDataSchema.parse(data);
return validated;
```

---

### Etapa 2: ComputeIndicators

**Responsabilidad:** Calcular indicadores técnicos verificables.

| Indicador | Descripción | Parámetros |
|-----------|-------------|------------|
| **RSI** | Relative Strength Index | Período: 14 |
| **MACD** | Moving Average Convergence/Divergence | 12, 26, 9 |
| **Volatilidad** | Desviación estándar de retornos | 30 días |
| **Sharpe Ratio** | Retorno ajustado por riesgo | 30 días |
| **Retornos** | Simples y logarítmicos | Diarios |

**Características:**
- Fórmulas documentadas y verificables
- Precisión mínima de 8 decimales
- Cálculos determinísticos (mismo input → mismo output)

---

### Etapa 3: AnalyzeMarketTrends

**Responsabilidad:** Consolidar análisis técnico determinístico.

**Output: MarketAnalysis**

```typescript
{
  asset_symbol: "BTC-USD",
  trend: "BULLISH" | "BEARISH" | "NEUTRAL",
  signal_strength: 0-100,
  key_kpis: {
    rsi: 65.4,
    macd_histogram: 0.023,
    volatility_30d: 0.045,
    sharpe_30d: 1.23
  },
  rationale: "RSI en zona neutral-alcista, MACD positivo..."
}
```

**Características:**
- Análisis **determinístico** (no usa IA)
- Reproducible ante el mismo input
- Sirve como **input estructurado para la IA**

---

### Etapa 4: GenerateInvestmentInsight

**Responsabilidad:** Invocar IA para generar insight y recomendación.

Esta es la etapa donde se integra IA de forma **controlada**:

| Control | Implementación |
|---------|----------------|
| **Input estructurado** | MarketAnalysis como contexto |
| **Prompt versionado** | `prompt_version` persistido |
| **Output validado** | Schema Zod estricto |
| **Trazabilidad** | Hash de input, model_version |

**Output dual:**

1. **InvestmentInsight** (explicación)
```typescript
{
  summary: "Análisis técnico favorable con cautela por volatilidad",
  reasoning: "El RSI indica momentum positivo...",
  assumptions: ["Continuación de tendencia actual"],
  caveats: ["Alta volatilidad reciente"]
}
```

2. **Recommendation** (acción)
```typescript
{
  action: "BUY" | "HOLD" | "SELL",
  confidence_score: 0.75,  // 0-1
  risk_level: "MEDIUM",
  horizon: "SHORT"
}
```

**Validación de output:**

```typescript
const InsightSchema = z.object({
  action: z.enum(["BUY", "HOLD", "SELL"]),
  confidence_score: z.number().min(0).max(1),
  risk_level: z.enum(["LOW", "MEDIUM", "HIGH"]),
  reasoning: z.string().min(10),
  // ... más campos
});

// Si falla validación → se rechaza y registra error
const result = InsightSchema.safeParse(llmOutput);
if (!result.success) {
  await auditLog.error("INVALID_LLM_OUTPUT", { errors: result.error });
  throw new InvalidLLMOutputError();
}
```

---

### Etapa 5: Persistencia

**Responsabilidad:** Almacenar todo para auditoría y consumo.

| Dato | Tabla | Propósito |
|------|-------|-----------|
| OHLCV | `market_data` | Datos de mercado |
| Indicadores | `indicators` | Cálculos técnicos |
| Análisis | `market_analysis` | Análisis determinístico |
| Insight | `investment_insights` | Explicación IA |
| Recomendación | `recommendations` | Acción sugerida |
| Auditoría | `audit_logs` | Trazabilidad completa |

---

## 4. Ejecución del Pipeline

### 4.1 Endpoint

```
POST /api/v1/admin/pipeline/run
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "symbol": "BTC-USD"
}
```

### 4.2 Protecciones

| Control | Implementación |
|---------|----------------|
| **Autenticación** | JWT verificado via JWKS |
| **Autorización** | Requiere rol `ADMIN` |
| **Rate Limiting** | 1 request / 5 min por (admin, asset) |
| **Validación** | Symbol debe estar en lista permitida |

### 4.3 Activos Soportados (MVP)

| Symbol | Tipo | Mercado |
|--------|------|---------|
| `BTC-USD` | Crypto | 24/7 |
| `AAPL` | Stock | NYSE |
| `EURUSD=X` | FX | 24/5 |

---

## 5. Trazabilidad

Cada ejecución del pipeline genera trazabilidad completa:

```typescript
{
  trace_id: "550e8400-e29b-41d4-a716-446655440000",
  execution: {
    started_at: "2026-01-27T15:30:00Z",
    completed_at: "2026-01-27T15:30:12Z",
    duration_ms: 12340
  },
  stages: {
    ingest: { status: "success", records: 365 },
    compute: { status: "success", indicators: 5 },
    analyze: { status: "success", trend: "BULLISH" },
    insight: { status: "success", action: "BUY", confidence: 0.75 }
  },
  audit: {
    admin_id: "user_123",
    input_hash: "sha256:abc123...",
    model_version: "gpt-4-turbo",
    prompt_version: "v2.1.0"
  }
}
```

### Qué se puede reconstruir

Dado un `trace_id`, se puede determinar:
- Qué datos de mercado se usaron (input_hash)
- Qué indicadores se calcularon
- Qué análisis determinístico se produjo
- Qué prompt se envió a la IA (prompt_version)
- Qué modelo respondió (model_version)
- Qué output se recibió y validó
- Quién ejecutó y cuándo

---

## 6. Manejo de Fallos

El pipeline implementa manejo de fallos por etapa:

| Escenario | Comportamiento |
|-----------|----------------|
| Fallo en ingesta | No se persiste nada, error auditable |
| Fallo en cálculo | Se conserva ingesta, error auditable |
| Fallo en IA | Se conserva análisis, error auditable |
| Output IA inválido | Se rechaza y registra, no se persiste |
| Timeout de provider | Retry con backoff exponencial |

### Principio de Integridad

> **Nunca se persiste un resultado parcial o inválido.** Cada etapa valida su output antes de proceder.

---

## 7. Fake Providers (Testing)

Para TDD y tests unitarios, existen fake providers:

```typescript
// En desarrollo/testing
const provider = new FakeMarketDataProvider();
provider.setData(symbol, mockOHLCV);

// En producción (BLOQUEADO)
if (process.env.NODE_ENV === 'production') {
  // FakeMarketDataProvider lanza error
  // MARKET_DATA_PROVIDER debe ser "REAL"
}
```

**Guardrail de producción:**

```typescript
// services/api/src/infrastructure/market-data/createMarketDataProvider.ts
if (process.env.NODE_ENV === 'production' && provider !== 'REAL') {
  throw new Error('Fake providers not allowed in production');
}
```

Este control tiene **test de regresión** en `ProductionGuardrails.test.ts`.

---

## 8. Verificación de Datos

Los datos generados por el pipeline son **verificables externamente**:

| Dato | Cómo verificar |
|------|----------------|
| Precio BTC-USD | Google Finance, CoinMarketCap |
| Precio AAPL | Google Finance, Yahoo Finance |
| Precio EURUSD | Google Finance, xe.com |

Durante la demo, se puede mostrar:
1. Precio en el dashboard de InversorAI
2. Mismo precio en Google Finance
3. Demostrar que los datos son reales, no inventados

---

## 9. Extensiones Futuras

El pipeline está diseñado para evolucionar:

| Mejora | Estado | Notas |
|--------|--------|-------|
| Scheduler automático | Diseñado | Arquitectura preparada |
| Más activos | Fácil | Solo agregar a lista permitida |
| Colas/workers | Diseñado | Eventos ya son async-ready |
| Reprocesamiento histórico | Posible | Datos persistidos permiten re-análisis |

---

## 10. Resumen

El pipeline de InversorAI demuestra:

1. **Ingesta de datos reales** verificables externamente
2. **Cálculos determinísticos** reproducibles
3. **IA controlada** con validación estricta
4. **Trazabilidad completa** para auditoría
5. **Seguridad** con RBAC y rate limiting
6. **Integridad** con validación por etapa

> El pipeline no busca generar las mejores predicciones; busca demostrar cómo procesar datos y usar IA de forma **profesional, controlada y auditable**.

---

*Documento vinculante para la implementación del sistema.*
