\# 08 — CI/CD y Despliegue a Producción



\*\*Proyecto:\*\* InversorAI  

\*\*Fecha:\*\* 2025-01-24  

\*\*Contexto:\*\* Trabajo Final de Máster – Desarrollo de Sistemas con IA  



---



\## 1. Propósito del Documento



Este documento describe la estrategia de \*\*Integración Continua (CI)\*\* y \*\*Despliegue Continuo (CD)\*\* del sistema InversorAI.



El objetivo es demostrar que el sistema:



\- Puede pasar de desarrollo local a producción real.

\- Mantiene calidad, seguridad y reproducibilidad.

\- Evita despliegues manuales frágiles.

\- Es consistente con prácticas profesionales actuales.



Este documento \*\*no contiene scripts ni YAML\*\*, sino las \*\*decisiones y flujos\*\* que gobiernan el pipeline.



---



\## 2. Objetivos del Pipeline CI/CD



La estrategia de CI/CD debe:



\- Automatizar validaciones de calidad.

\- Prevenir regresiones funcionales.

\- Reducir errores humanos en despliegues.

\- Garantizar trazabilidad entre código y producción.

\- Facilitar rollback ante fallos.

\- Mantener bajo el costo operativo del MVP.



---



\## 3. Principios de Diseño



El pipeline se diseña siguiendo estos principios:



\- Automatización por defecto.

\- Fallar rápido y de forma visible.

\- Separación entre build, test y deploy.

\- Paridad entre entornos (local, staging, producción).

\- Infraestructura como configuración declarativa.

\- Simplicidad antes que sofisticación innecesaria.



---



\## 4. Control de Versiones



\### 4.1 Repositorio



\- Repositorio Git único (monorepo).

\- Ramas principales:

&nbsp; - `main`: estado estable y desplegable.

&nbsp; - `feature/\*`: desarrollo de funcionalidades.



---



\### 4.2 Estrategia de Commits



\- Commits pequeños y atómicos.

\- Mensajes descriptivos.

\- Cambios estructurales acompañados de documentación.



---



\## 5. Integración Continua (CI)



\### 5.1 Disparadores del Pipeline



El pipeline de CI se ejecuta automáticamente en:



\- Pull Requests hacia `main`.

\- Commits directos a `main`.



---



\### 5.2 Etapas del Pipeline CI



El pipeline incluye, como mínimo, las siguientes etapas:



1\. \*\*Instalación de dependencias\*\*

2\. \*\*Análisis estático\*\*

&nbsp;  - Linting

&nbsp;  - Type checking

3\. \*\*Ejecución de tests\*\*

&nbsp;  - Tests unitarios

&nbsp;  - Tests de casos de uso

&nbsp;  - Tests de integración (cuando aplique)

4\. \*\*Validación de build\*\*

&nbsp;  - Compilación de frontend y backend

5\. \*\*Chequeos de seguridad básicos\*\*

&nbsp;  - Dependencias vulnerables

&nbsp;  - Configuración insegura conocida



El pipeline \*\*bloquea el merge\*\* si alguna etapa falla.



---



\## 6. Gestión de Secretos y Configuración



\- Ningún secreto se versiona en el repositorio.

\- Las configuraciones sensibles se manejan mediante:

&nbsp; - Variables de entorno.

&nbsp; - Secret managers de la plataforma.

\- Los valores por entorno están claramente separados:

&nbsp; - desarrollo

&nbsp; - staging

&nbsp; - producción



---



\## 7. Despliegue Continuo (CD)



\### 7.1 Estrategia de Despliegue



Se adopta una estrategia de despliegue \*\*automatizada y gradual\*\*.



\- El despliegue se ejecuta solo desde `main`.

\- Cada despliegue corresponde a un commit identificable.

\- No se realizan despliegues manuales en producción.



---



\### 7.2 Componentes Desplegados



El sistema se despliega en los siguientes componentes:



\- \*\*Frontend Web\*\*

\- \*\*API Backend\*\*

\- \*\*Workers asíncronos\*\*

\- \*\*Infraestructura gestionada\*\* (DB, Auth, Redis)



Cada componente puede desplegarse de forma independiente.



---



\## 8. Entornos



\### 8.1 Desarrollo Local



\- Entorno reproducible mediante configuración local.

\- Uso de servicios emulados o cuentas de desarrollo.

\- Logs verbosos habilitados.



---



\### 8.2 Producción



\- Configuración segura por defecto.

\- Logs estructurados.

\- Métricas habilitadas.

\- Acceso restringido.



No se permite testear directamente en producción.



---



\## 9. Estrategia de Rollback



Ante un fallo en producción:



\- Se identifica el commit desplegado.

\- Se revierte al último estado estable.

\- Se registra el incidente.

\- Se analiza la causa raíz.



El rollback es \*\*rápido y automatizable\*\*.



---



\## 10. Observabilidad Post-Deploy



Luego de cada despliegue se monitorean:



\- Errores de aplicación.

\- Latencia.

\- Consumo de recursos.

\- Fallos en jobs asíncronos.



Esto permite detectar problemas tempranamente.



---



\## 11. Seguridad en CI/CD



El pipeline considera seguridad como parte integral:



\- Validación de dependencias vulnerables.

\- Protección de secretos.

\- Acceso mínimo necesario a pipelines.

\- Separación de permisos por entorno.



---



\## 12. Alternativas Consideradas



\### 12.1 Despliegue Manual



Rechazado por:

\- alto riesgo humano,

\- baja reproducibilidad,

\- dificultad de rollback.



---



\### 12.2 Infraestructura Compleja (Kubernetes)



Rechazada para el MVP por:

\- complejidad excesiva,

\- sobrecarga operativa,

\- bajo valor académico adicional.



---



\## 13. Consideraciones Finales



\- El pipeline CI/CD es parte del diseño del sistema.

\- Un sistema sin despliegue reproducible no está completo.

\- Esta estrategia es suficiente para el MVP y el TFM.

\- El documento es vinculante para la implementación.



---



