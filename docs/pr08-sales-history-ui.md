# Stack F — Historial de ventas en React

Basado en Stack E (API Go de historial), que a su vez depende de los stacks de movimientos, productos y ventas persistentes.

El módulo **Ventas** muestra las últimas 100 ventas confirmadas desde PostgreSQL y permite consultar el detalle del ticket: líneas, cantidades, precios unitarios, total, efectivo y vuelto.

No modifica ventas ni recalcula importes usando precios vigentes; la pantalla usa datos registrados cuando ocurrió la operación.

E2E Playwright/Chromium desktop y móvil: crea una venta por API real, navega al historial, visualiza el detalle y comprueba que el ticket sigue presente tras recargar.

Pendiente: paginación, exportación de tickets, filtros y, antes de cualquier publicación, autenticación y autorización.
