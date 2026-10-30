package api

import (
 "context"
 "database/sql"
 "errors"
 "time"
)

type SaleSummary struct {
 ID int64 `json:"id"`
 Total float64 `json:"total"`
 CashReceived float64 `json:"cashReceived"`
 Change float64 `json:"change"`
 CreatedAt time.Time `json:"createdAt"`
}

type SaleLine struct {
 ProductID string `json:"productId"`
 ProductName string `json:"productName"`
 Quantity int `json:"quantity"`
 UnitPrice float64 `json:"unitPrice"`
 Subtotal float64 `json:"subtotal"`
}

type SaleDetail struct {
 SaleSummary
 Items []SaleLine `json:"items"`
}

// ListSales returns a bounded set to keep the initial MVP predictable.
func (s *Store) ListSales(ctx context.Context) ([]SaleSummary,error) {
 rows,err:=s.DB.QueryContext(ctx,`SELECT id,total_centavos,efectivo_centavos,vuelto_centavos,creada_en FROM ventas ORDER BY id DESC LIMIT 100`)
 if err!=nil{return nil,err}
 defer rows.Close()
 results:=make([]SaleSummary,0)
 for rows.Next(){
  var entry SaleSummary
  var total,cash,change int64
  if err:=rows.Scan(&entry.ID,&total,&cash,&change,&entry.CreatedAt);err!=nil{return nil,err}
  entry.Total=float64(total)/100
  entry.CashReceived=float64(cash)/100
  entry.Change=float64(change)/100
  results=append(results,entry)
 }
 return results,rows.Err()
}

func (s *Store) GetSale(ctx context.Context,id int64) (SaleDetail,error) {
 if id<1{return SaleDetail{},&DomainError{404,"Venta no encontrada"}}
 var detail SaleDetail
 var total,cash,change int64
 err:=s.DB.QueryRowContext(ctx,
  `SELECT id,total_centavos,efectivo_centavos,vuelto_centavos,creada_en FROM ventas WHERE id=$1`,id).
  Scan(&detail.ID,&total,&cash,&change,&detail.CreatedAt)
 if errors.Is(err,sql.ErrNoRows){return SaleDetail{},&DomainError{404,"Venta no encontrada"}}
 if err!=nil{return SaleDetail{},err}
 detail.Total=float64(total)/100
 detail.CashReceived=float64(cash)/100
 detail.Change=float64(change)/100
 rows,err:=s.DB.QueryContext(ctx,`
 SELECT d.producto_id,p.nombre,d.cantidad,d.precio_unitario_centavos,d.total_centavos
 FROM venta_detalles d JOIN productos p ON p.id=d.producto_id
 WHERE d.venta_id=$1 ORDER BY d.id`,id)
 if err!=nil{return SaleDetail{},err}
 defer rows.Close()
 detail.Items=make([]SaleLine,0)
 for rows.Next(){
  var line SaleLine
  var price,subtotal int64
  if err:=rows.Scan(&line.ProductID,&line.ProductName,&line.Quantity,&price,&subtotal);err!=nil{return SaleDetail{},err}
  line.UnitPrice=float64(price)/100
  line.Subtotal=float64(subtotal)/100
  detail.Items=append(detail.Items,line)
 }
 if err:=rows.Err();err!=nil{return SaleDetail{},err}
 return detail,nil
}
