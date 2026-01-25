Actuá como Senior Software Architect y aplicá TDD estricto (RED → GREEN → REFACTOR).



Objetivo:

Implementar un adaptador de infraestructura FakeMarketDataProvider para el puerto MarketDataProviderPort, y un runner mínimo en main.ts para ejecutar el caso de uso IngestMarketData. Todo debe hacerse con TDD: primero tests que fallan, luego implementación mínima para pasar, luego refactor si aplica.



Restricciones obligatorias:

\- NO usar HTTP real.

\- NO usar Supabase.

\- NO persistir datos.

\- NO crear endpoints.

\- NO tocar el caso de uso para acomodar infraestructura.

\- Todo debe compilar con TypeScript estricto.

\- El fake provider debe ser determinístico: mismo assetSymbol → misma serie siempre.

\- Evitar sobre-ingeniería: tooling mínimo para tests.



Contexto existente (ya está creado y compila):

\- services/api/src/domain/entities/MarketDataPoint

\- services/api/src/application/ports/MarketDataProviderPort

\- services/api/src/application/use-cases/IngestMarketData



Tareas:



A) Setup mínimo de testing en services/api (solo lo necesario)

1\) Elegir Vitest como runner de tests.

2\) Configurar services/api/package.json con scripts:

&nbsp;  - test

&nbsp;  - test:watch (opcional)

3\) Asegurar que Vitest corra tests TypeScript sin compilación manual.

4\) NO modificar otros paquetes del monorepo salvo lo estrictamente necesario para que tests corran.



B) Tests primero (RED)

Crear tests en services/api/src/\_\_tests\_\_/:



B1) IngestMarketData.test.ts

\- Caso: cuando el provider devuelve datos, execute(symbol) retorna la lista.

\- Caso: cuando el provider devuelve \[], execute(symbol) lanza un error claro.

\- El provider en este test debe ser un stub in-memory simple (no el Fake real todavía).



B2) FakeMarketDataProvider.test.ts

\- Caso: fetchMarketData("BTC-USD") retorna exactamente 30 puntos.

\- Caso: determinismo: dos llamadas con "BTC-USD" devuelven igual contenido (mismo largo, mismos valores y timestamps).

\- Caso: variación por símbolo: "BTC-USD" y "AAPL" NO devuelven exactamente la misma serie (al menos un punto difiere).

\- Caso: coherencia OHLC por punto:

&nbsp; - low <= open <= high

&nbsp; - low <= close <= high

&nbsp; - volume >= 0

\- Caso: timestamps:

&nbsp; - deben estar en UTC (Date) y ser estrictamente crecientes por timestamp (orden ascendente).

&nbsp; - deben ser 1 por día, consecutivos, sin gaps (diferencia de 24h exacta entre puntos).

\- Estos tests deben FALLAR antes de implementar FakeMarketDataProvider.



C) Implementación (GREEN)

C1) Crear services/api/src/infrastructure/providers/FakeMarketDataProvider.ts

\- Crear carpeta services/api/src/infrastructure/providers/ si no existe.

\- Implementar class FakeMarketDataProvider implements MarketDataProviderPort.

\- Implementar fetchMarketData(assetSymbol: string): Promise<MarketDataPoint\[]>

\- Debe generar serie diaria de 30 puntos, determinística.



Determinismo (obligatorio):

\- Usar una fecha base fija para todos (ej: startDate = 2025-01-01T00:00:00.000Z).

\- Generar 30 días consecutivos desde startDate (inclusive) hacia adelante.

\- Valores determinísticos basados en assetSymbol:

&nbsp; - Crear una seed numérica a partir de assetSymbol (hash simple).

&nbsp; - Usar PRNG simple determinístico (por ejemplo LCG) para generar variaciones.

&nbsp; - Asegurar OHLC coherente:

&nbsp;   - elegir un "basePrice" por símbolo

&nbsp;   - generar open/close alrededor de basePrice

&nbsp;   - high = max(open, close) + delta

&nbsp;   - low  = min(open, close) - delta

&nbsp; - volume determinístico y >= 0.



C2) Runner mínimo

Modificar o crear services/api/src/main.ts:

\- Instanciar FakeMarketDataProvider.

\- Instanciar IngestMarketData con el provider.

\- Ejecutar con un assetSymbol hardcodeado "BTC-USD".

\- Loguear:

&nbsp; - "Ingested X points for BTC-USD"

&nbsp; - "First: <ISO timestamp>, Last: <ISO timestamp>"

&nbsp; - "Sample: <timestamp> O:<open> H:<high> L:<low> C:<close> V:<volume>"

\- NO agregar frameworks ni wiring extra.



D) Refactor (REFACTOR)

\- Si hay duplicación mínima o nombres confusos, refactor sin cambiar comportamiento.

\- Mantener tests verdes.



Entregables esperados:

1\) Cambios en services/api/package.json para soportar Vitest.

2\) Los dos archivos de test con asserts claros.

3\) FakeMarketDataProvider implementado en infrastructure/providers.

4\) main.ts con runner mínimo.

5\) Todo compila y: 

&nbsp;  - `npm -w services/api test` (o equivalente workspace) pasa.

&nbsp;  - build y ejecución del runner funcionan tras build.



No expliques decisiones.

No inventes archivos extra.

Entregá directamente los archivos y su contenido final.



