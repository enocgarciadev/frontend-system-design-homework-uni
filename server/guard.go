package api

import (
 "net/http"
 "strings"
)

// protectBusinessRoutes applies real authorization to every business route,
// including unknown /api paths. Health and auth's own flows remain reachable.
func protectBusinessRoutes(mux *http.ServeMux,store *Store) http.Handler {
 return http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){
  path:=r.URL.Path
  if !strings.HasPrefix(path,"/api/") ||
   path=="/api/health"||path=="/api/auth/login"||
   path=="/api/auth/me"||path=="/api/auth/logout"||store==nil {
   mux.ServeHTTP(w,r)
   return
  }
  session,err:=store.CurrentSession(r)
  if err!=nil{authFailure(w,err);return}
  adminRequired:=(strings.HasPrefix(path,"/api/movimientos") ||
    strings.HasPrefix(path,"/api/productos") && r.Method!=http.MethodGet)
  if adminRequired && session.User.Role!="admin" {
   writeJSON(w,403,map[string]string{"error":"No tenés permisos para esta operación"})
   return
  }
  if r.Method==http.MethodPost||r.Method==http.MethodPut||
   r.Method==http.MethodPatch||r.Method==http.MethodDelete {
   if !validCSRF(session,r.Header.Get("X-CSRF-Token")) {
    writeJSON(w,403,map[string]string{"error":"CSRF inválido"})
    return
   }
  }
  mux.ServeHTTP(w,r)
 })
}
