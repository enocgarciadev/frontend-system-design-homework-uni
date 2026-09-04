import {
  ArrowLeftRight,
  BarChart3,
  ClipboardList,
  Package,
  ReceiptText,
  Settings,
  Store,
  Tags,
  Truck,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react'

/**
 * Navegación principal del sistema (módulos).
 * `pos` es el único implementado hoy; el resto se reserva para futuros
 * casos de uso del sistema de inventario y punto de venta.
 */
export const NAV_GROUPS = [
  {
    label: 'Punto de Venta',
    items: [
      {
        id: 'pos',
        label: 'Punto de Venta',
        description: 'Cobro rápido y salida de stock',
        icon: Store,
      },
      {
        id: 'ventas',
        label: 'Ventas',
        description: 'Historial de transacciones y tickets',
        icon: ReceiptText,
      },
      {
        id: 'caja',
        label: 'Caja / Arqueo',
        description: 'Apertura, cierre y arqueo de caja',
        icon: Wallet,
      },
    ],
  },
  {
    label: 'Inventario',
    items: [
      {
        id: 'productos',
        label: 'Productos',
        description: 'Alta, edición y precios de productos',
        icon: Package,
      },
      {
        id: 'categorias',
        label: 'Categorías',
        description: 'Organización de productos por rubro',
        icon: Tags,
      },
      {
        id: 'movimientos',
        label: 'Movimientos',
        description: 'Entradas, salidas y ajustes de stock',
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    label: 'Clientes y Proveedores',
    items: [
      {
        id: 'clientes',
        label: 'Clientes',
        description: 'Cuentas corrientes y compras frecuentes',
        icon: Users,
      },
      {
        id: 'proveedores',
        label: 'Proveedores',
        description: 'Catálogo y datos de compra de proveedores',
        icon: Truck,
      },
      {
        id: 'compras',
        label: 'Compras',
        description: 'Reposición de stock a proveedores',
        icon: ClipboardList,
      },
    ],
  },
  {
    label: 'Administración',
    items: [
      {
        id: 'reportes',
        label: 'Reportes',
        description: 'Métricas, alertas de stock y ganancias',
        icon: BarChart3,
      },
      {
        id: 'usuarios',
        label: 'Usuarios y roles',
        description: 'Accesos y permisos del personal',
        icon: UserCog,
      },
      {
        id: 'configuracion',
        label: 'Configuración',
        description: 'Ajustes del sistema y del negocio',
        icon: Settings,
      },
    ],
  },
]

/** Lista plana de módulos para resolver título/descripción por id. */
export const MODULES = NAV_GROUPS.flatMap((group) => group.items)

export function getModuleById(id) {
  return MODULES.find((module) => module.id === id)
}
