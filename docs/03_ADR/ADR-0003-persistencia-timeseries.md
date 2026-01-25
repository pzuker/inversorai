\# ADR-0003 — Persistencia y Modelo de Datos Time-Series



\*\*Estado:\*\* Aprobado  

\*\*Fecha:\*\* 2025-01-24  

\*\*Decisores:\*\* Equipo InversorAI  

\*\*Contexto:\*\* Trabajo Final de Máster – Desarrollo de Sistemas con IA  



---



\## 1. Contexto



El sistema \*\*InversorAI\*\* procesa y analiza grandes volúmenes de datos financieros con fuerte componente temporal, incluyendo:



\- Precios históricos de mercado (OHLCV).

\- Indicadores técnicos calculados sobre ventanas temporales.

\- Recomendaciones de inversión generadas por IA.

\- Eventos de auditoría y seguridad.



Los requisitos del sistema imponen que la persistencia:



\- Soporte \*\*series temporales de alta cardinalidad\*\*.

\- Permita \*\*consultas eficientes por rango de fechas\*\*.

\- Mantenga \*\*integridad histórica\*\* (no sobrescritura silenciosa).

\- Sea compatible con \*\*auditoría, trazabilidad y cumplimiento\*\*.

\- Se integre de forma natural con la arquitectura Clean/Hexagonal definida.



Adicionalmente, el contexto académico del TFM exige:



\- Uso de tecnologías estándar y defendibles.

\- Justificación explícita del modelo de datos.

\- Evitar soluciones experimentales o excesivamente complejas.



---



\## 2. Requisitos de Persistencia



\### 2.1 Requisitos Funcionales



\- Almacenar datos OHLCV por activo y resolución temporal.

\- Almacenar indicadores técnicos derivados de datos de mercado.

\- Almacenar recomendaciones de inversión con inputs asociados.

\- Almacenar usuarios, roles y preferencias.

\- Almacenar eventos de auditoría y seguridad.



\### 2.2 Requisitos No Funcionales



\- Escalabilidad para miles de activos y años de histórico.

\- Consultas por rango temporal con latencia predecible.

\- Integridad referencial entre activos, datos, indicadores y recomendaciones.

\- Soporte para retención de datos y archivado.

\- Compatibilidad con despliegue gestionado en la nube.



---



\## 3. Decisión



Se adopta \*\*PostgreSQL\*\* como base de datos principal del sistema, con un \*\*modelo híbrido relacional + time-series\*\*, utilizando \*\*TimescaleDB\*\* cuando esté disponible.



\### 3.1 Motor de Base de Datos



\- \*\*Motor:\*\* PostgreSQL 17+

\- \*\*Proveedor:\*\* Supabase

\- \*\*Extensión opcional:\*\* TimescaleDB



PostgreSQL se utiliza como \*\*única fuente de verdad\*\* para:



\- Datos de mercado.

\- Indicadores.

\- Recomendaciones IA.

\- Usuarios y seguridad.

\- Auditoría.



No se introducen bases de datos adicionales en el MVP.



---



\## 4. Modelo de Datos Conceptual



\### 4.1 Entidad: Asset



Representa un instrumento financiero.



Campos conceptuales:

\- `id`

\- `symbol`

\- `type` (STOCK | CRYPTO | FX)

\- `currency`

\- `exchange`

\- `is\_active`



---



\### 4.2 Entidad: MarketDataPoint (Time-Series)



Representa un punto OHLCV en el tiempo.



Campos conceptuales:

\- `asset\_id`

\- `timestamp` (UTC)

\- `open`

\- `high`

\- `low`

\- `close`

\- `volume`

\- `resolution`

\- `is\_interpolated`

\- `source`



Claves:

\- Clave compuesta (`asset\_id`, `timestamp`, `resolution`)



---



\### 4.3 Entidad: IndicatorSet



Representa indicadores calculados sobre datos de mercado.



Campos conceptuales:

\- `asset\_id`

\- `timestamp`

\- `resolution`

\- `rsi`

\- `macd`

\- `macd\_signal`

\- `volatility`

\- `sharpe\_ratio`

\- `calculation\_version`



---



\### 4.4 Entidad: Recommendation



Representa una recomendación generada por IA.



Campos conceptuales:

\- `id`

\- `asset\_id`

\- `action` (BUY | HOLD | SELL)

\- `confidence\_score`

\- `model\_name`

\- `model\_version`

\- `prompt\_version`

\- `input\_snapshot\_hash`

\- `created\_at`



---



\### 4.5 Entidad: RecommendationAudit



Almacena la trazabilidad completa de una recomendación IA.



Campos conceptuales:

\- `recommendation\_id`

\- `input\_snapshot`

\- `model\_output\_raw`

\- `model\_output\_normalized`

\- `created\_at`



---



\### 4.6 Entidad: AuditLog



Eventos de seguridad y auditoría.



Campos conceptuales:

\- `id`

\- `event\_type`

\- `actor\_id`

\- `timestamp`

\- `ip\_address`

\- `user\_agent`

\- `details`



---



\## 5. Estrategia Time-Series



\### 5.1 Particionado y Escalabilidad



\- Particionado por:

&nbsp; - `asset\_id`

&nbsp; - `timestamp`

\- Uso de hypertables (TimescaleDB) si está disponible.

\- En ausencia de TimescaleDB:

&nbsp; - Particionado nativo por rango temporal.



\### 5.2 Retención de Datos



\- Datos de mercado:

&nbsp; - Alta resolución: retención configurable.

&nbsp; - Resolución diaria: retención completa.

\- Auditoría:

&nbsp; - Retención mínima: 1 año.

\- Recomendaciones:

&nbsp; - Retención completa (no se eliminan).



---



\## 6. Acceso a Datos y Arquitectura



\### 6.1 Puertos de Persistencia



El acceso a la base de datos se realiza exclusivamente mediante \*\*puertos de repositorio\*\*, por ejemplo:



\- `MarketDataRepositoryPort`

\- `IndicatorRepositoryPort`

\- `RecommendationRepositoryPort`

\- `AuditLogRepositoryPort`



El dominio \*\*no conoce\*\* SQL, ORM ni detalles de almacenamiento.



---



\### 6.2 Implementaciones



Las implementaciones concretas:



\- Viven en la capa de infraestructura.

\- Utilizan SQL/ORM de forma explícita.

\- Aplican validaciones y conversiones necesarias.



---



\## 7. Alternativas Consideradas



\### 7.1 Bases de Datos Especializadas Time-Series (InfluxDB)



\*\*Ventajas\*\*:

\- Alto rendimiento para métricas puras.



\*\*Desventajas\*\*:

\- Modelo no relacional.

\- Complejidad adicional.

\- Dificultad para auditoría y joins.



\*\*Decisión\*\*: ❌ Rechazado.



---



\### 7.2 Bases NoSQL (MongoDB)



\*\*Ventajas\*\*:

\- Flexibilidad de esquema.



\*\*Desventajas\*\*:

\- Inadecuada para queries financieras precisas.

\- Consistencia eventual no deseada.



\*\*Decisión\*\*: ❌ Rechazado.



---



\## 8. Consecuencias



\### Positivas



\- Modelo de datos consistente y auditable.

\- Unificación de persistencia.

\- Consultas complejas posibles (joins, agregaciones).

\- Facilidad de backup y recuperación.



\### Negativas



\- Escalabilidad extrema limitada sin tuning.

\- Dependencia de SQL para consultas avanzadas.



---



\## 9. Riesgos y Mitigaciones



| Riesgo | Impacto | Mitigación |

|------|--------|------------|

| Crecimiento acelerado de datos | Medio | Retención y compresión. |

| Queries lentas | Medio | Índices y particionado. |

| Errores de migración | Bajo | Versionado de esquema y pruebas. |

| Dependencia de proveedor | Bajo | Uso de PostgreSQL estándar. |



---



\## 10. Estado y Seguimiento



\- Este ADR queda \*\*aprobado y cerrado\*\*.

\- Cambios futuros en persistencia requerirán un nuevo ADR.

\- El diseño es vinculante para la implementación del MVP.



---



