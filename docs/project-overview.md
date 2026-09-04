# PulpeStock Web — Project Overview

A point-of-sale + inventory web app for local micro-stores (pulperías). This
document is the living record of what exists in the repo, the decisions behind
it, and what comes next. Read it before extending the codebase.

> Spanish version: [Visión general del proyecto (ES)](project-overview.es.md)

## Quick path

1. `pnpm install && pnpm dev` and open the app.
2. The first screen is **CU-06 — Punto de Venta** (the only implemented module).
3. Browse `src/features/pos/` to understand the POS; `src/components/layout/`
   for the app shell; `src/data/products.js` for the sample catalog.
4. To verify a change: `pnpm lint && pnpm build`.

## Current state

| Area | Status |
|------|--------|
| Scaffold: Vite + React 19 + Tailwind v4 | Done |
| shadcn/ui full registry on Base UI (`base-nova`, JS mode) | Done |
| CU-06 Point of sale + stock out | Done |
| App shell (sidebar, header, profile) | Done |
| Navigation for future modules (placeholders) | Done |
| Light/dark theme | Done |
| Auth / log out | Pending — demo toast only |
| Inventory modules (products, categories, movements) | Pending |
| Sales history, cash drawer, reports, clients, suppliers, purchases, users | Pending |

## Decisions

| Topic | Decision |
|-------|----------|
| Framework | Vite 8 + React 19 |
| Language | JavaScript (JSX). TypeScript is recommended by shadcn, but the project was scaffolded as JS and stays JS (`components.json` has `tsx: false`). |
| Component base | shadcn/ui on **Base UI** (`--base base`), preset `Nova`, icons `lucide` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`; tokens in `src/index.css`; `.dark` variant on `html` |
| Currency | Nicaraguan córdobas `C$` (`Intl` `es-NI` / `NIO`) in `src/lib/format.js` |
| State | Local React state per screen; no global store, no router yet |
| UI copy | Spanish; code identifiers and comments English |
| Imports | Alias `@/` → `src/`; components from `@/components/ui/...` |

## Domain data model (catalog sample)

Products live in `src/data/products.js` and follow this shape:

| Field | Purpose |
|-------|---------|
| `id` | Stable string key |
| `nombre` | Display name (Spanish) |
| `categoria` | Category id: `abarrotes`, `bebidas`, `lacteos`, `limpieza` |
| `precioVenta` | Unit price in C$ |
| `stockActual` | Current stock |
| `stockMinimo` | Low-stock threshold |
| `codigoBarras` | Simulated EAN barcode used by the search |

`getStockStatus(product)` returns `agotado` (stock 0), `bajo`
(`stockActual <= stockMinimo`), or `disponible`.

## Implemented features

### CU-06 — Quick point of sale and stock out

| Requirement | Implementation |
|-------------|----------------|
| Search by name or simulated barcode | `ProductCatalog` filters `nombre` and `codigoBarras` |
| Category filter | Chip buttons (`Todas` + 4 categories) |
| Product cards with price and live stock | `ProductCard` with `formatCurrency`, `StockBadge` |
| Disable add at zero stock | Add button disabled when `stockActual === 0` or cart reached stock |
| Ticket with quantity controls | `SalesTicket` table rows: `-` / quantity / `+`, delete (`Trash2`) |
| Stock validation | Quantity cannot exceed `stockActual`; `+` disables at the limit |
| Subtotal / total / change | Derived from cart and cash input; `Alert` when cash is insufficient |
| Charge and deduct stock | Confirmation updates the catalog reactively, shows a success toast, clears ticket and cash |
| Tactile targets | Buttons ≥ 40–48 px, primary CTA 48 px |
| Feedback | Base UI toasts via `@/components/ui/toast` (`toast.add`) |

Key files: `src/features/pos/PosScreen.jsx` (state orchestration),
`ProductCatalog.jsx`, `ProductCard.jsx`, `SalesTicket.jsx`,
`MobileCheckoutBar.jsx`.

### Layout and scrolling strategy

- **Desktop (≥ `lg`)**: fixed workspace height (`h-svh`), no page scroll. Two
  columns: catalog (search/filters fixed, product grid scrolls internally) and
  ticket (items scroll internally, totals + charge always visible).
- **Mobile**: content stacks; catalog has a bounded height (`max-h-[62svh]`),
  ticket items are bounded (`max-h-[55svh]`), and a fixed bottom checkout bar
  shows total + “Cobrar” so the charge action is never lost.

### App shell

- `AppSidebar` with collapsible icon mode; brand at the top.
- Navigation groups and modules are declared in `src/components/layout/navigation.js`
  (single source for sidebar, header title, and placeholder pages).
- Header: sidebar trigger, active module title, theme toggle, profile menu.
- Profile menu (`UserMenu`) shows the active session and **Cerrar sesión**
  (currently a demo toast until auth exists).
- Only `pos` is wired to a screen; every other module renders
  `ModulePlaceholder`.

> Gotcha: `DropdownMenuLabel` in this Base UI dropdown **must** be inside a
> `DropdownMenuGroup`, otherwise opening the menu crashes React (white screen).

### Theme

- `theme-provider.jsx`: reads `pulpestock-theme` from `localStorage`, falls
  back to `prefers-color-scheme`, toggles `.dark` on `<html>`, persists choice.
- `index.html` has a small inline script to apply the theme before first paint
  (avoids a flash).

### Project-level agent tooling

- `.opencode/opencode.json`: registers the **shadcn MCP server**
  (`pnpm dlx shadcn@latest mcp`) and points `skills.paths` at `.agents/skills`.
- `.agents/skills/shadcn/`: the official shadcn skill (CLI, MCP, registry,
  theming and composition rules). `migrate-radix-to-base` was removed because
  this project already runs on Base UI.
- Shadcn CLI is a local dependency: prefer `pnpm shadcn <command>`.

## Conventions for future work

- Add shadcn components with `pnpm shadcn add <component>`, then keep them
  editable under `src/components/ui`.
- Keep navigation data in `navigation.js`; screens map ids → components in
  `AppShell` (`ModulePlaceholder` until implemented).
- UI strings Spanish, code English, commits conventional, no AI attribution.
- Whenever a menu item is renamed/removed, check that nothing references the
  old `id`.

## Roadmap (pending modules)

Products CRUD, categories, stock movements, purchases, clients, suppliers,
sales history, cash drawer / daily close, reports and low-stock alerts, users
and roles, settings, and real authentication.

## Checklist for a release-quality change

- [ ] `pnpm lint` passes (warnings from generated `ui/` files are pre-existing)
- [ ] `pnpm build` passes
- [ ] Touch targets and mobile flow keep “Cobrar” reachable
- [ ] English and Spanish docs updated when behavior changes

## Update log

| Date | Change | Key files |
|------|--------|-----------|
| 2026-09-04 | Scaffold React + Vite; connect shadcn/ui (Base UI, full registry, JS mode); project-level shadcn MCP + skill | `components.json`, `vite.config.js`, `.opencode/`, `.agents/` |
| 2026-09-04 | CU-06 POS: catalog, ticket, stock out, toasts | `src/features/pos/*` |
| 2026-09-04 | App shell, sidebar navigation, profile menu, light/dark theme, independent scroll areas | `src/components/layout/*` |
| 2026-09-04 | Expanded navigation to full POS + inventory module map | `src/components/layout/navigation.js` |
| 2026-09-04 | Bilingual README + living docs (this file) | `README.md`, `README.es.md`, `docs/*` |
