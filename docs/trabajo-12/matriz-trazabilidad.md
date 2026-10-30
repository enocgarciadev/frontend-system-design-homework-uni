# Matriz de trazabilidad — Trabajo 12

| Requisito de la guía UNI | Funcionalidad o artefacto comprobable | Estado |
|---|---|---|
| Portada, resumen y alcance | Informe y presentación del Trabajo 12 | Preparados; falta completar integrantes reales |
| UWE/WebML/híbrido | OOHDM documentado en Semana 7; adaptación de vistas de dominio/navegación a enfoque híbrido con conceptos UWE en informe final | Correspondencia documentada; no se afirma UML UWE formal previo |
| Arquitectura de 3 capas | React → HTTP REST Go → PostgreSQL, `src/features`, `server/`, `server/db/` | Implementada en rama final |
| DNS, hosting, base de datos | Despliegue propuesto en Cloudflare Pages + servicio PaaS compatible con Go + PostgreSQL gestionado | Diseño, **no hay URL pública/DNS evidenciado** |
| Wireframes, usabilidad, accesibilidad | `docs/semana-7/diagramas/wireframe-*`; componentes accesibles y adaptación móvil; CI Chromium | Wireframes históricos y tests actuales, no auditoría WCAG formal |
| Autenticación y sesiones | `server/auth.go`, `server/guard.go`, `src/features/auth/AuthGate.jsx` | Implementado en pila |
| Roles, validación y CSRF | admin/vendedor; validación cliente/servidor; `X-CSRF-Token` | Implementado en pila; falta hardening productivo |
| ACID / stock y ventas | `server/store.go` y `server/movements.go`, SQL con transacciones y bloqueo | Implementado / probado PostgreSQL |
| Servicios web REST/JSON | Endpoints documentados en `servicios-web.md`; Postman collection de muestra | API implementada; colección preparada (ejecución Postman manual pendiente) |
| Consumo servicios externos | React consume API propia REST; posibles pagos/ERP externos | **No existe integración con tercero**; propuesta documentada |
| 5 funciones críticas | POS, CRUD productos, inventario, historial ventas, reportes | Implementadas en la pila #3–#13 |
| Código funcional comprimido | Workflow de CI: `git archive` genera ZIP descargable | Tras CI/merge confirmar ZIP de `main` |
| Exposición 10–15 min y participación | `guion-exposicion.md` | Guion preparado; exposición oral pendiente |

## Vínculo de casos de uso con la implementación

| Caso MVP | Componentes React | Go REST | Persistencia |
|---|---|---|---|
| Venta rápida y salida de stock | `src/features/pos/` | `POST /api/ventas` | ventas, venta_detalles, movimientos_stock, productos |
| Alta/edición/baja de producto | `src/features/products/` | `GET/POST /api/productos`, `PUT/DELETE /api/productos/{id}` | productos, categorias |
| Entrada y ajuste de existencias | `src/features/movements/` | `GET/POST /api/movimientos` | productos, movimientos_stock |
| Historial y detalle de venta | `src/features/sales/` | `GET /api/ventas`, `GET /api/ventas/{id}` | ventas, venta_detalles |
| Panel de inventario y ventas | `src/features/reports/` | `GET /api/reportes/resumen` | agregaciones sobre productos y ventas |
| Acceso y roles (transversal) | `src/features/auth/`, `src/components/layout/UserMenu.jsx` | `/api/auth/*` y middleware | usuarios, sesiones |

## Pesos del instrumento de evaluación (10 puntos)

Demostración MVP 35%; Integración de servicios web 15%; Integración/coherencia 20%; calidad documental 15%; exposición y comunicación 10%; tiempo/organización 5%. Se recomienda dedicar la mayor parte del tiempo práctico a la demostración de las cinco funciones, sin omitir la explicación técnica.
