# Trabajo N.° 12 — Entrega final del MVP PulpeStock Web

Fuente de requisitos: «Trabajo N.° 12 — Entrega Final del Proyecto y Presentación del MVP», UNI, páginas 1–5.

## Entrega y estado verificable

PulpeStock Web es un MVP de punto de venta e inventario para pulperías.
La implementación final existe en **stacked PRs #3 a #13** y se integra en este PR final (#14), **basado en la rama del PR #13**, no en `main` hasta que se fusionen las dependencias.

- Frontend: React 19, Vite 8, Tailwind CSS 4.
- API HTTP: Go 1.23 `net/http`, JSON, rutas `/api/*`.
- Datos: PostgreSQL 16, migración explícita y transacciones de venta y movimientos.
- Autenticación: sesiones persistentes en PostgreSQL; roles `admin`/`vendedor`; CSRF para escrituras.
- Funciones demostrables: POS, productos, movimientos, historial, reportes; login habilita el acceso.
- CI: lint, build, pruebas Go `-race`, `go vet` y pruebas de navegador Chromium desktop/móvil.

El material de `docs/semana-7` es **histórico**: documenta el estado del 6/10/2026 y una API Node/Express propuesta, **no** la arquitectura actualmente implementada. No reutilizar ese texto como estado final sin corregirlo.

## Material de cierre

1. [Informe final fuente](informe-final.md)
2. [Matriz de requisitos y trazabilidad](matriz-trazabilidad.md)
3. [Manual de instalación, roles y demostración](manual-mvp.md)
4. [API y colección Postman](servicios-web.md) (colección en `postman/`)
5. [Guion de exposición de 10–15 minutos](guion-exposicion.md)
6. [Acta de evidencias y pendientes](validacion-y-pendientes.md)

## Archivos formales

El informe Word/PDF y la presentación PowerPoint se generan como archivos entregables separados a partir de estos contenidos. Deben rellenarse los **integrantes reales** y confirmar docente/fecha antes de subirlos. No atribuir nombres no proporcionados.

## Código comprimido

En GitHub Actions, el PR final crea el artefacto `PulpeStock-Web-Trabajo-12-fuente.zip` con el árbol de código versionado mediante `git archive`. Tras fusionar **toda la pila en orden** debe descargarse el ZIP del workflow de `main` para que corresponda al código final, no a una rama provisional.

## Comprobación de cierre

No declarar «entrega concluida» hasta confirmar: PRs fusionados; CI verde en `main`; ZIP final; DOCX o PPT con portada completa; cuenta de demo real; demostración de los cinco casos; participación del equipo; envío en la plataforma.
