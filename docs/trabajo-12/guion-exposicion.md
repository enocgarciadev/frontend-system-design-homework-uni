# Guion de exposición — 12 minutos + preguntas

El docente solicita **10–15 minutos**, participación equitativa y luego preguntas. Sustituir «Integrante A/B/C» por nombres y redistribuir según la cantidad real de integrantes.

| Tiempo | Voz | Diapositivas | Contenido |
|---|---|---|---|
| 0:00–1:10 | Integrante A | 1–2 | Portada, equipo, pulpería y problema |
| 1:10–2:20 | A | 3 | Objetivos y cinco capacidades del MVP |
| 2:20–3:40 | B | 4–5 | OOHDM/UWE híbrido y 3 capas |
| 3:40–4:40 | B | 6 | Seguridad, sesiones, roles y ACID |
| 4:40–5:40 | B | 7 | REST/JSON, endpoints y ejemplo real |
| 5:40–9:45 | C | 8–10 | Demo: login, POS C$80/C$20, productos, movimientos, historial y reportes |
| 9:45–11:10 | C | 11 | Pruebas de navegador y matriz de trazabilidad |
| 11:10–12:00 | A+B+C | 12 | Lecciones, límites e invitación a preguntas |

**Distribución:** ajustar participación para que **todos los integrantes reales** hablen; la tabla es una propuesta de tres participantes, no nombres confirmados.

## Checklist de demostración

- Verificar PostgreSQL 16, API Go y Vite conectados; seleccionar cuenta admin.
- Partir de inventario demo conocido y un ticket vacío.
- Mostrar 401 al visitar recurso sin sesión (Postman) y luego login; mostrar un 403 de vendedor en endpoint admin si hay tiempo.
- Hacer venta de arroz C$38 + frijol C$42 con efectivo C$100, total C$80 y vuelto C$20, luego recargar.
- Dar de alta/editar/desactivar un producto demo.
- Registrar entrada +3 y ajuste -1, y mostrar rechazo a movimiento negativo imposible.
- Abrir el detalle histórico de una venta, y los cinco indicadores del reporte.
- Mostrar en GitHub Actions pruebas Go y Chromium; si no hay conectividad, usar las capturas descargadas.
- Aclarar que DNS y terceros son propuestas, no servicios públicos activos.

## Preguntas esperadas

**¿Por qué Go?** API pequeña, HTTP estándar, validación y SQL transaccional; frontend React desacoplado.

**¿Por qué REST frente a SOAP?** JSON y HTTP son interoperables con navegadores; para este alcance no se necesita WSDL ni contrato SOAP.

**¿Cómo se evita doble venta?** Clave requestId idempotente, bloqueo SQL en orden estable y transacción; errores provocan rollback.

**¿Qué garantiza la autorización?** Go examina sesión y rol; ocultar botones no es el control real.

**¿Está desplegado?** No hay evidencia de dominio ni despliegue público: el sistema se demuestra localmente/CI y la topología productiva está propuesta.

**¿Por qué se habla de OOHDM y UWE?** OOHDM fue la metodología documentada en Semana 7; el informe final presenta equivalencias parciales de perspectivas de UWE sin atribuir aplicación UML formal original.
