package api

import (
 "encoding/json"
 "errors"
 "io"
 "strings"
 "net/http"
)

func NewHandler(store *Store) http.Handler {
 mux := http.NewServeMux()
 mux.HandleFunc("/api/health",func(w http.ResponseWriter,r *http.Request){
  if r.Method != http.MethodGet { methodNotAllowed(w,"GET"); return }
  writeJSON(w,http.StatusOK,map[string]string{"status":"ok","service":"pulpestock-api"})
 })
 mux.HandleFunc("/api/productos",func(w http.ResponseWriter,r *http.Request){
  if store == nil { writeJSON(w,503,map[string]string{"error":"Base de datos no disponible"}); return }
  switch r.Method {
  case http.MethodGet:
   data,err := store.ListProducts(r.Context())
   if err != nil { writeJSON(w,500,map[string]string{"error":"Error al consultar productos"}); return }
   writeJSON(w,200,data)
  case http.MethodPost:
   var data ProductInput
   if !decodeJSON(w,r,&data) { return }
   product,err := store.CreateProduct(r.Context(),data)
   respondProduct(w,product,err,http.StatusCreated)
  default: methodNotAllowed(w,"GET, POST")
  }
 })
 mux.HandleFunc("/api/productos/",func(w http.ResponseWriter,r *http.Request){
  if store == nil { writeJSON(w,503,map[string]string{"error":"Base de datos no disponible"}); return }
  id := strings.TrimPrefix(r.URL.Path,"/api/productos/")
  if !validProductID(id) { writeJSON(w,404,map[string]string{"error":"Producto no encontrado"}); return }
  switch r.Method {
  case http.MethodPut:
   var data ProductInput
   if !decodeJSON(w,r,&data) { return }
   product,err := store.UpdateProduct(r.Context(),id,data)
   respondProduct(w,product,err,200)
  case http.MethodDelete:
   err := store.DeactivateProduct(r.Context(),id)
   if err != nil { respondProduct(w,Product{},err,0); return }
   w.WriteHeader(http.StatusNoContent)
  default: methodNotAllowed(w,"PUT, DELETE")
  }
 })
 mux.HandleFunc("/api/movimientos",func(w http.ResponseWriter,r *http.Request){
  if store == nil { writeJSON(w,503,map[string]string{"error":"Base de datos no disponible"}); return }
  switch r.Method {
  case http.MethodGet:
   movements,err := store.ListMovements(r.Context())
   if err != nil { writeJSON(w,500,map[string]string{"error":"No se pudieron consultar los movimientos"}); return }
   writeJSON(w,200,movements)
  case http.MethodPost:
   var input MovementInput
   if !decodeJSON(w,r,&input) { return }
   movement,err := store.CreateMovement(r.Context(),input)
   if err != nil {
    var domain *DomainError
    if errors.As(err,&domain){ writeJSON(w,domain.Code,map[string]string{"error":domain.Message});return }
    writeJSON(w,500,map[string]string{"error":"No se pudo registrar el movimiento"});return
   }
   writeJSON(w,201,movement)
  default: methodNotAllowed(w,"GET, POST")
  }
 })
 mux.HandleFunc("/api/ventas",func(w http.ResponseWriter,r *http.Request){
  if r.Method != http.MethodPost { methodNotAllowed(w,"POST"); return }
  if store == nil { writeJSON(w,503,map[string]string{"error":"Base de datos no disponible"}); return }
  r.Body = http.MaxBytesReader(w,r.Body,65536)
  dec := json.NewDecoder(r.Body)
  dec.DisallowUnknownFields()
  var input SaleRequest
  if err := dec.Decode(&input); err != nil { writeJSON(w,400,map[string]string{"error":"Solicitud JSON inválida"}); return }
  var extra any
  if err := dec.Decode(&extra); !errors.Is(err,io.EOF) { writeJSON(w,400,map[string]string{"error":"JSON debe contener un solo objeto"}); return }
  sale,err := store.CreateSale(r.Context(),input)
  if err != nil {
   var domain *DomainError
   if errors.As(err,&domain) { writeJSON(w,domain.Code,map[string]string{"error":domain.Message}); return }
   writeJSON(w,500,map[string]string{"error":"No se pudo registrar la venta"}); return
  }
  status := http.StatusCreated
  if sale.Reused { status = http.StatusOK }
  writeJSON(w,status,sale)
 })
 mux.HandleFunc("/",func(w http.ResponseWriter,_ *http.Request){ writeJSON(w,404,map[string]string{"error":"Not Found"}) })
 return mux
}

func methodNotAllowed(w http.ResponseWriter,method string){
 w.Header().Set("Allow",method)
 writeJSON(w,405,map[string]string{"error":"Method Not Allowed"})
}

func writeJSON(w http.ResponseWriter,status int,payload any){
 w.Header().Set("Content-Type","application/json; charset=utf-8")
 w.Header().Set("Cache-Control","no-store")
 w.Header().Set("X-Content-Type-Options","nosniff")
 w.WriteHeader(status)
 _=json.NewEncoder(w).Encode(payload)
}

func decodeJSON(w http.ResponseWriter,r *http.Request,into any) bool{
 if !strings.HasPrefix(strings.ToLower(r.Header.Get("Content-Type")),"application/json"){
  writeJSON(w,415,map[string]string{"error":"Se requiere Content-Type: application/json"});return false
 }
 r.Body=http.MaxBytesReader(w,r.Body,65536)
 dec:=json.NewDecoder(r.Body);dec.DisallowUnknownFields()
 if err:=dec.Decode(into);err!=nil{writeJSON(w,400,map[string]string{"error":"JSON inválido o campos desconocidos"});return false}
 var extra any
 if err:=dec.Decode(&extra);!errors.Is(err,io.EOF){writeJSON(w,400,map[string]string{"error":"JSON debe contener un solo objeto"});return false}
 return true
}
func respondProduct(w http.ResponseWriter,product Product,err error,status int){
 if err!=nil{
  var domain *DomainError
  if errors.As(err,&domain){writeJSON(w,domain.Code,map[string]string{"error":domain.Message});return}
  writeJSON(w,500,map[string]string{"error":"No se pudo procesar el producto"});return
 }
 writeJSON(w,status,product)
}
