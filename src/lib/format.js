/** Utilidades de formato monetario (Córdobas nicaragüenses, C$). */

const currencyFormatter = new Intl.NumberFormat('es-NI', {
  style: 'currency',
  currency: 'NIO',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** Formatea un número como moneda local, p. ej. C$ 38 o C$ 95.50 */
export function formatCurrency(value) {
  if (!Number.isFinite(value)) return 'C$ 0'
  return currencyFormatter.format(value)
}
