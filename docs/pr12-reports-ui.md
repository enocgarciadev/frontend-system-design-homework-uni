# Stack J — Reportes en React

Basado en Stack I (API Go, solo admin) y en los módulos previos de stock, ventas y autenticación.

La pantalla Reportes muestra 5 indicadores (productos activos, bajo mínimo, sin existencias, ventas e ingresos de hoy) y un listado de reposición, consultando datos reales de PostgreSQL.

La API restringe este módulo a `admin`, y el sidebar oculta Reportes para vendedores. Playwright Chromium, escritorio y móvil, compara los contadores con la respuesta real de la API y comprueba persistencia tras recargar.

Para un MVP académico, los indicadores son suficiente evidencia de la quinta funcionalidad. Quedan para iteraciones futuras filtros históricos, gráficos, paginación y exportación.
