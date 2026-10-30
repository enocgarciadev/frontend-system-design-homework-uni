import { useEffect, useState } from 'react'
import { ClipboardList, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

async function getSales(path) {
  const response = await fetch(`${apiBaseUrl}${path}`, { cache: 'no-store' })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las ventas.')
  return data
}
function dateLabel(value) {
  return new Date(value).toLocaleString('es-NI')
}

function SalesHistoryScreen() {
  const [sales, setSales] = useState([])
  const [current, setCurrent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    const data = await getSales('/api/ventas')
    setSales(data)
  }

  useEffect(() => {
    let live = true
    getSales('/api/ventas')
      .then((data) => { if (live) setSales(data) })
      .catch((err) => { if (live) setError(err.message) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [])

  async function showDetail(id) {
    setError('')
    setDetailLoading(true)
    setCurrent(null)
    try {
      setCurrent(await getSales(`/api/ventas/${id}`))
    } catch (err) {
      setError(err.message)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 overflow-y-auto pb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Historial de ventas</h2>
          <p className="text-sm text-muted-foreground">Ventas confirmadas y comprobantes guardados en PostgreSQL</p>
        </div>
        <Button variant="outline" type="button" disabled={loading || detailLoading}
          onClick={async () => {
            setError('')
            try { await refresh() } catch (err) { setError(err.message) }
          }}>
          <RefreshCw aria-hidden="true" />Actualizar ventas
        </Button>
      </div>

      {error && <p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">{error}</p>}
      <div className="grid min-h-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(290px,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList aria-hidden="true" className="size-4" />Ventas registradas
            </CardTitle>
            <CardDescription>Últimas 100 operaciones, ordenadas de la más reciente a la más antigua.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {loading && <p role="status">Cargando historial...</p>}
            {!loading && sales.length === 0 && <p>No hay ventas registradas.</p>}
            {sales.map((sale) => (
              <article key={sale.id} data-sale-id={sale.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-semibold">Venta #{sale.id}</p>
                  <p className="text-xs text-muted-foreground">{dateLabel(sale.createdAt)}</p>
                  <p className="font-medium">{formatCurrency(sale.total)}</p>
                </div>
                <Button variant="outline" size="sm" type="button" disabled={detailLoading}
                  aria-label={`Ver detalle de venta #${sale.id}`} onClick={() => showDetail(sale.id)}>
                  Ver detalle
                </Button>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{current ? `Detalle de venta #${current.id}` : 'Detalle de venta'}</CardTitle>
            <CardDescription>Productos e importes históricos de la operación.</CardDescription>
          </CardHeader>
          <CardContent>
            {detailLoading ? <p role="status">Cargando detalle...</p>
              : !current ? <p className="text-sm text-muted-foreground">Seleccioná una venta para revisar su ticket.</p>
                : <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground">{dateLabel(current.createdAt)}</p>
                  <div className="flex flex-col gap-2">
                    {current.items.map((item) => (
                      <div key={item.productId} className="flex flex-wrap items-start justify-between gap-3 border-b pb-2">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">Cantidad {item.quantity} × {formatCurrency(item.unitPrice)}</p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(current.total)}</span></div>
                  <div className="flex justify-between"><span>Efectivo</span><span>{formatCurrency(current.cashReceived)}</span></div>
                  <div className="flex justify-between"><span>Vuelto</span><span>{formatCurrency(current.change)}</span></div>
                </div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SalesHistoryScreen
