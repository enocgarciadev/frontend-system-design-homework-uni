import { useCallback, useEffect, useState } from 'react'
import { ArrowLeftRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

async function getJSON(path) {
  const response = await fetch(`${baseUrl}${path}`, { cache: 'no-store' })
  if (!response.ok) throw new Error('No se pudieron consultar los datos del inventario.')
  return response.json()
}

const names = { venta: 'Venta', entrada: 'Entrada', ajuste: 'Ajuste' }

function MovementsScreen() {
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [productId, setProductId] = useState('')
  const [type, setType] = useState('entrada')
  const [quantity, setQuantity] = useState('1')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    const [nextProducts, nextMovements] = await Promise.all([
      getJSON('/api/productos'),
      getJSON('/api/movimientos'),
    ])
    setProducts(nextProducts)
    setMovements(nextMovements)
    setProductId((prev) => nextProducts.some((p) => p.id === prev)
      ? prev : (nextProducts[0]?.id ?? ''))
  }, [])

  useEffect(() => {
    let live = true
    Promise.all([getJSON('/api/productos'), getJSON('/api/movimientos')])
      .then(([p, m]) => {
        if (!live) return
        setProducts(p)
        setMovements(m)
        setProductId(p[0]?.id ?? '')
      })
      .catch((err) => { if (live) setError(err.message) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [])

  const selected = products.find((p) => p.id === productId)

  async function submit(event) {
    event.preventDefault()
    if (saving || !selected) return
    setError('')
    setMessage('')
    setSaving(true)
    try {
      const amount = Number(quantity)
      if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > 10000 ||
          (type === 'entrada' && amount < 1)) {
        throw new Error('Ingresá una variación entera válida, distinta de cero.')
      }
      const response = await fetch(`${baseUrl}/api/movimientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, type, quantity: amount }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo registrar el movimiento.')
      await refresh()
      setMessage(`Movimiento registrado. Nuevo stock de ${data.productName}: ${data.stockAfter}.`)
      setQuantity('1')
    } catch (err) {
      setError(err.message)
      // El estado no se da por confirmado cuando la red o la API fallan.
      try { await refresh() } catch { /* el mensaje original permanece visible */ }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 overflow-y-auto pb-8">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Movimientos de inventario</h2>
          <p className="text-sm text-muted-foreground">Entradas y ajustes registrados en PostgreSQL</p>
        </div>
        <Button variant="outline" type="button" onClick={async () => {
          setError('')
          try { await refresh() } catch (err) { setError(err.message) }
        }} disabled={saving || loading}><RefreshCw aria-hidden="true" />Actualizar</Button>
      </div>

      {error && <p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="rounded-lg border p-3 text-sm">{message}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ArrowLeftRight className="size-4" aria-hidden="true" />Nuevo movimiento</CardTitle>
          <CardDescription>Usá Entrada para reponer y Ajuste para sumar o retirar unidades. No se permiten existencias negativas.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p role="status">Cargando inventario...</p> : (
            <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submit}>
              <div className="space-y-1">
                <Label htmlFor="movement-product">Producto</Label>
                <select id="movement-product" required value={productId} disabled={saving}
                  className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm"
                  onChange={(e) => setProductId(e.target.value)}>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                {selected && <p className="text-xs text-muted-foreground">Existencia actual: {selected.stockActual}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="movement-type">Tipo de movimiento</Label>
                <select id="movement-type" value={type} disabled={saving} onChange={(e) => {
                  setType(e.target.value)
                  setQuantity('1')
                }} className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm">
                  <option value="entrada">Entrada</option>
                  <option value="ajuste">Ajuste</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="movement-quantity">Variación (unidades)</Label>
                <Input id="movement-quantity" required type="number" step="1"
                  min={type === 'entrada' ? '1' : '-10000'} max="10000"
                  value={quantity} disabled={saving}
                  onChange={(e) => setQuantity(e.target.value)} className="h-10" />
              </div>
              <div className="flex items-end">
                <Button className="h-10 w-full" type="submit" disabled={saving || !selected}>
                  {saving ? 'Guardando...' : 'Registrar movimiento'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de movimientos</CardTitle>
          <CardDescription>Últimos 100 registros, incluidas las salidas por venta.</CardDescription>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? <p className="text-sm text-muted-foreground">Todavía no hay movimientos registrados.</p> : (
            <div className="flex flex-col gap-2">
              {movements.map((m) => (
                <article key={m.id} data-movement-id={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="font-medium">{m.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {names[m.type] ?? m.type} · {new Date(m.createdAt).toLocaleString('es-NI')}
                    </p>
                  </div>
                  <span className={`font-semibold tabular-nums ${m.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                  </span>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MovementsScreen
