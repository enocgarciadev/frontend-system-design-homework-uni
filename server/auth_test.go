package api

import (
 "bytes"
 "context"
 "encoding/json"
 "fmt"
 "net/http"
 "net/http/httptest"
 "os"
 "testing"
 "time"
)

func TestPasswordHash(t *testing.T){
 h1,err:=hashPassword("Password-MUY-Largo-123")
 if err!=nil{t.Fatal(err)}
 h2,err:=hashPassword("Password-MUY-Largo-123")
 if err!=nil{t.Fatal(err)}
 if h1==h2{t.Fatal("El salt debe ser aleatorio")}
 if !checkPassword("Password-MUY-Largo-123",h1)||checkPassword("Password-equivocado",h1){t.Fatal("Hash/validación incorrecto")}
}

func TestPersistentLoginAndLogout(t *testing.T){
 url:=os.Getenv("DATABASE_URL")
 if url==""{t.Skip("DATABASE_URL no configurado")}
 ctx:=context.Background()
 store,err:=OpenStore(ctx,url)
 if err!=nil{t.Fatal(err)}
 defer store.DB.Close()
 if err:=Migrate(ctx,store.DB);err!=nil{t.Fatal(err)}
 email:=fmt.Sprintf("pr09-%d@pulpestock.test",time.Now().UnixNano())
 user,err:=store.CreateUser(ctx,UserRegistration{Name:"Administrador de prueba",Email:email,Password:"ClaveSegura123456-TEST",Role:"admin"})
 if err!=nil{t.Fatal(err)}
 t.Cleanup(func(){store.DB.ExecContext(context.Background(),"DELETE FROM usuarios WHERE id=$1",user.ID)})
 handler:=NewHandler(store)
 makeRequest:=func(method,path string,data any,cookie *http.Cookie,csrf string)*httptest.ResponseRecorder{
  t.Helper()
  var body []byte
  if data!=nil{body,_=json.Marshal(data)}
  req:=httptest.NewRequest(method,path,bytes.NewReader(body))
  if data!=nil{req.Header.Set("Content-Type","application/json")}
  if cookie!=nil{req.AddCookie(cookie)}
  if csrf!=""{req.Header.Set("X-CSRF-Token",csrf)}
  recorder:=httptest.NewRecorder()
  handler.ServeHTTP(recorder,req)
  return recorder
 }
 if got:=makeRequest("GET","/api/auth/me",nil,nil,"");got.Code!=401{t.Errorf("anonymous session %d",got.Code)}
 if got:=makeRequest("POST","/api/auth/login",LoginInput{Email:email,Password:"equivocada"},nil,"");got.Code!=401{t.Errorf("bad password %d",got.Code)}
 login:=makeRequest("POST","/api/auth/login",LoginInput{Email:email,Password:"ClaveSegura123456-TEST"},nil,"")
 if login.Code!=200{t.Fatalf("login status %d: %s",login.Code,login.Body.String())}
 cookies:=login.Result().Cookies()
 if len(cookies)==0||!cookies[0].HttpOnly||cookies[0].SameSite!=http.SameSiteStrictMode{t.Fatalf("cookie insegura: %+v",cookies)}
 var result struct{User AuthUser `json:"user"`;CSRFToken string `json:"csrfToken"`}
 if err:=json.Unmarshal(login.Body.Bytes(),&result);err!=nil{t.Fatal(err)}
 if result.User.Role!="admin"||result.User.Email!=email||len(result.CSRFToken)!=64{t.Fatalf("login %+v",result)}
 if got:=makeRequest("GET","/api/auth/me",nil,cookies[0],"");got.Code!=200{t.Fatalf("session %d",got.Code)}
 if got:=makeRequest("POST","/api/auth/logout",nil,cookies[0],"incorrecto");got.Code!=403{t.Fatalf("CSRF %d",got.Code)}
 if got:=makeRequest("POST","/api/auth/logout",nil,cookies[0],result.CSRFToken);got.Code!=204{t.Fatalf("logout %d: %s",got.Code,got.Body.String())}
 if got:=makeRequest("GET","/api/auth/me",nil,cookies[0],"");got.Code!=401{t.Fatalf("revoked session %d",got.Code)}
}

func testAuthSession(t *testing.T,store *Store,role string) (*http.Cookie,string) {
 t.Helper()
 email:=fmt.Sprintf("integration-%s-%d@pulpestock.test",role,time.Now().UnixNano())
 user,err:=store.CreateUser(context.Background(),UserRegistration{
  Name:"Usuario de pruebas",Email:email,Password:"Integration-Password-Strong-123",Role:role,
 })
 if err!=nil{t.Fatal(err)}
 t.Cleanup(func(){
  store.DB.ExecContext(context.Background(),"DELETE FROM usuarios WHERE id=$1",user.ID)
 })
 body,_:=json.Marshal(LoginInput{Email:email,Password:"Integration-Password-Strong-123"})
 req:=httptest.NewRequest("POST","/api/auth/login",bytes.NewReader(body))
 req.Header.Set("Content-Type","application/json")
 w:=httptest.NewRecorder()
 NewHandler(store).ServeHTTP(w,req)
 if w.Code!=200{t.Fatalf("test login HTTP %d %s",w.Code,w.Body.String())}
 var login struct {CSRFToken string `json:"csrfToken"`}
 if err:=json.Unmarshal(w.Body.Bytes(),&login);err!=nil{t.Fatal(err)}
 cookies:=w.Result().Cookies()
 if len(cookies)!=1{t.Fatalf("login returned %d cookies",len(cookies))}
 return cookies[0],login.CSRFToken
}
func authorizeTestRequest(req *http.Request,cookie *http.Cookie,csrf string) {
 req.AddCookie(cookie)
 if req.Method!=http.MethodGet&&req.Method!=http.MethodHead{
  req.Header.Set("X-CSRF-Token",csrf)
 }
}
