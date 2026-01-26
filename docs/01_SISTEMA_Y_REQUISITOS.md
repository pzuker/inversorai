# 01 — Sistema y Requisitos

**Proyecto:** InversorAI  
**Versión:** 1.1  
**Fecha:** 2025-01-24  

---

## 1. Objetivo del Sistema

**InversorAI** es una plataforma fullstack de análisis de mercados financieros basada en inteligencia artificial, orientada a la **toma de decisiones de inversión informadas, explicables, auditables y defendibles**, para los siguientes tipos de activos:

- **Acciones (STOCK)**
- **Criptomonedas (CRYPTO)**
- **Divisas (FX)**

El sistema permite:

- Ingestar **datos de mercado reales** desde Internet (Yahoo Finance) bajo demanda (ejecución controlada por ADMIN).
- Persistir datos e indicadores en una base de datos (Supabase/PostgreSQL) para lecturas repetibles.
- Calcular indicadores técnicos y métricas cuantitativas verificables.
- Ejecutar análisis de tendencia sobre series temporales.
- Generar **insights y recomendaciones de inversión** mediante IA, con output estructurado y explicable.
- Exponer resultados en una **interfaz web profesional** y una **API segura**.


---

## 2. Actores del Sistema

| Actor | Descripción |
|------|-------------|
| **USER** | Usuario autenticado que accede a análisis, indicadores, insights y recomendaciones basadas en datos reales. |
| **ADMIN** | Administrador con control global del sistema: gestión de usuarios, roles, activos, configuración del sistema, auditoría y seguridad. |
| **SISTEMA (Pipeline)** | Orquestación de casos de uso: ingesta → indicadores → tendencias → IA → persistencia. En el MVP se ejecuta bajo demanda (ADMIN). |
| **Identity Provider (IdP)** | Proveedor externo compatible con OIDC/OAuth2 responsable de la autenticación de usuarios. |

> Nota: el sistema **no implementa autenticación local** en el MVP. Toda identidad se delega al Identity Provider externo.

---

## 3. Alcance del MVP

### 3.1 Incluido en el MVP

- Ingesta automática de datos de mercado para activos STOCK, CRYPTO y FX.
- Persistencia de datos en base de datos optimizada para series temporales.
- Cálculo de indicadores técnicos:
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - Retornos simples y logarítmicos
  - Volatilidad
  - Sharpe Ratio
- Motor de recomendaciones de inversión mediante IA **auditables y reproducibles**.
- Dashboard web responsive (desktop y tablet).
- API REST autenticada y versionada.
- API REST autenticada y versionada.
- Sistema de identidad y acceso (IAM) basado en Supabase Auth:
  - JWT `Authorization: Bearer <token>` verificado en backend mediante JWKS (ES256).
  - Roles **ADMIN/USER** almacenados en `app_metadata.inversorai_role` (default: USER).
  - Endpoints ADMIN protegidos por `requireAdmin`.
  - Step-up auth para cambios de rol (token reciente, basado en `iat`).
- Administración (MVP, vía API):
  - Listado de usuarios.
  - Asignación de rol ADMIN/USER (con step-up auth y protección del “último admin”).
  - Envío de email de reset de contraseña usando Supabase.

- Auditoría de decisiones de IA y trazabilidad de pipeline.


### 3.2 Fuera de Alcance (No-MVP)

- Ejecución automática de órdenes de trading real.
- Integración directa con brokers o exchanges.
- Backtesting avanzado con slippage y costos transaccionales.
- Machine Learning predictivo entrenado en tiempo real.
- Soporte multi-idioma.
- Aplicaciones móviles nativas.
- Notificaciones push o por correo electrónico (más allá del reset de contraseña).
- Monetización/suscripciones (fuera del alcance del MVP).
- Optimización de portafolios (work-in-progress / línea futura).
- Ejecución programada del pipeline por scheduler/colas (línea futura; el MVP es on-demand).

---

## 4. Tipos de Activos y Consideraciones de Mercado

| Tipo | Horario de Operación | Calendario | Tratamiento de Gaps |
|-----|---------------------|------------|---------------------|
| **STOCK** | Lunes a viernes (horario bursátil) | Días hábiles + feriados bursátiles | Forward-fill hasta 5 días con flag |
| **CRYPTO** | 24/7 | Continuo | Gap > 1h genera alerta |
| **FX** | 24/5 | Excluye sábados | Forward-fill hasta 4h |

### Implicaciones Técnicas

- Los cálculos deben realizarse sobre **días efectivos de trading**, no calendario civil.
- Todos los timestamps se almacenan en **UTC**.
- La visualización puede convertir a timezone del mercado.
- Se deben generar alertas ante anomalías de calidad de datos.

---

## 5. Requisitos Funcionales (RF)

### RF-01: Ingesta Automática de Datos de Mercado

**Descripción**  
El sistema debe obtener automáticamente datos OHLCV (Open, High, Low, Close, Volume) desde fuentes externas para los activos configurados.

**Criterios de Aceptación**:
- [ ] Soporta al menos una fuente de datos por tipo de mercado (STOCK, CRYPTO, FX).
- [ ] La ingesta respeta el calendario específico de cada mercado.
- [ ] Los datos se persisten en formato time-series con timestamp en UTC.
- [ ] Errores de ingesta generan reintentos con backoff exponencial.
- [ ] El sistema registra métricas de ingesta (latencia, volumen, errores).

---

### RF-02: Persistencia de Series Temporales

**Descripción**  
Los datos de mercado deben almacenarse en una base de datos optimizada para series temporales.

**Criterios de Aceptación**:
- [ ] Queries por rango de fechas con latencia < 100 ms para 1 año de datos.
- [ ] Compresión de históricos mayores a 1 año sin pérdida de precisión.
- [ ] Particionamiento por símbolo y período temporal.
- [ ] Soporte para múltiples resoluciones (1m, 5m, 1h, 1d).
- [ ] Integridad referencial con el catálogo de activos.

---

### RF-03: Cálculo de Indicadores Técnicos

**Descripción**  
El sistema debe calcular y persistir indicadores técnicos para cada activo.

**Indicadores**:
- RSI (período configurable, default 14).
- MACD (12, 26, 9).
- Sharpe Ratio.
- Volatilidad.
- Retornos simples y logarítmicos.

**Criterios de Aceptación**:
- [ ] Indicadores calculados dentro de los 5 minutos posteriores a nueva ingesta.
- [ ] Fórmulas documentadas y verificables.
- [ ] Precisión mínima de 8 decimales.
- [ ] API expone indicadores con filtros por fecha y resolución.
- [ ] Re-cálculo bajo demanda permitido para ADMIN.

---

### RF-04: Recomendaciones de Inversión mediante IA (Auditables)

**Descripción**  
El sistema genera recomendaciones de inversión basadas en indicadores técnicos y contexto reciente de mercado.

**Acciones posibles**:
- **BUY**: entrada o refuerzo de posición bullish.
- **SELL**: entrada o refuerzo de posición bearish (conceptual; sin ejecución real en MVP).
- **HOLD**: mantener exposición actual.

**Criterios de Aceptación**:
- [ ] Cada recomendación incluye `recommendation_id`, `asset_id`, `action`, `confidence_score`, `model_name`, `model_version`, `timestamp`.
- [ ] Se persiste snapshot completo de inputs (precios e indicadores).
- [ ] Se almacena prompt versionado y output crudo del modelo.
- [ ] El output es normalizado y validado.
- [ ] El historial es consultable por usuario.
- [ ] El evento queda registrado en el audit log.

---

### RF-05: Optimización de Portafolio (Max Sharpe)

**Descripción**  
El sistema calcula la asignación óptima de pesos maximizando el Sharpe Ratio.

**Criterios de Aceptación**:
- [ ] Selección de entre 2 y 20 activos.
- [ ] Cálculo de retornos esperados y matriz de covarianza.
- [ ] Output: pesos, Sharpe, retorno y volatilidad esperados.
- [ ] Restricción: pesos entre 0% y 100%.
- [ ] Tiempo de cálculo < 10 segundos para N = 20.

---

### RF-06: Dashboard Web

**Descripción**  
Interfaz web para visualización de datos, indicadores y recomendaciones.

**Criterios de Aceptación**:
- [ ] Autenticación obligatoria.
- [ ] Lista de activos con precios e indicadores clave.
- [ ] Gráficos interactivos con overlays.
- [ ] Panel de recomendaciones IA.
- [ ] Herramienta de optimización de portafolio.
- [ ] Responsive (desktop y tablet).
- [ ] Carga inicial < 3 segundos en conexión 4G.

---

### RF-07: API REST Autenticada

**Descripción**  
API REST para acceso programático a datos del sistema.

**Criterios de Aceptación**:
- [ ] Autenticación mediante JWT Bearer.
- [ ] Rate limiting por usuario/plan.
- [ ] Documentación OpenAPI 3.0.
- [ ] Versionado `/api/v1`.
- [ ] Respuestas JSON consistentes.
- [ ] Uso correcto de códigos HTTP.

---

### RF-08: Autenticación OIDC / OAuth2

**Descripción**  
La autenticación se delega completamente a un Identity Provider externo.

**Criterios de Aceptación**:
- [ ] Authorization Code + PKCE para web.
- [ ] JWT con claims estándar.
- [ ] Refresh tokens con rotación.
- [ ] MFA obligatorio para ADMIN.
- [ ] No se gestionan contraseñas locales en el MVP.

---

### RF-09: Autorización y Aislamiento de Datos

**Descripción**  
Control de acceso basado en roles y aislamiento lógico de datos.

**Criterios de Aceptación**:
- [ ] RBAC en endpoints y casos de uso.
- [ ] Aislamiento de datos por `user_id`.
- [ ] ADMIN puede impersonar USER con auditoría.
- [ ] Accesos denegados retornan HTTP 403.

---

### RF-10: Auditoría de Eventos de Seguridad

**Descripción**  
Registro de eventos de seguridad y decisiones críticas.

**Eventos auditados**:
- Login y logout.
- Cambios de rol.
- Cambios de configuración.
- Generación de recomendaciones IA.
- Accesos denegados.

**Criterios de Aceptación**:
- [ ] Logs inmutables (append-only).
- [ ] Retención mínima de 1 año.
- [ ] Consultables por ADMIN.
- [ ] Exportables en formatos estándar.

---

## 6. Requisitos No Funcionales (RNF)

### RNF-01: Disponibilidad
- Uptime objetivo: 99.5% mensual.

### RNF-02: Rendimiento
- API p95 < 200 ms.
- Dashboard TTI < 3 segundos.

### RNF-03: Escalabilidad
- 1.000 usuarios concurrentes.
- 5.000 activos con 5 años de histórico.

### RNF-04: Seguridad (OWASP Top 10)

El sistema se alinea explícitamente con OWASP Top 10 mediante controles técnicos:

- A01: RBAC y aislamiento de datos.
- A02: TLS 1.3 y gestión segura de secretos.
- A03: Validación estricta de inputs.
- A04: Diseño seguro documentado.
- A05: Configuración segura.
- A06: Gestión activa de dependencias.
- A07: MFA, rate limiting y bloqueo por intentos.
- A08: Integridad de software mediante CI/CD.
- A09: Logging y auditoría completos.
- A10: Protección SSRF mediante allowlists.

### RNF-05: Mantenibilidad
- Cobertura mínima de tests: 70%.
- TypeScript strict.
- Linting y formatting en CI.

### RNF-06: Observabilidad
- Logs estructurados con correlation IDs.
- Métricas y health checks.
- Alertas ante errores críticos.

---

## 7. Riesgos y Mitigaciones

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|----|--------|--------------|---------|------------|
| R01 | Cambios en APIs de proveedores de datos | Media | Alto | Abstracción de proveedores y soporte multi-fuente. |
| R02 | Recomendaciones IA incorrectas | Media | Alto | Auditoría completa, confidence thresholds y disclaimers. |
| R03 | Brecha de seguridad | Baja | Crítico | Controles OWASP, hardening y revisión previa a producción. |
| R04 | Costos elevados de infraestructura | Media | Medio | Monitoreo de costos y límites de escalado. |
| R05 | Latencia de proveedores externos | Media | Medio | Timeouts, circuit breakers y caching. |
| R06 | Cambios regulatorios | Media | Alto | Disclaimers legales y separación entre análisis y ejecución. |
| R07 | Vendor lock-in del IdP | Baja | Medio | Uso de estándares OIDC/OAuth2 y abstracción del proveedor. |

---

## 8. Glosario

| Término | Definición |
|--------|-----------|
| OHLCV | Open, High, Low, Close, Volume. |
| RSI | Relative Strength Index. |
| MACD | Moving Average Convergence Divergence. |
| Sharpe Ratio | Retorno ajustado por riesgo. |
| OIDC | OpenID Connect. |
| OAuth2 | Framework de autorización estándar. |
| RBAC | Role-Based Access Control. |
| JWT | JSON Web Token. |
| MFA | Multi-Factor Authentication. |
| Time-Series DB | Base de datos optimizada para series temporales. |

---

## 9. Control de Documento

| Versión | Fecha | Cambios |
|--------|------|---------|
| 1.0 | 2025-01-24 | Versión inicial |
| 1.1 | 2025-01-24 | Clarificaciones IAM, SELL/BUY y consistencia técnica |
