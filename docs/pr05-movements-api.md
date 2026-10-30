# Stack C — Movimientos de inventario (API Go)

Base de este PR: Stack B, interfaz de productos (`feat/pr04-products-react-ui`). El frontend del módulo Movimientos se construirá en el siguiente stacked PR.

## Contrato HTTP
- `GET /api/movimientos`: devuelve los últimos 100 eventos con información de producto, tipo, cantidad y fecha. Incluye también movimientos de ventas anteriores (`type=venta`).
- `POST /api/movimientos` con JSON `{"productId":"arroz-faisan-1lb","type":"entrada","quantity":5}` agrega 5 unidades.
- `type=ajuste` permite cantidad positiva o negativa. `type=entrada` solo cantidad positiva.
- Respuesta 201 devuelve el movimiento registrado y el nuevo stock; 400/404/409 cubren datos inválidos, producto inexistente o existencias insuficientes.

El servidor bloquea el producto `FOR UPDATE` durante la operación. El registro de auditoría y el nuevo stock se confirman en una sola transacción SQL; ante fallo ocurre `ROLLBACK`. Stock negativo está prohibido. Los formularios de ficha de producto no pueden eludir este proceso.

## Pruebas
`go test -race ./server/...` con `DATABASE_URL` ejecuta operaciones reales con PostgreSQL y prueba que un ajuste rechazado no modifica la base. La regresión de Chromium continúa ejecutándose en CI.

## Pendientes
Identidad de usuario y motivo detallado del ajuste, idempotencia de movimientos, paginación de historial y autenticación/roles: no desplegar públicamente.
