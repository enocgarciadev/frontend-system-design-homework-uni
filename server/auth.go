package api

import (
 "context"
 "crypto/hmac"
 "crypto/rand"
 "crypto/sha256"
 "crypto/subtle"
 "database/sql"
 "encoding/base64"
 "encoding/hex"
 "errors"
 "fmt"
 "net/http"
 "os"
 "strings"
 "time"
)

const sessionCookieName = "pulpestock_session"
const passwordIterations = 310000
const sessionDuration = 8 * time.Hour

type AuthUser struct {
 ID int64 `json:"id"`
 Name string `json:"name"`
 Email string `json:"email"`
 Role string `json:"role"`
}

type LoginInput struct {
 Email string `json:"email"`
 Password string `json:"password"`
}

type UserRegistration struct {
 Name string
 Email string
 Password string
 Role string
}

type AuthSession struct {
 User AuthUser
 CSRFToken string
 TokenHash string
}

func normalizedEmail(value string) string {return strings.ToLower(strings.TrimSpace(value))}

func validateRegistration(input UserRegistration) error {
 if len(strings.TrimSpace(input.Name))<2||len(input.Name)>120{return invalid("Nombre inválido")}
 if input.Role!="admin"&&input.Role!="vendedor"{return invalid("Rol inválido")}
 email:=normalizedEmail(input.Email)
 if len(email)<5||len(email)>254||!strings.Contains(email,"@")||strings.ContainsAny(email," \n\r\t"){return invalid("Correo inválido")}
 if len(input.Password)<12||len(input.Password)>128{return invalid("La contraseña debe tener entre 12 y 128 caracteres")}
 return nil
}

// pbkdf2SHA256 follows PBKDF2-HMAC-SHA256 with a random 128-bit salt.
// This deliberately avoids raw/fast SHA256 password storage.
func pbkdf2SHA256(password,salt []byte,iterations int) []byte {
 h:=hmac.New(sha256.New,password)
 _,_=h.Write(salt)
 _,_=h.Write([]byte{0,0,0,1})
 u:=h.Sum(nil)
 result:=append([]byte(nil),u...)
 for i:=1;i<iterations;i++ {
  h.Reset()
  _,_=h.Write(u)
  u=h.Sum(u[:0])
  for j:=range result {result[j]^=u[j]}
 }
 return result
}

func hashPassword(password string) (string,error) {
 salt:=make([]byte,16)
 if _,err:=rand.Read(salt);err!=nil{return "",err}
 key:=pbkdf2SHA256([]byte(password),salt,passwordIterations)
 return fmt.Sprintf("pbkdf2-sha256$%d$%s$%s",passwordIterations,base64.RawURLEncoding.EncodeToString(salt),base64.RawURLEncoding.EncodeToString(key)),nil
}

func checkPassword(password,stored string) bool {
 parts:=strings.Split(stored,"$")
 if len(parts)!=4||parts[0]!="pbkdf2-sha256"||parts[1]!="310000"{return false}
 salt,err1:=base64.RawURLEncoding.DecodeString(parts[2])
 key,err2:=base64.RawURLEncoding.DecodeString(parts[3])
 if err1!=nil||err2!=nil||len(salt)!=16||len(key)!=sha256.Size{return false}
 actual:=pbkdf2SHA256([]byte(password),salt,passwordIterations)
 return subtle.ConstantTimeCompare(actual,key)==1
}

func (s *Store) CreateUser(ctx context.Context,input UserRegistration) (AuthUser,error) {
 if err:=validateRegistration(input);err!=nil{return AuthUser{},err}
 hash,err:=hashPassword(input.Password)
 if err!=nil{return AuthUser{},err}
 var user AuthUser
 err=s.DB.QueryRowContext(ctx,
  "INSERT INTO usuarios(nombre,email,password_hash,rol) VALUES($1,$2,$3,$4) RETURNING id,nombre,email,rol",
  strings.TrimSpace(input.Name),normalizedEmail(input.Email),hash,input.Role,
 ).Scan(&user.ID,&user.Name,&user.Email,&user.Role)
 return user,productDatabaseError(err)
}

func (s *Store) Authenticate(ctx context.Context,input LoginInput) (AuthUser,error) {
 var user AuthUser
 var stored string
 err:=s.DB.QueryRowContext(ctx,
  "SELECT id,nombre,email,rol,password_hash FROM usuarios WHERE email=$1 AND activo=TRUE",
  normalizedEmail(input.Email),
 ).Scan(&user.ID,&user.Name,&user.Email,&user.Role,&stored)
 if errors.Is(err,sql.ErrNoRows) {return AuthUser{},&DomainError{401,"Credenciales inválidas"}}
 if err!=nil{return AuthUser{},err}
 if !checkPassword(input.Password,stored){return AuthUser{},&DomainError{401,"Credenciales inválidas"}}
 return user,nil
}

func digestToken(token string) string {
 hash:=sha256.Sum256([]byte(token))
 return hex.EncodeToString(hash[:])
}
func csrfForToken(token string) string {return digestToken("csrf:"+token)}

func (s *Store) StartSession(ctx context.Context,user AuthUser) (string,error) {
 raw:=make([]byte,32)
 if _,err:=rand.Read(raw);err!=nil{return "",err}
 token:=base64.RawURLEncoding.EncodeToString(raw)
 _,err:=s.DB.ExecContext(ctx,
  "INSERT INTO sesiones(token_hash,usuario_id,expira_en) VALUES($1,$2,$3)",
  digestToken(token),user.ID,time.Now().Add(sessionDuration),
 )
 return token,err
}

func (s *Store) CurrentSession(r *http.Request) (AuthSession,error) {
 var session AuthSession
 cookie,err:=r.Cookie(sessionCookieName)
 if err!=nil||len(cookie.Value)<40||len(cookie.Value)>128{return session,&DomainError{401,"Se requiere iniciar sesión"}}
 session.TokenHash=digestToken(cookie.Value)
 err=s.DB.QueryRowContext(r.Context(),`
 SELECT u.id,u.nombre,u.email,u.rol FROM sesiones s
 JOIN usuarios u ON u.id=s.usuario_id
 WHERE s.token_hash=$1 AND s.expira_en>now() AND u.activo=TRUE`,session.TokenHash).
 Scan(&session.User.ID,&session.User.Name,&session.User.Email,&session.User.Role)
 if errors.Is(err,sql.ErrNoRows){return AuthSession{},&DomainError{401,"La sesión expiró o no existe"}}
 if err!=nil{return AuthSession{},err}
 session.CSRFToken=csrfForToken(cookie.Value)
 return session,nil
}

func validCSRF(session AuthSession,header string) bool {
 return subtle.ConstantTimeCompare([]byte(session.CSRFToken),[]byte(header))==1
}

func writeSessionCookie(w http.ResponseWriter,r *http.Request,token string,ttl int){
 http.SetCookie(w,&http.Cookie{
  Name:sessionCookieName,Value:token,Path:"/",MaxAge:ttl,
  HttpOnly:true,Secure:r.TLS!=nil||os.Getenv("COOKIE_SECURE")=="true",
  SameSite:http.SameSiteStrictMode,
 })
}

func registerAuthRoutes(mux *http.ServeMux,store *Store) {
 mux.HandleFunc("/api/auth/login",func(w http.ResponseWriter,r *http.Request){
  if r.Method!="POST"{methodNotAllowed(w,"POST");return}
  if store==nil{writeJSON(w,503,map[string]string{"error":"Base de datos no disponible"});return}
  var input LoginInput
  if !decodeJSON(w,r,&input){return}
  if len(input.Email)>254||len(input.Password)>256 {
   writeJSON(w,401,map[string]string{"error":"Credenciales inválidas"});return
  }
  user,err:=store.Authenticate(r.Context(),input)
  if err!=nil{
   var domain *DomainError
   if errors.As(err,&domain){writeJSON(w,domain.Code,map[string]string{"error":domain.Message});return}
   writeJSON(w,500,map[string]string{"error":"No se pudo iniciar sesión"});return
  }
  token,err:=store.StartSession(r.Context(),user)
  if err!=nil{writeJSON(w,500,map[string]string{"error":"No se pudo crear la sesión"});return}
  writeSessionCookie(w,r,token,int(sessionDuration.Seconds()))
  writeJSON(w,200,map[string]any{"user":user,"csrfToken":csrfForToken(token)})
 })
 mux.HandleFunc("/api/auth/me",func(w http.ResponseWriter,r *http.Request){
  if r.Method!="GET"{methodNotAllowed(w,"GET");return}
  if store==nil{writeJSON(w,503,map[string]string{"error":"Base de datos no disponible"});return}
  session,err:=store.CurrentSession(r)
  if err!=nil{authFailure(w,err);return}
  writeJSON(w,200,map[string]any{"user":session.User,"csrfToken":session.CSRFToken})
 })
 mux.HandleFunc("/api/auth/logout",func(w http.ResponseWriter,r *http.Request){
  if r.Method!="POST"{methodNotAllowed(w,"POST");return}
  if store==nil{writeJSON(w,503,map[string]string{"error":"Base de datos no disponible"});return}
  session,err:=store.CurrentSession(r)
  if err!=nil{authFailure(w,err);return}
  if !validCSRF(session,r.Header.Get("X-CSRF-Token")){writeJSON(w,403,map[string]string{"error":"CSRF inválido"});return}
  if _,err:=store.DB.ExecContext(r.Context(),"DELETE FROM sesiones WHERE token_hash=$1",session.TokenHash);err!=nil{
   writeJSON(w,500,map[string]string{"error":"No se pudo cerrar sesión"});return
  }
  writeSessionCookie(w,r,"",-1)
  w.WriteHeader(204)
 })
}

func authFailure(w http.ResponseWriter,err error) {
 var domain *DomainError
 if errors.As(err,&domain){writeJSON(w,domain.Code,map[string]string{"error":domain.Message});return}
 writeJSON(w,500,map[string]string{"error":"Error al validar la sesión"})
}
