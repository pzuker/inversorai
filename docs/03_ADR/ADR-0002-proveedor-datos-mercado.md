# ADR-0002 — Proveedor de Datos de Mercado



**Estado:** Aprobado  

**Fecha:** 2026-01-25  

**Decisores:** Equipo InversorAI  

**Contexto:** Trabajo Final de Máster – Desarrollo de Sistemas con IA  



---



## 1. Contexto



El sistema **InversorAI** requiere acceso continuo y automatizado a datos de mercado financieros para soportar:



- Ingesta histórica y periódica de precios (OHLCV).

- Cálculo de indicadores técnicos.

- Generación de recomendaciones de inversión mediante IA.

- Optimización de portafolios.



Los tipos de activos soportados en el MVP son:



- **Acciones (STOCK)**

- **Criptomonedas (CRYPTO)**

- **Divisas (FX)**



Los datos de mercado constituyen un **input crítico** del sistema. Errores, inconsistencias o interrupciones impactan directamente en:



- La calidad de los indicadores.

- La confiabilidad de las recomendaciones de IA.

- La credibilidad del producto frente a usuarios y evaluadores académicos.



El proyecto debe equilibrar:



- Viabilidad académica y técnica.

- Coste operativo reducido.

- Facilidad de despliegue en producción.

- Capacidad de evolución futura hacia proveedores más robustos.



---



## 2. Requisitos del Proveedor de Datos



El proveedor (o conjunto de proveedores) de datos de mercado debe cumplir con los siguientes requisitos funcionales y no funcionales.



### 2.1 Requisitos Funcionales



- Proveer datos **OHLCV** históricos por activo.

- Permitir consultas por rango de fechas.

- Soportar resolución diaria como mínimo (1d).

- Cubrir activos STOCK, CRYPTO y FX.

- Permitir identificación consistente de símbolos (tickers, pares).



### 2.2 Requisitos No Funcionales



- Disponibilidad razonable (> 99% no garantizado en MVP).

- Latencia aceptable para procesamiento batch.

- Límites de rate compatibles con ingesta programada.

- Licencia compatible con uso académico y prototipo productivo.

- Acceso mediante APIs HTTP estándar.



---



## 3. Decisión



Se adopta una **estrategia híbrida y desacoplada**, basada en abstracción por puertos, con el siguiente enfoque:



### 3.1 MVP: Proveedores “Best-Effort” Gratuitos



Para el MVP se utilizarán proveedores de datos gratuitos o de bajo coste, con las siguientes características:



- **STOCK y FX**:

&nbsp; - Proveedores basados en datos públicos agregados (ej. Yahoo Finance u equivalentes).

- **CRYPTO**:

&nbsp; - APIs públicas de exchanges o agregadores (ej. Binance, Coinbase, CoinGecko).



**Características del enfoque MVP**:

- Sin garantías contractuales de SLA.

- Posibles límites de rate.

- Calidad suficiente para análisis académico y demostración funcional.

- Coste operativo cercano a cero.



### 3.2 Arquitectura de Abstracción



Independientemente del proveedor concreto de datos de mercado, el sistema define un **puerto de dominio explícito** denominado:



**MarketDataProviderPort**



Este puerto representa el **contrato abstracto** mediante el cual el sistema obtiene datos de mercado, y actúa como límite arquitectónico entre:



- El **dominio y los casos de uso** (núcleo del sistema)

- Las **implementaciones concretas** de proveedores externos (infraestructura)



#### Responsabilidades del MarketDataProviderPort



El puerto debe ser responsable de:



- Obtener datos históricos OHLCV para un activo financiero.

- Permitir consultas por rango temporal.

- Normalizar los datos obtenidos:

&nbsp; - timestamps en UTC

&nbsp; - formatos numéricos homogéneos

&nbsp; - estructuras consistentes independientemente del proveedor

- Encapsular particularidades del proveedor:

&nbsp; - símbolos específicos

&nbsp; - límites de rate

&nbsp; - formatos propietarios

- Reportar errores de forma controlada y predecible.



#### Operaciones esperadas del puerto (conceptuales)



El contrato del puerto debe soportar, como mínimo, las siguientes operaciones lógicas:



- Obtener histórico OHLCV de un activo dado un rango de fechas.

- Indicar la resolución temporal soportada (ej. diaria).

- Informar errores de disponibilidad, rate limiting o datos incompletos.



> Nota: este ADR **no define la firma técnica ni el lenguaje del puerto**.  

> La definición concreta de interfaces pertenece a la documentación de diseño y al código, no al ADR.



#### Consecuencias Arquitectónicas



- El dominio **no depende** de ningún proveedor concreto (Yahoo, exchange, API comercial).

- Es posible implementar múltiples adaptadores:

&nbsp; - `YahooMarketDataProvider`

&nbsp; - `CryptoExchangeMarketDataProvider`

&nbsp; - `FxMarketDataProvider`

- El reemplazo de un proveedor **no requiere cambios en casos de uso ni lógica de negocio**.

- Se facilita el testing mediante mocks o stubs del puerto.



Esta abstracción es un **requisito estructural** del sistema y una condición necesaria para:

- mantenibilidad

- extensibilidad

- evaluación académica correcta de arquitectura limpia.





## 4. Consideración sobre providers fake (TDD)

- Se permiten **fake providers** únicamente para tests (TDD) y desarrollo controlado.
- En producción, el pipeline se ejecuta con proveedor real (Yahoo Finance).
- Principio rector: **providers solo para ingesta**; lecturas siempre desde base persistida.

