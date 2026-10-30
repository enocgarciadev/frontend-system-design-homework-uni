# Contratos REST JSON y validación de servicios

La API Go implementa endpoints HTTP/JSON en /api. React utiliza fetch al servicio propio; **no hay integración externa funcional**. No se implementa SOAP/WSDL. Tampoco se afirma ejecución previa de Postman: la colección está preparada para probar manualmente.

## Autenticación y protección

| Método | Endpoint | Autorización |
|---|---|---|
| GET | /api/health | Pública |
| POST | /api/auth/login | Pública |
| GET | /api/auth/me | Sesión |
| POST | /api/auth/logout | Sesión + CSRF |
| GET | /api/productos | Sesión: admin/vendedor |
| POST | /api/productos | admin + CSRF |
| PUT | /api/productos/{id} | admin + CSRF |
| DELETE | /api/productos/{id} | admin + CSRF (baja lógica) |
| GET | /api/movimientos | admin |
| POST | /api/movimientos | admin + CSRF |
| GET | /api/ventas | admin/vendedor |
| GET | /api/ventas/{id} | admin/vendedor |
| POST | /api/ventas | admin/vendedor + CSRF |
| GET | /api/reportes/resumen | admin |

## Cuerpo y respuesta de ejemplo

```json
{"requestId":"f3f210e6-caa9-440e-a1b3-d90e321840f5","cashReceived":100,"items":[{"productId":"arroz-faisan-1lb","quantity":1},{"productId":"frijol-rojo-1lb","quantity":1}]}
```

La API calcula los precios: total esperado con datos demo sin cambios C$80, vuelto C$20. La respuesta de creación incluye id, total, vuelto, reused. Si se repite exactamente con el mismo requestId se recupera la venta en lugar de duplicarla.

Las rutas POST/PUT/DELETE de negocio requieren encabezado `X-CSRF-Token` devuelto por login o `GET /api/auth/me`, además de cookie de sesión. Usar el cookie jar de Postman. El servidor devuelve 400 por JSON o campos inválidos, 401 sin sesión, 403 por rol o CSRF, 404 recursos inexistentes, 409 stock insuficiente o conflicto, 422 efectivo menor que total.

## Postman

Importar `docs/trabajo-12/postman/PulpeStock-Web.postman_collection.json` y configurar variable `baseUrl=http://127.0.0.1:5173` (proxy Vite) o `http://127.0.0.1:3001` (Go directo). Ingresar `email` y `password` en variables de entorno/colección **locales**; no guardar claves reales en Git. Ejecutar primero Login: el script guarda `csrfToken` y Postman retiene la cookie del mismo host.

Para los ejemplos de venta usar `requestId` nuevo por operación, suficiente stock y efectivo adecuado. Mantener tests que alteran existencias en una base demo.

## Estrategia de integración futura (no implementada)

Pueden integrarse proveedores de factura electrónica, ERP o pasarelas de pago mediante adaptadores internos Go: HTTPS, autenticación de servicio, idempotencia, reintentos limitados y conciliación. Aún no hay clave/URL/contrato de tercero, por lo que los servicios externos se presentan solo como proyección.
