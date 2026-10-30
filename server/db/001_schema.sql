-- CU-06: datos relacionales y consistencia transaccional
CREATE TABLE IF NOT EXISTS categorias (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS productos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria_id TEXT NOT NULL REFERENCES categorias(id),
  precio_centavos BIGINT NOT NULL CHECK (precio_centavos > 0),
  stock_actual INTEGER NOT NULL CHECK (stock_actual >= 0),
  stock_minimo INTEGER NOT NULL CHECK (stock_minimo >= 0),
  codigo_barras TEXT UNIQUE,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS ventas (
  id BIGSERIAL PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  fingerprint TEXT NOT NULL,
  total_centavos BIGINT NOT NULL CHECK (total_centavos >= 0),
  efectivo_centavos BIGINT NOT NULL CHECK (efectivo_centavos >= total_centavos),
  vuelto_centavos BIGINT NOT NULL CHECK (vuelto_centavos >= 0),
  creada_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS venta_detalles (
  id BIGSERIAL PRIMARY KEY,
  venta_id BIGINT NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id TEXT NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario_centavos BIGINT NOT NULL CHECK (precio_unitario_centavos > 0),
  total_centavos BIGINT NOT NULL CHECK (total_centavos >= 0)
);
CREATE TABLE IF NOT EXISTS movimientos_stock (
  id BIGSERIAL PRIMARY KEY,
  venta_id BIGINT REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id TEXT NOT NULL REFERENCES productos(id),
  variacion INTEGER NOT NULL CHECK (variacion <> 0),
  tipo TEXT NOT NULL CHECK (tipo IN ('venta', 'entrada', 'ajuste')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_venta_detalles_venta ON venta_detalles(venta_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_stock(producto_id);
