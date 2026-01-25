\# 05 — Eventos y Procesamiento Asíncrono



\*\*Proyecto:\*\* InversorAI  

\*\*Fecha:\*\* 2025-01-24  

\*\*Contexto:\*\* Trabajo Final de Máster – Desarrollo de Sistemas con IA  



---



\## 1. Propósito del Documento



Este documento describe:



\- La estrategia de \*\*eventos y asincronía\*\* del sistema InversorAI.

\- Los tipos de eventos manejados.

\- El uso de colas, workers y jobs programados.

\- Los mecanismos de retry, idempotencia y tolerancia a fallos.



El objetivo es demostrar una comprensión sólida de:

\- sistemas distribuidos,

\- procesamiento asíncrono,

\- y diseño resiliente.



Este documento no contiene código ni configuración de infraestructura concreta.



---



\## 2. Motivación para la Asincronía



El sistema InversorAI realiza operaciones que:



\- Son costosas en tiempo (ingesta, cálculos, IA).

\- Dependen de servicios externos.

\- No deben bloquear solicitudes de usuario.

\- Deben ser resilientes ante fallos parciales.



Por estas razones, se adopta un modelo \*\*event-driven y asíncrono\*\* para tareas no interactivas.



---



\## 3. Principios de Diseño



La estrategia de asincronía se rige por los siguientes principios:



\- Separación entre flujos interactivos y batch.

\- Procesamiento desacoplado mediante eventos.

\- Idempotencia explícita.

\- Retries controlados, nunca infinitos.

\- Fallos visibles y auditables.

\- Simplicidad sobre complejidad innecesaria.



---



\## 4. Tipos de Eventos del Sistema



\### 4.1 Eventos de Dominio



Representan hechos relevantes ocurridos en el sistema.



Ejemplos:

\- MarketDataIngested

\- IndicatorsComputed

\- RecommendationGenerated

\- PortfolioOptimized



Características:

\- Inmutables.

\- Emitidos después de completar un caso de uso.

\- No contienen lógica, solo datos.



---



\### 4.2 Eventos Técnicos



Relacionados con la operación del sistema.



Ejemplos:

\- JobFailed

\- RetryExhausted

\- ExternalServiceTimeout

\- RateLimitExceeded



Se utilizan para:

\- observabilidad,

\- alertas,

\- auditoría técnica.



---



\## 5. Jobs y Procesos Asíncronos



\### 5.1 Scheduler



Un scheduler es responsable de disparar procesos periódicos.



Responsabilidades:

\- Iniciar ingesta de datos según calendario del mercado.

\- Evitar ejecuciones duplicadas.

\- Respetar ventanas temporales configuradas.



El scheduler \*\*no ejecuta lógica de negocio\*\*, solo dispara jobs.



---



\### 5.2 Workers



Los workers procesan jobs de forma asíncrona.



Responsabilidades:

\- Ejecutar casos de uso largos.

\- Manejar retries y backoff.

\- Reportar éxito o fallo.



Tipos de workers:

\- Ingesta de mercado.

\- Cálculo de indicadores.

\- Generación de recomendaciones IA.



---



\## 6. Estrategia de Idempotencia



Dado que un job puede ejecutarse más de una vez, el sistema debe garantizar idempotencia.



Estrategias aplicadas:

\- Claves idempotentes por combinación (asset\_id, timestamp, resolución).

\- Verificación previa a persistencia.

\- Operaciones de escritura seguras ante duplicados.



La idempotencia es \*\*responsabilidad del caso de uso\*\*, no del worker.



---



\## 7. Retries y Backoff



\### 7.1 Política de Retries



\- Retries solo ante errores transitorios.

\- Número máximo de intentos configurable.

\- Backoff exponencial con jitter.



Errores no reintentables:

\- Datos inválidos.

\- Violaciones de contrato.

\- Errores de autorización.



---



\### 7.2 Exhaustión de Retries



Cuando un job agota sus retries:



\- Se marca como fallido.

\- Se emite un evento técnico.

\- Se registra auditoría.

\- No se reintenta automáticamente.



---



\## 8. Manejo de Fallos Parciales



El sistema asume que los fallos ocurren.



Estrategias:

\- Circuit breakers para servicios externos.

\- Timeouts explícitos.

\- Degradación controlada.

\- Continuación parcial cuando sea posible.



Un fallo en un activo \*\*no bloquea\*\* el procesamiento de otros.



---



\## 9. Consistencia y Orden



\- No se garantiza orden global de eventos.

\- Se garantiza consistencia por activo.

\- Los eventos se procesan al menos una vez.

\- Los casos de uso deben ser tolerantes a reejecución.



---



\## 10. Auditoría y Observabilidad



Cada job y evento relevante debe registrar:



\- Identificador del job.

\- Tipo de evento.

\- Timestamp.

\- Resultado (éxito / fallo).

\- Detalles del error si aplica.



Esto permite:

\- trazabilidad completa,

\- debugging,

\- análisis post-mortem.



---



\## 11. Alternativas Consideradas



\### 11.1 Procesamiento Sincrónico



Rechazado por:

\- bloquear al usuario,

\- mala escalabilidad,

\- mala experiencia de usuario.



---



\### 11.2 Orquestadores Complejos (ej. Airflow)



Rechazados para el MVP por:

\- sobrecarga operativa,

\- complejidad injustificada,

\- escaso valor académico adicional.



---



\## 12. Consecuencias



\### Positivas



\- Sistema resiliente y escalable.

\- Mejor experiencia de usuario.

\- Aislamiento de fallos.



\### Negativas



\- Mayor complejidad conceptual.

\- Necesidad de observabilidad adecuada.



---



\## 13. Consideraciones Finales



\- La asincronía es un pilar del sistema.

\- Los eventos representan hechos, no comandos.

\- El diseño prioriza claridad y resiliencia.

\- Este documento es vinculante para la implementación.



---



