# InversorAI — Documentación Técnica

> **Plataforma de Análisis Financiero con IA Explicable**  
> Trabajo Final de Máster — Desarrollo de Sistemas con Inteligencia Artificial

---

## Acerca de Este Proyecto

InversorAI demuestra cómo construir sistemas profesionales que integran IA de forma **controlada, trazable y auditable**. El foco no es predecir el mercado, sino aplicar ingeniería de software rigurosa a un dominio donde la IA suele tratarse como caja negra.

Este repositorio incluye documentación orientada a **evaluación técnica**: decisiones justificadas, alcance explícito, arquitectura defendible y operación reproducible.

---

## Ruta de Lectura Recomendada

### Para una Revisión Rápida (10-15 minutos)

| Orden | Documento | Propósito |
|-------|-----------|-----------|
| 1 | **README.md** | Qué es, qué hace, cómo ejecutarlo |
| 2 | [01_SISTEMA_Y_REQUISITOS.md](01_SISTEMA_Y_REQUISITOS.md) | Requisitos funcionales y no funcionales |
| 3 | [02_VISION_Y_ALCANCE.md](02_VISION_Y_ALCANCE.md) | Visión, objetivos y delimitación del MVP |
| 4 | [04_DOMINIO_Y_CASOS_DE_USO.md](04_DOMINIO_Y_CASOS_DE_USO.md) | Modelo de dominio y arquitectura |
| 5 | [06_PIPELINE.md](06_PIPELINE.md) | Pipeline de datos end-to-end |
| 6 | [07_TESTING.md](07_TESTING.md) | Estrategia TDD y calidad |

### Para una Revisión Completa

| Documento | Descripción |
|-----------|-------------|
| [08_CICD_Y_DEPLOY.md](08_CICD_Y_DEPLOY.md) | CI/CD, despliegue y bootstrap |
| [09_CHECKLIST_FINAL.md](09_CHECKLIST_FINAL.md) | Checklist de entrega del TFM |
| [10_OPERACION_ADMIN.md](10_OPERACION_ADMIN.md) | Gobernanza y operación ADMIN |
| [11_DEPLOYMENT_CHECKLIST.md](11_DEPLOYMENT_CHECKLIST.md) | Runbook de despliegue |

---

## Decisiones Arquitectónicas (ADRs)

Las decisiones de diseño están documentadas formalmente:

| ADR | Decisión |
|-----|----------|
| [ADR-0001](03_ADR/ADR-0001-stack-y-plataformas.md) | Stack tecnológico y plataformas |
| [ADR-0002](03_ADR/ADR-0002-proveedor-datos-mercado.md) | Proveedor de datos de mercado |
| [ADR-0003](03_ADR/ADR-0003-persistencia-timeseries.md) | Persistencia de series temporales |
| [ADR-0004](03_ADR/ADR-0004-ia-prompting-trazabilidad.md) | IA, prompting y trazabilidad |
| [ADR-0005](03_ADR/ADR-0005-seguridad-iam-autorizacion.md) | Seguridad, IAM y autorización |
| [ADR-0006](03_ADR/ADR-0006_DUAL_OUTPUT_ANALISIS_Y_RECOMENDACION_IA.md) | Dual output: análisis + recomendación |

---

## Configuración y Operación

| Documento | Propósito |
|-----------|-----------|
| [SUPABASE_CONFIG.md](SUPABASE_CONFIG.md) | Configuración requerida de Supabase |
| [AUDIT_LOGGING.md](AUDIT_LOGGING.md) | Sistema de auditoría y GDPR |
| [db/](db/) | Scripts SQL de base de datos |

---

## Navegación por Tema

### Entender el Proyecto
→ README.md → 02_VISION_Y_ALCANCE.md → 01_SISTEMA_Y_REQUISITOS.md

### Entender la Arquitectura
→ 04_DOMINIO_Y_CASOS_DE_USO.md → ADR-0001 → ADR-0004

### Entender la Seguridad
→ ADR-0005 → 07_TESTING.md (sección 5) → AUDIT_LOGGING.md

### Desplegar el Sistema
→ 08_CICD_Y_DEPLOY.md → 11_DEPLOYMENT_CHECKLIST.md → SUPABASE_CONFIG.md

---

## Convenciones de Documentación

- **Fechas**: ISO 8601 (YYYY-MM-DD)
- **Versiones**: Semánticas (MAJOR.MINOR.PATCH)
- **Código**: Inline con backticks, bloques con triple backtick
- **Énfasis**: Negrita para conceptos clave, cursiva para términos técnicos
- **Tablas**: Para información estructurada y comparativa
- **Diagramas**: Mermaid cuando aportan claridad

---

*Última actualización: 2026-01-27*
