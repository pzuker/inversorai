# InversorAI

**InversorAI** es una plataforma full-stack de análisis de mercados financieros que combina **datos de mercado reales** (Crypto, Acciones y FX) con **análisis cuantitativo** e **inteligencia artificial** para generar **insights y recomendaciones de inversión explicables**.

El sistema está diseñado y construido siguiendo principios de **Clean Architecture**, **TDD** y **separación estricta de responsabilidades**, con un enfoque claro en **calidad académica, robustez técnica y experiencia de usuario profesional**.

Este proyecto corresponde al **Trabajo Final de Máster (TFM)** del Máster en Desarrollo con Inteligencia Artificial.

---

## 🎯 Objetivos del Proyecto

- Analizar activos financieros reales (CRYPTO, STOCK y FX).
- Automatizar la ingesta de datos de mercado directamente desde Internet.
- Calcular indicadores técnicos y métricas cuantitativas.
- Generar análisis e insights mediante IA explicable.
- Ofrecer recomendaciones de inversión claras y defendibles.
- Proveer una interfaz web profesional con UX de nivel producto.
- Demostrar buenas prácticas de arquitectura, testing y seguridad.

---

## 📊 Activos Soportados (MVP)

El MVP soporta múltiples mercados reales:

| Tipo   | Símbolo   | Descripción        |
|--------|-----------|--------------------|
| Crypto | BTC-USD   | Bitcoin            |
| Stock  | AAPL      | Apple Inc.         |
| FX     | EURUSD=X  | Euro / Dólar USD   |

Todos los precios e históricos provienen de **Yahoo Finance** y son **verificables externamente**.

---

## 🏗️ Arquitectura

El sistema sigue una **Clean / Hexagonal Architecture**, separando claramente:

- **Dominio**: entidades, reglas de negocio y casos de uso.
- **Aplicación**: orquestación de procesos.
- **Infraestructura**: proveedores externos (market data, IA, persistencia).
- **Interfaces**: API REST y frontend web.

### Principios clave

- Los providers se utilizan exclusivamente para **ingesta y escritura**.
- Todas las lecturas se realizan desde una **fuente de verdad persistida**.
- Los fake providers existen **solo para testing**.
- El código está preparado para evolucionar sin acoplamientos.

---

## 🧠 Inteligencia Artificial

El sistema utiliza IA para:

- Analizar tendencias de mercado.
- Explicar oportunidades de inversión.
- Generar recomendaciones estructuradas (BUY / HOLD / SELL).

### Características

- Output validado por esquema.
- Versionado de prompts.
- Insights explicables (no caja negra).
- IA integrada como parte del sistema, no como feature aislado.

---

## 🔐 Seguridad y Roles

### Autenticación

- Supabase Auth (email + password).
- Registro abierto para usuarios finales.

### Roles

- **USER**
  - Acceso de solo lectura.
  - Visualiza datos reales, gráficos, insights y recomendaciones.
- **ADMIN**
  - Ejecuta el pipeline de análisis.
  - Controla la actualización de datos e insights.

### Seguridad adicional

- Rate limiting en endpoints sensibles (por asset).
- Protección contra abuso del pipeline.
- Separación estricta de permisos.

---

## 🧪 Testing y Calidad

- Desarrollo guiado por tests (TDD).
- Tests unitarios y de integración (opt-in).
- Fake providers utilizados únicamente en tests.
- TypeScript estricto en todo el código.

---

## 📦 Stack Tecnológico

### Backend

- Node.js + TypeScript
- Clean Architecture
- Supabase (PostgreSQL + Auth)
- Yahoo Finance (market data)
- OpenAI (IA)

### Frontend

- Next.js (App Router)
- TailwindCSS + shadcn/ui
- Recharts (visualización)
- Light / Dark mode
- UX orientada a producto real

### Infraestructura

- Monorepo
- Separación backend / frontend
- Preparado para despliegue en producción

---

## 🚀 Ejecución en Local

### Requisitos

- Node.js 18+
- Cuenta en Supabase
- Variables de entorno configuradas

### Backend

cd services/api
npm install
npm run dev

### Frontend

cd apps/web
npm install
npm run dev

Acceder a:

http://localhost:3000

---

## ⚙️ Variables de Entorno (ejemplo)

SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

OPENAI_API_KEY=...

MARKET_DATA_PROVIDER=REAL
NODE_ENV=development

---

## 🧭 Flujo de Demo Recomendado (Defensa)

1. Registro de usuario (USER).
2. Login y acceso al dashboard.
3. Visualización de datos reales (verificables en Google).
4. Cambio de activos (Crypto / Stock / FX).
5. Visualización de indicadores y gráficos con escala adaptativa.
6. Ejecución del pipeline como ADMIN.
7. Generación de insight IA y recomendación.
8. Comparación con mercado real.

---

## 📈 Fuente de Datos y Disclaimer

- Fuente de datos de mercado: **Yahoo Finance**.
- Los análisis e insights generados **no constituyen asesoramiento financiero**.
- El sistema tiene fines educativos y demostrativos.

---

## 📌 Estado del Proyecto

- MVP completo y funcional.
- Desplegado en producción.
- Preparado para evaluación académica.
- Base sólida para evolución futura.

---

## 👨‍🎓 Autor

Trabajo realizado como **Trabajo Final de Máster (TFM)**  
Máster en Desarrollo con Inteligencia Artificial.
