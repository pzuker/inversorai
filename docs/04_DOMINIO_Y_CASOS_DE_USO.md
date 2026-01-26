# 04 — Dominio y Arquitectura de Casos de Uso

**Proyecto:** InversorAI  
**Fecha:** 2025-01-25  
**Contexto:** Trabajo Final de Máster – Desarrollo de Sistemas con IA  

---

## 1. Propósito del Documento

Este documento define:

- El modelo de dominio del sistema InversorAI (MVP académico-profesional).
- Los casos de uso que gobiernan su comportamiento.
- Los flujos principales de ejecución.
- La separación de responsabilidades entre capas según Clean Architecture.

El objetivo es demostrar comprensión aplicada de:
- diseño orientado a dominio,
- arquitectura basada en casos de uso,
- integración responsable de IA (explicable, validable, auditable).

---

## 2. Principios de Diseño

## 2.1 Vista de Contenedores (C4-lite)

El siguiente diagrama resume la arquitectura del MVP como **contenedores** y **dependencias**. Es intencionalmente simple: ayuda a entender *dónde vive cada responsabilidad* y *por qué no se leen datos directamente de proveedores externos*.

```mermaid
flowchart LR
  Client[Cliente Web<br/>(USER / ADMIN)] -->|HTTPS| Web[Next.js App Router<br/>UI + Auth client]
  Web -->|Bearer JWT| Api[API Node.js<br/>(Interfaces + Application + Domain)]
  Api -->|Verify JWT (JWKS)| Auth[Supabase Auth]
  Api -->|Read model| Db[(Supabase Postgres)]
  Api -->|Write model (pipeline)| Db
  Api -->|Market data provider| YF[Yahoo Finance]
  Api -->|LLM provider| OpenAI[OpenAI]

  %% Clean Architecture emphasis
  subgraph Ports [Ports (Application Layer)]
    P1[MarketDataProviderPort]
    P2[AIInsightPort]
    P3[Repositories (DB)]
  end
```

Notas:
- **Lecturas** (dashboard, gráficos, histórico) → siempre desde **DB**.
- **Escrituras** → solo vía casos de uso (pipeline) y solo con providers reales en producción.
- RBAC: el rol proviene de `app_metadata.inversorai_role` (JWT verificado por JWKS), nunca de headers del cliente.


- El dominio es independiente de frameworks, DB y APIs externas.
- Toda funcionalidad relevante se expresa como un caso de uso explícito.
- Dependencias siempre hacia el dominio (Inversión de Dependencias).
- Procesos largos se ejecutan de manera asíncrona cuando aplica.
- La IA es un componente controlado: input estructurado, output validado, auditoría completa.
- El sistema produce dos salidas complementarias:
  - análisis y explicación de oportunidades,
  - recomendación de acción (BUY/HOLD/SELL) con nivel de confianza.
- La generación de insights es **responsabilidad del sistema**, no una acción interactiva del usuario final.

---

## 3. Modelo de Dominio

### 3.1 Asset

Representa un instrumento financiero.

Atributos conceptuales:
- id
- symbol
- type (STOCK | CRYPTO | FX)
- currency
- exchange
- is_active

---

### 3.2 MarketDataPoint

Representa un punto de datos de mercado (OHLCV).

Atributos conceptuales:
- asset_symbol
- timestamp (UTC)
- open
- high
- low
- close
- volume
- resolution
- source
- is_interpolated

---

### 3.3 IndicatorSet

Representa indicadores técnicos calculados para un instante y resolución.

Atributos conceptuales:
- asset_symbol
- timestamp
- resolution
- sma_20
- ema_20
- rsi_14
- macd
- macd_signal
- volatility_30d
- sharpe_30d
- calculation_version

---

### 3.4 MarketAnalysis

Representa un análisis técnico y cuantitativo consolidado, previo a IA.

Atributos conceptuales:
- id
- asset_symbol
- as_of_timestamp
- resolution
- trend (BULLISH | BEARISH | NEUTRAL)
- signal_strength (0..100)
- key_kpis (estructura con KPIs relevantes)
- rationale (explicación técnica no-IA, breve y determinística)
- created_at

Notas:
- MarketAnalysis es determinístico y reproducible.
- Es el insumo principal para la IA (no se le entrega la serie cruda completa si no hace falta).

---

### 3.5 Recommendation

Representa una recomendación estructurada de acción.

Atributos conceptuales:
- id
- asset_symbol
- action (BUY | HOLD | SELL)
- confidence_score (0..1)
- horizon (ej: SHORT | MID | LONG)
- risk_level (LOW | MEDIUM | HIGH)
- created_at

Notas:
- Esta entidad es apta para automatización futura, pero el MVP no ejecuta operaciones.
- La recomendación se genera como **resultado del análisis del sistema por activo**, no por solicitud directa del usuario.

---

### 3.6 InvestmentInsight

Representa la explicación generada por IA, trazable y auditable.

Atributos conceptuales:
- id
- asset_symbol
- summary (texto breve)
- reasoning (texto estructurado: drivers, riesgos, señales)
- assumptions (lista)
- caveats (lista)
- model_name
- model_version
- prompt_version
- input_snapshot_hash
- output_schema_version
- created_at

Notas:
- InvestmentInsight y Recommendation se generan en el mismo flujo analítico.
- Se persisten separadas para auditoría, reutilización y análisis histórico.
- Los usuarios finales **consultan insights persistidos**, no disparan su generación.

---

### 3.7 OpportunityScore

Representa un score comparable entre activos para ranking.

Atributos conceptuales:
- id
- asset_symbol
- as_of_timestamp
- score (0..100)
- components (estructura: tendencia, riesgo, consistencia, confianza_ia, etc.)
- created_at

---

### 3.8 Portfolio (MVP+)

Representa un portafolio del usuario (MVP académico puede ser básico).

Atributos conceptuales:
- id
- user_id
- positions
- weights
- expected_return
- expected_volatility
- expected_sharpe

---

### 3.9 AuditLog

Evento auditable del sistema.

Atributos conceptuales:
- id
- event_type
- actor_id
- timestamp
- details

---

## 4. Casos de Uso

### UC-01 IngestMarketData

Actor: Sistema (ADMIN puede dispararlo manualmente)  
Responsabilidad: obtener OHLCV desde proveedores externos y persistirlos.

Resultado:
- MarketDataPoint persistidos.
- Auditoría de ingesta.

---

### UC-02 ComputeIndicators

Actor: Sistema  
Responsabilidad: calcular indicadores técnicos desde MarketDataPoint.

Resultado:
- IndicatorSet persistidos.
- Auditoría de cálculo.

---

### UC-03 AnalyzeMarketTrends

Actor: Sistema  
Responsabilidad: consolidar un MarketAnalysis determinístico usando indicadores y reglas.

Resultado:
- MarketAnalysis persistido.
- KPIs y señal agregada.

---

### UC-04 GenerateInvestmentInsight

Actor: Sistema  
Responsabilidad: invocar IA con un input estructurado basado en MarketAnalysis para producir:

- InvestmentInsight (explicación),
- Recommendation (acción BUY/HOLD/SELL con confianza).

Características:
- prompt_version controlado,
- input_snapshot_hash,
- output validado por esquema.

Resultado:
- InvestmentInsight persistido.
- Recommendation persistida.
- Auditoría completa.

Notas:
- Este caso de uso se ejecuta por **pipeline automático, scheduler o acción ADMIN**.
- No se expone como acción directa del usuario final.

---

### UC-05 RankOpportunities

Actor: Sistema  
Responsabilidad: rankear activos (STOCK/CRYPTO/FX) usando OpportunityScore.

Resultado:
- OpportunityScore persistidos por ventana temporal.
- Ranking consumible por UI.

---

### UC-06 AuthenticateUser

Actor: Usuario  
Responsabilidad: autenticación delegada (IdP), emisión de sesión.

---

### UC-07 ViewDashboard

Actor: Usuario  
Responsabilidad: visualizar datos, KPIs, insights, recomendaciones y ranking según permisos.

---

### UC-08 ManageAssets

Actor: ADMIN  
Responsabilidad: gestionar catálogo de activos (activar/desactivar, tipo, moneda, exchange).

---

### UC-09 ViewAuditLogs

Actor: ADMIN  
Responsabilidad: consultar auditoría y trazabilidad del sistema.

---

## 5. Flujos Principales del Sistema

### 5.1 Flujo automático (pipeline técnico)

- IngestMarketData (scheduler o ADMIN).
- ComputeIndicators.
- AnalyzeMarketTrends.
- GenerateInvestmentInsight.

Este flujo produce análisis e insights reproducibles por activo.

---

### 5.2 Flujo de consumo de insights

- El sistema persiste InvestmentInsight y Recommendation por activo.
- Los usuarios consultan los últimos resultados disponibles.
- No se dispara IA desde la UI.

---

### 5.3 Flujo de ranking (multi-activo)

- Se toman OpportunityScore por activo.
- Se calcula ranking.
- UI consume ranking con KPIs resumidos e insight breve.

---

## 6. Separación de Capas

- Dominio: entidades y reglas.
- Aplicación: casos de uso y puertos.
- Infraestructura: DB, colas, proveedores, IA client.
- Interfaces: HTTP/CLI/UI.

La IA y Supabase pertenecen a infraestructura.

---

## 7. Consideraciones Finales

- Se distingue análisis determinístico (MarketAnalysis) de explicación IA (InvestmentInsight).
- La recomendación BUY/HOLD/SELL es una salida estructurada y auditable.
- La generación de insights es responsabilidad del sistema, no del usuario.
- El MVP no ejecuta operaciones reales.
- Este documento es vinculante para la evolución del sistema.

---