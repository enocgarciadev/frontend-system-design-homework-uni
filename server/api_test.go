package api

import (
 "encoding/json"
 "net/http/httptest"
 "reflect"
 "strings"
 "testing"
)

func TestHealth(t *testing.T){
 t.Parallel()
 tests:=[]struct{name,method,path string;status int;allow string;body map[string]string}{
  {"ok","GET","/api/health",200,"",map[string]string{"status":"ok","service":"pulpestock-api"}},
  {"method","POST","/api/health",405,"GET",map[string]string{"error":"Method Not Allowed"}},
  {"missing","GET","/api/missing",404,"",map[string]string{"error":"Not Found"}},
  {"missing database","GET","/api/productos",503,"",map[string]string{"error":"Base de datos no disponible"}},
 }
 for _,tt:=range tests{
  t.Run(tt.name,func(t *testing.T){
   req:=httptest.NewRequest(tt.method,tt.path,nil);w:=httptest.NewRecorder()
   NewHandler(nil).ServeHTTP(w,req);res:=w.Result();defer res.Body.Close()
   if res.StatusCode!=tt.status{t.Fatalf("status %d want %d",res.StatusCode,tt.status)}
   if !strings.HasPrefix(res.Header.Get("Content-Type"),"application/json"){t.Error("not JSON")}
   if res.Header.Get("Cache-Control")!="no-store"{t.Error("cache header")}
   if res.Header.Get("Allow")!=tt.allow{t.Error("allow header")}
   var got map[string]string
   if err:=json.NewDecoder(res.Body).Decode(&got);err!=nil{t.Fatal(err)}
   if !reflect.DeepEqual(got,tt.body){t.Fatalf("got %v want %v",got,tt.body)}
  })
 }
}
func TestCents(t *testing.T){
 if cents,err:=centsOf(100.25);err!=nil||cents!=10025{t.Fatalf("centavos: %d %v",cents,err)}
 for _,bad:=range []float64{-1,1.001,100000001}{
  if _,err:=centsOf(bad);err==nil{t.Errorf("accepted %f",bad)}
 }
}
