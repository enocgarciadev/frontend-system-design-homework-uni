import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { CATEGORIES, CATEGORY_LABELS } from '@/data/products'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
const emptyProduct = {
  id: '', nombre: '', categoria: 'abarrotes', precioVenta: '',
  stockActual: '0', stockMinimo: '0', codigoBarras: '',
}

async function requestProducts() {
  const response = await fetch(`${apiBaseUrl}/api/productos`, { cache: 'no-store' })
  if (!response.ok) throw new Error('No se pudieron cargar los productos.')
  const payload = await response.json()
  if (!Array.isArray(payload)) throw new Error('La respuesta del catálogo no es válida.')
  return payload
}

function ProductsScreen() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = await requestProducts()
        if (active) setProducts(data)
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((product) =>
      product.nombre.toLowerCase().includes(query) ||
      product.id.toLowerCase().includes(query) ||
      product.codigoBarras?.includes(query),
    )
  }, [products, search])

  function openCreate() {
    setEditing(null)
    setForm({ ...emptyProduct })
    setPendingDelete(null)
    setError('')
    setNotice('')
  }

  function openEdit(product) {
    setEditing(product.id)
    setForm({
      id: product.id,
      nombre: product.nombre,
      categoria: product.categoria,
      precioVenta: String(product.precioVenta),
      stockActual: String(product.stockActual),
      stockMinimo: String(product.stockMinimo),
      codigoBarras: product.codigoBarras ?? '',
    })
    setPendingDelete(null)
    setError('')
    setNotice('')
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function save(event) {
    event.preventDefault()
    if (saving || !form) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const input = {
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        precioVenta: Number(form.precioVenta),
        stockMinimo: Number(form.stockMinimo),
        codigoBarras: form.codigoBarras.trim(),
      }
      if (!editing) {
        input.id = form.id.trim()
        input.stockActual = Number(form.stockActual)
      }
      const url = editing
        ? `${apiBaseUrl}/api/productos/${encodeURIComponent(editing)}`
        : `${apiBaseUrl}/api/productos`
      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar el producto.')
      const updated = await requestProducts()
      setProducts(updated)
      setNotice(editing ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.')
      setForm(null)
      setEditing(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function deactivate(product) {
    if (saving) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`${apiBaseUrl}/api/productos/${encodeURIComponent(product.id)}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || 'No se pudo desactivar el producto.')
      }
      setProducts(await requestProducts())
      setPendingDelete(null)
      if (editing === product.id) { setEditing(null); setForm(null) }
      setNotice('Producto desactivado. Las ventas anteriores se conservan.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 overflow-y-auto pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Gestión de productos</h2>
          <p className="text-sm text-muted-foreground">Catálogo persistente · Go + PostgreSQL</p>
        </div>
        <Button type="button" onClick={openCreate} disabled={saving}>
          <Plus aria-hidden="true" /> Nuevo producto
        </Button>
      </div>

      {error && <div role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">{error}</div>}
      {notice && <p role="status" className="rounded-lg border p-3 text-sm text-foreground">{notice}</p>}

      {form && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? 'Editar producto' : 'Crear producto'}</CardTitle>
            <CardDescription>
              {editing ? 'Las existencias se modificarán mediante movimientos de inventario.' : 'Ingresá los datos y la existencia inicial.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="product-id">Código interno</Label>
                <Input id="product-id" required disabled={Boolean(editing) || saving} value={form.id}
                  onChange={(e) => update('id', e.target.value)} placeholder="mi-producto-001" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="product-name">Nombre del producto</Label>
                <Input id="product-name" required disabled={saving} maxLength={120} value={form.nombre}
                  onChange={(e) => update('nombre', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="product-category">Categoría</Label>
                <select id="product-category" disabled={saving} value={form.categoria}
                  onChange={(e) => update('categoria', e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="product-price">Precio de venta (C$)</Label>
                <Input id="product-price" required type="number" min="0.01" max="1000000" step="0.01"
                  disabled={saving} value={form.precioVenta} onChange={(e) => update('precioVenta', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="product-min-stock">Stock mínimo</Label>
                <Input id="product-min-stock" required type="number" min="0" max="10000000" step="1"
                  disabled={saving} value={form.stockMinimo} onChange={(e) => update('stockMinimo', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="product-stock">{editing ? 'Stock actual (solo lectura)' : 'Stock inicial'}</Label>
                <Input id="product-stock" required type="number" min="0" max="10000000" step="1"
                  disabled={Boolean(editing) || saving} value={form.stockActual}
                  onChange={(e) => update('stockActual', e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="product-barcode">Código de barras (opcional)</Label>
                <Input id="product-barcode" disabled={saving} value={form.codigoBarras}
                  onChange={(e) => update('codigoBarras', e.target.value)} placeholder="8 a 20 dígitos" />
              </div>
              <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar producto'}</Button>
                <Button type="button" variant="outline" disabled={saving}
                  onClick={() => { setForm(null); setEditing(null); setError('') }}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Productos activos</CardTitle>
          <CardDescription>{loading ? 'Cargando...' : `${visible.length} de ${products.length} productos`}</CardDescription>
          <div className="relative max-w-md">
            <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Buscar en productos" placeholder="Buscar producto..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="h-10 pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <p role="status">Cargando productos...</p>
            : visible.length === 0 ? <p className="text-sm text-muted-foreground">No hay productos que coincidan con la búsqueda.</p>
              : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((product) => (
                  <article key={product.id} className="flex flex-col gap-3 rounded-xl border p-3" data-product-id={product.id}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium">{product.nombre}</h3>
                        <p className="break-all text-xs text-muted-foreground">{product.id}</p>
                        <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[product.categoria]}</p>
                      </div>
                      <Badge variant="secondary">Stock {product.stockActual}</Badge>
                    </div>
                    <div className="text-lg font-semibold">{formatCurrency(product.precioVenta)}</div>
                    {pendingDelete === product.id ? (
                      <div className="flex flex-wrap gap-2">
                        <p className="w-full text-sm">¿Desactivar este producto?</p>
                        <Button type="button" variant="destructive" size="sm" disabled={saving}
                          onClick={() => deactivate(product)}>Confirmar baja de {product.nombre}</Button>
                        <Button type="button" variant="outline" size="sm" disabled={saving}
                          onClick={() => setPendingDelete(null)}>Cancelar baja</Button>
                      </div>
                    ) : (
                      <div className="mt-auto flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" disabled={saving}
                          onClick={() => openEdit(product)}><Pencil aria-hidden="true" />Editar {product.nombre}</Button>
                        <Button type="button" variant="ghost" size="sm" disabled={saving}
                          onClick={() => { setPendingDelete(product.id); setNotice('') }}>
                          <Trash2 aria-hidden="true" />Desactivar {product.nombre}
                        </Button>
                      </div>
                    )}
                  </article>
                ))}
              </div>}
        </CardContent>
      </Card>
    </div>
  )
}

export default ProductsScreen
