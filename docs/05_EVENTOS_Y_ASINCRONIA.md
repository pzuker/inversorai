# 05 — Eventos y Procesamiento Asíncrono

**Proyecto:** InversorAI  
**Fecha:** 2026-01-25  
**Contexto:** Trabajo Final de Máster – Desarrollo de Sistemas con IA  

---

## 1. Propósito del Documento

Este documento explica **cómo se diseñó el sistema para soportar asincronía**, y **qué parte se implementó efectivamente en el MVP**.

El objetivo es doble:

- Ser honesto con el estado real del producto (MVP desplegado).
- Demostrar que la arquitectura **ya contempla** una evolución natural hacia jobs/colas, sin reescritura.

---

## 2. Estado actual en el MVP (lo que existe hoy)

En el MVP:

- El pipeline completo (ingesta → indicadores → tendencias → IA → persistencia) se ejecuta **bajo demanda** mediante un endpoint **ADMIN**.
- La ejecución es **sin colas/workers**: una decisión consciente para reducir complejidad operativa y riesgo en producción.
- La protección ante abuso se resuelve con:
  - **Rate limiting** por **(admin, asset)**.
  - Persistencia y lecturas desde base (no “respuestas inventadas”).
  - Contratos explícitos (use cases) que encapsulan cada etapa.

> Esta elección prioriza: reproducibilidad, facilidad de despliegue y defensa académica del MVP.

---

## 3. Diseño preparado para asincronía (línea futura, no implementada)

Aunque el MVP no usa colas, el diseño ya está preparado para migrar a un modelo asíncrono con cambios acotados:

### 3.1 Qué se movería a jobs

- Ingesta de datos de mercado (dependencia externa, latencia variable).
- Generación de insights IA (costosa, dependiente de proveedor externo).
- Reprocesamiento histórico o “backfill” de series.

### 3.2 Qué disparadores tendría sentido incorporar

- Scheduler (ej. cron) para refrescar activos en ventanas controladas.
- Eventos internos al persistir series (ej. “MarketDataPersisted”) para encadenar etapas.
- Reintentos con backoff para fallos transitorios (API externa / rate limit).

### 3.3 Propiedades no negociables

- **Idempotencia** por (asset, ventana temporal, jobId).
- **Observabilidad**: logs estructurados + correlación (traceId).
- **Auditoría**: toda decisión de IA debe tener inputs/outputs persistidos.

---

## 4. Por qué se difiere en el MVP

Implementar colas/workers en un MVP académico puede terminar siendo “infra por la infra”.
Se difiere por:

- Costo operativo y riesgo de fallos de infraestructura.
- Complejidad de monitoreo y retries (más superficie de bugs).
- Prioridad en demostrar: arquitectura limpia + pipeline real + seguridad y trazabilidad.

---

## 5. Criterio de aceptación para incorporar asincronía (post-MVP)

Se incorpora asincronía cuando:

- El pipeline excede tiempos razonables de request/response.
- Se requiere refresco frecuente de múltiples activos.
- Se necesita reprocesamiento histórico sin bloquear endpoints.

