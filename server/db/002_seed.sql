-- Datos demostrativos: solo se insertan los que no existan.
INSERT INTO categorias (id, nombre) VALUES
('abarrotes', 'Abarrotes'), ('bebidas','Bebidas'), ('lacteos','Lácteos'), ('limpieza','Limpieza')
ON CONFLICT (id) DO NOTHING;

INSERT INTO productos (id,nombre,categoria_id,precio_centavos,stock_actual,stock_minimo,codigo_barras) VALUES
('arroz-faisan-1lb','Arroz Faisán 1lb','abarrotes',3800,24,6,'7441001000017'),
('frijol-rojo-1lb','Frijol Rojo 1lb','abarrotes',4200,18,6,'7441001000024'),
('aceite-vegetal-1l','Aceite Vegetal 1L','abarrotes',9500,4,5,'7441001000031'),
('azucar-blanca-1lb','Azúcar Blanca 1lb','abarrotes',3400,9,5,'7441001000048'),
('coca-cola-500ml','Coca-Cola 500ml','bebidas',3000,12,8,'7441001000055'),
('agua-cristal-600ml','Agua Cristal 600ml','bebidas',2000,0,6,'7441001000062'),
('jugo-tampico-1l','Jugo Tampico 1L','bebidas',5500,7,4,'7441001000079'),
('leche-entera-1l','Leche Entera 1L','lacteos',7000,3,4,'7441001000086'),
('queso-fresco-1lb','Queso Fresco 1lb','lacteos',8500,10,4,'7441001000093'),
('yogurt-natural-1l','Yogurt Natural 1L','lacteos',6000,6,3,'7441001000109'),
('detergente-500g','Detergente en Polvo 500g','limpieza',4800,8,4,'7441001000116'),
('jabon-bano','Jabón de Baño','limpieza',2500,5,3,'7441001000123'),
('cloro-1l','Cloro 1L','limpieza',2200,1,4,'7441001000130')
ON CONFLICT (id) DO NOTHING;
