# 07 — Testing y Calidad del Software

**Proyecto:** InversorAI  
**Fecha:** 2025-01-25  
**Contexto:** Trabajo Final de Máster – Desarrollo de Sistemas con IA  

---

## 1. Propósito del Documento

Este documento define la estrategia de testing y calidad del sistema InversorAI, con especial énfasis en:

- TDD como metodología de desarrollo,
- testing por capas (dominio, casos de uso, integración),
- testing específico para sistemas que integran IA,
- control de regresiones y trazabilidad.

---

## 2. Metodología de Desarrollo

Se adopta **TDD estricto** como práctica base:

- RED: escribir un test que falle y defina el comportamiento.
- GREEN: implementar lo mínimo para pasar el test.
- REFACTOR: mejorar diseño manteniendo tests verdes.

Regla operativa:
- No se incorpora una feature sin tests y sin reflejo documental mínimo cuando corresponda.

---

## 3. Niveles de Testing

### 3.1 Unitarios de Dominio

- Entidades y reglas determinísticas.
- Validación de invariantes (ej: coherencia OHLC).
- Cálculo de KPIs técnicos.

---

### 3.2 Tests de Casos de Uso

- Orquestación de lógica en aplicación.
- Puertos mockeados o fakes.
- Validación de flujos principales y alternativos.

---

### 3.3 Integración

- Repositorios reales (Supabase) mediante tests opt-in.
- Limpieza controlada de datos por asset en entorno de test.
- Verificación de idempotencia (unique/upsert).

---

### 3.4 Tests de Contrato

- Contrato entre aplicación e infraestructura:
  - provider de mercado,
  - repositorios,
  - proveedor de IA.
- Contratos de API (request/response) con esquemas.

---

### 3.5 End-to-End (E2E)

- Flujo login → dashboard → disparo ADMIN → visualización datos.
- Cantidad reducida, foco en flujos críticos.

---

## 4. Testing Específico de IA

### 4.1 Qué se testea

- Construcción determinística del input a IA (snapshot).
- Versionado de prompt.
- Validación estricta del output (esquema):
  - existencia de campos obligatorios,
  - tipos correctos,
  - rangos válidos (confidence_score 0..1),
  - action ∈ {BUY,HOLD,SELL}.
- Persistencia de auditoría:
  - input_snapshot_hash,
  - model_version,
  - prompt_version,
  - output_schema_version.

---

### 4.2 Qué no se testea

- “Si la IA acierta el mercado”.
- “Si el insight es financieramente verdadero”.
- Predicción futura de rentabilidad.

El objetivo de testing es asegurar que:
- el sistema usa IA de forma controlada,
- la salida es validable y auditada,
- las alucinaciones se mitigan con validación y guardrails.

---

### 4.3 Estrategia de tests de IA

Se definen tres tipos de pruebas:

1) Tests unitarios de normalización/validación  
- Dado un output, se valida que cumple el esquema.

2) Tests con stubs determinísticos  
- IAProviderPort retorna respuestas predefinidas.
- Se testea la orquestación sin depender de red.

3) Tests de integración opt-in (si aplica)  
- Con credenciales reales, se prueba la llamada a un modelo real.
- Se marca como opt-in para no romper CI.

---

## 5. Cobertura y Criterios

- Cobertura mínima objetivo: 70%, priorizando dominio y casos de uso.
- En IA, se prioriza cobertura de validación de outputs y auditoría.
- Se evita perseguir 100% de cobertura sin sentido.

---

## 6. Integración Continua (CI)

- Tests unitarios y de casos de uso corren siempre.
- Tests de integración (Supabase, IA real) son opt-in por variables de entorno.
- Bloqueo de merges ante fallos.
- Reporte de resultados.

---

## 7. Consideraciones Finales

- TDD es parte del proceso, no un agregado.
- El sistema mantiene separación estricta por capas.
- La IA se integra con disciplina: input estructurado, output validado, auditoría completa.
- Este documento es vinculante para la evolución del sistema.

---
