# 10 — Guión de Defensa Oral (10–12 minutos)

**Proyecto:** InversorAI
**Fecha:** 2026-01-26
**Contexto:** Trabajo Final de Máster – Desarrollo de Sistemas con IA

Este documento define el **guión recomendado para la defensa oral** del TFM ante el tribunal.
El objetivo es comunicar de forma clara, estructurada y profesional **qué problema se aborda, qué sistema se construyó y por qué las decisiones tomadas son correctas**.

---

## Estructura General

Duración total estimada: **10 a 12 minutos**

- Introducción y problema: ~2 minutos
- Visión y alcance: ~1 minuto
- Arquitectura y diseño: ~3 minutos
- Uso de IA y control de riesgos: ~2 minutos
- Seguridad, calidad y despliegue: ~2 minutos
- Cierre y conclusiones: ~1–2 minutos

---

## 1. Introducción y Problema (Minuto 0:00 – 2:00)

**Objetivo:** contextualizar rápidamente y captar la atención del tribunal.

Qué decir:

- "Este trabajo presenta InversorAI, una plataforma de análisis financiero asistido por inteligencia artificial."
- "El problema que abordo no es predecir el mercado, sino **cómo diseñar un sistema profesional, auditable y desplegable que utilice IA de forma responsable**."
- "En muchos sistemas actuales, la IA se usa como una caja negra, sin trazabilidad ni control."
- "El foco de este proyecto es la ingeniería del sistema, no la rentabilidad financiera."

Qué NO decir:

- No hablar de resultados financieros.
- No prometer predicciones.
- No decir que la IA 'decide' o 'invierte'.

---

## 2. Visión y Alcance del Sistema (Minuto 2:00 – 3:00)

**Objetivo:** demostrar que el alcance está bien delimitado.

Qué decir:

- "La visión del sistema es asistir el análisis, no automatizar trading real."
- "El sistema analiza acciones, criptomonedas y divisas."
- "Se generan recomendaciones explicables, pero **la decisión final siempre es humana**."
- "Quedan explícitamente fuera de alcance la ejecución de órdenes reales y el asesoramiento financiero vinculante."

Mensaje clave:

> "El alcance está definido para ser técnicamente sólido y académicamente defendible."

---

## 3. Arquitectura y Diseño (Minuto 3:00 – 6:00)

**Objetivo:** demostrar dominio de arquitectura de software.

Qué decir:

- "El sistema está diseñado siguiendo principios de Clean Architecture."
- "Separé claramente dominio, casos de uso, infraestructura e interfaces."
- "Todas las decisiones relevantes están documentadas mediante ADRs."
- "No existen endpoints sin un caso de uso explícito."
- "La asincronía se utiliza para ingesta de datos, cálculos e IA."

Puntos fuertes a remarcar:

- Casos de uso como unidad central.
- Dominio independiente de frameworks.
- Eventos, idempotencia y retries.
- Pipeline de datos automático y auditable.

Qué NO decir:

- No enumerar tecnologías como lista.
- No entrar en código.
- No justificar decisiones "porque es lo más usado".

---

## 4. Uso de Inteligencia Artificial (Minuto 6:00 – 8:00)

**Objetivo:** diferenciarte del 90 % de los TFM con IA.

Qué decir:

- "La IA no es el centro del sistema, es un componente controlado."
- "Los prompts están versionados (`prompt_version` en cada insight)."
- "Los inputs son sanitizados para prevenir prompt injection."
- "Los outputs se validan contra un esquema Zod estricto."
- "Cada recomendación es auditable: input, output, modelo y versión."

Mensaje clave:

> "No testeo si la IA tiene razón, testeo que el sistema use la IA correctamente."

Qué NO decir:

- No decir que la IA 'entiende el mercado'.
- No hablar de creatividad o intuición del modelo.

---

## 5. Seguridad, Calidad y Producción (Minuto 8:00 – 10:00)

**Objetivo:** mostrar madurez profesional sin vender humo.

Qué decir:

- "El MVP está desplegado con **usuarios reales** (Supabase Auth), no con mocks."
- "El backend exige `Authorization: Bearer <JWT>` y valida el token **localmente** contra el **JWKS** del proyecto usando `jose` (ES256)."
- "El rol no se hardcodea: se deriva de `app_metadata.inversorai_role` y el backend aplica RBAC (`ADMIN` vs `USER`)."
- "La gobernanza está cuidada: existe bootstrap idempotente del primer ADMIN y protección para no demover al último admin."
- "Acciones críticas (cambio de rol) requieren **step-up auth**: si el token no es reciente, respondo `401` con `code: REAUTH_REQUIRED`."
- "La calidad se sostiene con TDD y tests de regresión de seguridad."
- "El despliegue está documentado y el sistema es reproducible end-to-end."

Punto fuerte:

> "La IA es solo una parte del sistema: lo defendible es la ingeniería que la rodea (trazabilidad, contratos y seguridad)."

---

## 6. Cierre y Conclusiones (Minuto 10:00 – 12:00)

**Objetivo:** dejar una impresión clara y sólida.

Qué decir:

- "Este trabajo demuestra la aplicación práctica de arquitectura limpia, procesamiento de datos, seguridad e IA responsable."
- "El foco estuvo en construir un sistema defendible, mantenible y evaluable."
- "El proyecto cumple los objetivos del máster y sienta bases sólidas para extensiones futuras."

Frase de cierre sugerida:

> "InversorAI no busca predecir el mercado, busca demostrar cómo se construyen sistemas serios cuando hay IA involucrada."

---

## Demo Recomendada (Si se solicita)

### Flujo de Demo (5-7 minutos)

| Paso | Acción | Ruta | Qué mostrar |
|------|--------|------|-------------|
| 1 | Registro de usuario | `/register` | Flujo Supabase Auth, email de confirmación |
| 2 | Login como USER | `/login` | Autenticación exitosa |
| 3 | Dashboard de usuario | `/dashboard` | Visualización de datos de mercado reales |
| 4 | Cambio de activos | `/dashboard` | Crypto (BTC-USD), Stock (AAPL), FX (EURUSD=X) |
| 5 | Visualización de gráficos | `/dashboard` | Indicadores técnicos, tendencias |
| 6 | Login como ADMIN | `/login` | Usuario con rol ADMIN |
| 7 | Panel de administración | `/dashboard/admin` | Lista de usuarios, acciones admin |
| 8 | Ejecutar pipeline | `/dashboard/admin` | Ingesta → Indicadores → IA → Recomendación |
| 9 | Ver insight generado | `/dashboard` | Insight con confidence_score, action, reasoning |
| 10 | Demo cambio de rol | `/dashboard/admin` | **Ver paso detallado abajo** |
| 11 | Demo reset password | `/reset-password` | Flujo de recuperación de contraseña |

### Demo de Step-up Auth (Cambio de Rol)

Este es un punto diferenciador importante para mostrar al tribunal:

1. **Iniciar como ADMIN** con token "viejo" (más de 5 minutos desde login)
2. **Intentar cambiar el rol de un usuario**
3. **Mostrar respuesta 401** con `code: REAUTH_REQUIRED`
4. **Ingresar contraseña nuevamente** (re-autenticación)
5. **Mostrar que ahora funciona** con el nuevo token reciente
6. **Explicar**: "El sistema requiere autenticación reciente para operaciones sensibles. Esto es un patrón estándar de seguridad llamado step-up authentication."

### Rutas Clave del Frontend

| Ruta | Descripción | Requiere |
|------|-------------|----------|
| `/` | Landing page | - |
| `/login` | Inicio de sesión | - |
| `/register` | Registro de usuario | - |
| `/dashboard` | Panel principal de usuario | Auth (USER/ADMIN) |
| `/dashboard/admin` | Panel de administración | Auth (ADMIN) |
| `/reset-password` | Establecer nueva contraseña | Token de reset |

### Datos Verificables

Durante la demo, mencionar que los datos son verificables:

- "Estos precios de BTC-USD son reales de Yahoo Finance"
- "Pueden verificarlo en Google Finance o cualquier otra fuente"
- "El sistema no inventa datos: ingesta de fuentes reales, persiste en PostgreSQL, y lee desde la DB"

---

## Preguntas Frecuentes del Tribunal (Preparación)

### Sobre el alcance

- **¿Por qué no ejecuta trading real?**
  → Por control de riesgo, alcance académico y responsabilidad legal.

- **¿Por qué no entrenaste un modelo propio?**
  → El foco es ingeniería del sistema, no investigación en ML.

- **¿Podría llevarse a producción real?**
  → Sí, la arquitectura y el pipeline están pensados para ello.

### Sobre seguridad

- **¿Cómo sabés que el JWT es válido?**
  → Se verifica localmente contra JWKS de Supabase usando la librería `jose`.

- **¿Cómo se define quién es ADMIN?**
  → Mediante `app_metadata.inversorai_role` en el JWT, no hardcodeado.

- **¿Qué pasa si alguien intenta cambiar su rol desde el frontend?**
  → El rol viene del JWT firmado por Supabase. El cliente no puede modificarlo.

- **¿Qué es step-up auth?**
  → Es requerir una autenticación reciente para operaciones sensibles. Evita que un token robado hace horas pueda cambiar roles.

### Sobre IA

- **¿Cómo controlás las alucinaciones?**
  → Validación estricta del output con Zod, campos obligatorios, rangos válidos.

- **¿Qué pasa si la IA devuelve basura?**
  → El sistema rechaza outputs que no cumplen el schema y registra el error.

- **¿Cómo auditás las recomendaciones?**
  → Cada insight incluye: input_snapshot_hash, model_version, prompt_version, timestamp.

---

## Recomendaciones Finales

- Hablar con calma.
- No acelerar.
- Usar el vocabulario de los documentos (USER, ADMIN, pipeline, providers).
- No improvisar términos nuevos.
- Si no sabés algo, decilo con honestidad técnica.
- En la demo, explicar qué está pasando, no solo clickear.

---

**Conclusión:**
Este guión está diseñado para que el tribunal perciba **claridad conceptual, madurez técnica y dominio real del contenido**.

---
