import { useEffect, useMemo, useRef, useState } from 'react'
import { formatCurrency } from '@/lib/format'
import { toast } from '@/components/ui/toast'
import MobileCheckoutBar from './MobileCheckoutBar'
import ProductCatalog from './ProductCatalog'
import SalesTicket from './SalesTicket'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

function PosScreen() {
  const [catalog, setCatalog] = useState([])
  const [cart, setCart] = useState({})
  const [cash, setCash] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const submitting = useRef(false)
  const saleRequestId = useRef(null)

  async function fetchProducts(signal) {
    const response = await fetch(`${apiBaseUrl}/api/productos`, {
      signal,
      cache: 'no-store',
    })
    if (!response.ok) throw new Error('No se pudo consultar el catálogo.')
    const products = await response.json()
    if (!Array.isArray(products)) throw new Error('El catálogo recibido no es válido.')
    setCatalog(products)
    setCatalogError('')
  }

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        await fetchProducts(controller.signal)
      } catch (error) {
        if (!controller.signal.aborted) setCatalogError(error.message)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [])

  const productById = useMemo(
    () => new Map(catalog.map((product) => [product.id, product])),
    [catalog],
  )
  const entries = useMemo(
    () => Object.entries(cart)
      .map(([id, quantity]) => ({ product: productById.get(id), quantity }))
      .filter((entry) => entry.product !== undefined),
    [cart, productById],
  )
  const cartQuantities = useMemo(
    () => Object.fromEntries(entries.map(({ product, quantity }) => [product.id, quantity])),
    [entries],
  )
  const cartCount = entries.reduce((sum, entry) => sum + entry.quantity, 0)
  const subtotal = entries.reduce(
    (sum, entry) => sum + entry.product.precioVenta * entry.quantity, 0,
  )
  const total = subtotal
  const parsedCash = Number(cash)
  const cashAmount = Number.isFinite(parsedCash) && parsedCash >= 0 ? parsedCash : 0
  const missingAmount = cartCount > 0 && cashAmount > 0 && cashAmount < total
    ? total - cashAmount : 0
  const change = cartCount > 0 && cashAmount >= total ? cashAmount - total : null
  const canConfirm = cartCount > 0 && cashAmount >= total && !isSaving && !catalogError

  function setQuantity(productId, nextQuantity) {
    const product = productById.get(productId)
    if (!product || product.stockActual <= 0 || isSaving) return
    saleRequestId.current = null
    setCart((current) => {
      const quantity = Math.min(Math.max(nextQuantity, 1), product.stockActual)
      return { ...current, [productId]: quantity }
    })
  }
  function addToCart(productId) {
    setQuantity(productId, (cart[productId] ?? 0) + 1)
  }
  function incrementItem(productId) {
    setQuantity(productId, (cart[productId] ?? 0) + 1)
  }
  function decrementItem(productId) {
    const currentQuantity = cart[productId] ?? 0
    if (currentQuantity > 1) setQuantity(productId, currentQuantity - 1)
  }
  function removeItem(productId) {
    if (isSaving) return
    saleRequestId.current = null
    setCart((current) => {
      const next = { ...current }
      delete next[productId]
      return next
    })
  }
  function clearTicket() {
    if (isSaving) return
    saleRequestId.current = null
    setCart({})
    setCash('')
  }
  function onCashChange(value) {
    if (isSaving) return
    saleRequestId.current = null
    setCash(value)
  }

  async function confirmSale() {
    if (!canConfirm || submitting.current) return
    submitting.current = true
    setIsSaving(true)
    if (!saleRequestId.current) saleRequestId.current = crypto.randomUUID()

    try {
      const response = await fetch(`${apiBaseUrl}/api/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: saleRequestId.current,
          cashReceived: cashAmount,
          items: entries.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No se pudo registrar la venta.')

      // La API confirma la transacción antes de limpiar el ticket.
      setCart({})
      setCash('')
      saleRequestId.current = null
      let refreshFailed = false
      try {
        await fetchProducts()
      } catch {
        refreshFailed = true
        setCatalogError('No se pudo actualizar el catálogo. Recargá la página.')
      }
      toast.add({
        type: 'success',
        title: 'Venta concretada',
        description: `Venta #${payload.id} · Total ${formatCurrency(payload.total)} · Vuelto ${formatCurrency(payload.vuelto)}`,
        timeout: 4500,
      })
      if (refreshFailed) {
        toast.add({ type: 'warning', title: 'Venta guardada', description: 'Recargá para consultar el nuevo stock.' })
      }
    } catch (error) {
      // La clave se conserva: al reintentar no se duplica una venta confirmada
      // cuyo resultado se hubiera perdido por falta de red.
      toast.add({ type: 'error', title: 'No se pudo cobrar', description: error.message, timeout: 6000 })
      try {
        await fetchProducts()
      } catch {
        setCatalogError('No se pudo actualizar el catálogo. Recargá la página.')
      }
    } finally {
      submitting.current = false
      setIsSaving(false)
    }
  }

  function handleMobileCheckout() {
    if (canConfirm) {
      confirmSale()
      return
    }
    const cashInput = document.getElementById('cash-received')
    cashInput?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    cashInput?.focus({ preventScroll: true })
  }

  return (
    <div className="flex w-full flex-col gap-4 pb-24 lg:h-full lg:min-h-0 lg:pb-0">
      {isLoading && <p role="status" className="text-sm text-muted-foreground">Cargando productos...</p>}
      {catalogError && (
        <div role="alert" className="rounded-lg border border-destructive px-3 py-2 text-sm text-destructive">
          {catalogError}
          <button type="button" className="ml-3 underline" onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      )}
      <div className="grid gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_420px] lg:grid-rows-[minmax(0,1fr)]">
        <ProductCatalog products={catalog} cartQuantities={cartQuantities} onAdd={addToCart} />
        <div className="lg:flex lg:min-h-0">
          <SalesTicket
            entries={entries}
            cartCount={cartCount}
            cash={cash}
            onCashChange={onCashChange}
            onIncrement={incrementItem}
            onDecrement={decrementItem}
            onRemove={removeItem}
            onClear={clearTicket}
            onConfirm={confirmSale}
            subtotal={subtotal}
            total={total}
            missingAmount={missingAmount}
            change={change}
            canConfirm={canConfirm}
            isSaving={isSaving}
          />
        </div>
      </div>
      <MobileCheckoutBar
        cartCount={cartCount}
        total={total}
        onCheckout={handleMobileCheckout}
        disabled={isSaving}
      />
    </div>
  )
}
export default PosScreen
