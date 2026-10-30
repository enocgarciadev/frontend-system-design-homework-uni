package api

import (
 "context"
 "fmt"
 "os"
 "testing"
 "time"
)

func TestMovementValidation(t *testing.T) {
 ok:=MovementInput{ProductID:"arroz-faisan-1lb",Type:"entrada",Quantity:3}
 if err:=validateMovement(ok);err!=nil{t.Fatal(err)}
 for _,tt:=range []MovementInput{
  {ProductID:ok.ProductID,Type:"entrada",Quantity:-1},
  {ProductID:ok.ProductID,Type:"venta",Quantity:1},
  {ProductID:ok.ProductID,Type:"ajuste",Quantity:0},
  {ProductID:ok.ProductID,Type:"ajuste",Quantity:10001},
  {ProductID:"../bad",Type:"entrada",Quantity:1},
 } {
  if err:=validateMovement(tt);err==nil{t.Errorf("validación aceptó %+v",tt)}
 }
}

func TestStockMovementPostgres(t *testing.T) {
 url:=os.Getenv("DATABASE_URL")
 if url==""{t.Skip("DATABASE_URL no configurado")}
 ctx:=context.Background()
 store,err:=OpenStore(ctx,url);if err!=nil{t.Fatal(err)}
 defer store.DB.Close()
 if err:=Migrate(ctx,store.DB);err!=nil{t.Fatal(err)}
 id:=fmt.Sprintf("pr05-test-%d",time.Now().UnixNano())
 if _,err:=store.DB.ExecContext(ctx,"INSERT INTO productos(id,nombre,categoria_id,precio_centavos,stock_actual,stock_minimo) VALUES($1,'Prueba de movimiento','abarrotes',3000,2,0)",id);err!=nil{t.Fatal(err)}
 t.Cleanup(func(){
  store.DB.ExecContext(context.Background(),"DELETE FROM movimientos_stock WHERE producto_id=$1",id)
  store.DB.ExecContext(context.Background(),"DELETE FROM productos WHERE id=$1",id)
 })
 income,err:=store.CreateMovement(ctx,MovementInput{ProductID:id,Type:"entrada",Quantity:4})
 if err!=nil||income.StockAfter==nil||*income.StockAfter!=6{t.Fatalf("entrada %+v %v",income,err)}
 adj,err:=store.CreateMovement(ctx,MovementInput{ProductID:id,Type:"ajuste",Quantity:-5})
 if err!=nil||adj.StockAfter==nil||*adj.StockAfter!=1{t.Fatalf("ajuste %+v %v",adj,err)}
 if _,err:=store.CreateMovement(ctx,MovementInput{ProductID:id,Type:"ajuste",Quantity:-2});err==nil{t.Fatal("permitió stock negativo")}
 var stock,events int
 if err:=store.DB.QueryRowContext(ctx,"SELECT stock_actual FROM productos WHERE id=$1",id).Scan(&stock);err!=nil{t.Fatal(err)}
 if err:=store.DB.QueryRowContext(ctx,"SELECT COUNT(*) FROM movimientos_stock WHERE producto_id=$1",id).Scan(&events);err!=nil{t.Fatal(err)}
 if stock!=1||events!=2{t.Fatalf("se perdió atomicidad stock=%d eventos=%d",stock,events)}
 history,err:=store.ListMovements(ctx)
 if err!=nil{t.Fatal(err)}
 found:=0
 for _,entry:=range history{if entry.ProductID==id{found++}}
 if found!=2{t.Fatalf("historial de movimientos tiene %d, se esperaban 2",found)}
}
