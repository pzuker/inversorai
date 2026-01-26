# 06 — Pipeline de Datos de Mercado

**Proyecto:** InversorAI  
**Fecha:** 2026-01-25  
**Contexto:** Trabajo Final de Máster – Desarrollo de Sistemas con IA  

---

## 1. Propósito del Documento

Este documento describe el **pipeline end-to-end** del MVP: desde la obtención de datos de mercado reales hasta la generación de insight/recomendación con IA y su persistencia.

El foco es demostrar:

- pipeline reproducible con **datos verificables externamente**,
- separación estricta de responsabilidades (Clean/Hexagonal),
- trazabilidad y auditabilidad (inputs/outputs persistidos),
- controles de abuso (rate limiting) y seguridad (ADMIN vs USER).

---

## 2. Principio rector: “escritura por providers, lectura por base”

- Los **providers** (Yahoo Finance / fakes) existen **solo para ingesta**.
- Todas las lecturas que consume el sistema (UI/API) se realizan **desde la base persistida** (Supabase/PostgreSQL).
- Esto evita respuestas no reproducibles y permite auditoría ante tribunal.

---

## 3. Cómo se ejecuta en el MVP

### 3.1 Disparador

- Endpoint: `POST /api/v1/admin/pipeline/run`
- Autorización: `ADMIN` (RBAC) + `Authorization: Bearer <JWT>`
- Rate limiting: **1 request cada 5 minutos por (admin, asset)**

### 3.2 Activos soportados (MVP)

- `BTC-USD` (Crypto)
- `AAPL` (Stock)
- `EURUSD=X` (FX)

---

## 4. Etapas del pipeline (implementadas)

1) **IngestMarketData**  
   - Obtiene OHLCV desde Yahoo Finance.
   - Normaliza timestamps y estructura.

2) **ComputeIndicators**  
   - Calcula indicadores técnicos (por ejemplo RSI, MACD, retornos, volatilidad, Sharpe en serie).

3) **AnalyzeMarketTrends**  
   - Resume tendencia y condiciones de mercado (heurísticas cuantitativas reproducibles).

4) **GenerateInvestmentInsight (IA)**  
   - Genera salida estructurada (análisis + recomendación).
   - Se valida schema (fail fast si el modelo devuelve algo fuera de contrato).

5) **Persistencia**  
   - Se persisten market data + indicadores + tendencias + insight + recomendación.
   - La UI y endpoints de lectura consumen **únicamente** estos datos persistidos.

---

## 5. Trazabilidad

Cada ejecución del pipeline se correlaciona mediante un `traceId` (por request), de forma que:

- se puede reconstruir qué datos se usaron,
- qué indicadores se calcularon,
- qué input recibió la IA,
- y qué output se persistió.

---

## 6. Fallos y controles

- Si falla la ingesta (proveedor externo): no se persiste nada incompleto.
- Si falla IA o validación de schema: se conserva todo lo anterior y se registra el error.
- Los **fake providers** existen solo para tests (TDD). El endpoint de pipeline usa proveedor real.

---

## 7. Extensión post-MVP (no implementada)

- Scheduler para refresco automático.
- Colas/workers para reprocesamiento histórico.
- Ampliar universo de activos (sin alterar el principio “lectura desde base”).

