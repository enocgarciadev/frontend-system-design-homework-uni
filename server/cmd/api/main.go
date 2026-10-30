package main

import (
 "context"
 "log"
 "net"
 "net/http"
 "os"
 "strconv"
 "time"

 api "github.com/enocgarciadev/frontend-system-design-homework-uni/server"
)
func main(){
 port:=os.Getenv("PORT");if port==""{port="3001"}
 n,err:=strconv.Atoi(port);if err!=nil||n<1||n>65535{log.Fatal("PORT debe ser entre 1 y 65535")}
 host:=os.Getenv("HOST");if host==""{host="127.0.0.1"}
 ctx,cancel:=context.WithTimeout(context.Background(),10*time.Second);defer cancel()
 store,err:=api.OpenStore(ctx,os.Getenv("DATABASE_URL"));if err!=nil{log.Fatal("PostgreSQL: ",err)}
 defer store.DB.Close()
 server:=&http.Server{Addr:net.JoinHostPort(host,port),Handler:api.NewHandler(store),ReadHeaderTimeout:5*time.Second}
 log.Printf("PulpeStock Go API en http://%s",server.Addr)
 log.Fatal(server.ListenAndServe())
}
