# Semana 7 PulpeStock Web

Entrega consolidada de las cuatro actividades del Trabajo 6, basada en el material didáctico de Semana 7 y en el código real de PulpeStock Web.

- [Documento final DOCX](entrega/PulpeStock-Web-Semana-7.docx)
- [Documento final PDF](entrega/PulpeStock-Web-Semana-7.pdf)
- [Informe fuente legible](informe.md)
- [Contenido estructurado](contenido.json)
- [Evidencia de ejecución y medidas](capturas/evidencia.json)

El informe tiene **16 páginas**. Servicios Web ocupa las páginas 2–5, cumpliendo el requisito de 3–4 páginas para esa actividad.

## Cobertura del material docente

| Actividad y diapositiva | Entregable | Páginas finales |
| --- | --- | --- |
| Servicios Web, 33 | Dominio/DNS, hosting, datos/respaldos y arquitectura de integración | 2–5 |
| Metodología, 34 | Comparación HDM/RMM/OOHDM/WAE, cuatro razones y fases conceptual y navegacional aplicadas | 6–8 |
| Perspectivas, 35 | Contenido, navegación, dos wireframes y proceso CU-06 | 7–11 |
| Movilidad, 36 | Perfil/contexto, responsive mobile-first, cuatro breakpoints y capturas comparativas | 12–14 |
| Entrega y criterios, 37 | Documento consolidado, fuentes y verificación | 1–16 |

Material de referencia: `Material_Didactico_Diseño_Sistemas_Internet_2026_S7.pptx`, disponible en el proyecto de curso. Se consultó sin modificarlo. Las diapositivas 33–37 corresponden a páginas impresas 29–33 del material.

## Estado actual y propuesta

**Actual:** React 19, Vite 8, catálogo de 13 productos y 4 categorías, CU-06 en memoria, shell y destinos pendientes. Los módulos adicionales son placeholders. No existe backend, base de datos, autenticación real ni PWA. Recargar o salir de POS pierde el estado local.

**Propuesto:** nombres DNS sujetos a registro, Cloudflare Pages, API monolítica Node/Express en Render, PostgreSQL, transacción de venta, autenticación y respaldo externo. No se configuraron servicios, se contrataron dominios ni se implementó ese backend.

Los wireframes representan selección de productos en escritorio y revisión/cobro móvil del CU-06; no inventan módulos implementados. Los contextos de uso son supuestos de diseño, no entrevistas.

## Archivos

```text
semana-7/
├── README.md
├── informe.md
├── contenido.json
├── entrega/      # DOCX y PDF consolidados
├── diagramas/    # SVG editables y PNG para el documento
├── capturas/     # navegador real, escritorio y móvil, JSON de evidencia
└── scripts/     # capturas, diagramas y construcción del informe
```

Los SVG y PNG se generan con la misma geometría. El guion Python es la fuente de autoría que exporta JSON, Markdown y DOCX. Para cambios permanentes de texto, editar `scripts/construir_documento.py` y regenerar; editar solo el DOCX no actualiza el Markdown.

## Reproducir la aplicación y las capturas

Desde la raíz del repositorio:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm dev --host 127.0.0.1
```

En otra terminal, usar un entorno de documentación con Playwright y Chromium instalados (sin agregar dependencias al frontend):

```bash
PLAYWRIGHT_MODULE=/ruta/node_modules/playwright node docs/semana-7/scripts/capturar.cjs
```

`APP_URL` permite cambiar la URL de Vite. El script captura la app con viewport de 1440×900 y 390×844 CSS px, tema claro y escala 1. La emulación móvil activa entrada táctil; no es una prueba con teléfono físico. Los archivos entregados corresponden al 6 de octubre de 2026 y al código base `0f267f8f336923c98a2c7f0df226caedd539347f`.

La venta de ejemplo usa un arroz y un frijol (C$80), efectivo C$100 y vuelto C$20. Se verifica bloqueo con C$50, venta correcta, arroz 24→23, frijol 18→17, recarga que restaura el catálogo y pantalla pendiente de Productos. Las mediciones de columnas y menú provienen del DOM calculado del navegador a ambos lados de 640, 768, 1024 y 1536 px.

## Regenerar la entrega

Usar Python con `python-docx` y `Pillow`, y LibreOffice para exportar el PDF. El generador de diagramas usa Arial del sistema macOS; en otro sistema ajustar `FONT` a una fuente disponible.

```bash
python docs/semana-7/scripts/diagramas.py
python docs/semana-7/scripts/construir_documento.py
soffice --headless --convert-to pdf --outdir docs/semana-7/entrega docs/semana-7/entrega/PulpeStock-Web-Semana-7.docx
```

En Codex, usar los runtimes y LibreOffice **bundled**, con el renderer `render_docx.py --emit_pdf`, y revisar las imágenes de las 16 páginas antes de sustituir el PDF entregado. No se agregan herramientas de documentación al `package.json` ni al lockfile del frontend.

## Validación de esta entrega

- Build correcto y lint sin errores; 20 advertencias preexistentes.
- Escenarios de venta correctos en ambos viewports y sin excepciones `pageerror`.
- Sin overflow horizontal global en las ocho medidas de breakpoints.
- DOCX exportado a PDF y páginas revisadas visualmente.
- Fuentes, seis diagramas SVG/PNG y cuatro capturas reales versionadas.
- La app no fue modificada por esta entrega.

Limitación documentada: a 1024 px, con sidebar abierto y ticket de 420 px, el catálogo se comprime a tarjetas de unos 80 px. Corregir ese intervalo y probar teclado virtual/dispositivos físicos queda como mejora propuesta, no como resultado aprobado de esta revisión.

La exposición de 10–15 minutos indicada por el docente deberá realizarla el equipo. No se atribuyen integrantes ni participación individual sin información confirmada.
