# Stack E — API Go de historial de ventas

Base: Stack D (interfaz de movimientos), con dependencias desde PR #3.

- `GET /api/ventas`: las últimas 100 ventas, ordenadas por ID descendente, incluyen total, efectivo, vuelto y fecha.
- `GET /api/ventas/{id}`: detalle completo con productos, cantidades y precios históricos de cada línea.
- `POST /api/ventas` sigue funcionando: crea la venta y descuenta stock con transacción ACID.

El detalle se basa en los importes guardados en `venta_detalles`, no en precios actuales del catálogo. Las ventas quedan consultables tras desactivar productos (FK + baja lógica). Errores JSON y 404 para IDs inválidos.

Pruebas: Go/PostgreSQL con ventas reales y productos dados de baja, más la regresión de Playwright (Chromium) existente. Por ahora los listados están limitados a 100 sin paginación; antes de producción se requiere autenticación y roles.
