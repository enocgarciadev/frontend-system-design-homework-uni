package api

import (
 "context"
 "database/sql"
 "errors"
 "fmt"
 "time"
)

type MovementInput struct {
 ProductID string `json:"productId"`
 Type string `json:"type"`
 Quantity int `json:"quantity"`
}

type Movement struct {
 ID int64 `json:"id"`
 ProductID string `json:"productId"`
 ProductName string `json:"productName"`
 Type string `json:"type"`
 Quantity int `json:"quantity"`
 StockAfter *int `json:"stockAfter,omitempty"`
 SaleID *int64 `json:"saleId,omitempty"`
 CreatedAt time.Time `json:"createdAt"`
}

func validateMovement(input MovementInput) error {
 if !validProductID(input.ProductID) {return invalid("Producto inválido")}
 if input.Type != "entrada" && input.Type != "ajuste" {return invalid("El tipo debe ser entrada o ajuste")}
 if input.Quantity == 0 || input.Quantity < -10000 || input.Quantity > 10000 {return invalid("La variación debe estar entre -10000 y 10000 y no puede ser cero")}
 if input.Type == "entrada" && input.Quantity < 0 {return invalid("Una entrada debe ser positiva")}
 return nil
}

// CreateMovement serializes stock changes with sales on the same product row.
// Insert + update share one transaction, so invalid results never record a movement.
func (s *Store) CreateMovement(ctx context.Context, input MovementInput) (Movement,error) {
 if err:=validateMovement(input);err!=nil{return Movement{},err}
 tx,err:=s.DB.BeginTx(ctx,nil)
 if err!=nil{return Movement{},err}
 defer tx.Rollback()
 var name string
 var stock int
 err=tx.QueryRowContext(ctx,"SELECT nombre,stock_actual FROM productos WHERE id=$1 AND activo=TRUE FOR UPDATE",input.ProductID).Scan(&name,&stock)
 if errors.Is(err,sql.ErrNoRows){return Movement{},&DomainError{404,"Producto no encontrado"}}
 if err!=nil{return Movement{},err}
 next:=int64(stock)+int64(input.Quantity)
 if next<0{return Movement{},conflict("El movimiento dejaría existencias negativas")}
 if next>10000000{return Movement{},invalid("Stock fuera del máximo permitido")}
 var result Movement
 result.ProductID=input.ProductID
 result.ProductName=name
 result.Type=input.Type
 result.Quantity=input.Quantity
 updatedStock:=int(next)
 result.StockAfter=&updatedStock
 err=tx.QueryRowContext(ctx,"INSERT INTO movimientos_stock(producto_id,variacion,tipo) VALUES($1,$2,$3) RETURNING id,creado_en",input.ProductID,input.Quantity,input.Type).Scan(&result.ID,&result.CreatedAt)
 if err!=nil{return Movement{},fmt.Errorf("registrar movimiento: %w",err)}
 if _,err:=tx.ExecContext(ctx,"UPDATE productos SET stock_actual=$1 WHERE id=$2",next,input.ProductID);err!=nil{return Movement{},err}
 if err:=tx.Commit();err!=nil{return Movement{},err}
 return result,nil
}

func (s *Store) ListMovements(ctx context.Context) ([]Movement,error) {
 rows,err:=s.DB.QueryContext(ctx,`
 SELECT m.id,m.producto_id,p.nombre,m.tipo,m.variacion,m.venta_id,m.creado_en
 FROM movimientos_stock AS m
 JOIN productos AS p ON p.id=m.producto_id
 ORDER BY m.id DESC LIMIT 100`)
 if err!=nil{return nil,err}
 defer rows.Close()
 result:=make([]Movement,0)
 for rows.Next(){
  var entry Movement
  var saleID sql.NullInt64
  if err:=rows.Scan(&entry.ID,&entry.ProductID,&entry.ProductName,&entry.Type,&entry.Quantity,&saleID,&entry.CreatedAt);err!=nil{return nil,err}
  if saleID.Valid {value:=saleID.Int64;entry.SaleID=&value}
  result=append(result,entry)
 }
 return result,rows.Err()
}
