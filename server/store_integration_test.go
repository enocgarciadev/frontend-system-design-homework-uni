package api

import (
 "bytes"
 "context"
 "encoding/json"
 "fmt"
 "net/http"
 "net/http/httptest"
 "os"
 "strings"
 "sync"
 "testing"
 "time"
)

func TestPostgresTransactions(t *testing.T){
 url:=os.Getenv("DATABASE_URL")
 if url==""{t.Skip("DATABASE_URL no configurado")}
 ctx:=context.Background()
 store,err:=OpenStore(ctx,url);if err!=nil{t.Fatal(err)}
 defer store.DB.Close()
 if err:=Migrate(ctx,store.DB);err!=nil{t.Fatal(err)}
 id:=fmt.Sprintf("pr02-test-%d",time.Now().UnixNano())
 requestID:=id+"-sale"
 if _,err:=store.DB.ExecContext(ctx,"INSERT INTO productos(id,nombre,categoria_id,precio_centavos,stock_actual,stock_minimo) VALUES($1,'Prueba transaccional','abarrotes',2500,2,0)",id);err!=nil{t.Fatal(err)}
 t.Cleanup(func(){
  store.DB.ExecContext(context.Background(),"DELETE FROM ventas WHERE request_id LIKE $1",id+"%")
  store.DB.ExecContext(context.Background(),"DELETE FROM productos WHERE id=$1",id)
 })
 handler:=NewHandler(store)
 post:=func(payload SaleRequest)(int,SaleResponse,string){
  t.Helper()
  b,_:=json.Marshal(payload)
  w:=httptest.NewRecorder()
  handler.ServeHTTP(w,httptest.NewRequest(http.MethodPost,"/api/ventas",bytes.NewReader(b)))
  var result SaleResponse
  json.Unmarshal(w.Body.Bytes(),&result)
  return w.Code,result,w.Body.String()
 }
 initial:=SaleRequest{RequestID:requestID,CashReceived:30,Items:[]SaleItemInput{{ProductID:id,Quantity:1}}}
 status,result,body:=post(initial)
 if status!=201||result.Total!=25||result.Vuelto!=5{t.Fatalf("venta %d %+v %s",status,result,body)}
 status,again,body:=post(initial)
 if status!=200||!again.Reused||again.ID!=result.ID{t.Fatalf("idempotencia %d %+v %s",status,again,body)}
 different:=initial;different.CashReceived=40
 if status,_,_:=post(different);status!=409{t.Fatalf("requestId reusado status %d",status)}
 var stock,details,moves,ventas int
 store.DB.QueryRowContext(ctx,"SELECT stock_actual FROM productos WHERE id=$1",id).Scan(&stock)
 store.DB.QueryRowContext(ctx,"SELECT count(*) FROM venta_detalles WHERE venta_id=$1",result.ID).Scan(&details)
 store.DB.QueryRowContext(ctx,"SELECT count(*) FROM movimientos_stock WHERE venta_id=$1",result.ID).Scan(&moves)
 store.DB.QueryRowContext(ctx,"SELECT count(*) FROM ventas WHERE request_id=$1",requestID).Scan(&ventas)
 if stock!=1||details!=1||moves!=1||ventas!=1{t.Fatalf("persistencia: %d stock %d detalles %d movimientos %d ventas",stock,details,moves,ventas)}
 // Another sale must fail with insufficient stock and leave no partial write.
 invalid:=SaleRequest{RequestID:id+"-insufficient",CashReceived:100,Items:[]SaleItemInput{{ProductID:id,Quantity:2}}}
 if status,_,_:=post(invalid);status!=409{t.Fatalf("stock status %d",status)}
 var partial int
 store.DB.QueryRowContext(ctx,"SELECT count(*) FROM ventas WHERE request_id=$1",invalid.RequestID).Scan(&partial)
 if partial!=0{t.Fatal("rollback left an incomplete sale")}
 // Competing requests for the final unit can never both succeed.
 var wg sync.WaitGroup
 statuses:=make(chan int,2)
 for n:=0;n<2;n++{
  wg.Add(1)
  go func(i int){
   defer wg.Done()
   payload:=SaleRequest{RequestID:fmt.Sprintf("%s-concurrent-%d",id,i),CashReceived:25,Items:[]SaleItemInput{{ProductID:id,Quantity:1}}}
   b,_:=json.Marshal(payload)
   w:=httptest.NewRecorder()
   handler.ServeHTTP(w,httptest.NewRequest("POST","/api/ventas",bytes.NewReader(b)))
   statuses<-w.Code
  }(n)
 }
 wg.Wait();close(statuses)
 ok,conflicts:=0,0
 for status:=range statuses{if status==201{ok++};if status==409{conflicts++}}
 if ok!=1||conflicts!=1{t.Fatalf("concurrencia: %d exitosas, %d conflictos",ok,conflicts)}
 if err:=store.DB.QueryRowContext(ctx,"SELECT stock_actual FROM productos WHERE id=$1",id).Scan(&stock);err!=nil||stock!=0{t.Fatalf("stock final %d, %v",stock,err)}
 // GET returns server-side catalog.
 w:=httptest.NewRecorder()
 handler.ServeHTTP(w,httptest.NewRequest("GET","/api/productos",nil))
 if w.Code!=200||!strings.Contains(w.Body.String(),id){t.Fatalf("catálogo %d: %s",w.Code,w.Body.String())}
}
