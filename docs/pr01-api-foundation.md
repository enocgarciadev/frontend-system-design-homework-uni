# PR 1 — API en Go y pruebas frontend–backend

## Objetivo
Agregar un servidor HTTP funcional escrito en **Go**, manteniendo React en el frontend y sin modificar la lógica del punto de venta (CU-06).

## Implementado
- API Go 1.23 con la biblioteca estándar `net/http`.
- `GET /api/health` devuelve JSON 200, solicitudes con métodos no permitidos JSON 405 y rutas desconocidas JSON 404.
- Vite redirige `/api` a `http://127.0.0.1:3001` en desarrollo.
- El frontend presenta un indicador de estado de conexión.
- Pruebas `go test` y `go vet`, más Playwright/Chromium en GitHub Actions en escritorio y móvil.

## Lo que NO se ha implementado
PostgreSQL, endpoints de negocio, autenticación y ventas persistentes. El POS sigue usando datos locales de React; recargar reinicia el stock. El endpoint de salud no sustituye la integración de servicios de negocio requerida en el Trabajo 12.

## Cómo iniciar localmente
Requiere Go 1.23+, Node.js 22 y pnpm 10. En una terminal ejecutar:

```sh
go run ./server/cmd/api
```

En otra:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Probar `http://127.0.0.1:3001/api/health` y abrir `http://127.0.0.1:5173`.
Se puede configurar `PORT` (por defecto 3001) y `HOST` (por defecto 127.0.0.1).

## Verificación
```sh
go test ./server/...
go vet ./server/...
pnpm lint
pnpm build
npm install --prefix e2e
./e2e/node_modules/.bin/playwright install chromium
npm --prefix e2e test
```

Playwright arranca automáticamente Go y Vite, comprueba el estado de la API y ejecuta el caso de uso de cobro en Chromium 1440×900 y 390×844. No dar por aprobada la validación en navegador hasta ver los resultados de CI.

## Próximo PR
Base de datos PostgreSQL, API REST para productos y ventas, validaciones del servidor y transacciones ACID, manteniendo Go como lenguaje de backend.

## Nota de despliegue
El proxy Vite es de desarrollo. Un frontend servido desde otro dominio requiere configuración de URL y CORS con orígenes permitidos, además de HTTPS y autenticación antes de operaciones de negocio.
