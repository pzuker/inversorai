\# 07 — Testing y Calidad del Software



\*\*Proyecto:\*\* InversorAI  

\*\*Fecha:\*\* 2025-01-24  

\*\*Contexto:\*\* Trabajo Final de Máster – Desarrollo de Sistemas con IA  



---



\## 1. Propósito del Documento



Este documento define la \*\*estrategia de testing y aseguramiento de calidad\*\* del sistema InversorAI.



El objetivo es demostrar:



\- comprensión de testing en sistemas complejos,

\- validación de reglas de negocio,

\- control de calidad en pipelines de datos,

\- verificación responsable de sistemas que utilizan IA.



Este documento \*\*no contiene código de tests\*\*, sino la \*\*estrategia y criterios\*\* que gobiernan su diseño.



---



\## 2. Objetivos de Calidad



La estrategia de testing del sistema persigue los siguientes objetivos:



\- Detectar errores lo antes posible.

\- Garantizar la corrección de reglas de negocio.

\- Evitar regresiones funcionales.

\- Validar contratos entre componentes.

\- Asegurar trazabilidad y auditabilidad.

\- Reducir el riesgo operativo en producción.



La calidad se considera un \*\*atributo transversal\*\*, no una fase final.



---



\## 3. Principios de Testing Aplicados



La estrategia se rige por los siguientes principios:



\- \*\*Testing piramidal\*\*: más tests unitarios que integraciones.

\- \*\*Tests determinísticos\*\*: sin dependencia de servicios externos reales.

\- \*\*Tests aislados del framework\*\*: foco en dominio y casos de uso.

\- \*\*Contratos explícitos\*\* entre componentes.

\- \*\*Fallos reproducibles\*\*, no intermitentes.

\- \*\*Cobertura significativa\*\*, no inflada artificialmente.



---



\## 4. Niveles de Testing



\### 4.1 Tests Unitarios de Dominio



\*\*Alcance\*\*:

\- Entidades de dominio.

\- Reglas de negocio.

\- Validaciones y cálculos.



\*\*Características\*\*:

\- Sin acceso a base de datos.

\- Sin acceso a red.

\- Sin mocks complejos.

\- Ejecución rápida.



\*\*Ejemplos de validación\*\*:

\- Cálculo correcto de indicadores.

\- Validación de coherencia OHLC.

\- Reglas de portafolio.



---



\### 4.2 Tests de Casos de Uso (Application Layer)



\*\*Alcance\*\*:

\- Casos de uso completos.

\- Orquestación de lógica.

\- Flujos principales y alternativos.



\*\*Características\*\*:

\- Uso de puertos mockeados o fake.

\- Validación de precondiciones y postcondiciones.

\- Verificación de efectos observables.



\*\*Ejemplos\*\*:

\- IngestMarketData con proveedor simulado.

\- GenerateInvestmentRecommendation con IA stub.



---



\### 4.3 Tests de Integración



\*\*Alcance\*\*:

\- Integración con base de datos.

\- Integración con colas.

\- Serialización y persistencia.



\*\*Características\*\*:

\- Uso de infraestructura real o emulada.

\- Datos controlados.

\- Ejecución menos frecuente que unitarios.



---



\### 4.4 Tests de Contrato



\*\*Alcance\*\*:

\- Contratos entre:

&nbsp; - casos de uso y proveedores externos,

&nbsp; - API y clientes,

&nbsp; - sistema y modelos de IA.



\*\*Objetivo\*\*:

\- Detectar cambios incompatibles.

\- Garantizar estabilidad de interfaces.



---



\### 4.5 Tests End-to-End (E2E)



\*\*Alcance\*\*:

\- Flujos críticos completos desde UI o API.



\*\*Características\*\*:

\- Cantidad limitada.

\- Ejecución en pipelines de CI.

\- No cubren todos los casos.



\*\*Ejemplos\*\*:

\- Login + acceso a dashboard.

\- Solicitud de recomendación IA.



---



\## 5. Testing del Pipeline de Datos



Dado el carácter crítico de los datos financieros, el pipeline requiere testing específico.



\### 5.1 Validación de Datos



\- Validación estructural de inputs.

\- Validación de rangos numéricos.

\- Validación de orden temporal.



---



\### 5.2 Testing de Gaps e Interpolación



\- Simulación de gaps por tipo de mercado.

\- Verificación de reglas de forward-fill.

\- Confirmación de flags de interpolación.



---



\### 5.3 Idempotencia



\- Reejecución de ingestas duplicadas.

\- Verificación de no-duplicación de datos.

\- Consistencia tras retries.



---



\## 6. Testing de Sistemas con IA



El uso de IA requiere una estrategia de testing específica.



\### 6.1 Qué se Testea



\- Construcción correcta del input.

\- Validación del output contra esquema.

\- Manejo de errores del modelo.

\- Persistencia correcta de auditoría.



---



\### 6.2 Qué NO se Testea



\- “Calidad” subjetiva del razonamiento del modelo.

\- Predicciones de mercado.

\- Exactitud financiera futura.



El sistema testea \*\*el uso de la IA\*\*, no la IA en sí.



---



\### 6.3 Testing Determinístico



\- Uso de stubs o respuestas fijas del modelo.

\- No dependencia de APIs reales en CI.

\- Reproducibilidad de resultados.



---



\## 7. Cobertura y Métricas



\### 7.1 Cobertura



\- Cobertura mínima objetivo: 70%.

\- Prioridad en dominio y casos de uso.

\- No se persigue cobertura del 100%.



---



\### 7.2 Métricas de Calidad



\- Número de tests por capa.

\- Tiempo de ejecución de la suite.

\- Número de fallos en CI.

\- Defectos detectados en producción.



---



\## 8. Integración Continua (CI)



La estrategia de testing se integra en el pipeline de CI:



\- Ejecución automática de tests unitarios y de casos de uso.

\- Ejecución de tests de integración en branches principales.

\- Bloqueo de merge ante fallos.

\- Reporte automático de resultados.



---



\## 9. Alternativas Consideradas



\### 9.1 Solo Tests Manuales



Rechazados por:

\- baja reproducibilidad,

\- alto costo,

\- riesgo elevado.



---



\### 9.2 Solo Tests End-to-End



Rechazados por:

\- fragilidad,

\- lentitud,

\- bajo poder diagnóstico.



---



\## 10. Consideraciones Finales



\- La calidad es parte del diseño.

\- Los tests documentan el comportamiento esperado.

\- Un sistema con IA exige mayor disciplina de testing.

\- Este documento es vinculante para la implementación.



---



