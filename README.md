\# InversorAI  

Plataforma Fullstack de Análisis de Mercados con Inteligencia Artificial



Trabajo Final de Máster – Desarrollo de Sistemas con IA



---



\## 1. Introducción



InversorAI es una plataforma fullstack diseñada para el análisis de mercados financieros mediante ingeniería de software moderna e inteligencia artificial controlada.



El sistema permite analizar activos de distintos mercados (acciones, criptomonedas y divisas), calcular indicadores técnicos, optimizar portafolios y generar recomendaciones de inversión \*\*explicables y auditables\*\*, sin ejecutar operaciones reales.



El proyecto se concibe como un sistema profesional, desplegable en producción, alineado con principios de arquitectura limpia, seguridad (OWASP Top 10) y uso responsable de IA.



---



\## 2. Problema que Aborda



Los inversores y analistas enfrentan problemas recurrentes:



\- Acceso fragmentado a datos de mercado.

\- Falta de trazabilidad en sistemas basados en IA.

\- Herramientas poco auditables o no reproducibles.

\- Mezcla incorrecta entre análisis, recomendación y ejecución.

\- Sistemas difíciles de desplegar o mantener.



InversorAI aborda estos problemas mediante un sistema que automatiza la recolección de datos, aplica indicadores verificables, integra IA de forma controlada y separa claramente análisis, recomendación y ejecución.



---



\## 3. Alcance del Proyecto



Incluye:



\- Análisis de mercados: acciones (STOCK), criptomonedas (CRYPTO) y divisas (FX).

\- Ingesta automática de datos de mercado.

\- Persistencia de series temporales.

\- Cálculo de indicadores técnicos (RSI, MACD, Sharpe Ratio, volatilidad).

\- Optimización de portafolios (maximización de Sharpe).

\- Recomendaciones de inversión mediante IA.

\- Auditoría completa de decisiones generadas por IA.

\- Dashboard web.

\- API REST segura.

\- Autenticación y autorización con roles ADMIN y USER.



Excluye deliberadamente:



\- Ejecución automática de trading real.

\- Integración con brokers.

\- Garantías de predicción financiera.

\- Entrenamiento de modelos en tiempo real.

\- Aplicaciones móviles nativas.



---



\## 4. Arquitectura General



El sistema sigue una arquitectura Clean / Hexagonal organizada en:



\- Dominio: entidades y reglas de negocio.

\- Aplicación: casos de uso explícitos.

\- Infraestructura: base de datos, colas y proveedores externos.

\- Interfaces: API REST y aplicación web.



Se utiliza un monorepo TypeScript con separación clara entre frontend, backend y workers asíncronos.  

Las decisiones arquitectónicas están documentadas mediante ADRs en el directorio /docs/03\_ADR.



---



\## 5. Uso de Inteligencia Artificial



La inteligencia artificial se utiliza exclusivamente para generar recomendaciones, nunca para ejecutar acciones reales.



Principios aplicados:



\- Prompts versionados.

\- Inputs estructurados y determinísticos.

\- Outputs validados contra esquemas.

\- Auditoría completa (input, output, modelo y versión).

\- Mitigación explícita de alucinaciones.



La IA se trata como un componente controlado de ingeniería, no como una caja negra.



---



\## 6. Instalación y Ejecución del Proyecto



Esta sección describe cómo instalar y ejecutar el proyecto, cumpliendo los requisitos del Trabajo Final de Máster.



\### 6.1 Requisitos Previos



\- Git

\- Node.js (versión LTS recomendada)

\- Gestor de paquetes npm o pnpm

\- Cuenta gratuita en Supabase (base de datos y autenticación)

\- Cuenta en proveedor de IA (opcional para modo demo limitado)



No se requiere software propietario.



---



\### 6.2 Clonado del Repositorio



Clonar el repositorio desde su URL oficial y acceder al directorio raíz del proyecto.



---



\### 6.3 Instalación de Dependencias



Desde la raíz del monorepo, instalar todas las dependencias del proyecto utilizando el gestor de paquetes configurado.



---



\### 6.4 Configuración de Variables de Entorno



El proyecto incluye un archivo de ejemplo de variables de entorno (.env.example).  

Debe copiarse como .env y configurarse con los valores correspondientes a cada entorno.



Las variables incluyen, entre otras:



\- Conexión a base de datos.

\- Credenciales de Supabase Auth.

\- Clave del proveedor de IA.

\- Configuración del entorno de ejecución.



---



\### 6.5 Ejecución Local (Modo Desarrollo)



El sistema se ejecuta en procesos independientes:



\- Aplicación web (frontend).

\- API backend.

\- Workers asíncronos.



Cada componente puede iniciarse de forma separada mediante los scripts definidos en el proyecto.



---



\### 6.6 Ejecución sin Credenciales Reales (Modo Demo)



Para fines académicos, el sistema puede ejecutarse en modo demo utilizando:



\- Proveedores de datos simulados.

\- Respuestas de IA stub.

\- Autenticación de prueba.



Este modo permite evaluar la arquitectura y los flujos del sistema sin depender de servicios externos reales.



---



\### 6.7 Despliegue a Producción (Resumen)



El proyecto está preparado para despliegue real mediante:



\- Frontend en plataforma serverless.

\- Backend y workers en servicios gestionados.

\- Base de datos y autenticación gestionadas.



El detalle completo del despliegue se documenta en /docs/08\_CICD\_Y\_DEPLOY.md.



---



\## 7. Seguridad



La seguridad es un eje central del diseño:



\- Autenticación mediante OIDC/OAuth2.

\- Roles ADMIN y USER.

\- Autorización basada en RBAC.

\- Aislamiento de datos por usuario.

\- Auditoría de eventos críticos.

\- Alineación explícita con OWASP Top 10.



El sistema no gestiona contraseñas localmente.



---



\## 8. Organización del Repositorio



Estructura simplificada del repositorio:



\- /docs: documentación del sistema y ADRs.

\- /apps: frontend web.

\- /services: API y workers.

\- /packages: código compartido.



La documentación es parte integral del proyecto.



---



\## 9. Documentación Técnica



El proyecto incluye documentación detallada sobre:



\- Requisitos del sistema.

\- Decisiones arquitectónicas.

\- Dominio y casos de uso.

\- Pipeline de datos.

\- Uso de IA y guardrails.

\- Seguridad.

\- Testing.

\- CI/CD.



Toda la documentación se encuentra en el directorio /docs.



---



\## 10. Limitaciones y Trabajo Futuro



Limitaciones actuales:



\- Uso de proveedores de datos gratuitos en el MVP.

\- Sin ejecución de órdenes reales.

\- Optimización de portafolio básica.



Posibles extensiones futuras:



\- Integración con brokers.

\- Backtesting avanzado.

\- Modelos predictivos propios.

\- Multi-tenant completo.

\- Aplicaciones móviles.



---



\## 11. Conclusiones



InversorAI demuestra la aplicación práctica de arquitectura limpia, procesamiento de datos financieros, uso responsable de inteligencia artificial, seguridad moderna y despliegue realista.



El proyecto prioriza claridad conceptual, trazabilidad y calidad técnica, cumpliendo los objetivos académicos y profesionales del Trabajo Final de Máster.



---



