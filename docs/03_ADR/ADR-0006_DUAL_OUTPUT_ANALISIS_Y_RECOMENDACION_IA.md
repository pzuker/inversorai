# ADR-0006 — Salida Dual: Análisis Determinístico + Recomendación IA Auditada

**Estado:** Aprobado  
**Fecha:** 2025-01-25  
**Decisores:** Equipo InversorAI  
**Contexto:** TFM – Desarrollo de Sistemas con IA  

---

## 1. Contexto

El proyecto InversorAI debe demostrar:

- análisis financiero verificable,
- uso responsable de IA,
- trazabilidad y auditabilidad,
- recomendaciones accionables sin ejecutar trading real,
- soporte multi-mercado (STOCK, CRYPTO, FX).

Un riesgo típico en proyectos con IA es que la IA se convierta en el núcleo de la lógica, generando:
- resultados no reproducibles,
- falta de control y validación,
- explicaciones inconsistentes,
- dificultad de testeo y auditoría.

---

## 2. Decisión

El sistema generará dos salidas complementarias:

1. **MarketAnalysis (determinístico, reproducible)**  
   - construido con reglas e indicadores técnicos,
   - produce KPIs y señal agregada,
   - sirve como base para ranking y para alimentar la IA.

2. **Salida IA auditada** compuesta por:
   - **InvestmentInsight**: explicación en lenguaje natural estructurado,
   - **Recommendation**: acción BUY/HOLD/SELL con nivel de confianza y horizonte.

Ambas se persisten con trazabilidad:
- prompt_version,
- input_snapshot_hash,
- model_name y model_version,
- output_schema_version,
- timestamps.

La IA no opera sobre series crudas completas si no es necesario.  
Se le entrega un snapshot estructurado basado en MarketAnalysis.

---

## 3. Consecuencias

### Positivas

- Separación clara entre análisis verificable y explicación IA.
- Mayor control sobre calidad y reproducibilidad del sistema.
- Facilita TDD y testing por capas:
  - tests determinísticos para MarketAnalysis,
  - tests de contrato y validación para output IA.
- Mejor defensa académica: el sistema no “adivina”, explica y recomienda de forma auditada.
- Permite evolución futura:
  - cambiar proveedor de IA sin tocar dominio,
  - mejorar prompts con versionado,
  - introducir backtesting sin reescribir el core.
- La generación de insights se centraliza en el sistema, evitando llamadas ad-hoc por usuario.

### Negativas

- Más entidades y persistencia.
- Necesidad de definir un esquema de salida IA y validarlo.
- Complejidad adicional en auditoría y almacenamiento.

---

## 4. Alternativas Consideradas

### A) IA como única fuente de análisis y recomendación

Rechazada por:
- baja reproducibilidad,
- dificultad de testeo,
- riesgo de alucinaciones,
- peor trazabilidad.

### B) Solo análisis determinístico sin IA

Rechazada por:
- no cumple la expectativa de un TFM centrado en IA,
- reduce valor percibido del sistema.

---

## 5. Notas de Implementación

- MarketAnalysis se implementa como caso de uso propio y se persiste.
- GenerateInvestmentInsight usa un puerto IAProviderPort.
- Recommendation e InvestmentInsight se persisten por separado.
- La generación de insights no se expone como acción directa del usuario final.
- El output de IA debe validarse contra un esquema estable (versionado).

---
