import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CATEGORY_LABELS, getStockStatus } from '@/data/products'
import { formatCurrency } from '@/lib/format'

function StockBadge({ product }) {
  const status = getStockStatus(product)

  if (status === 'agotado') {
    return (
      <Badge
        variant="destructive"
        className="shrink-0 border-transparent bg-destructive text-white"
      >
        Agotado
      </Badge>
    )
  }

  if (status === 'bajo') {
    return (
      <Badge variant="destructive" className="shrink-0">
        Quedan {product.stockActual}
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="shrink-0">
      Stock {product.stockActual}
    </Badge>
  )
}

function ProductCard({ product, qtyInCart = 0, onAdd }) {
  const isOutOfStock = getStockStatus(product) === 'agotado'
  const reachedCartLimit = qtyInCart >= product.stockActual
  const isDisabled = isOutOfStock || reachedCartLimit

  return (
    <Card className="flex flex-col">
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm leading-tight font-medium">
              {product.nombre}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {CATEGORY_LABELS[product.categoria]}
            </p>
          </div>
          <StockBadge product={product} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-base font-bold tabular-nums">
            {formatCurrency(product.precioVenta)}
          </span>
          <Button
            type="button"
            size="icon"
            className="size-11 shrink-0 rounded-xl"
            onClick={() => onAdd(product.id)}
            disabled={isDisabled}
            aria-label={
              isOutOfStock
                ? `${product.nombre}: agotado`
                : `Agregar ${product.nombre} al ticket`
            }
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>

        {reachedCartLimit && !isOutOfStock && (
          <p className="text-[11px] leading-tight text-muted-foreground">
            Límite en el ticket: {product.stockActual}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default ProductCard
