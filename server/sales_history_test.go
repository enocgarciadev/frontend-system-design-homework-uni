package api

import (
 "context"
 "fmt"
 "net/http"
 "net/http/httptest"
 "os"
 "strconv"
 "testing"
 "time"
)

func TestSalesHistoryPostgres(t *testing.T) {
 dbURL:=os.Getenv("DATABASE_URL")
 if dbURL==""{t.Skip("DATABASE_URL no configurado")}
 ctx:=context.Background()
 store,err:=OpenStore(ctx,dbURL);if err!=nil{t.Fatal(err)}
 defer store.DB.Close()
 if err:=Migrate(ctx,store.DB);err!=nil{t.Fatal(err)}
 productID:=fmt.Sprintf("pr07-test-%d",time.Now().UnixNano())
 _,err=store.DB.ExecContext(ctx,"INSERT INTO productos (id,nombre,categoria_id,precio_centavos,stock_actual,stock_minimo) VALUES($1,'Prueba historial','abarrotes',1700,3,0)",productID)
 if err!=nil{t.Fatal(err)}
 var id int64
 t.Cleanup(func(){
  if id>0 {store.DB.ExecContext(context.Background(),"DELETE FROM ventas WHERE id=$1",id)}
  store.DB.ExecContext(context.Background(),"DELETE FROM productos WHERE id=$1",productID)
 })
 result,err:=store.CreateSale(ctx,SaleRequest{RequestID:productID+"-sale",CashReceived:50,Items:[]SaleItemInput{{ProductID:productID,Quantity:2}}})
 if err!=nil{t.Fatal(err)}
 id=result.ID
 history,err:=store.ListSales(ctx)
 if err!=nil{t.Fatal(err)}
 found:=false
 for _,entry:=range history{if entry.ID==id&&entry.Total==34{found=true}}
 if !found{t.Fatal("La venta no aparece en el historial")}
 detail,err:=store.GetSale(ctx,id)
 if err!=nil{t.Fatal(err)}
 if detail.Total!=34||detail.CashReceived!=50||detail.Change!=16||len(detail.Items)!=1||detail.Items[0].Quantity!=2||detail.Items[0].ProductName!="Prueba historial"{t.Fatalf("Detalle incorrecto: %+v",detail)}
 // The audit detail remains available even after soft-deactivating the product.
 if err:=store.DeactivateProduct(ctx,productID);err!=nil{t.Fatal(err)}
 detail,err=store.GetSale(ctx,id)
 if err!=nil||len(detail.Items)!=1{t.Fatalf("Historial perdido luego de baja: %+v %v",detail,err)}
 handler:=NewHandler(store)
 cookie,csrf:=testAuthSession(t,store,"admin")
 for _,tt:=range []struct{path string;want int}{
  {"/api/ventas",200},
  {"/api/ventas/"+strconv.FormatInt(id,10),200},
  {"/api/ventas/0",404},
  {"/api/ventas/abc",404},
  {"/api/ventas/999999999999",404},
 }{
  w:=httptest.NewRecorder()
  request:=httptest.NewRequest(http.MethodGet,tt.path,nil)
  authorizeTestRequest(request,cookie,csrf)
  handler.ServeHTTP(w,request)
  if w.Code!=tt.want{t.Errorf("%s: HTTP %d, esperado %d: %s",tt.path,w.Code,tt.want,w.Body.String())}
 }
}
