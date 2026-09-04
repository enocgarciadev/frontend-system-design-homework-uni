import { AlertTriangle, Banknote, CheckCircle2, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/format'

function TicketLine({ product, quantity, onIncrement, onDecrement, onRemove }) {
  const lineTotal = product.precioVenta * quantity
  const canIncrement = quantity < product.stockActual
  const canDecrement = quantity > 1

  return (
    <TableRow>
      <TableCell className="align-top">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm leading-tight font-medium">
            {product.nombre}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatCurrency(product.precioVenta)} c/u
          </p>
        </div>
      </TableCell>

      <TableCell className="align-top">
        <div className="flex items-center justify-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-lg"
            onClick={() => onDecrement(product.id)}
            disabled={!canDecrement}
            aria-label={`Quitar una unidad de ${product.nombre}`}
          >
            <Minus aria-hidden="true" />
          </Button>
          <span
            aria-live="polite"
            className="w-7 text-center text-sm font-semibold tabular-nums"
          >
            {quantity}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-lg"
            onClick={() => onIncrement(product.id)}
            disabled={!canIncrement}
            aria-label={`Agregar una unidad de ${product.nombre}`}
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
        {!canIncrement && (
          <p className="mt-1 text-center text-[11px] leading-tight font-medium text-amber-600 dark:text-amber-400">
            Stock máximo
          </p>
        )}
      </TableCell>

      <TableCell className="text-right align-top">
        <span className="text-sm font-semibold tabular-nums">
          {formatCurrency(lineTotal)}
        </span>
        <div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-1 size-8 rounded-lg text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(product.id)}
            aria-label={`Quitar ${product.nombre} del ticket`}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function SalesTicket({
  entries,
  cash,
  onCashChange,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  onConfirm,
  subtotal,
  total,
  cartCount,
  missingAmount,
  change,
  canConfirm,
}) {
  const isEmpty = entries.length === 0

  return (
    <Card className="flex w-full flex-col overflow-hidden lg:h-full lg:min-h-0">
      <CardHeader className="gap-1">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart aria-hidden="true" className="size-4" />
            Ticket de venta
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-muted-foreground"
            onClick={onClear}
            disabled={isEmpty}
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Vaciar
          </Button>
        </div>
        <CardDescription>
          {isEmpty
            ? 'Tocá un producto del catálogo para agregarlo.'
            : `${cartCount} ${cartCount === 1 ? 'artículo' : 'artículos'} en el ticket`}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex max-h-[55svh] min-h-0 flex-1 flex-col overflow-y-auto lg:max-h-none">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-10 text-center">
            <ShoppingCart
              aria-hidden="true"
              className="size-8 text-muted-foreground/60"
            />
            <p className="text-sm font-medium">El ticket está vacío</p>
            <p className="max-w-52 text-xs text-muted-foreground">
              La venta se descuenta del stock al cobrar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(({ product, quantity }) => (
                  <TicketLine
                    key={product.id}
                    product={product}
                    quantity={quantity}
                    onIncrement={onIncrement}
                    onDecrement={onDecrement}
                    onRemove={onRemove}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-stretch gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium tabular-nums">
            {formatCurrency(subtotal)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold">Total a pagar</span>
          <span className="text-lg font-bold tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>

        <Separator className="my-1" />

        <div className="space-y-1.5">
          <Label htmlFor="cash-received" className="text-sm">
            Efectivo recibido
          </Label>
          <div className="relative">
            <Banknote
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="cash-received"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={cash}
              onChange={(event) => onCashChange(event.target.value)}
              placeholder="0.00"
              disabled={isEmpty}
              aria-label="Efectivo recibido"
              className="h-11 pr-3 pl-9 text-right font-semibold tabular-nums"
            />
          </div>
        </div>

        {missingAmount > 0 && (
          <Alert variant="destructive">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>Efectivo insuficiente</AlertTitle>
            <AlertDescription>
              Faltan {formatCurrency(missingAmount)} para completar la venta.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Banknote aria-hidden="true" className="size-4 text-muted-foreground" />
            Vuelto
          </span>
          {change !== null && !isEmpty ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
              <CheckCircle2 aria-hidden="true" className="size-4" />
              {formatCurrency(change)}
            </span>
          ) : (
            <span className="text-muted-foreground tabular-nums">—</span>
          )}
        </div>

        <Button
          type="button"
          className="h-12 w-full gap-2 text-base font-semibold"
          onClick={onConfirm}
          disabled={!canConfirm}
        >
          <CheckCircle2 aria-hidden="true" className="size-5" />
          Cobrar y Descontar Stock
        </Button>
        {canConfirm && change === null && (
          <p className="text-center text-[11px] text-muted-foreground">
            Pagos exactos: ingresá el total en efectivo para cobrar.
          </p>
        )}
      </CardFooter>
    </Card>
  )
}

export default SalesTicket
