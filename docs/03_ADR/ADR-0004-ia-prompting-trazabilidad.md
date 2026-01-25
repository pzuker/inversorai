\# ADR-0004 — Inteligencia Artificial, Prompting, Trazabilidad y Guardrails



\*\*Estado:\*\* Aprobado  

\*\*Fecha:\*\* 2025-01-24  

\*\*Decisores:\*\* Equipo InversorAI  

\*\*Contexto:\*\* Trabajo Final de Máster – Desarrollo de Sistemas con IA  



---



\## 1. Contexto



El sistema \*\*InversorAI\*\* utiliza modelos de lenguaje (LLMs) para generar recomendaciones de inversión explicables, basadas en indicadores técnicos y contexto reciente del mercado.



El uso de IA en este dominio introduce riesgos específicos:



\- Resultados no determinísticos.

\- Riesgo de alucinaciones.

\- Falta de explicabilidad si no se controla el input y el output.

\- Riesgos legales y reputacionales.

\- Dificultad para reproducir decisiones pasadas.



Dado que el sistema es monetizable, orientado a usuarios finales y evaluado académicamente, el uso de IA debe tratarse como un \*\*componente de ingeniería controlado\*\*, no como una caja negra.



---



\## 2. Objetivos de Diseño



El subsistema de IA debe cumplir los siguientes objetivos:



\- Generar recomendaciones consistentes y justificables.

\- Garantizar trazabilidad completa de cada decisión.

\- Permitir reproducibilidad parcial de resultados.

\- Prevenir outputs inválidos o peligrosos.

\- Separar claramente la lógica de negocio del uso de IA.

\- Alinear el diseño con principios de Responsible AI.



---



\## 3. Decisión



Se adopta un enfoque de \*\*IA controlada por contrato\*\*, basado en:



\- Prompts explícitos y versionados.

\- Inputs estructurados y determinísticos.

\- Outputs estrictamente validados.

\- Auditoría persistente de todo el ciclo de decisión.



La IA \*\*no toma decisiones autónomas\*\* ni ejecuta acciones reales: únicamente genera \*\*recomendaciones de inversión\*\*.



---



\## 4. Arquitectura del Subsistema de IA



\### 4.1 Posición Arquitectónica



La IA se encapsula en un caso de uso específico dentro de la capa de aplicación:



\*\*GenerateInvestmentRecommendationUseCase\*\*



El dominio no conoce modelos, prompts ni proveedores de IA; solo consume resultados normalizados.



---



\### 4.2 Puerto de Aplicación de IA



Se define un puerto explícito denominado:



\*\*LLMRecommendationPort\*\*



Responsabilidades:



\- Enviar inputs estructurados al modelo.

\- Gestionar prompts y versiones.

\- Devolver resultados normalizados o errores controlados.



El sistema no depende de un proveedor concreto de IA.



---



\## 5. Estrategia de Prompting



\### 5.1 Principios



Los prompts deben:



\- Ser claros y no ambiguos.

\- Tener instrucciones explícitas.

\- Limitar el contexto al dominio financiero.

\- Imponer formato estructurado de salida.



No se permite prompting dinámico sin control.



---



\### 5.2 Versionado de Prompts



Cada prompt:



\- Tiene un identificador único (`prompt\_version`).

\- Se versiona en el repositorio.

\- Es inmutable una vez usado en producción.

\- Se referencia explícitamente en cada recomendación.



Esto permite auditoría, comparación y rollback controlado.



---



\## 6. Inputs al Modelo



\### 6.1 Naturaleza de los Inputs



Los inputs enviados al modelo deben ser:



\- Determinísticos.

\- Estructurados.

\- Serializados de forma estable.



Incluyen como mínimo:



\- Identificador del activo.

\- Tipo de mercado (STOCK, CRYPTO, FX).

\- Indicadores técnicos relevantes.

\- Variaciones recientes de precio.

\- Horizonte temporal de análisis.



---



\### 6.2 Hash del Input



Antes de invocar el modelo:



\- Se calcula un hash criptográfico del snapshot completo.

\- El hash se persiste junto a la recomendación.



Esto permite verificación de integridad y reproducibilidad parcial.



---



\## 7. Outputs del Modelo



\### 7.1 Formato Esperado



El modelo debe responder en un formato estructurado que incluya:



\- Acción recomendada: BUY | HOLD | SELL

\- Nivel de confianza (0 a 1)

\- Justificación concisa

\- Factores principales considerados



No se acepta texto libre sin estructura.



---



\### 7.2 Validación y Normalización



Antes de persistir un resultado:



\- Se valida contra un esquema estricto.

\- Se rechazan outputs incompletos o inválidos.

\- Se normaliza a un modelo interno del dominio.



Outputs inválidos generan eventos de error auditables.



---



\## 8. Trazabilidad y Auditoría



Por cada recomendación generada se persiste:



\- model\_name

\- model\_version

\- prompt\_version

\- input\_snapshot\_hash

\- input completo serializado

\- output crudo del modelo

\- output normalizado

\- timestamp

\- usuario solicitante (si aplica)



Estos datos son inmutables.



---



\## 9. Guardrails y Seguridad



\### 9.1 Guardrails Técnicos



\- Validación estricta de output.

\- Límites de tokens y tiempo.

\- Timeouts y retries controlados.

\- Circuit breaker ante fallos repetidos.



---



\### 9.2 Guardrails de Dominio



La IA no puede:



\- Ejecutar operaciones reales.

\- Modificar datos del sistema.

\- Acceder a secretos.

\- Generar instrucciones fuera del dominio financiero.



---



\### 9.3 Mitigación de Alucinaciones



\- Inputs cerrados y estructurados.

\- Prompts restrictivos.

\- Validación de consistencia entre datos e interpretación.

\- Rechazo explícito de respuestas especulativas.



---



\## 10. Consideraciones Éticas y Legales



\- Las recomendaciones se presentan como análisis asistido.

\- No constituyen asesoramiento financiero vinculante.

\- Se incluyen disclaimers visibles al usuario.

\- Se habilita revisión humana.

\- Se explicita la naturaleza probabilística de la IA.



---



\## 11. Alternativas Consideradas



\### 11.1 IA No Controlada



Rechazada por falta de trazabilidad, alto riesgo legal y ausencia de reproducibilidad.



\### 11.2 Modelos Propios Entrenados



Rechazados para el MVP por complejidad, coste y escasa justificación académica.



---



\## 12. Consecuencias



\### Positivas



\- IA defendible y responsable.

\- Alta trazabilidad.

\- Control explícito del riesgo.



\### Negativas



\- Mayor complejidad de implementación.

\- Coste adicional de almacenamiento y cómputo.



---



\## 13. Estado y Seguimiento



\- Este ADR queda aprobado y cerrado.

\- Cambios en prompts, modelos o guardrails requieren nuevos ADRs.

\- El contenido es vinculante para la implementación del MVP.



---



