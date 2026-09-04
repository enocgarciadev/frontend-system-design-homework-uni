# PulpeStock Web

Aplicación web de punto de venta e inventario para microcomercios locales
(pulperías). Construida con React + Vite + Tailwind CSS v4 y el set completo de
[shadcn/ui](https://ui.shadcn.com) sobre **Base UI** (sin Radix).

> Docs: [Project overview (EN)](docs/project-overview.md) ·
> [Visión general del proyecto (ES)](docs/project-overview.es.md) ·
> [English README](README.md)

## Inicio rápido

```bash
pnpm install     # instala dependencias
pnpm dev         # levanta el servidor de desarrollo de Vite
pnpm build       # build de producción
pnpm lint        # oxlint
```

## Qué hay implementado hoy

- **CU-06 — Punto de Venta Rápido y Salida de Stock**: catálogo reactivo con
  búsqueda por nombre o código de barras simulado, filtros por categoría,
  badges de existencia en vivo, ticket de venta con controles de cantidad y
  validación de stock, cálculo automático de vuelto y descuento de existencias
  al confirmar, sin recargar la página.
- **POS responsive de dos paneles**: en desktop el catálogo y el ticket son
  columnas separadas con scroll propio; en pantallas chicas el contenido se
  apila y una barra de cobro fija mantiene siempre accesible el botón de cobrar.
- **Shell de la aplicación**: sidebar colapsable con la navegación completa de
  POS + inventario, header sticky, menú de perfil con cerrar sesión (demo) y
  toggle de tema claro/oscuro.
- **Tema claro/oscuro**: arranca siguiendo la preferencia del sistema,
  persiste la elección y se aplica antes del primer render (sin destello).
- **Registro completo de shadcn/ui (61 componentes)** instalado en
  `src/components/ui` con la variante `base` (Base UI), estilo `base-nova`,
  en modo JavaScript (`tsx: false`).

## Stack

| Aspecto | Decisión |
|---------|----------|
| Build | Vite 8 |
| Lenguaje | JavaScript (JSX) — aún sin TypeScript |
| UI framework | React 19 |
| Estilos | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Librería de componentes | shadcn/ui sobre Base UI (`--base base`, preset Nova) |
| Íconos | lucide-react |
| Gestor de paquetes | pnpm |

## Estructura del proyecto

```text
src/
├── main.jsx / App.jsx          # entry → ThemeProvider + AppShell + Toaster
├── index.css                   # Tailwind + tokens de tema Nova de shadcn (.dark)
├── components/
│   ├── layout/                 # AppShell, AppSidebar, navigation, UserMenu, ModeToggle, theme-provider
│   └── ui/                     # 61 componentes de shadcn/ui Base UI (source, editables)
├── data/
│   └── products.js             # catálogo de muestra + categorías + helper de estado de stock
├── features/
│   └── pos/                    # CU-06: catálogo, ticket, barra de cobro, orquestación de estado
└── lib/
    ├── format.js               # formateador de moneda (C$, es-NI / NIO)
    └── utils.js                # utilidad cn()
```

## Convenciones

- Importar desde `@/components/ui/...` (alias `@` → `src`).
- El texto visible de la interfaz está en español; los identificadores y
  comentarios de código en inglés.
- Agregar componentes de shadcn con `pnpm shadcn add <componente>`.
- Este repo incluye tooling de agentes a nivel proyecto: el MCP de shadcn y la
  skill oficial de shadcn (`.opencode/`, `.agents/skills/`).

## Contribuir a esta documentación

La documentación vive en `docs/`. Mantené sincronizados los archivos en inglés
y español, y actualizalos a medida que se implementan features (ver sección
"Registro de cambios" en cada visión general).

---

Versión en inglés: [README.md](README.md)
