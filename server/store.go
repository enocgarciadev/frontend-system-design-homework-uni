package api

import (
 "context"
 "crypto/sha256"
 "database/sql"
 "encoding/hex"
 "errors"
 "fmt"
 "math"
 "sort"
 "strings"

 _ "github.com/lib/pq"
)

type Store struct { DB *sql.DB }

func OpenStore(ctx context.Context, url string) (*Store, error) {
 if strings.TrimSpace(url) == "" { return nil, errors.New("DATABASE_URL es obligatorio") }
 db, err := sql.Open("postgres", url)
 if err != nil { return nil, err }
 db.SetMaxOpenConns(10)
 db.SetMaxIdleConns(5)
 if err := db.PingContext(ctx); err != nil { db.Close(); return nil, err }
 return &Store{DB: db}, nil
}

type Product struct {
 ID string `json:"id"`
 Nombre string `json:"nombre"`
 Categoria string `json:"categoria"`
 PrecioVenta float64 `json:"precioVenta"`
 StockActual int `json:"stockActual"`
 StockMinimo int `json:"stockMinimo"`
 CodigoBarras string `json:"codigoBarras"`
}

func (s *Store) ListProducts(ctx context.Context) ([]Product, error) {
 rows, err := s.DB.QueryContext(ctx, "SELECT id,nombre,categoria_id,precio_centavos,stock_actual,stock_minimo,COALESCE(codigo_barras,'') FROM productos WHERE activo = TRUE ORDER BY nombre")
 if err != nil { return nil, err }
 defer rows.Close()
 result := make([]Product, 0)
 for rows.Next() {
  var p Product
  var cents int64
  if err := rows.Scan(&p.ID, &p.Nombre, &p.Categoria, &cents, &p.StockActual, &p.StockMinimo, &p.CodigoBarras); err != nil { return nil, err }
  p.PrecioVenta = float64(cents)/100
  result = append(result, p)
 }
 return result, rows.Err()
}

type SaleItemInput struct {
 ProductID string `json:"productId"`
 Quantity int `json:"quantity"`
}

type SaleRequest struct {
 RequestID string `json:"requestId"`
 CashReceived float64 `json:"cashReceived"`
 Items []SaleItemInput `json:"items"`
}

type SaleResponse struct {
 ID int64 `json:"id"`
 Total float64 `json:"total"`
 Vuelto float64 `json:"vuelto"`
 Reused bool `json:"reused"`
}

type DomainError struct { Code int; Message string }
func (e *DomainError) Error() string { return e.Message }
func invalid(s string) error { return &DomainError{400,s} }
func conflict(s string) error { return &DomainError{409,s} }

func centsOf(amount float64) (int64, error) {
 if math.IsNaN(amount) || math.IsInf(amount, 0) || amount < 0 || amount > 100000000 {
  return 0, invalid("Efectivo inválido")
 }
 rounded := math.Round(amount * 100)
 if math.Abs(amount*100-rounded) > 0.00001 { return 0, invalid("El efectivo admite máximo dos decimales") }
 return int64(rounded), nil
}

// CreateSale recomputes totals using server prices and locks products in a
// stable order. A failure rolls back both sale records and stock updates.
func (s *Store) CreateSale(ctx context.Context, input SaleRequest) (SaleResponse, error) {
 var zero SaleResponse
 if len(input.RequestID) < 8 || len(input.RequestID) > 120 || strings.TrimSpace(input.RequestID) != input.RequestID { return zero, invalid("requestId inválido") }
 if len(input.Items) == 0 || len(input.Items) > 100 { return zero, invalid("La venta necesita entre 1 y 100 productos") }
 cashCents, err := centsOf(input.CashReceived)
 if err != nil { return zero, err }
 items := append([]SaleItemInput(nil), input.Items...)
 sort.Slice(items, func(i,j int) bool { return items[i].ProductID < items[j].ProductID })
 for i,it := range items {
  if it.ProductID == "" || len(it.ProductID) > 120 || it.Quantity < 1 || it.Quantity > 10000 { return zero, invalid("Producto o cantidad inválidos") }
  if i > 0 && items[i-1].ProductID == it.ProductID { return zero, invalid("Productos repetidos en la solicitud") }
 }
 fingerprintValue := fmt.Sprintf("%d|", cashCents)
 for _,it := range items { fingerprintValue += fmt.Sprintf("%s:%d;",it.ProductID,it.Quantity) }
 digest := sha256.Sum256([]byte(fingerprintValue))
 fingerprint := hex.EncodeToString(digest[:])

 tx, err := s.DB.BeginTx(ctx, nil)
 if err != nil { return zero, err }
 defer tx.Rollback()

 // Serialize retries for the same request key before looking up the sale.
 if _,err := tx.ExecContext(ctx,"SELECT pg_advisory_xact_lock(hashtext($1)::bigint)",input.RequestID); err != nil { return zero,err }
 var existingID, existingTotal, existingChange int64
 var existingFingerprint string
 err = tx.QueryRowContext(ctx,"SELECT id,fingerprint,total_centavos,vuelto_centavos FROM ventas WHERE request_id=$1", input.RequestID).Scan(&existingID,&existingFingerprint,&existingTotal,&existingChange)
 if err == nil {
  if existingFingerprint != fingerprint { return zero, conflict("requestId ya usado con otros datos") }
  if err := tx.Commit(); err != nil { return zero,err }
  return SaleResponse{ID:existingID,Total:float64(existingTotal)/100,Vuelto:float64(existingChange)/100,Reused:true},nil
 }
 if !errors.Is(err,sql.ErrNoRows) { return zero,err }

 type line struct { ID string; Qty int; Price int64 }
 lines := make([]line,0,len(items))
 var total int64
 for _,it := range items {
  var price int64
  var stock int
  err := tx.QueryRowContext(ctx,"SELECT precio_centavos,stock_actual FROM productos WHERE id=$1 AND activo=TRUE FOR UPDATE",it.ProductID).Scan(&price,&stock)
  if errors.Is(err,sql.ErrNoRows) { return zero,&DomainError{404,"Producto no encontrado"} }
  if err != nil { return zero,err }
  if stock < it.Quantity { return zero, conflict("Existencias insuficientes para "+it.ProductID) }
  if price > 1000000000000/int64(it.Quantity) { return zero, invalid("Importe fuera de rango") }
  total += price*int64(it.Quantity)
  if total > 1000000000000 { return zero,invalid("Importe fuera de rango") }
  lines = append(lines,line{it.ProductID,it.Quantity,price})
 }
 if cashCents < total { return zero,&DomainError{422,"Efectivo insuficiente"} }
 var saleID int64
 err = tx.QueryRowContext(ctx,"INSERT INTO ventas(request_id,fingerprint,total_centavos,efectivo_centavos,vuelto_centavos) VALUES($1,$2,$3,$4,$5) RETURNING id",input.RequestID,fingerprint,total,cashCents,cashCents-total).Scan(&saleID)
 if err != nil { return zero,err }
 for _,l := range lines {
  if _,err := tx.ExecContext(ctx,"INSERT INTO venta_detalles(venta_id,producto_id,cantidad,precio_unitario_centavos,total_centavos) VALUES($1,$2,$3,$4,$5)",saleID,l.ID,l.Qty,l.Price,l.Price*int64(l.Qty)); err != nil { return zero,err }
  result,err := tx.ExecContext(ctx,"UPDATE productos SET stock_actual=stock_actual-$1 WHERE id=$2 AND stock_actual >= $1",l.Qty,l.ID)
  if err != nil { return zero,err }
  affected,err := result.RowsAffected()
  if err != nil { return zero,err }
  if affected != 1 { return zero,conflict("Existencias insuficientes") }
  if _,err := tx.ExecContext(ctx,"INSERT INTO movimientos_stock(venta_id,producto_id,variacion,tipo) VALUES($1,$2,$3,'venta')",saleID,l.ID,-l.Qty); err != nil { return zero,err }
 }
 if err := tx.Commit(); err != nil { return zero,err }
 return SaleResponse{ID:saleID,Total:float64(total)/100,Vuelto:float64(cashCents-total)/100},nil
}
