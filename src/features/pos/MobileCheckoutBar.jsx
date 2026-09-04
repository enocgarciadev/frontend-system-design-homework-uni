import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'

/**
 * Barra inferior fija (solo pantallas pequeñas) para poder cobrar siempre,
 * sin importar cuánto crezca el catálogo o el ticket.
 */
function MobileCheckoutBar({ cartCount, total, onCheckout }) {
  if (cartCount === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-3 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur lg:hidden sm:px-4">
      <div className="mx-auto flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <ShoppingCart
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">
              {cartCount} {cartCount === 1 ? 'artículo' : 'artículos'}
            </p>
            <p className="truncate text-base font-bold tabular-nums">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="h-11 shrink-0 px-5 text-base font-semibold"
          onClick={onCheckout}
        >
          Cobrar
        </Button>
      </div>
    </div>
  )
}

export default MobileCheckoutBar
