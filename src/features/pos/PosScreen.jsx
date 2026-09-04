import { useMemo, useState } from 'react'
import { PRODUCTS } from '@/data/products'
import { formatCurrency } from '@/lib/format'
import { toast } from '@/components/ui/toast'
import MobileCheckoutBar from './MobileCheckoutBar'
import ProductCatalog from './ProductCatalog'
import SalesTicket from './SalesTicket'

function PosScreen() {
  const [catalog, setCatalog] = useState(PRODUCTS)
  const [cart, setCart] = useState({}) // { [productId]: cantidad }
  const [cash, setCash] = useState('')

  const productById = useMemo(
    () => new Map(catalog.map((product) => [product.id, product])),
    [catalog],
  )

  const entries = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => ({
          product: productById.get(id),
          quantity,
        }))
        .filter((entry) => entry.product !== undefined),
    [cart, productById],
  )

  const cartQuantities = useMemo(
    () => Object.fromEntries(entries.map(({ product, quantity }) => [product.id, quantity])),
    [entries],
  )

  const cartCount = entries.reduce(
    (sum, entry) => sum + entry.quantity,
    0,
  )
  const subtotal = entries.reduce(
    (sum, entry) => sum + entry.product.precioVenta * entry.quantity,
    0,
  )
  const total = subtotal // Sin impuestos en este caso de uso.

  const parsedCash = Number(cash)
  const cashAmount = Number.isFinite(parsedCash) && parsedCash >= 0 ? parsedCash : 0
  const missingAmount =
    cartCount > 0 && cashAmount > 0 && cashAmount < total ? total - cashAmount : 0
  const change =
    cartCount > 0 && cashAmount >= total ? cashAmount - total : null
  const canConfirm = cartCount > 0 && cashAmount >= total

  function setQuantity(productId, nextQuantity) {
    const product = productById.get(productId)
    if (!product) return

    setCart((current) => {
      const quantity = Math.min(Math.max(nextQuantity, 1), product.stockActual)
      return { ...current, [productId]: quantity }
    })
  }

  function addToCart(productId) {
    const currentQuantity = cart[productId] ?? 0
    setQuantity(productId, currentQuantity + 1)
  }

  function incrementItem(productId) {
    const currentQuantity = cart[productId] ?? 0
    setQuantity(productId, currentQuantity + 1)
  }

  function decrementItem(productId) {
    const currentQuantity = cart[productId] ?? 0
    if (currentQuantity <= 1) return
    setQuantity(productId, currentQuantity - 1)
  }

  function removeItem(productId) {
    setCart((current) => {
      if (!(productId in current)) return current
      const next = { ...current }
      delete next[productId]
      return next
    })
  }

  function clearTicket() {
    setCart({})
    setCash('')
  }

  function confirmSale() {
    if (!canConfirm) return

    // Descuenta las existencias del catálogo local (cliente) sin recargar.
    setCatalog((current) =>
      current.map((product) => {
        const soldQuantity = cart[product.id] ?? 0
        if (soldQuantity === 0) return product
        return {
          ...product,
          stockActual: Math.max(product.stockActual - soldQuantity, 0),
        }
      }),
    )

    const itemsLabel = `${cartCount} ${cartCount === 1 ? 'artículo' : 'artículos'}`
    const changeLabel = change ? ` · Vuelto ${formatCurrency(change)}` : ''
    toast.add({
      type: 'success',
      title: 'Venta concretada',
      description: `${itemsLabel} · Total ${formatCurrency(total)}${changeLabel}`,
      timeout: 4000,
    })

    setCart({})
    setCash('')
  }

  function handleMobileCheckout() {
    if (canConfirm) {
      confirmSale()
      return
    }

    // Sin efectivo suficiente: llevá al vendedor hasta el campo de efectivo.
    const cashInput = document.getElementById('cash-received')
    cashInput?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    cashInput?.focus({ preventScroll: true })
  }

  return (
    <div className="flex w-full flex-col gap-4 pb-24 lg:h-full lg:min-h-0 lg:pb-0">
      <div className="grid gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_420px] lg:grid-rows-[minmax(0,1fr)]">
        <ProductCatalog
          products={catalog}
          cartQuantities={cartQuantities}
          onAdd={addToCart}
        />

        <div className="lg:flex lg:min-h-0">
          <SalesTicket
            entries={entries}
            cartCount={cartCount}
            cash={cash}
            onCashChange={setCash}
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
          />
        </div>
      </div>

      <MobileCheckoutBar
        cartCount={cartCount}
        total={total}
        onCheckout={handleMobileCheckout}
      />
    </div>
  )
}

export default PosScreen
