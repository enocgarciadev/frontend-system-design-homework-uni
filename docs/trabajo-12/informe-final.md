# INFORME EJECUTIVO FINAL — PULPESTOCK WEB

**Universidad Nacional de Ingeniería | Diseño de Sistemas en Internet | Trabajo N.º 12**
**Docente:** Víctor Manuel Díaz Suárez
**Equipo:** [COMPLETAR NOMBRES REALES]
**Fecha de presentación:** [COMPLETAR]
**Estado del producto:** MVP académico implementado en la pila de PRs #3–#13; verificación final condicionada al merge y CI en main.

## 1. Resumen ejecutivo

Las pulperías necesitan conocer las existencias disponibles, registrar ventas y verificar qué productos requieren reposición. Los registros manuales dificultan mantener coherencia entre el cobro y el inventario. PulpeStock Web aborda esta necesidad mediante un MVP web orientado a ventas en efectivo, productos y control de stock.

La solución combina React 19 (interfaz), una API REST en Go 1.23 (reglas de negocio y seguridad) y PostgreSQL 16 (persistencia transaccional). Se presentan cinco funciones críticas verificables: venta con descuento de existencias, administración de productos, movimientos de stock, historial de ventas y reportes de inventario/ventas. El inicio de sesión por roles es transversal.

**Alcance y exclusiones.** Se trabaja con datos demostrativos y efectivo. El MVP no implementa pasarela de pagos, integración externa real, contabilidad completa, clientes/proveedores o caja/arqueo. No se dispone aquí de una URL pública ni registros DNS configurados; su arquitectura de despliegue se expone como propuesta. No se declara producción.

## 2. Problema, objetivos y valor del MVP

**Problema.** La ausencia de un registro único y confiable de productos, ventas y existencias dificulta conocer qué hay disponible y genera riesgo de vender artículos sin stock.

**Objetivo general.** Desarrollar un sistema web funcional de punto de venta e inventario para pulperías, con persistencia y trazabilidad de operaciones críticas.

**Objetivos específicos.**
- Reducir pasos manuales de cobro en efectivo y cálculo de vuelto.
- Evitar stock negativo y duplicación accidental de ventas.
- Permitir mantenimiento de productos y movimientos inventariables.
- Facilitar consulta de transacciones e indicadores de reposición.
- Demostrar la separación presentación / negocio / datos y el uso de servicios REST JSON.

## 3. Ingeniería Web: metodología y navegación

El documento de Semana 7 eligió **OOHDM** como método principal, separando modelo conceptual, navegación e interfaz abstracta. La guía del Trabajo 12 solicita explicar **UWE, WebML o un enfoque híbrido**. Para el cierre se presenta con precisión un **enfoque híbrido documental**: se conservan los artefactos OOHDM reales y se relacionan con las perspectivas de contenido, navegación y presentación usadas en UWE; no se afirma que el equipo elaboró formalmente una metodología UWE completa desde el inicio.

**Contenido.** Entidades: Categoria, Producto, Venta, VentaDetalle, MovimientoStock, Usuario y Sesion. Producto pertenece a Categoria; Venta agrupa detalles; las ventas y ajustes generan movimientos; una sesión pertenece a un usuario.

**Navegación.** Tras autenticación, el AppShell muestra enlaces POS y Ventas. El rol administrador accede además a Productos, Movimientos y Reportes. El acceso a la API se controla también del lado servidor: ocultar un enlace no sustituye autorización.

**Presentación.** Interfaz adaptable: catálogo y ticket; controles de cantidad, efectivo y vuelto; formularios etiquetados; menús laterales; estados de carga/error; paneles de productos, movimientos, ventas y reportes. Los wireframes de Semana 7 son previos al backend; para evidencia actual deben usarse las capturas nuevas de CI.

## 4. Arquitectura de tres capas

**Presentación:** React 19 + Vite 8, Tailwind CSS; componentes `src/features/` y `src/components/layout/`, renderizados en navegador. El cliente consume la API con `fetch`, guarda solo estado temporal del carrito y no abre conexiones SQL.

**Lógica de negocio:** Go 1.23 con `net/http` en `server/`; router REST JSON, validación de entradas, sesiones, CSRF y autorización admin/vendedor, precio calculado por servidor y reglas de inventario.

**Datos:** PostgreSQL, esquema en `server/db/`. Tablas: categorias, productos, ventas, venta_detalles, movimientos_stock, usuarios y sesiones. El driver PostgreSQL se usa desde Go mediante `database/sql`.

**Diagrama de flujo:** Navegador React → HTTPS/JSON → servicio Go → SQL transaccional → PostgreSQL. El proxy Vite `/api` se usa en desarrollo. Para un despliegue real se propone frontend estático en Cloudflare Pages, API Go en un PaaS compatible y PostgreSQL gestionado. El dominio, certificados TLS, copias de seguridad, CORS y monitoreo requieren una configuración y comprobación de operación; no existe evidencia de publicación actual.

**DNS conceptual:** `app.<dominio-propio>` apuntaría al alojamiento frontend (CNAME o mecanismo específico del proveedor), `api.<dominio-propio>` al backend Go. No atribuir propiedad del dominio `pulpestock.com` ni inventar IPs.

## 5. Seguridad, validación y transacciones

**Autenticación.** El servidor guarda usuarios con rol admin/vendedor y contraseña derivada mediante PBKDF2-HMAC-SHA256 con salt aleatorio. El login establece una cookie HttpOnly, SameSite Strict y una sesión opaca respaldada por PostgreSQL. El logout revoca la sesión. Para escrituras, Go exige X-CSRF-Token. La cookie solo es Secure cuando la solicitud usa TLS directamente o la configuración `COOKIE_SECURE=true` está activa: en producción detrás de proxy TLS debe establecerse explícitamente.

**Autorización.** Un vendedor puede cobrar y consultar productos/ventas. El admin también puede modificar productos, registrar movimientos y consultar reportes. El servidor verifica el rol aunque el cliente oculte los destinos administrativos.

**Validación.** El frontend valida formularios y disponibilidad estimada, pero Go valida cantidades, precios, existencia, total, tipo de movimiento e identidad autorizada. El total de una venta se calcula a partir del precio guardado en PostgreSQL, no desde un total confiado al navegador.

**ACID.** `CreateSale` abre una transacción SQL; bloquea productos mediante `SELECT ... FOR UPDATE`, ordena las líneas para limitar conflictos y verifica stock; inserta Venta, VentaDetalle y MovimientoStock y descuenta existencias antes del COMMIT. Un error provoca rollback y la tabla `productos` tiene restricción stock_actual >= 0. El `requestId` hace idempotentes los reintentos de una venta. Los movimientos de entrada/ajuste usan igualmente transacción y bloqueo por producto.

## 6. Servicios Web e integración

Se eligió **REST/JSON** por compatibilidad con el navegador React, sencillez de consumo y representación de recursos. SOAP/WSDL no se implementó: su contrato XML formal aportaría complejidad injustificada para este MVP local.

**API implementada (desarrollo):**
- `GET /api/health` — disponibilidad del proceso Go.
- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` — sesiones.
- `GET, POST /api/productos`; `PUT, DELETE /api/productos/{id}` — catálogo y gestión.
- `GET, POST /api/movimientos` — auditoría y entradas/ajustes.
- `GET, POST /api/ventas`; `GET /api/ventas/{id}` — ventas y consulta de tickets.
- `GET /api/reportes/resumen` — indicadores (administrador).

Las rutas de negocio exigen sesión, y las mutaciones exigen CSRF. Las operaciones se prueban mediante `go test` + PostgreSQL y Playwright/Chromium. Se incluye una colección **Postman lista para ejecución**, pero no se afirma que Postman se haya ejecutado.

**Servicios externos.** React consume la API **propia** de Go. No existe consumo real de servicios externos. Como integración futura puede plantearse un proveedor de facturación electrónica, una pasarela de pago o un ERP; requeriría contrato, credenciales, tolerancia a fallos y seguridad de datos. No confundir proyección con implementación.

## 7. Cinco funcionalidades críticas demostradas

| # | Función de negocio | Prueba técnica y valor |
|---|---|---|
| 1 | Punto de venta y descuento de existencias | PosScreen, POST /api/ventas, transacción SQL; evita inconsistencias de caja e inventario |
| 2 | CRUD de productos | ProductsScreen, POST/PUT/DELETE /api/productos; catálogo actualizado y baja lógica |
| 3 | Movimientos de inventario | MovementsScreen, POST /api/movimientos; reposición y ajustes trazables |
| 4 | Historial y detalle de ventas | SalesHistoryScreen, GET /api/ventas/{id}; revisión de tickets y precios históricos |
| 5 | Reportes de inventario y venta | ReportsScreen, GET /api/reportes/resumen; identificación de stock crítico y resultados diarios |

La autenticación y roles son la capacidad transversal necesaria para protegerlas. Los módulos de caja, clientes, proveedores y compras siguen siendo placeholders o mejoras futuras.

## 8. Calidad y evidencia

Pipeline por PR: instalación de React, lint, compilación, migraciones y usuario CI, `go test -race ./server/...`, `go vet`, instalación Chromium y pruebas Playwright en 1440x900 (escritorio) y 390x844 (móvil). El PR #13 registró **18/18 pruebas Chromium aprobadas**. El PR final debe superar pruebas propias y producir ZIP + capturas. El flujo de venta se prueba contra PostgreSQL real; los tests cubren idempotencia, stock insuficiente y concurrencia.

No afirmar cumplimiento WCAG formal, pentest ni escalabilidad productiva: hay pruebas funcionales y atributos accesibles, pero no auditoría especializada.

## 9. Conclusiones y lecciones aprendidas

PulpeStock materializa el paso de un POS React demostrativo a un sistema cliente-servidor con datos persistentes. La separación de tres capas hizo posible evolucionar de forma incremental; las transacciones SQL evitan estados parciales y los roles verifican que las interfaces no son un mecanismo suficiente de autorización. Una lección clave fue actualizar los artefactos de diseño después de los cambios técnicos: el informe histórico hablaba de Node/Express, mientras el sistema real usa Go.

La entrega cumple el alcance técnico de un MVP académico con cinco capacidades principales, siempre que se fusionen las ramas dependientes y se presenten las evidencias finales. Siguen pendientes despliegue público verificable, integración con tercero, cuentas reales de producción y obligaciones de entrega/exposición realizadas por los integrantes.

## 10. Referencias y trazabilidad

- Universidad Nacional de Ingeniería, «Trabajo N.° 12: Entrega Final del Proyecto y Presentación del MVP», pp. 1–5.
- PulpeStock Web, repositorio `enocgarciadev/frontend-system-design-homework-uni`, stacked PR #3–#14.
- `docs/semana-7/informe.md` (material histórico, 6/10/2026), diagramas de contenido/navegación y wireframes.
- `docs/trabajo-12/matriz-trazabilidad.md`, `servicios-web.md` y `validacion-y-pendientes.md`.
