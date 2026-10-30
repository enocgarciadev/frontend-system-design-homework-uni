# Manual breve de instalación y demostración del MVP

**Requisitos:** Go 1.23+, Node.js 22, pnpm 10 y PostgreSQL 16+. Terminal para backend y frontend; no subir credenciales reales al repositorio.

## Inicio local (ambiente aislado)

1. Crear PostgreSQL `pulpestock` y un usuario con permisos sobre esa base.
2. Definir `DATABASE_URL` (solo desarrollo local `sslmode=disable`).
3. Ejecutar `go run ./server/cmd/migrate`: crea tablas y datos demo, sin sobreescribir los productos existentes.
4. Crear cuenta de admin: definir `BOOTSTRAP_NAME`, `BOOTSTRAP_EMAIL`, `BOOTSTRAP_ROLE=admin`, `BOOTSTRAP_PASSWORD` (mín. 12 caracteres); luego `go run ./server/cmd/createuser`.
5. Ejecutar `go run ./server/cmd/api` (por defecto 127.0.0.1:3001).
6. En otra terminal: `pnpm install --frozen-lockfile` y `pnpm dev`; abrir `http://127.0.0.1:5173`.
7. Login con la cuenta creada. Opcional: crear cuenta con `BOOTSTRAP_ROLE=vendedor` para demostrar 403 en funciones administrativas.

En producción tras proxy TLS configurar `COOKIE_SECURE=true`; no usar `sslmode=disable` fuera de desarrollo. No exponer bases de datos públicamente.

## Demo guiada de cinco funciones

**1. POS:** Login → Punto de Venta → elegir Arroz Faisán (C$38) y Frijol Rojo (C$42) → efectivo 50 (bloqueo esperado) → efectivo 100 → confirmar (C$80, vuelto C$20). Verificar descuenta stock y persiste tras recargar.

**2. Productos (admin):** Productos → Nuevo producto → registrar código único, precio, categoría y stock inicial → recargar → editar nombre/precio → desactivar. Verificar que desactivado desaparece de catálogo.

**3. Movimientos (admin):** Movimientos → escoger producto → entrada de +3 → ajuste de -1 → verificar historial, cantidades y recarga → intentar descuento que deje negativo (rechazo).

**4. Historial:** Ventas → seleccionar la venta del POS → consultar líneas, total, efectivo y vuelto → recargar y volver a consultar. Los precios provienen del registro histórico.

**5. Reportes (admin):** Reportes → comprobar total de productos, bajo stock, sin stock, ventas e ingresos del día y productos por reponer. Mostrar que un vendedor no tiene acceso al panel.

## Validación reproducible
```sh
go test -race ./server/...
go vet ./server/...
pnpm lint
pnpm build
npm install --prefix e2e
./e2e/node_modules/.bin/playwright install chromium
TEST_ADMIN_PASSWORD='clave-usuario-que-creaste' npm --prefix e2e test
```

La prueba Go de integración utiliza `DATABASE_URL`; si falta, algunos tests se marcan como SKIP. En CI PostgreSQL se inicia como servicio.

## Preparación de la entrega

- Fusionar PRs en orden; ejecutar CI verde en `main`.
- Descargar del workflow de main los artefactos ZIP de fuente y capturas.
- Completar nombres reales en informe y PPT; verificar requisitos de publicación con docente.
- Probar previamente la red y preparar plan B local con PostgreSQL, API y frontend.
