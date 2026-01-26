# ADR-0001 — Stack Tecnológico y Plataformas de Despliegue



**Estado:** Aprobado  

**Fecha:** 2026-01-25  

**Decisores:** Equipo InversorAI  

**Contexto:** Trabajo Final de Máster – Desarrollo de Sistemas con IA  



---



## 1. Contexto



El proyecto **InversorAI** consiste en una plataforma fullstack de análisis de mercados financieros con inteligencia artificial, orientada a:



- Acciones (STOCK)

- Criptomonedas (CRYPTO)

- Divisas (FX)



El sistema debe cumplir con los siguientes requisitos clave:



- Arquitectura limpia y mantenible (Clean Architecture / Hexagonal).

- Automatización completa de ingesta y procesamiento de datos (sin archivos manuales).

- Recomendaciones de inversión generadas por IA con **trazabilidad, auditabilidad y explicabilidad**.

- Seguridad alineada con **OWASP Top 10** y preparada para monetización.

- Separación clara de responsabilidades (web, API, workers).

- Capacidad de despliegue real en producción con bajo costo operativo.

- Facilidad para pasar de entorno local a producción sin rediseños.



El contexto académico del TFM exige, además:



- Uso de tecnologías actuales y ampliamente aceptadas en la industria.

- Justificación explícita de decisiones técnicas.

- Evitar sobre–ingeniería innecesaria (ej. Kubernetes, microservicios complejos).

- Evidencia de comprensión de trade-offs y riesgos.



---



## 2. Decisión



Se adopta el siguiente **stack tecnológico y de plataformas** para el MVP y despliegue inicial en producción.



### 2.1 Arquitectura General



- **Arquitectura:** Clean Architecture / Hexagonal

- **Repositorio:** Monorepo

- **Lenguaje:** TypeScript end-to-end

- **Paradigma:** Backend orientado a casos de uso, frontend desacoplado. (Workers/colas quedan como línea futura; el MVP ejecuta pipeline on-demand.)



### 2.2 Frontend (Web)



- **Framework:** Next.js

- **Tipo:** SPA con capacidades SSR/SSG cuando aplique

- **Responsabilidades:**

&nbsp; - Autenticación de usuarios (via IdP)

&nbsp; - Visualización de datos de mercado

&nbsp; - Gráficos e indicadores

&nbsp; - Recomendaciones IA

&nbsp; - Optimización de portafolio

- **Motivos:**

&nbsp; - Excelente DX y UX

&nbsp; - Integración nativa con TypeScript

&nbsp; - Ecosistema maduro para dashboards financieros

&nbsp; - Despliegue serverless simplificado



### 2.3 Backend API



- **Framework:** NestJS

- **Tipo:** API REST

- **Responsabilidades:**

&nbsp; - Exposición de endpoints versionados (`/api/v1`)

&nbsp; - Autorización RBAC

&nbsp; - Orquestación de casos de uso

&nbsp; - Validación de inputs

&nbsp; - Acceso a datos (vía puertos)

- **Motivos:**

&nbsp; - Enfoque arquitectónico claro

&nbsp; - Soporte nativo para DI

&nbsp; - Testing estructurado

&nbsp; - Familiaridad académica y profesional



### 2.4 Workers Asíncronos



- **Runtime:** Node.js (TypeScript)

- **Responsabilidades:**

&nbsp; - Ingesta de datos de mercado

&nbsp; - Cálculo de indicadores

&nbsp; - Generación de recomendaciones IA

- **Comunicación:** Cola de mensajes

- **Motivos:**

&nbsp; - Separación clara entre procesamiento y API

&nbsp; - Mejor tolerancia a fallos

&nbsp; - Escalabilidad independiente



### 2.5 Base de Datos



- **Motor:** PostgreSQL 17+

- **Proveedor:** Supabase

- **Extensión:** TimescaleDB (si está disponible)

- **Uso:**

&nbsp; - Series temporales de mercado

&nbsp; - Indicadores calculados

&nbsp; - Usuarios y metadatos

&nbsp; - Auditoría de eventos

- **Motivos:**

&nbsp; - Estándar industrial

&nbsp; - Soporte robusto para time-series

&nbsp; - SQL expresivo para análisis

&nbsp; - Integración con Auth y RLS



### 2.6 Autenticación e Identidad



- **Proveedor:** Supabase Auth

- **Estándar:** OIDC / OAuth2

- **Modelo:**

&nbsp; - Autenticación delegada completamente

&nbsp; - Tokens JWT

&nbsp; - Roles ADMIN / USER

- **Motivos:**

&nbsp; - Cumplimiento de estándares

&nbsp; - MFA integrado

&nbsp; - Row Level Security en DB

&nbsp; - Reducción de superficie de ataque



### 2.7 Colas y Cache



- **Sistema:** Redis

- **Proveedor:** Upstash

- **Uso:**

&nbsp; - Cola de jobs (BullMQ)

&nbsp; - Cache de queries frecuentes

- **Motivos:**

&nbsp; - Servicio gestionado

&nbsp; - Escalado automático

&nbsp; - Integración simple con Node.js



### 2.8 Inteligencia Artificial



- **Proveedor:** OpenAI (SDK oficial)

- **Uso:**

&nbsp; - Generación de recomendaciones de inversión

- **Controles:**

&nbsp; - Prompt versionado

&nbsp; - Output normalizado

&nbsp; - Auditoría completa

- **Motivos:**

&nbsp; - Estado del arte

&nbsp; - Documentación sólida

&nbsp; - Control explícito de versiones y parámetros



### 2.9 Despliegue



- **Web:** Vercel

- **API + Workers:** Render (o Railway como alternativa)

- **Base de Datos + Auth:** Supabase

- **Redis:** Upstash



---



## 3. Alternativas Consideradas



### 3.1 Frontend



- **React + Vite**

&nbsp; - ❌ Rechazado: requiere más configuración para SSR y routing avanzado.

- **Angular**

&nbsp; - ❌ Rechazado: sobrecarga innecesaria para el alcance del MVP.



### 3.2 Backend



- **Fastify puro**

&nbsp; - ❌ Rechazado: mayor esfuerzo para estructurar arquitectura limpia.

- **Express**

&nbsp; - ❌ Rechazado: falta de estructura y DI nativo.



### 3.3 Base de Datos



- **InfluxDB**

&nbsp; - ❌ Rechazado: menor flexibilidad relacional.

- **MongoDB**

&nbsp; - ❌ Rechazado: pobre adecuación para time-series financieras.



### 3.4 Autenticación



- **Auth0 / Clerk**

&nbsp; - ❌ Rechazado: dependencia externa adicional y mayor costo.

- **Autenticación propia**

&nbsp; - ❌ Rechazado: riesgo de seguridad innecesario.



### 3.5 Infraestructura



- **Kubernetes**

&nbsp; - ❌ Rechazado: complejidad injustificada para el MVP.

- **Microservicios completos**

&nbsp; - ❌ Rechazado: sobre–ingeniería académicamente penalizable.



---



## 4. Consecuencias



### Positivas



- Arquitectura clara y defendible académicamente.

- Baja fricción entre desarrollo local y producción.

- Seguridad profesional sin complejidad excesiva.

- Escalabilidad razonable para el alcance del MVP.

- Costos controlados.



### Negativas



- Dependencia de proveedores gestionados (Supabase, Vercel).

- Límite de escalabilidad extrema sin rediseño.

- Menor control fino de infraestructura que en soluciones self-hosted.



---



## 5. Riesgos y Mitigaciones



| Riesgo | Impacto | Mitigación |

|------|--------|------------|

| Vendor lock-in | Medio | Uso de estándares abiertos (OIDC, SQL, REST). |

| Costos inesperados | Medio | Monitoreo y límites de uso. |

| Cambios en APIs externas | Alto | Abstracción mediante puertos/adaptadores. |

| Latencia entre servicios | Bajo | Colas y cache. |



---



## 6. Estado y Seguimiento



- Este ADR queda **cerrado y aprobado**.

- Cualquier cambio posterior deberá registrarse en un nuevo ADR.

- Este documento es vinculante para el diseño e implementación del sistema.



---



