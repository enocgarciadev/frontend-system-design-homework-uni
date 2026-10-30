# Stacked PR A — CRUD REST de productos (backend Go)

**Base:** PR #3 (ventas y stock persistentes). **Siguiente:** UI de Productos, basada en este PR.

Endpoints:
- `GET /api/productos` mantiene catálogo de activos para el POS.
- `POST /api/productos` crea un producto y exige id único, categoría existente, precio válido y stock inicial.
- `PUT /api/productos/{id}` modifica nombre, categoría, precio, stock mínimo y código de barras; **no** modifica existencias.
- `DELETE /api/productos/{id}` desactiva el producto (`activo=false`), sin borrar ventas históricas.

Pruebas: `go test -race ./server/...` con `DATABASE_URL`, `go vet ./server/...`, Playwright existente en CI. No se expone este servicio sin autenticación (PR posterior).

Se usan parámetros SQL, validaciones de servidor y códigos HTTP 400, 404, 409, 415 y 500. Los ajustes de stock deberán registrarse como movimientos en otro caso de uso; modificar la ficha del producto no permite saltar ese control.
