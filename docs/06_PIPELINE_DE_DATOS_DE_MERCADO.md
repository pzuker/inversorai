\# 06 — Pipeline de Datos de Mercado



\*\*Proyecto:\*\* InversorAI  

\*\*Fecha:\*\* 2025-01-24  

\*\*Contexto:\*\* Trabajo Final de Máster – Desarrollo de Sistemas con IA  



---



\## 1. Propósito del Documento



Este documento describe de forma detallada el \*\*pipeline end-to-end de datos de mercado\*\* del sistema InversorAI, desde la obtención de datos externos hasta su consumo por indicadores, optimización de portafolios y generación de recomendaciones mediante IA.



El objetivo es demostrar comprensión de:



\- pipelines de datos financieros,

\- tratamiento de series temporales,

\- control de calidad de datos,

\- resiliencia frente a fallos externos.



Este documento no contiene código ni configuración específica de proveedores.



---



\## 2. Alcance del Pipeline



El pipeline cubre los siguientes tipos de activos:



\- Acciones (STOCK)

\- Criptomonedas (CRYPTO)

\- Divisas (FX)



Y procesa los siguientes tipos de datos:



\- Precios OHLCV históricos.

\- Datos incrementales periódicos.

\- Metadatos de calidad y origen.



---



\## 3. Principios de Diseño del Pipeline



El pipeline se diseña siguiendo estos principios:



\- Automatización completa (sin intervención manual).

\- Normalización temprana de datos.

\- Validación y control de calidad explícitos.

\- Tolerancia a fallos parciales.

\- Idempotencia en cada etapa.

\- Observabilidad y auditoría completas.



---



\## 4. Etapas del Pipeline



\### 4.1 Descubrimiento y Selección de Activos



Antes de la ingesta:



\- Los activos deben existir en el catálogo del sistema.

\- Cada activo tiene:

&nbsp; - tipo de mercado,

&nbsp; - símbolo,

&nbsp; - fuente de datos asociada,

&nbsp; - estado activo/inactivo.

\- Activos inactivos no participan del pipeline.



---



\### 4.2 Ingesta de Datos Externos



Responsabilidad:

\- Obtener datos OHLCV desde proveedores externos.



Características:

\- Ejecutada por workers asíncronos.

\- Disparada por scheduler según calendario del mercado.

\- Soporta rangos históricos e ingesta incremental.



Controles:

\- Timeouts explícitos.

\- Manejo de rate limiting.

\- Retries con backoff exponencial.

\- Registro del proveedor y timestamp de obtención.



---



\### 4.3 Normalización de Datos



Todos los datos ingresados se normalizan inmediatamente:



\- Timestamps convertidos a UTC.

\- Campos OHLCV convertidos a tipos numéricos estándar.

\- Resolución temporal explícita (1d, 1h, etc.).

\- Estructura homogénea independientemente del proveedor.



La normalización ocurre \*\*antes de cualquier persistencia\*\*.



---



\### 4.4 Validación y Control de Calidad



Cada lote de datos pasa por validaciones:



Validaciones estructurales:

\- Campos obligatorios presentes.

\- Tipos de datos correctos.

\- Rangos numéricos válidos (ej. precios no negativos).



Validaciones temporales:

\- Orden cronológico correcto.

\- Detección de gaps temporales.

\- Detección de duplicados.



Validaciones de negocio:

\- Coherencia OHLC (low ≤ open/close ≤ high).

\- Volúmenes no negativos.



Resultados:

\- Datos válidos continúan el pipeline.

\- Datos inválidos se descartan o marcan con flags.

\- Eventos de calidad se registran en auditoría.



---



\### 4.5 Persistencia de Datos de Mercado



Los datos validados se persisten como \*\*MarketDataPoint\*\*.



Características:

\- Escrituras idempotentes.

\- Claves compuestas por activo, timestamp y resolución.

\- Registro del origen del dato.

\- Flag explícito para datos interpolados.



La persistencia es \*\*append-only\*\* desde la perspectiva lógica.



---



\### 4.6 Detección y Tratamiento de Gaps



Cuando se detectan gaps:



\- Se clasifican según tipo de mercado.

\- Se aplican reglas definidas:

&nbsp; - Forward-fill limitado para STOCK y FX.

&nbsp; - Alertas tempranas para CRYPTO.

\- Se marca el dato como interpolado cuando aplica.



Las decisiones de interpolación quedan registradas.



---



\### 4.7 Cálculo de Indicadores Técnicos



Una vez persistidos los datos de mercado:



\- Se dispara el cálculo de indicadores.

\- Los indicadores se calculan sobre ventanas temporales definidas.

\- Los resultados se persisten como \*\*IndicatorSet\*\*.

\- Se registra versión del cálculo.



Errores en indicadores:

\- No invalidan datos de mercado.

\- Generan eventos de error y alertas.



---



\### 4.8 Consumo por Casos de Uso



Los datos procesados alimentan:



\- Visualización en dashboard.

\- Optimización de portafolios.

\- Generación de recomendaciones mediante IA.



Los consumidores \*\*no acceden a proveedores externos\*\*, solo a datos persistidos y validados.



---



\## 5. Manejo de Errores y Fallos



El pipeline asume fallos como normales.



Estrategias:

\- Fallos por activo no bloquean el pipeline completo.

\- Retries controlados ante errores transitorios.

\- Circuit breakers para proveedores externos.

\- Registro exhaustivo de errores.



---



\## 6. Observabilidad y Auditoría



Cada etapa registra:



\- Timestamp de inicio y fin.

\- Resultado (éxito / fallo).

\- Detalles del proveedor.

\- Métricas de volumen y latencia.



Esto permite:

\- Trazabilidad completa del dato.

\- Diagnóstico de problemas.

\- Evaluación de calidad histórica.



---



\## 7. Alternativas Consideradas



\### 7.1 Ingesta Manual mediante Archivos



Rechazada por:

\- Riesgo de errores humanos.

\- Falta de escalabilidad.

\- Inadecuada para producción.



---



\### 7.2 Procesamiento en Tiempo Real Estricto



Rechazado para el MVP por:

\- Complejidad excesiva.

\- Coste operativo alto.

\- Bajo valor académico adicional.



---



\## 8. Riesgos y Mitigaciones



| Riesgo | Impacto | Mitigación |

|------|--------|------------|

| Caída de proveedor externo | Medio | Retries, múltiples fuentes. |

| Datos inconsistentes | Alto | Validaciones estrictas. |

| Gaps prolongados | Medio | Alertas y flags. |

| Crecimiento de datos | Medio | Retención y particionado. |



---



\## 9. Consideraciones Finales



\- El pipeline es determinístico y auditable.

\- Ningún dato entra al sistema sin validación.

\- Los datos son tratados como activos críticos.

\- Este documento es vinculante para la implementación.



---



