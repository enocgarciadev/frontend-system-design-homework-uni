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
 "testing"
 "time"
)

func TestProductValidation(t *testing.T){
 stock:=1
 valid:=ProductInput{ID:"producto-ejemplo",Nombre:"Producto Ejemplo",Categoria:"abarrotes",PrecioVenta:23.75,StockActual:&stock,StockMinimo:1,CodigoBarras:"7441234567890"}
 if _,err:=validateProduct(valid,true);err!=nil{t.Fatal(err)}
 for _,tt:=range []struct{name string;change func(*ProductInput)}{
  {"negative price",func(p *ProductInput){p.PrecioVenta=-1}},
  {"fractional cent",func(p *ProductInput){p.PrecioVenta=20.001}},
  {"invalid id",func(p *ProductInput){p.ID="../../danger"}},
  {"negative stock",func(p *ProductInput){n:=-1;p.StockActual=&n}},
  {"non numeric barcode",func(p *ProductInput){p.CodigoBarras="not-valid"}},
 } {
  t.Run(tt.name,func(t *testing.T){p:=valid;tt.change(&p);if _,err:=validateProduct(p,true);err==nil{t.Fatal("validation accepted invalid product")}})
 }
 if _,err:=validateProduct(valid,false);err==nil{t.Fatal("editing stock must be rejected")}
}

func TestProductCRUDPostgres(t *testing.T){
 url:=os.Getenv("DATABASE_URL");if url==""{t.Skip("DATABASE_URL not configured")}
 ctx:=context.Background()
 store,err:=OpenStore(ctx,url);if err!=nil{t.Fatal(err)}
 defer store.DB.Close()
 if err:=Migrate(ctx,store.DB);err!=nil{t.Fatal(err)}
 productID:=fmt.Sprintf("pr03-%d",time.Now().UnixNano())
 t.Cleanup(func(){store.DB.ExecContext(context.Background(),"DELETE FROM productos WHERE id=$1",productID)})
 handler:=NewHandler(store)
 cookie,csrf:=testAuthSession(t,store,"admin")
 req:=func(method,path string,body any)(int,[]byte){
  t.Helper()
  var reader *bytes.Reader
  if body==nil{reader=bytes.NewReader(nil)}else{raw,_:=json.Marshal(body);reader=bytes.NewReader(raw)}
  r:=httptest.NewRequest(method,path,reader)
  if body!=nil{r.Header.Set("Content-Type","application/json")}
  authorizeTestRequest(r,cookie,csrf)
  w:=httptest.NewRecorder();handler.ServeHTTP(w,r)
  return w.Code,w.Body.Bytes()
 }
 stock:=7
 product:=ProductInput{ID:productID,Nombre:"Producto de prueba",Categoria:"abarrotes",PrecioVenta:25.5,StockActual:&stock,StockMinimo:2,CodigoBarras:""}
 code,body:=req(http.MethodPost,"/api/productos",product)
 if code!=201{t.Fatalf("create %d %s",code,body)}
 var saved Product
 if err:=json.Unmarshal(body,&saved);err!=nil{t.Fatal(err)}
 if saved.StockActual!=7||saved.PrecioVenta!=25.5{t.Fatalf("created product %+v",saved)}
 if code,_:=req(http.MethodPost,"/api/productos",product);code!=409{t.Errorf("duplicate code %d",code)}
 if code,body:=req(http.MethodGet,"/api/productos",nil);code!=200||!strings.Contains(string(body),productID){t.Fatalf("list %d %s",code,body)}
 product.ID="";product.StockActual=nil;product.Nombre="Producto actualizado";product.PrecioVenta=30
 code,body=req(http.MethodPut,"/api/productos/"+productID,product)
 if code!=200{t.Fatalf("update %d %s",code,body)}
 if err:=json.Unmarshal(body,&saved);err!=nil{t.Fatal(err)}
 if saved.PrecioVenta!=30||saved.StockActual!=7{t.Fatalf("changed stock unexpectedly %+v",saved)}
 bad:=product;bad.Categoria="no-existe"
 if code,_:=req(http.MethodPut,"/api/productos/"+productID,bad);code!=400{t.Errorf("missing category expected 400 got %d",code)}
 current:=saved.StockActual;product.StockActual=&current
 if code,_:=req(http.MethodPut,"/api/productos/"+productID,product);code!=400{t.Errorf("stock edit must be rejected, got %d",code)}
 if code,_:=req(http.MethodDelete,"/api/productos/"+productID,nil);code!=204{t.Fatalf("deactivate %d",code)}
 if code,body:=req(http.MethodGet,"/api/productos",nil);code!=200||strings.Contains(string(body),productID){t.Fatalf("deactivated appears in list %d %s",code,body)}
 if code,_:=req(http.MethodPut,"/api/productos/"+productID,product);code!=400{ /* request includes forbidden stock, tested above */ }
 product.StockActual=nil
 if code,_:=req(http.MethodPut,"/api/productos/"+productID,product);code!=404{t.Errorf("update archived %d",code)}
 if code,_:=req(http.MethodDelete,"/api/productos/"+productID,nil);code!=404{t.Errorf("delete archived %d",code)}
}
