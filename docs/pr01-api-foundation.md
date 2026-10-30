# PR 1 — Base de API y verificación frontend–backend

## Objetivo
Agregar una capa de servidor verificable sin modificar las reglas del POS ni afirmar que exista persistencia.

## Qué existe
- Servidor Node.js sin dependencias adicionales que expone `GET /api/health`, devuelve JSON y errores 404/405 coherentes.
- Proxy de desarrollo Vite `/api` → `http://127.0.0.1:3001`.
- Indicador accesible de estado de API en el header, disponible en escritorio y móvil.
- Pruebas de API con `node:test` y pruebas de navegador reales con Playwright + Chromium en CI.

## Qué NO existe todavía
- Express, PostgreSQL, persistencia, login, roles ni endpoints de negocio.
- Registrar una venta continúa modificando solo el estado local de React. Recargar restablece las existencias.
- No confundir este endpoint de diagnóstico con la API de ventas que requiere el Trabajo 12.

## Ejecución local
Requiere Node.js 22 y pnpm 10. En dos terminales:

```bash
pnpm install --frozen-lockfile
pnpm api:start
```

```bash
pnpm dev
```

Comprobar `http://127.0.0.1:3001/api/health` y la app en `http://127.0.0.1:5173`.

## Pruebas
```bash
pnpm lint
pnpm build
pnpm test:api
npm install --prefix e2e
./e2e/node_modules/.bin/playwright install chromium
npm --prefix e2e test
```

Playwright levanta el frontend y la API automáticamente, prueba Chromium en 1440×900 y 390×844, verifica la conexión y repite el flujo de cobro CU-06.

## Siguiente PR
Introducir persistencia y endpoints de productos/ventas, con validación del lado servidor y transacciones reales. Elegir y fijar dependencias de backend (Express/PostgreSQL) y sus lockfiles en ese PR.

## Nota de despliegue
El proxy de Vite sirve solo para desarrollo. Si se publica el frontend en otro origen, definir `VITE_API_BASE_URL` al compilar y habilitar CORS restringido en la API antes de habilitar esa topología. No publicar el backend actual como servicio de negocio.
