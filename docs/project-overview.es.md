# PulpeStock Web — Visión general del proyecto

Aplicación web de punto de venta + inventario para microcomercios locales
(pulperías). Este documento es el registro vivo de lo que existe en el repo,
las decisiones detrás y lo que viene. Leelo antes de extender el código.

> Versión en inglés: [Project overview (EN)](project-overview.md)

## Camino rápido

1. `pnpm install && pnpm dev` y abrí la app.
2. La primera pantalla es **CU-06 — Punto de Venta** (el único módulo
   implementado).
3. Explorá `src/features/pos/` para entender el POS; `src/components/layout/`
   para el shell de la app; `src/data/products.js` para el catálogo de muestra.
4. Para verificar un cambio: `pnpm lint && pnpm build`.

## Estado actual

| Área | Estado |
|------|--------|
| Scaffold: Vite + React 19 + Tailwind v4 | Hecho |
| Registro completo de shadcn/ui sobre Base UI (`base-nova`, modo JS) | Hecho |
| CU-06 Punto de venta + salida de stock | Hecho |
| Shell de la app (sidebar, header, perfil) | Hecho |
| Navegación de módulos futuros (placeholders) | Hecho |
| Tema claro/oscuro | Hecho |
| Autenticación / cerrar sesión | Pendiente — solo toast demo |
| Módulos de inventario (productos, categorías, movimientos) | Pendiente |
| Historial de ventas, caja, reportes, clientes, proveedores, compras, usuarios | Pendiente |

## Decisiones

| Tema | Decisión |
|------|----------|
| Framework | Vite 8 + React 19 |
| Lenguaje | JavaScript (JSX). TypeScript es recomendado por shadcn, pero el proyecto nació en JS y sigue en JS (`components.json` con `tsx: false`). |
| Base de componentes | shadcn/ui sobre **Base UI** (`--base base`), preset `Nova`, íconos `lucide` |
| Estilos | Tailwind CSS v4 vía `@tailwindcss/vite`; tokens en `src/index.css`; variante `.dark` en `html` |
| Moneda | Córdobas nicaragüenses `C$` (`Intl` `es-NI` / `NIO`) en `src/lib/format.js` |
| Estado | Estado local de React por pantalla; sin store global ni router todavía |
| Texto de UI | Español; identificadores y comentarios de código en inglés |
| Imports | Alias `@/` → `src/`; componentes desde `@/components/ui/...` |

## Modelo de datos del dominio (catálogo de muestra)

Los productos viven en `src/data/products.js` con esta forma:

| Campo | Propósito |
|-------|-----------|
| `id` | Clave estable (string) |
| `nombre` | Nombre visible (español) |
| `categoria` | Id de categoría: `abarrotes`, `bebidas`, `lacteos`, `limpieza` |
| `precioVenta` | Precio unitario en C$ |
| `stockActual` | Existencia actual |
| `stockMinimo` | Umbral de stock bajo |
| `codigoBarras` | Código EAN simulado que usa la búsqueda |

`getStockStatus(product)` devuelve `agotado` (stock 0), `bajo`
(`stockActual <= stockMinimo`) o `disponible`.

## Funcionalidades implementadas

### CU-06 — Punto de Venta Rápido y Salida de Stock

| Requisito | Implementación |
|-----------|----------------|
| Búsqueda por nombre o código de barras simulado | `ProductCatalog` filtra por `nombre` y `codigoBarras` |
| Filtro por categoría | Botones tipo chip (`Todas` + 4 categorías) |
| Tarjetas con precio y existencias en vivo | `ProductCard` con `formatCurrency` y `StockBadge` |
| Deshabilitar agregar con stock 0 | El botón se deshabilita cuando `stockActual === 0` o el carrito llegó al stock |
| Ticket con controles de cantidad | Filas de `SalesTicket`: `-` / cantidad / `+` y eliminar (`Trash2`) |
| Validación de stock | La cantidad no puede superar `stockActual`; `+` se deshabilita en el límite |
| Subtotal / total / vuelto | Derivados del carrito y el efectivo; `Alert` cuando el efectivo no alcanza |
| Cobrar y descontar stock | Al confirmar actualiza el catálogo de forma reactiva, muestra toast de éxito y limpia ticket y efectivo |
| Objetivos táctiles | Botones de 40–48 px, CTA principal de 48 px |
| Retroalimentación | Toasts de Base UI vía `@/components/ui/toast` (`toast.add`) |

Archivos clave: `src/features/pos/PosScreen.jsx` (orquestación de estado),
`ProductCatalog.jsx`, `ProductCard.jsx`, `SalesTicket.jsx`,
`MobileCheckoutBar.jsx`.

### Estrategia de layout y scroll

- **Desktop (≥ `lg`)**: alto de trabajo fijo (`h-svh`), sin scroll de página.
  Dos columnas: catálogo (búsqueda/filtros fijos, grilla con scroll interno) y
  ticket (ítems con scroll interno, totales + cobrar siempre visibles).
- **Móvil**: el contenido se apila; el catálogo tiene altura acotada
  (`max-h-[62svh]`), los ítems del ticket están acotados (`max-h-[55svh]`) y
  una barra de cobro fija al fondo muestra total + “Cobrar” para que la acción
  de cobro nunca se pierda.

### Shell de la aplicación

- `AppSidebar` con modo colapsado a íconos; marca arriba.
- Los grupos y módulos de navegación se declaran en
  `src/components/layout/navigation.js` (fuente única para sidebar, título del
  header y páginas placeholder).
- Header: trigger del sidebar, título del módulo activo, toggle de tema y menú
  de perfil.
- El menú de perfil (`UserMenu`) muestra la sesión activa y **Cerrar sesión**
  (hoy es un toast demo hasta que exista autenticación).
- Solo `pos` está conectado a una pantalla; el resto renderiza
  `ModulePlaceholder`.

> Gotcha: el `DropdownMenuLabel` de este dropdown de Base UI **debe** estar
> dentro de un `DropdownMenuGroup`; si no, abrir el menú crashea React
> (pantalla en blanco).

### Tema

- `theme-provider.jsx`: lee `pulpestock-theme` de `localStorage`, usa como
  fallback `prefers-color-scheme`, togglea `.dark` en `<html>` y persiste.
- `index.html` tiene un script inline que aplica el tema antes del primer
  render (evita el destello).

### Tooling de agentes a nivel proyecto

- `.opencode/opencode.json`: registra el **MCP server de shadcn**
  (`pnpm dlx shadcn@latest mcp`) y apunta `skills.paths` a `.agents/skills`.
- `.agents/skills/shadcn/`: la skill oficial de shadcn (CLI, MCP, registry,
  theming y reglas de composición). Se quitó `migrate-radix-to-base` porque el
  proyecto ya corre sobre Base UI.
- El CLI de shadcn es dependencia local: preferí `pnpm shadcn <comando>`.

## Convenciones para trabajo futuro

- Agregar componentes shadcn con `pnpm shadcn add <componente>` y mantenerlos
  editables bajo `src/components/ui`.
- Mantener los datos de navegación en `navigation.js`; las pantallas mapean ids
  → componentes en `AppShell` (`ModulePlaceholder` hasta implementar).
- Texto de UI en español, código en inglés, commits convencionales, sin
  atribución de IA.
- Si renombrás o quitás un ítem de menú, verificá que nada referencie el `id`
  viejo.

## Roadmap (módulos pendientes)

CRUD de productos, categorías, movimientos de stock, compras, clientes,
proveedores, historial de ventas, caja / cierre diario, reportes y alertas de
stock bajo, usuarios y roles, configuración y autenticación real.

## Checklist para un cambio con calidad de entrega

- [ ] `pnpm lint` pasa (los warnings de los `ui/` generados son preexistentes)
- [ ] `pnpm build` pasa
- [ ] Objetivos táctiles y flujo móvil mantienen “Cobrar” alcanzable
- [ ] Documentación en inglés y español actualizada cuando cambia el comportamiento

## Registro de cambios

| Fecha | Cambio | Archivos clave |
|-------|--------|----------------|
| 2026-09-04 | Scaffold React + Vite; conexión de shadcn/ui (Base UI, registro completo, modo JS); MCP + skill de shadcn a nivel proyecto | `components.json`, `vite.config.js`, `.opencode/`, `.agents/` |
| 2026-09-04 | CU-06 POS: catálogo, ticket, salida de stock, toasts | `src/features/pos/*` |
| 2026-09-04 | Shell de la app, sidebar, menú de perfil, tema claro/oscuro, scrolls independientes | `src/components/layout/*` |
| 2026-09-04 | Navegación ampliada al mapa completo de módulos POS + inventario | `src/components/layout/navigation.js` |
| 2026-09-04 | README bilingüe + documentación viva (este archivo) | `README.md`, `README.es.md`, `docs/*` |
