# Stack G — Base de autenticación en Go + PostgreSQL

Base: PR #9 (historial React). Este PR crea la infraestructura de seguridad, y el siguiente **Stack H** la hará obligatoria en todas las rutas de negocio y añadirá el login React. **No fusionar G sin H** si el despliegue necesita protección.

- Migración SQL agrega `usuarios` (rol `admin` o `vendedor`, activo) y `sesiones` (tokens aleatorios almacenados solamente como SHA256).
- Contraseñas: PBKDF2-HMAC-SHA256, 310 000 iteraciones, salt aleatorio por usuario; sin contraseñas en el repositorio.
- `POST /api/auth/login`: devuelve datos del usuario y CSRF, establece cookie HttpOnly, SameSite Strict, expiración 8 horas.
- `GET /api/auth/me`: valida sesión persistida y expirada.
- `POST /api/auth/logout`: exige encabezado X-CSRF-Token y revoca sesión.
- `COOKIE_SECURE=true` es obligatorio detrás de un proxy TLS (local HTTP usa false); HTTPS siempre recomendado.

## Crear usuario de forma explícita
```sh
export DATABASE_URL='postgres://usuario:password@localhost:5432/pulpestock?sslmode=disable'
go run ./server/cmd/migrate
export BOOTSTRAP_NAME='Administrador'
export BOOTSTRAP_EMAIL='admin@ejemplo.com'
export BOOTSTRAP_ROLE='admin'
export BOOTSTRAP_PASSWORD='una-clave-unica-de-al-menos-12-caracteres'
go run ./server/cmd/createuser
```
`BOOTSTRAP_ROLE=vendedor` permite crear el segundo rol. Evitá guardar credenciales reales en .env versionados.

## Pruebas
`go test -race ./server/...` prueba hash con salt, login correcto/incorrecto, cookie, sesión persistida, CSRF de cierre y revocación en PostgreSQL.

## Pendiente para siguiente stacked PR
Los endpoints de productos/ventas/movimientos *aún no exigen* autenticación hasta implementar en conjunto el middleware de roles y el frontend. No presentar G aisladamente como sistema protegido.
