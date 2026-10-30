# Stack H — Login React, RBAC y protección de API

Base: Stack G / PR #10. La integración requiere los dos PRs en orden.

## Comportamiento
- El usuario debe iniciar sesión para acceder a las pantallas y a todas las APIs de negocio.
- `admin`: puede administrar productos y movimientos; también realizar y consultar ventas.
- `vendedor`: puede usar el POS, consultar productos y consultar ventas. El backend impide cambios de producto y ajustes de inventario.
- Los métodos POST, PUT, PATCH y DELETE en rutas de negocio exigen `X-CSRF-Token` vinculado a la sesión.
- React añade el token automáticamente mediante `apiFetch`, y ofrece login y cierre de sesión reales.
- Las sesiones están guardadas en PostgreSQL: revocar una sesión impide seguir usando la API.

## Desarrollo y pruebas
1. Migrar esquema: `go run ./server/cmd/migrate`.
2. Crear cuentas explícitamente con `go run ./server/cmd/createuser` y las variables `BOOTSTRAP_NAME`, `BOOTSTRAP_EMAIL`, `BOOTSTRAP_ROLE`, `BOOTSTRAP_PASSWORD`.
3. Iniciar Go y Vite. Probar login, venta y cierre.
4. CI utiliza exclusivamente una clave de demostración y corre Go/PostgreSQL, lint/build React y Playwright Chromium escritorio/móvil.

## Limitaciones
- No hay aún recuperación de contraseñas, interfaz de administración de cuentas, rate limiting distribuido ni MFA.
- `COOKIE_SECURE=true` es obligatorio cuando Go está detrás de un proxy que termina TLS.
- No usar esta demo para datos reales hasta endurecimiento y auditoría de seguridad.
