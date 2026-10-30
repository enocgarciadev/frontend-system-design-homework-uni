# Acta de verificación y pendientes de entrega

Fecha de preparación: 30 de octubre de 2026. Esta acta registra evidencia de CI disponible en GitHub, no sustituye una auditoría de infraestructura de producción.

## Evidencia existente

- PR #3: flujo de ventas, Go/PostgreSQL y Chromium; CI aprobada tras correcciones.
- PR #5: CRUD de productos en navegador desktop y móvil (8/8 pruebas).
- PR #7: movimientos y rechazo de stock negativo (12/12 pruebas Chromium).
- PR #9: historial y tickets (14/14 pruebas Chromium).
- PR #11: autenticación y roles (16/16 pruebas Chromium).
- PR #13: reportes (18/18 pruebas Chromium).
- GitHub Actions dispone de compilación React, `go test -race ./server/...`, `go vet`, base PostgreSQL temporal y Chromium.

Son resultados de las ramas PR indicadas. **La CI de este PR final debe aprobarse también**. Hasta que se fusionen las ramas no equivalen a una validación del commit definitivo de `main`.

## Evidencias nuevas del PR final

El workflow genera screenshots de los módulos ejecutados en Chromium y adjunta un ZIP del código del commit en pruebas. Referenciar la URL del workflow exitoso y descargar los artefactos al entregar.

## Pendientes que requieren acción humana

- [ ] Revisar y fusionar la pila PR #3 → #14 **en orden**, actualizando las bases de PR después de los merges.
- [ ] Confirmar que la CI de `main` termine en verde y descargar ZIP de código de esa ejecución.
- [ ] Sustituir «[INTEGRANTES]» por nombres reales y verificar docente/fecha en Word/PPT.
- [ ] Ejecutar Postman con la colección y una cuenta de prueba, guardar resultados/capturas si el docente los solicita.
- [ ] Probar demo manual con PostgreSQL, dos roles y acceso estable a la API; preparar datos para las cinco funciones.
- [ ] Confirmar aceptación de PulpeStock (negocio comercial) como proyecto final si seguía vigente la consigna previa de trámite de institución pública.
- [ ] Confirmar si se exige publicación con URL accesible: **no se ha constatado despliegue público/DNS**.
- [ ] Confirmar todos los integrantes y distribuir la intervención equitativamente; ensayar para 10–15 min.
- [ ] Subir ZIP + informe formal o PPT a la plataforma y realizar exposición en vivo.

## Riesgos explícitos

No se implementó una integración con pasarelas externas: REST/JSON funciona entre React y Go, y se documenta una extensión futura. El método de Semana 7 fue OOHDM y no UWE/WebML completo. Los wireframes originales son anteriores a la API en Go. Sesiones y RBAC del MVP no bastan por sí solos para certificar seguridad productiva (TLS, limitación de intentos, recuperación de cuenta, backups y observabilidad son trabajos separados).
