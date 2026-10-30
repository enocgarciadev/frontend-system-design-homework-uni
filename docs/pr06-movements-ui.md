# Stack D — Interfaz React de movimientos

Basado en Stack C, el backend de movimientos.

La pantalla **Movimientos** permite entradas y ajustes positivos/negativos de stock. En edición de productos no se admiten cambios directos de existencias; el servidor registra cada movimiento y stock en una sola transacción PostgreSQL.

Playwright en Chromium desktop y mobile verifica entrada, ajuste negativo, recarga y protección contra stock negativo. Las pruebas anteriores del POS y CRUD permanecen.
