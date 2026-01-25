# 04 — Dominio y Arquitectura de Casos de Uso

**Proyecto:** InversorAI  
**Fecha:** 2025-01-24  
**Contexto:** Trabajo Final de Máster – Desarrollo de Sistemas con IA  

---

## 1. Propósito del Documento

Este documento define de manera explícita:

- El modelo de dominio del sistema InversorAI.
- Los casos de uso que gobiernan su comportamiento.
- Los flujos principales de ejecución del sistema.
- La separación de responsabilidades entre capas según Clean Architecture.

El objetivo es demostrar comprensión real de:
- diseño orientado a dominio,
- arquitectura basada en casos de uso,
- separación estricta de responsabilidades.

Este documento no contiene código ni configuración de infraestructura.

---

## 2. Principios de Diseño

El sistema se diseña siguiendo estos principios:

- El dominio es independiente de frameworks, bases de datos y APIs externas.
- Toda funcionalidad relevante se expresa como un caso de uso explícito.
- Las dependencias siempre apuntan hacia el dominio.
- No existen efectos colaterales implícitos.
- La IA se integra como servicio controlado, no como lógica central del dominio.

---

## 3. Modelo de Dominio

### 3.1 Asset

Representa un instrumento financiero.

Atributos conceptuales:
- id
- symbol
- type (STOCK | CRYPTO | FX)
- currency
- exchange
- is_active

---

### 3.2 MarketDataPoint

Representa un punto de datos de mercado.

Atributos conceptuales:
- asset_id
- timestamp (UTC)
- open
- high
- low
- close
- volume
- resolution
- is_interpolated
- source

---

### 3.3 IndicatorSet

Representa indicadores técnicos calculados.

Atributos conceptuales:
- asset_id
- timestamp
- resolution
- rsi
- macd
- macd_signal
- volatility
- sharpe_ratio
- calculation_version

---

### 3.4 Recommendation

Representa una recomendación generada por IA.

Atributos conceptuales:
- id
- asset_id
- action (BUY | HOLD | SELL)
- confidence_score
- model_name
- model_version
- prompt_version
- input_snapshot_hash
- created_at

---

### 3.5 Portfolio

Representa un portafolio de usuario.

Atributos conceptuales:
- id
- user_id
- assets
- weights
- expected_return
- expected_volatility
- expected_sharpe

---

### 3.6 AuditLog

Evento de auditoría del sistema.

Atributos conceptuales:
- id
- event_type
- actor_id
- timestamp
- details

---

## 4. Casos de Uso

### UC-01 IngestMarketData

Actor: Sistema  
Responsabilidad: obtener datos OHLCV desde proveedores externos y persistirlos.

Flujo:
1. Resolver proveedor según tipo de activo.
2. Obtener datos históricos por rango temporal.
3. Normalizar timestamps y formatos.
4. Persistir datos de mercado.
5. Registrar evento de auditoría.

---

### UC-02 ComputeIndicators

Actor: Sistema  
Responsabilidad: calcular indicadores técnicos a partir de datos de mercado.

Flujo:
1. Recuperar datos de mercado.
2. Calcular indicadores según fórmulas definidas.
3. Persistir resultados.
4. Registrar evento de auditoría.

---

### UC-03 GenerateInvestmentRecommendation

Actor: Sistema / Usuario  
Responsabilidad: generar recomendación de inversión mediante IA.

Flujo:
1. Construir snapshot determinístico de indicadores.
2. Calcular hash del input.
3. Invocar modelo IA vía puerto de aplicación.
4. Validar y normalizar output.
5. Persistir recomendación y auditoría.

---

### UC-04 AuthenticateUser

Actor: Usuario  
Responsabilidad: autenticarse mediante Identity Provider.

Resultado:
- Sesión válida emitida por el IdP.

---

### UC-05 ViewDashboard

Actor: Usuario  
Responsabilidad: visualizar datos de mercado, indicadores y recomendaciones permitidas.

Resultado:
- Información presentada según permisos del usuario.

---

### UC-06 OptimizePortfolio

Actor: Usuario  
Responsabilidad: optimizar un portafolio maximizando el Sharpe Ratio.

Flujo:
1. Obtener retornos históricos.
2. Calcular matriz de covarianza.
3. Ejecutar algoritmo de optimización.
4. Retornar resultados al usuario.

---

### UC-07 ManageAssets

Actor: ADMIN  
Responsabilidad: gestionar el catálogo de activos financieros.

Resultado:
- Activos actualizados.
- Auditoría registrada.

---

### UC-08 ViewAuditLogs

Actor: ADMIN  
Responsabilidad: consultar eventos de auditoría del sistema.

---

## 5. Flujos Principales del Sistema

### 5.1 Flujo Automático de Ingesta y Análisis

Este flujo equivale a un **diagrama de secuencia** y se describe textualmente para maximizar portabilidad del documento:

- Un scheduler dispara el caso de uso IngestMarketData.
- Un worker obtiene datos desde el proveedor externo.
- Los datos se persisten como MarketDataPoint.
- Se ejecuta el caso de uso ComputeIndicators.
- Los indicadores calculados se almacenan como IndicatorSet.

---

### 5.2 Flujo de Recomendación por Usuario

Flujo equivalente a un diagrama de secuencia usuario–sistema:

- El usuario solicita una recomendación.
- La API invoca GenerateInvestmentRecommendation.
- El caso de uso llama al modelo de IA mediante el puerto.
- El resultado se valida, normaliza y persiste.
- La recomendación se devuelve al usuario.

---

## 6. Separación de Capas

- Dominio: entidades y reglas de negocio.
- Aplicación: casos de uso.
- Infraestructura: base de datos, colas, proveedores externos.
- Interfaces: API y Web.

Las dependencias **nunca** apuntan hacia afuera.

---

## 7. Consideraciones Finales

- No existen endpoints sin un caso de uso asociado.
- La IA no rompe el dominio ni toma decisiones autónomas.
- El sistema es extensible sin reescribir el núcleo.
- Este documento es vinculante para la implementación del sistema.

---
