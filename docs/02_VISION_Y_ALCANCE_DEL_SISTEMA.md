# 02 — Visión y Alcance del Sistema



**Proyecto:** InversorAI  

**Contexto:** Trabajo Final de Máster – Desarrollo de Sistemas con IA  

**Fecha:** 2025-01-24  



---



## 1. Propósito del Documento



Este documento define la **visión, objetivos y alcance** del sistema InversorAI.



Su objetivo es servir como **puente conceptual** entre:

- la definición de requisitos del sistema, y

- las decisiones arquitectónicas y de diseño posteriores.



Este documento **no define requisitos detallados**, **no describe arquitectura técnica** y **no entra en implementación**.  

Establece el **marco conceptual y académico** del proyecto.



---



## 2. Visión del Sistema



InversorAI se concibe como una **plataforma de análisis financiero asistido por inteligencia artificial**, orientada a:



- el estudio de mercados financieros,

- la generación de recomendaciones explicables,

- y la demostración de buenas prácticas de ingeniería de software aplicada a sistemas con IA.



La visión del sistema **no es automatizar inversiones reales**, sino **asistir al análisis y la toma de decisiones**, manteniendo siempre control humano, trazabilidad y responsabilidad.



---



## 3. Objetivo General



Diseñar y construir un sistema fullstack que:



- integre datos de mercado de forma automática,

- aplique análisis técnico verificable,

- utilice inteligencia artificial de manera controlada y auditable,

- y pueda desplegarse en un entorno productivo real,



demostrando la correcta aplicación de los conocimientos adquiridos en el máster.



---



## 4. Objetivos Específicos



Los objetivos específicos del proyecto son:



- Automatizar la ingesta y normalización de datos de mercado.

- Persistir series temporales de forma consistente y auditable.

- Calcular indicadores técnicos relevantes.

- (Línea futura) Optimización de portafolios bajo criterios clásicos (fuera del alcance del MVP).

- Generar recomendaciones de inversión mediante IA explicable.

- Garantizar trazabilidad completa de decisiones de IA.

- Diseñar una arquitectura limpia y mantenible.

- Incorporar seguridad, control de acceso y auditoría.

- Preparar el sistema para despliegue en producción.



---



## 5. Stakeholders del Sistema



### Usuario Final (USER)



- Consulta datos de mercado.

- Visualiza indicadores y recomendaciones.

- Analiza oportunidades de inversión.

- Gestiona portafolios propios.



---



### Administrador del Sistema (ADMIN)



- Gestiona activos financieros.

- Configura parámetros del sistema.

- Supervisa procesos automáticos.

- Accede a auditoría y eventos de seguridad.



---



### Sistema / Plataforma



- Ejecuta procesos automáticos.

- Consume proveedores externos.

- Aplica reglas de negocio.

- Genera recomendaciones asistidas por IA.



---



## 6. Alcance Funcional



### Incluido en el Alcance



- Análisis de mercados: acciones, criptomonedas y divisas.

- Ingesta automática de datos de mercado.

- Ejecución del pipeline bajo demanda (ADMIN), con diseño preparado para futuros jobs.

- Persistencia de datos históricos.

- Cálculo de indicadores técnicos.

- Recomendaciones asistidas por IA.

- Dashboard web y API REST.

- Autenticación y autorización con roles.

- Auditoría y trazabilidad.



---



### Explícitamente Fuera de Alcance



- Optimización de portafolios (work futuro; fuera del MVP).

- Procesamiento por colas/workers y scheduler (work futuro; el MVP es on-demand).

- Ejecución automática de operaciones financieras reales.

- Integración directa con brokers.

- Asesoramiento financiero vinculante.

- Garantías de rentabilidad.

- Trading algorítmico autónomo.

- Aplicaciones móviles nativas.



La exclusión de estos puntos es **deliberada y justificada**, tanto técnica como académicamente.



---



## 7. Supuestos y Restricciones



### Supuestos



- Uso de proveedores de datos de mercado externos.

- Uso de modelos de lenguaje de propósito general.

- Usuarios con conocimientos básicos de análisis financiero.



---



### Restricciones



- Alcance limitado al contexto del TFM.

- Uso de tecnologías accesibles y defendibles académicamente.

- Prioridad en claridad arquitectónica sobre optimización extrema.

- Presupuesto y tiempo acotados.



---



## 8. Criterios de Éxito del Proyecto



El proyecto se considera exitoso si:



- El sistema funciona end-to-end.

- La arquitectura es coherente y defendible.

- Las decisiones están documentadas y justificadas.

- La IA es controlada, trazable y auditable.

- El sistema puede ejecutarse en modo demo.

- El proyecto cumple los requisitos formales del máster.



---



## 9. Relación con el Trabajo Final de Máster



Este proyecto sirve como **evidencia práctica** del aprendizaje del alumno en:



- arquitectura de software,

- diseño de sistemas distribuidos,

- procesamiento de datos,

- seguridad aplicada,

- uso responsable de inteligencia artificial.



El foco está puesto en la **ingeniería del sistema**, no en la rentabilidad financiera.



---



## 10. Consideraciones Finales



Este documento establece el marco conceptual que guía todas las decisiones posteriores del proyecto.



Cualquier cambio significativo en la visión o el alcance del sistema deberá reflejarse explícitamente en este documento y en las decisiones arquitectónicas correspondientes.



---



