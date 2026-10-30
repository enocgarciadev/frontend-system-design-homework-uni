# PR 2 — Persistencia de ventas y existencias (Go + PostgreSQL)

## Alcance
- Go + `net/http` + `database/sql` con driver PostgreSQL `github.com/lib/pq`.
- `GET /api/productos`: catálogo persistente, en JSON y compatible con la interfaz actual.
- `POST /api/ventas`: valida entrada, calcula total con precios del servidor y ejecuta transacción ACID.
- Bloqueos `SELECT ... FOR UPDATE` en orden estable. Registro de venta, detalles, movimientos de stock y descuento de existencias dentro de un mismo `COMMIT`.
- Solicitudes idempotentes con `requestId`: reintentar la misma petición no duplica la venta.
- React consume Go; una venta solo se muestra como confirmada si el backend la confirma. Después refresca el catálogo.

## Datos y despliegue local
Requiere Go 1.23+, Node.js 22, pnpm 10 y PostgreSQL 16+. Crear una base vacía `pulpestock` y definir:
```bash
export DATABASE_URL='postgres://pulpestock:password@127.0.0.1:5432/pulpestock?sslmode=disable'
go run ./server/cmd/migrate
go run ./server/cmd/api
```
En otra terminal: `pnpm install --frozen-lockfile && pnpm dev`. Abrir `http://127.0.0.1:5173`. No guardar credenciales reales en Git.

El comando `migrate` se ejecuta explícitamente. Las sentencias `CREATE TABLE IF NOT EXISTS` y `INSERT ... ON CONFLICT DO NOTHING` evitan sobrescribir existencias de la demo al repetirlo. **No equivalen todavía a un sistema versionado de migraciones evolutivas**; se mejorará antes de producción.

### Contratos REST
```http
GET /api/productos
200 [{ "id": "arroz-faisan-1lb", "nombre": "Arroz Faisán 1lb", "categoria": "abarrotes", "precioVenta": 38, "stockActual": 24, "stockMinimo": 6, "codigoBarras": "7441001000017" }]

POST /api/ventas
Content-Type: application/json
{ "requestId":"4f47c459-0ba0-4d7e-b60f-bdf8d960399a", "cashReceived":100, "items":[{"productId":"arroz-faisan-1lb","quantity":1},{"productId":"frijol-rojo-1lb","quantity":1}] }
201 { "id": 1, "total": 80, "vuelto": 20, "reused": false }
```

Error `400` por solicitudes inválidas, `404` por productos inexistentes, `409` si falta stock o se reutiliza una clave con datos distintos, `422` por efectivo insuficiente, `503` sin base disponible.

## Pruebas
```bash
go test -race ./server/...
go vet ./server/...
pnpm lint
pnpm build
npm install --prefix e2e
./e2e/node_modules/.bin/playwright install chromium
npm --prefix e2e test
```

La integración Go/PostgreSQL se ejecuta si `DATABASE_URL` está configurado (de lo contrario, la prueba de integración marca `SKIP`). GitHub Actions levanta PostgreSQL 16, ejecuta las migraciones y pruebas con base real, y Playwright prueba escritorio 1440×900 y móvil 390×844 en Chromium. La prueba comprueba que el stock baja exactamente una unidad por producto y se mantiene después de recargar.

## Riesgos y trabajo pendiente
- Sin autenticación ni autorización. **No publicar a internet** endpoints de venta sin seguridad.
- Es necesario agregar gestión de productos, historial, reportes y roles en siguientes PRs.
- La API no integra pasarelas de pago ni servicios externos; es un primer servicio de negocio REST JSON.
- Usar TLS y controles de despliegue antes de entornos compartidos.
