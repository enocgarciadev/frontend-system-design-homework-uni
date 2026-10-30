package api

import (
 "context"
)

type InventoryReportData struct {
 ProductsTotal int `json:"productsTotal"`
 LowStockCount int `json:"lowStockCount"`
 OutOfStockCount int `json:"outOfStockCount"`
 SalesToday int `json:"salesToday"`
 RevenueToday float64 `json:"revenueToday"`
 LowStockProducts []Product `json:"lowStockProducts"`
}

// InventoryReport returns a snapshot of active inventory and today's sales
// in Nicaragua's local civil date. Monetary arithmetic is done in cents.
func (s *Store) InventoryReport(ctx context.Context) (InventoryReportData,error) {
 var report InventoryReportData
 report.LowStockProducts=make([]Product,0)
 err:=s.DB.QueryRowContext(ctx,`
 SELECT count(*)::integer,
        count(*) FILTER(WHERE stock_actual <= stock_minimo)::integer,
        count(*) FILTER(WHERE stock_actual = 0)::integer
 FROM productos WHERE activo=TRUE`).Scan(
  &report.ProductsTotal,&report.LowStockCount,&report.OutOfStockCount)
 if err!=nil{return report,err}
 var cents int64
 err=s.DB.QueryRowContext(ctx,`
 SELECT count(*)::integer,COALESCE(sum(total_centavos),0)::bigint
 FROM ventas
 WHERE (creada_en AT TIME ZONE 'America/Managua')::date =
       (now() AT TIME ZONE 'America/Managua')::date`).Scan(
  &report.SalesToday,&cents)
 if err!=nil{return report,err}
 report.RevenueToday=float64(cents)/100
 rows,err:=s.DB.QueryContext(ctx,`
 SELECT id,nombre,categoria_id,precio_centavos,stock_actual,stock_minimo,
        COALESCE(codigo_barras,'')
 FROM productos
 WHERE activo=TRUE AND stock_actual <= stock_minimo
 ORDER BY (stock_minimo - stock_actual) DESC,nombre
 LIMIT 50`)
 if err!=nil{return report,err}
 defer rows.Close()
 for rows.Next(){
  var p Product
  var value int64
  if err:=rows.Scan(&p.ID,&p.Nombre,&p.Categoria,&value,&p.StockActual,
   &p.StockMinimo,&p.CodigoBarras);err!=nil{return report,err}
  p.PrecioVenta=float64(value)/100
  report.LowStockProducts=append(report.LowStockProducts,p)
 }
 return report,rows.Err()
}
