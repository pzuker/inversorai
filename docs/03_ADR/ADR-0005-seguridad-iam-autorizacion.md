\# ADR-0005 — Seguridad, Identidad (IAM) y Autorización



\*\*Estado:\*\* Aprobado  

\*\*Fecha:\*\* 2025-01-24  

\*\*Decisores:\*\* Equipo InversorAI  

\*\*Contexto:\*\* Trabajo Final de Máster – Desarrollo de Sistemas con IA  



---



\## 1. Contexto



El sistema \*\*InversorAI\*\* es una plataforma monetizable, accesible vía web y API, que procesa datos financieros sensibles y genera recomendaciones de inversión mediante IA.



Esto implica requisitos estrictos en materia de:



\- Identidad y autenticación de usuarios.

\- Control de acceso a funcionalidades y datos.

\- Protección frente a amenazas comunes (OWASP Top 10).

\- Auditoría de eventos de seguridad.

\- Aislamiento de datos entre usuarios.



El contexto académico del TFM exige además que la seguridad no sea tratada como un agregado posterior, sino como un \*\*eje transversal del diseño\*\*.



---



\## 2. Objetivos de Seguridad



El diseño de seguridad del sistema debe:



\- Garantizar que solo usuarios autenticados accedan al sistema.

\- Asegurar que cada usuario solo acceda a lo que está autorizado.

\- Diferenciar claramente capacidades de \*\*ADMIN\*\* y \*\*USER\*\*.

\- Proteger datos financieros y resultados de IA.

\- Permitir auditoría completa de eventos relevantes.

\- Alinear la implementación con \*\*OWASP Top 10\*\*.

\- Minimizar superficie de ataque y complejidad innecesaria.



---



\## 3. Decisión



Se adopta un modelo de seguridad basado en:



\- \*\*Autenticación delegada\*\* mediante estándares OIDC/OAuth2.

\- \*\*Autorización basada en roles (RBAC)\*\*.

\- \*\*Aislamiento lógico de datos por usuario\*\*.

\- \*\*Auditoría centralizada e inmutable\*\*.

\- \*\*Defensa en profundidad\*\* (no un único control).



La seguridad se implementa \*\*en múltiples capas\*\*: frontend, API, casos de uso y base de datos.



---



\## 4. Autenticación (Identity and Access Management)



\### 4.1 Proveedor de Identidad



\- \*\*Proveedor:\*\* Supabase Auth

\- \*\*Estándar:\*\* OpenID Connect (OIDC) sobre OAuth2

\- \*\*Modelo:\*\* Autenticación completamente delegada



El sistema \*\*no gestiona contraseñas locales\*\* en el MVP.



---



\### 4.2 Flujos de Autenticación



\- \*\*Web UI\*\*:

&nbsp; - Authorization Code Flow con PKCE

\- \*\*API programática\*\*:

&nbsp; - Bearer tokens JWT emitidos por el IdP



---



\### 4.3 Tokens



Los tokens JWT deben:



\- Estar firmados por el IdP.

\- Incluir claims estándar (`sub`, `exp`, `iat`).

\- Incluir claims de rol (`role`).

\- Tener expiración corta.

\- Usar refresh tokens con rotación.



---



\### 4.4 MFA



\- MFA configurable por el sistema.

\- MFA \*\*obligatorio\*\* para usuarios con rol ADMIN.

\- MFA recomendado para usuarios USER.



---



\## 5. Autorización



\### 5.1 Modelo RBAC



Se definen los siguientes roles:



\- \*\*ADMIN\*\*

\- \*\*USER\*\*



No se permiten permisos implícitos ni escalamiento dinámico de privilegios.



---



\### 5.2 Capacidades por Rol



\*\*ADMIN\*\* puede:

\- Gestionar usuarios y roles.

\- Gestionar activos financieros.

\- Configurar ingesta y parámetros del sistema.

\- Acceder a auditoría completa.

\- Impersonar usuarios (con auditoría obligatoria).



\*\*USER\*\* puede:

\- Acceder a datos de mercado permitidos.

\- Consultar indicadores y recomendaciones.

\- Gestionar portafolios propios.

\- Ejecutar optimizaciones de portafolio.



---



\### 5.3 Autorización en Capas



La autorización se aplica en:



1\. \*\*API Gateway / Middleware\*\*

2\. \*\*Casos de uso (Application Layer)\*\*

3\. \*\*Base de datos (cuando aplique)\*\*



Un fallo en una capa \*\*no debe permitir acceso\*\*.



---



\## 6. Aislamiento de Datos



\- Los datos de usuario (portafolios, preferencias, consultas) se asocian a `user\_id`.

\- El sistema impide accesos cruzados entre usuarios.

\- Se puede utilizar \*\*Row Level Security (RLS)\*\* en la base de datos.

\- ADMIN accede a datos globales solo mediante flujos explícitos.



---



\## 7. Seguridad en la API



La API REST debe implementar:



\- Autenticación obligatoria para endpoints protegidos.

\- Rate limiting por usuario y rol.

\- Validación estricta de inputs.

\- Versionado explícito (`/api/v1`).

\- Respuestas genéricas ante errores de autorización (403).



---



\## 8. Seguridad en el Frontend



El frontend debe:



\- No almacenar tokens en `localStorage`.

\- Utilizar cookies seguras (`httpOnly`, `secure`, `sameSite`).

\- Proteger rutas privadas.

\- Prevenir XSS mediante sanitización y CSP.

\- No exponer secretos ni lógica sensible.



---



\## 9. Auditoría y Logging de Seguridad



El sistema debe registrar eventos de seguridad críticos:



\- Login y logout.

\- Intentos fallidos de autenticación.

\- Cambios de rol.

\- Cambios de configuración.

\- Impersonación.

\- Accesos denegados.

\- Generación de recomendaciones IA.



Cada evento incluye:



\- `event\_type`

\- `actor\_id`

\- `timestamp`

\- `ip\_address`

\- `user\_agent`

\- `details`



Los logs son \*\*inmutables\*\* y con retención mínima de 1 año.



---



\## 10. Alineación con OWASP Top 10



El diseño cubre explícitamente:



\- \*\*A01 – Broken Access Control\*\*: RBAC + aislamiento.

\- \*\*A02 – Cryptographic Failures\*\*: TLS, secretos externos.

\- \*\*A03 – Injection\*\*: validación y queries seguras.

\- \*\*A04 – Insecure Design\*\*: ADRs y threat awareness.

\- \*\*A05 – Security Misconfiguration\*\*: hardening y defaults seguros.

\- \*\*A06 – Vulnerable Components\*\*: gestión de dependencias.

\- \*\*A07 – Auth Failures\*\*: OIDC, MFA, rate limit.

\- \*\*A08 – Software Integrity\*\*: CI/CD controlado.

\- \*\*A09 – Logging Failures\*\*: auditoría centralizada.

\- \*\*A10 – SSRF\*\*: allowlists y validación de URLs.



---



\## 11. Alternativas Consideradas



\### 11.1 Autenticación Propia



Rechazada por:

\- Alto riesgo de seguridad.

\- Complejidad innecesaria.

\- Falta de valor académico.



---



\### 11.2 Autorización Solo en Frontend



Rechazada por:

\- Ser trivialmente evadible.

\- Violación de principios de seguridad.



---



\## 12. Consecuencias



\### Positivas



\- Seguridad profesional y defendible.

\- Sistema preparado para monetización.

\- Reducción significativa de riesgos.



\### Negativas



\- Mayor esfuerzo de implementación.

\- Dependencia de un proveedor de identidad.



---



\## 13. Estado y Seguimiento



\- Este ADR queda \*\*aprobado y cerrado\*\*.

\- Cambios en IAM o autorización requieren nuevos ADRs.

\- El contenido es vinculante para el diseño y la implementación.



---



