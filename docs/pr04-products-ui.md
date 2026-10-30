# Stacked PR B — Gestión visual de productos

**Base:** `feat/pr03-products-go-api` (Stack A, API); depende también del PR #3 de ventas persistentes.

- Sustituye la pantalla placeholder de **Productos** por un módulo React funcional.
- Listado de productos activos, búsqueda, alta, edición y desactivación lógica.
- Formularios con campos etiquetados y estados de carga, error y confirmación.
- Los cambios se envían exclusivamente a los endpoints de Go/PostgreSQL del Stack A.
- La edición de una ficha no cambia `stockActual`: los movimientos deben conservar trazabilidad en otro caso de uso.
- Prueba Playwright + Chromium en escritorio y móvil: alta → recarga → edición → baja → recarga.
- Ejecuta además todos los tests de regresión del POS.

**Importante:** Todavía no existe autenticación ni permisos. No se debe desplegar la administración en internet antes de implementar la seguridad.
