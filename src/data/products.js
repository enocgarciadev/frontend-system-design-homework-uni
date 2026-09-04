/**
 * Datos de muestra del catálogo de una pulpería.
 * Dominio local: id, nombre, categoria, precioVenta, stockActual, stockMinimo.
 */

export const CATEGORIES = [
  { id: 'abarrotes', label: 'Abarrotes' },
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'lacteos', label: 'Lácteos' },
  { id: 'limpieza', label: 'Limpieza' },
]

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category.label]),
)

export const PRODUCTS = [
  // Abarrotes
  {
    id: 'arroz-faisan-1lb',
    nombre: 'Arroz Faisán 1lb',
    categoria: 'abarrotes',
    precioVenta: 38,
    stockActual: 24,
    stockMinimo: 6,
    codigoBarras: '7441001000017',
  },
  {
    id: 'frijol-rojo-1lb',
    nombre: 'Frijol Rojo 1lb',
    categoria: 'abarrotes',
    precioVenta: 42,
    stockActual: 18,
    stockMinimo: 6,
    codigoBarras: '7441001000024',
  },
  {
    id: 'aceite-vegetal-1l',
    nombre: 'Aceite Vegetal 1L',
    categoria: 'abarrotes',
    precioVenta: 95,
    stockActual: 4,
    stockMinimo: 5,
    codigoBarras: '7441001000031',
  },
  {
    id: 'azucar-blanca-1lb',
    nombre: 'Azúcar Blanca 1lb',
    categoria: 'abarrotes',
    precioVenta: 34,
    stockActual: 9,
    stockMinimo: 5,
    codigoBarras: '7441001000048',
  },
  // Bebidas
  {
    id: 'coca-cola-500ml',
    nombre: 'Coca-Cola 500ml',
    categoria: 'bebidas',
    precioVenta: 30,
    stockActual: 12,
    stockMinimo: 8,
    codigoBarras: '7441001000055',
  },
  {
    id: 'agua-cristal-600ml',
    nombre: 'Agua Cristal 600ml',
    categoria: 'bebidas',
    precioVenta: 20,
    stockActual: 0,
    stockMinimo: 6,
    codigoBarras: '7441001000062',
  },
  {
    id: 'jugo-tampico-1l',
    nombre: 'Jugo Tampico 1L',
    categoria: 'bebidas',
    precioVenta: 55,
    stockActual: 7,
    stockMinimo: 4,
    codigoBarras: '7441001000079',
  },
  // Lácteos
  {
    id: 'leche-entera-1l',
    nombre: 'Leche Entera 1L',
    categoria: 'lacteos',
    precioVenta: 70,
    stockActual: 3,
    stockMinimo: 4,
    codigoBarras: '7441001000086',
  },
  {
    id: 'queso-fresco-1lb',
    nombre: 'Queso Fresco 1lb',
    categoria: 'lacteos',
    precioVenta: 85,
    stockActual: 10,
    stockMinimo: 4,
    codigoBarras: '7441001000093',
  },
  {
    id: 'yogurt-natural-1l',
    nombre: 'Yogurt Natural 1L',
    categoria: 'lacteos',
    precioVenta: 60,
    stockActual: 6,
    stockMinimo: 3,
    codigoBarras: '7441001000109',
  },
  // Limpieza
  {
    id: 'detergente-500g',
    nombre: 'Detergente en Polvo 500g',
    categoria: 'limpieza',
    precioVenta: 48,
    stockActual: 8,
    stockMinimo: 4,
    codigoBarras: '7441001000116',
  },
  {
    id: 'jabon-bano',
    nombre: 'Jabón de Baño',
    categoria: 'limpieza',
    precioVenta: 25,
    stockActual: 5,
    stockMinimo: 3,
    codigoBarras: '7441001000123',
  },
  {
    id: 'cloro-1l',
    nombre: 'Cloro 1L',
    categoria: 'limpieza',
    precioVenta: 22,
    stockActual: 1,
    stockMinimo: 4,
    codigoBarras: '7441001000130',
  },
]

/** Estado de existencia para UI: 'agotado' | 'bajo' | 'disponible' */
export function getStockStatus(product) {
  if (product.stockActual <= 0) return 'agotado'
  if (product.stockActual <= product.stockMinimo) return 'bajo'
  return 'disponible'
}
