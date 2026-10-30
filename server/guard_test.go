package api

import (
 "bytes"
 "context"
 "encoding/json"
 "net/http"
 "net/http/httptest"
 "os"
 "testing"
)

func TestAuthorizationAndCSRF(t *testing.T) {
 url:=os.Getenv("DATABASE_URL")
 if url==""{t.Skip("DATABASE_URL no configurado")}
 store,err:=OpenStore(context.Background(),url)
 if err!=nil{t.Fatal(err)}
 defer store.DB.Close()
 if err:=Migrate(context.Background(),store.DB);err!=nil{t.Fatal(err)}
 handler:=NewHandler(store)
 adminCookie,adminCSRF:=testAuthSession(t,store,"admin")
 sellerCookie,sellerCSRF:=testAuthSession(t,store,"vendedor")
 call:=func(method,path string,cookie *http.Cookie,csrf string)int{
  req:=httptest.NewRequest(method,path,bytes.NewReader([]byte("{}")))
  if cookie!=nil{req.AddCookie(cookie)}
  if csrf!=""{req.Header.Set("X-CSRF-Token",csrf)}
  req.Header.Set("Content-Type","application/json")
  w:=httptest.NewRecorder()
  handler.ServeHTTP(w,req)
  return w.Code
 }
 cases:=[]struct{name,method,path string;cookie *http.Cookie;csrf string;expected int}{
  {"anonymous catalog","GET","/api/productos",nil,"",401},
  {"anonymous sale","POST","/api/ventas",nil,"",401},
  {"seller catalog","GET","/api/productos",sellerCookie,"",200},
  {"seller movements","GET","/api/movimientos",sellerCookie,"",403},
  {"seller cannot modify products","POST","/api/productos",sellerCookie,sellerCSRF,403},
  {"seller cannot adjust stock","POST","/api/movimientos",sellerCookie,sellerCSRF,403},
  {"seller without csrf","POST","/api/ventas",sellerCookie,"",403},
  {"admin without csrf","POST","/api/movimientos",adminCookie,"",403},
  {"admin valid csrf reaches parser","POST","/api/movimientos",adminCookie,adminCSRF,400},
  {"seller valid csrf reaches sale validation","POST","/api/ventas",sellerCookie,sellerCSRF,400},
 }
 for _,tt:=range cases{
  t.Run(tt.name,func(t *testing.T){if got:=call(tt.method,tt.path,tt.cookie,tt.csrf);got!=tt.expected{
   t.Errorf("%s %s => %d, expected %d",tt.method,tt.path,got,tt.expected)
  }})
 }
 // Verify authenticated user data doesn't accidentally include password hashes.
 req:=httptest.NewRequest("GET","/api/auth/me",nil);req.AddCookie(adminCookie)
 w:=httptest.NewRecorder();handler.ServeHTTP(w,req)
 var body map[string]any
 if err:=json.Unmarshal(w.Body.Bytes(),&body);err!=nil{t.Fatal(err)}
 if _,ok:=body["password_hash"];ok{t.Fatal("password hash exposed")}
}
