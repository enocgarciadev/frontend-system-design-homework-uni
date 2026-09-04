import { useMemo, useState } from 'react'
import { PackageSearch, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CATEGORIES } from '@/data/products'
import ProductCard from './ProductCard'

const ALL_CATEGORIES = 'todas'

function ProductCatalog({ products, cartQuantities, onAdd }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES)

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return products.filter((product) => {
      const matchesCategory =
        activeCategory === ALL_CATEGORIES ||
        product.categoria === activeCategory

      if (!matchesCategory) return false

      if (!normalizedQuery) return true

      const matchesName = product.nombre
        .toLowerCase()
        .includes(normalizedQuery)
      const matchesBarcode = (product.codigoBarras ?? '').includes(
        normalizedQuery,
      )

      return matchesName || matchesBarcode
    })
  }, [products, query, activeCategory])

  return (
    <Card className="flex max-h-[62svh] flex-col overflow-hidden lg:h-full lg:max-h-none lg:min-h-0">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Catálogo rápido</CardTitle>
            <CardDescription>
              Buscá por nombre o código de barras.
            </CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">
            {filteredProducts.length}
          </Badge>
        </div>

        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar producto o escanear código..."
            aria-label="Buscar producto por nombre o código de barras"
            inputMode="search"
            className="h-11 pr-3 pl-9"
          />
        </div>

        <div
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          role="group"
          aria-label="Filtrar por categoría"
        >
          <Button
            type="button"
            variant={activeCategory === ALL_CATEGORIES ? 'default' : 'outline'}
            size="sm"
            className="h-9 shrink-0 rounded-full px-3.5"
            onClick={() => setActiveCategory(ALL_CATEGORIES)}
          >
            Todas
          </Button>
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category.id
            return (
              <Button
                key={category.id}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="h-9 shrink-0 rounded-full px-3.5"
                onClick={() => setActiveCategory(category.id)}
              >
                {category.label}
              </Button>
            )
          })}
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
            <PackageSearch
              aria-hidden="true"
              className="size-8 text-muted-foreground/60"
            />
            <p className="text-sm font-medium">Sin resultados</p>
            <p className="max-w-56 text-xs text-muted-foreground">
              Probá con otro nombre, código o categoría.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-4 min-[2000px]:grid-cols-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                qtyInCart={cartQuantities[product.id] ?? 0}
                onAdd={onAdd}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ProductCatalog
