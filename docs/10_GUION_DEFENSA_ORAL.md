# 10 — Guión de Defensa Oral (10–12 minutos)



**Proyecto:** InversorAI  

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



- “Este trabajo presenta InversorAI, una plataforma de análisis financiero asistido por inteligencia artificial.”

- “El problema que abordo no es predecir el mercado, sino **cómo diseñar un sistema profesional, auditable y desplegable que utilice IA de forma responsable**.”

- “En muchos sistemas actuales, la IA se usa como una caja negra, sin trazabilidad ni control.”

- “El foco de este proyecto es la ingeniería del sistema, no la rentabilidad financiera.”



Qué NO decir:



- No hablar de resultados financieros.

- No prometer predicciones.

- No decir que la IA ‘decide’ o ‘invierte’.



---



## 2. Visión y Alcance del Sistema (Minuto 2:00 – 3:00)



**Objetivo:** demostrar que el alcance está bien delimitado.



Qué decir:



- “La visión del sistema es asistir el análisis, no automatizar trading real.”

- “El sistema analiza acciones, criptomonedas y divisas.”

- “Se generan recomendaciones explicables, pero **la decisión final siempre es humana**.”

- “Quedan explícitamente fuera de alcance la ejecución de órdenes reales y el asesoramiento financiero vinculante.”



Mensaje clave:

> “El alcance está definido para ser técnicamente sólido y académicamente defendible.”



---



## 3. Arquitectura y Diseño (Minuto 3:00 – 6:00)



**Objetivo:** demostrar dominio de arquitectura de software.



Qué decir:



- “El sistema está diseñado siguiendo principios de Clean Architecture.”

- “Separé claramente dominio, casos de uso, infraestructura e interfaces.”

- “Todas las decisiones relevantes están documentadas mediante ADRs.”

- “No existen endpoints sin un caso de uso explícito.”

- “La asincronía se utiliza para ingesta de datos, cálculos e IA.”



Puntos fuertes a remarcar:



- Casos de uso como unidad central.

- Dominio independiente de frameworks.

- Eventos, idempotencia y retries.

- Pipeline de datos automático y auditable.



Qué NO decir:



- No enumerar tecnologías como lista.

- No entrar en código.

- No justificar decisiones “porque es lo más usado”.



---



## 4. Uso de Inteligencia Artificial (Minuto 6:00 – 8:00)



**Objetivo:** diferenciarte del 90 % de los TFM con IA.



Qué decir:



- “La IA no es el centro del sistema, es un componente controlado.”

- “Los prompts están versionados.”

- “Los inputs son estructurados y determinísticos.”

- “Los outputs se validan contra un esquema.”

- “Cada recomendación es auditable: input, output, modelo y versión.”



Mensaje clave:

> “No testeo si la IA tiene razón, testeo que el sistema use la IA correctamente.”



Qué NO decir:



- No decir que la IA ‘entiende el mercado’.

- No hablar de creatividad o intuición del modelo.



---



## 5. Seguridad, Calidad y Producción (Minuto 8:00 – 10:00)

**Objetivo:** mostrar madurez profesional sin vender humo.

Qué decir:

- “El MVP está desplegado con **usuarios reales** (Supabase Auth), no con mocks.”
- “El backend exige `Authorization: Bearer <JWT>` y valida el token **localmente** contra el **JWKS** del proyecto (ES256).”
- “El rol no se hardcodea: se deriva de `app_metadata.inversorai_role` y el backend aplica RBAC (`ADMIN` vs `USER`).”
- “La gobernanza está cuidada: existe bootstrap idempotente del primer ADMIN y protección para no demover al último admin.”
- “Acciones críticas (cambio de rol) requieren step-up auth: si el token no es reciente, respondo `REAUTH_REQUIRED`.”
- “La calidad se sostiene con TDD y tests de integración donde importa (incluyendo verificación de JWKS en tests).”
- “El despliegue está documentado y el sistema es reproducible end-to-end.”

Punto fuerte:

> “La IA es solo una parte del sistema: lo defendible es la ingeniería que la rodea (trazabilidad, contratos y seguridad).”

---

## 6. Cierre y Conclusiones (Minuto 10:00 – 12:00)



**Objetivo:** dejar una impresión clara y sólida.



Qué decir:



- “Este trabajo demuestra la aplicación práctica de arquitectura limpia, procesamiento de datos, seguridad e IA responsable.”

- “El foco estuvo en construir un sistema defendible, mantenible y evaluable.”

- “El proyecto cumple los objetivos del máster y sienta bases sólidas para extensiones futuras.”



Frase de cierre sugerida:

> “InversorAI no busca predecir el mercado, busca demostrar cómo se construyen sistemas serios cuando hay IA involucrada.”



---



## Preguntas Frecuentes del Tribunal (Preparación)



- ¿Por qué no ejecuta trading real?  

&nbsp; → Por control de riesgo, alcance académico y responsabilidad legal.



- ¿Por qué no entrenaste un modelo propio?  

&nbsp; → El foco es ingeniería del sistema, no investigación en ML.



- ¿Podría llevarse a producción real?  

&nbsp; → Sí, la arquitectura y el pipeline están pensados para ello.



---



## Recomendaciones Finales



- Hablar con calma.

- No acelerar.

- Usar el vocabulario de los documentos.

- No improvisar términos nuevos.

- Si no sabés algo, decilo con honestidad técnica.



---



**Conclusión:**  

Este guión está diseñado para que el tribunal perciba **claridad conceptual, madurez técnica y dominio real del contenido**.



---



