# Visión y Alcance del Sistema

**Proyecto:** InversorAI  
**Versión:** 2.0  
**Fecha:** 2026-01-27  
**Contexto:** Trabajo Final de Máster — Desarrollo de Sistemas con IA

---

## Resumen Ejecutivo

InversorAI es una plataforma de análisis financiero que demuestra cómo integrar inteligencia artificial de forma **responsable, trazable y auditable** en un sistema de producción real.

> **Mensaje central:** El foco de este proyecto es la **ingeniería del sistema**, no predecir el mercado. InversorAI no busca automatizar inversiones; busca demostrar cómo se construyen sistemas serios cuando hay IA involucrada.

---

## 1. El Problema

Los sistemas de análisis financiero con IA enfrentan desafíos críticos que este proyecto aborda directamente:

| Problema | Impacto | Cómo lo resuelve InversorAI |
|----------|---------|------------------------------|
| **Caja negra** | Imposible auditar decisiones | Prompts versionados, outputs validados, trazabilidad completa |
| **Sin trazabilidad** | No se sabe qué datos generaron cada resultado | Hash de inputs, model_version, prompt_version persistidos |
| **Alucinaciones** | IA genera información falsa | Validación Zod estricta, rechazo de outputs inválidos |
| **Datos no verificables** | Imposible contrastar con fuentes externas | Datos reales de Yahoo Finance, verificables en Google Finance |
| **Seguridad deficiente** | Accesos no controlados | RBAC, JWT local via JWKS, step-up auth, audit logging |

---

## 2. La Visión

InversorAI se concibe como una **plataforma de análisis financiero asistido por IA** que:

1. **Ingesta datos reales** de mercados financieros (acciones, criptomonedas, divisas)
2. **Calcula indicadores técnicos** verificables y reproducibles
3. **Genera insights explicables** mediante IA controlada
4. **Produce recomendaciones auditables** (BUY/HOLD/SELL con confidence score)
5. **Garantiza seguridad profesional** con autenticación, autorización y auditoría

### Lo que InversorAI ES

- Un sistema fullstack desplegable en producción
- Una demostración de Clean Architecture aplicada
- Un ejemplo de integración responsable de IA
- Una plataforma con seguridad production-grade

### Lo que InversorAI NO ES

- Un sistema de trading automatizado
- Un asesor financiero que garantiza rentabilidad
- Una herramienta de predicción de mercados
- Un sistema que ejecuta órdenes reales

---

## 3. Objetivos del Proyecto

### 3.1 Objetivo Principal

Diseñar y construir un sistema fullstack que demuestre la correcta aplicación de los conocimientos adquiridos en el máster, con énfasis en:

- Arquitectura de software (Clean/Hexagonal)
- Integración responsable de IA
- Seguridad aplicada
- Calidad y testing
- Despliegue profesional

### 3.2 Objetivos Específicos

| Área | Objetivo | Evidencia |
|------|----------|-----------|
| **Arquitectura** | Separación clara de capas | Dominio → Aplicación → Infraestructura → Interfaces |
| **Datos** | Ingesta y persistencia confiable | Yahoo Finance → PostgreSQL con trazabilidad |
| **IA** | Uso controlado y auditable | Prompts versionados, outputs validados, hash de inputs |
| **Seguridad** | Protección production-grade | JWT/JWKS, RBAC, step-up auth, audit logs |
| **Calidad** | Testing riguroso | TDD, 180+ tests, CI/CD |
| **Operación** | Sistema desplegable | Documentación completa, bootstrap automatizado |

---

## 4. Alcance del MVP

### 4.1 Incluido en el MVP

**Activos Soportados:**
- `BTC-USD` (Criptomoneda)
- `AAPL` (Acción)
- `EURUSD=X` (Divisa)

**Funcionalidades:**

| Categoría | Funcionalidad |
|-----------|---------------|
| **Datos** | Ingesta OHLCV desde Yahoo Finance |
| **Análisis** | RSI, MACD, volatilidad, Sharpe Ratio |
| **IA** | Insights explicables + recomendaciones BUY/HOLD/SELL |
| **Frontend** | Dashboard web responsive con Next.js |
| **Backend** | API REST versionada con Node.js/Express |
| **Auth** | Supabase Auth con JWT verificado localmente |
| **RBAC** | Roles USER/ADMIN con permisos diferenciados |
| **Seguridad** | Helmet, CORS, rate limiting, audit logging |
| **Admin** | Gestión de usuarios, bootstrap de primer admin |

### 4.2 Fuera de Alcance (Decisiones Intencionales)

| Exclusión | Justificación |
|-----------|---------------|
| Trading real | Control de riesgo, alcance académico, responsabilidad legal |
| MFA | Evitar sobreingeniería; el MVP demuestra step-up auth |
| Scheduler automático | Pipeline on-demand suficiente para demostración |
| E2E con Playwright | Priorizamos tests unitarios y de integración |
| Apps móviles nativas | Web responsive cubre el caso de uso |

> **Nota:** Estas exclusiones son **deliberadas y defendibles**. El alcance está diseñado para ser técnicamente sólido y académicamente justificable.

---

## 5. Stakeholders

### 5.1 Usuario Final (USER)

**Puede:**
- Autenticarse en el sistema
- Visualizar dashboard con datos de mercado
- Consultar indicadores técnicos
- Ver insights y recomendaciones generados

**No puede:**
- Ejecutar el pipeline de análisis
- Gestionar otros usuarios
- Acceder a configuración del sistema

### 5.2 Administrador (ADMIN)

**Puede:** Todo lo del USER, más:
- Ejecutar pipeline de análisis bajo demanda
- Gestionar usuarios (listar, cambiar roles)
- Enviar emails de reset de contraseña
- Acceder a auditoría del sistema

**Restricciones:**
- Rate limiting por (admin, asset) en pipeline
- Step-up auth requerido para cambios de rol
- No puede demover al último ADMIN del sistema

### 5.3 Sistema (Pipeline)

El pipeline es una orquestación de casos de uso que ejecuta:

```
IngestMarketData → ComputeIndicators → AnalyzeMarketTrends → GenerateInsight → Persist
```

Se dispara únicamente por ADMIN (en el MVP) y produce resultados auditables.

---

## 6. Principios de Diseño

### 6.1 Arquitectura

- **Clean Architecture:** Dominio independiente de frameworks y bases de datos
- **Casos de uso explícitos:** Cada funcionalidad tiene un caso de uso documentado
- **Inversión de dependencias:** El dominio define puertos, la infraestructura los implementa
- **Hexagonal:** Adaptadores intercambiables para providers y repositorios

### 6.2 IA Responsable

- **Controlada:** Prompts versionados, inputs estructurados
- **Validada:** Outputs verificados contra schema Zod estricto
- **Trazable:** Hash de inputs, versión de modelo y prompt persistidos
- **Auditable:** Toda invocación queda registrada
- **Limitada:** La IA genera recomendaciones, no ejecuta acciones

### 6.3 Seguridad

- **Defense in depth:** Múltiples capas de protección
- **Fail-fast:** El servidor no inicia con configuración inválida
- **Zero trust:** JWT verificado localmente, roles derivados del token
- **Audit trail:** Todas las acciones sensibles quedan registradas

---

## 7. Criterios de Éxito

El proyecto se considera exitoso si cumple:

| Criterio | Métrica |
|----------|---------|
| **Funcional** | Pipeline ejecutable end-to-end con datos reales |
| **Arquitectura** | Clean Architecture demostrable y defendible |
| **Documentación** | ADRs completos, decisiones justificadas |
| **Seguridad** | Auditoría PASS, controles OWASP mapeados |
| **Calidad** | 180+ tests, TDD aplicado, CI verde |
| **Operación** | Sistema desplegable con documentación |
| **Académico** | Cumple requisitos del TFM |

---

## 8. Consideraciones Legales y Éticas

### 8.1 Disclaimer

InversorAI es un proyecto académico que:
- **No constituye** asesoramiento financiero
- **No garantiza** rentabilidad ni resultados
- **No ejecuta** operaciones reales de trading
- **Presenta** análisis como información educativa

### 8.2 Uso Responsable de IA

- Las recomendaciones son asistidas, no autónomas
- El usuario siempre tiene la decisión final
- Se explicita la naturaleza probabilística de la IA
- Se provee trazabilidad completa para revisión humana

---

## 9. Evolución Futura

El MVP sienta bases para extensiones post-académicas:

| Mejora | Complejidad | Preparación Actual |
|--------|-------------|---------------------|
| Scheduler automático | Media | Arquitectura preparada |
| Más activos | Baja | Providers abstractos |
| Optimización de portafolios | Alta | Dominio diseñado |
| MFA | Media | Auth delegado a Supabase |
| Notificaciones | Media | Eventos auditables |

---

## 10. Resumen

InversorAI demuestra que es posible construir sistemas con IA de forma **profesional, controlada y auditable**. El proyecto no busca predecir mercados ni automatizar trading; busca demostrar **cómo se hace ingeniería de software seria cuando hay IA involucrada**.

> "InversorAI no busca predecir el mercado, busca demostrar cómo se construyen sistemas serios cuando hay IA involucrada."

---

*Documento vinculante para la implementación del sistema.*
