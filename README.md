# PulpeStock Web

Point-of-sale and inventory web app for local micro-stores (pulperías). Built with
React + Vite + Tailwind CSS v4 and the full [shadcn/ui](https://ui.shadcn.com)
component set on **Base UI** (no Radix).

> Docs: [Project overview (EN)](docs/project-overview.md) ·
> [Visión general del proyecto (ES)](docs/project-overview.es.md) ·
> [README en español](README.es.md)

## Quick start

```bash
pnpm install     # install dependencies
pnpm dev         # start Vite dev server
pnpm build       # production build
pnpm lint        # oxlint
```

## What is implemented today

- **CU-06 — Quick point of sale with stock out**: reactive product catalog,
  search by name or simulated barcode, category filters, live stock badges,
  sale ticket with quantity controls and stock validation, automatic change
  (vuelto), and stock deduction on sale confirm without page reload.
- **Responsive two-pane POS**: on desktop the catalog and ticket are separate
  columns with their own scroll areas; on small screens the content stacks and
  a fixed checkout bar keeps the charge button always reachable.
- **App shell**: collapsible sidebar with the full POS + inventory navigation,
  sticky header, profile menu with log out (demo), and light/dark theme toggle.
- **Dark / light theme**: follows system preference on first visit, persists the
  choice, and applies before first paint (no flash).
- **Full shadcn/ui registry (61 components)** installed under
  `src/components/ui` with the `base` (Base UI) flavor, style `base-nova`,
  JavaScript mode (`tsx: false`).

## Stack

| Concern | Choice |
|---------|--------|
| Build | Vite 8 |
| Language | JavaScript (JSX) — no TypeScript yet |
| UI framework | React 19 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Component library | shadcn/ui on Base UI (`--base base`, preset Nova) |
| Icons | lucide-react |
| Package manager | pnpm |

## Project structure

```text
src/
├── main.jsx / App.jsx          # entry → ThemeProvider + AppShell + Toaster
├── index.css                   # Tailwind + shadcn Nova theme tokens (.dark)
├── components/
│   ├── layout/                 # AppShell, AppSidebar, navigation, UserMenu, ModeToggle, theme-provider
│   └── ui/                     # 61 shadcn/ui Base UI components (source, editable)
├── data/
│   └── products.js             # sample catalog + categories + stock status helper
├── features/
│   └── pos/                    # CU-06: catalog, ticket, checkout bar, state orchestration
└── lib/
    ├── format.js               # currency formatter (C$, es-NI / NIO)
    └── utils.js                # cn() utility
```

## Conventions

- Import from `@/components/ui/...` (alias `@` → `src`).
- UI copy is in Spanish; identifiers and code comments are in English.
- Add new shadcn components with `pnpm shadcn add <component>`.
- This repo also carries project-level agent tooling: the shadcn MCP server and
  the official shadcn skill (`.opencode/`, `.agents/skills/`).

## Contributing to this documentation

Docs live in `docs/`. Keep the English and Spanish files in sync and update
them as features land (see the "Update log" section in each overview).

---

Spanish version: [README.es.md](README.es.md)
