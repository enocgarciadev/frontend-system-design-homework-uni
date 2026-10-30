# Stack I — API de reportes de inventario y ventas

Base: Stack H (login + roles). API disponible únicamente para el rol `admin`.

`GET /api/reportes/resumen` ofrece:
- `productsTotal`: cantidad de productos activos.
- `lowStockCount`: productos activos cuya existencia es menor o igual al mínimo.
- `outOfStockCount`: activos con existencia 0.
- `salesToday` y `revenueToday`: ventas del día civil de Nicaragua (`America/Managua`).
- `lowStockProducts`: hasta 50 artículos prioritarios para reposición.

Precios monetarios se agregan en centavos de PostgreSQL y se devuelven en córdobas. Restringido a administradores: la sesión de un vendedor recibe HTTP 403.

Go/PostgreSQL verifica contadores y productos bajo mínimo. El siguiente Stack J agrega pantalla de reportes y prueba visual con Playwright. Para despliegue externo falta configuración de HTTPS, rate limiting y monitoreo.
