import { useCallback, useEffect, useState } from 'react'
import { BarChart3, Package, PackageX, RefreshCw, TriangleAlert, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

function StatCard({ icon: Icon, label, value, testId, helper }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums" data-testid={testId}>{value}</p>
        {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
      </CardContent>
    </Card>
  )
}

function ReportsScreen() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const response = await fetch(`${apiBaseUrl}/api/reportes/resumen`, { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'No se pudieron consultar los reportes.')
    setReport(data)
  }, [])

  useEffect(() => {
    let active = true
    fetch(`${apiBaseUrl}/api/reportes/resumen`, { cache: 'no-store' })
      .then(async response => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'No se pudo cargar el reporte.')
        return data
      })
      .then(data => { if (active) setReport(data) })
      .catch(err => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 overflow-y-auto pb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold"><BarChart3 className="size-5" aria-hidden="true" />Reportes del negocio</h2>
          <p className="text-sm text-muted-foreground">Inventario y ventas del día · Horario de Nicaragua</p>
        </div>
        <Button type="button" variant="outline" disabled={loading}
          onClick={async () => {
            setError('')
            try { await load() } catch (err) { setError(err.message) }
          }}>
          <RefreshCw aria-hidden="true" />Actualizar reporte
        </Button>
      </div>

      {error && <p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">{error}</p>}
      {loading && <p role="status" className="text-sm text-muted-foreground">Cargando reportes...</p>}
      {report && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={Package} label="Productos activos" value={report.productsTotal} testId="report-products-total" />
            <StatCard icon={TriangleAlert} label="Bajo mínimo" value={report.lowStockCount} testId="report-low-stock" helper="Stock actual menor o igual al mínimo" />
            <StatCard icon={PackageX} label="Sin existencias" value={report.outOfStockCount} testId="report-out-of-stock" />
            <StatCard icon={Wallet} label="Ventas de hoy" value={report.salesToday} testId="report-sales-today" />
            <StatCard icon={BarChart3} label="Ingresos de hoy" value={formatCurrency(report.revenueToday)} testId="report-revenue-today" helper="Total de ventas en efectivo" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Productos para reponer</CardTitle>
              <CardDescription>Hasta 50 artículos activos con stock bajo o agotado.</CardDescription>
            </CardHeader>
            <CardContent>
              {report.lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay productos debajo del mínimo.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {report.lowStockProducts.map(product => (
                    <article key={product.id} className="rounded-lg border p-3">
                      <p className="font-medium">{product.nombre}</p>
                      <p className="text-xs text-muted-foreground">{product.id}</p>
                      <p className="mt-2 text-sm">Stock <strong>{product.stockActual}</strong> · Mínimo {product.stockMinimo}</p>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default ReportsScreen
