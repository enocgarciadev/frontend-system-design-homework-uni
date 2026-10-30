package main

import (
 "context"
 "log"
 "os"
 "time"

 api "github.com/enocgarciadev/frontend-system-design-homework-uni/server"
)

func main(){
 ctx,cancel:=context.WithTimeout(context.Background(),30*time.Second);defer cancel()
 store,err:=api.OpenStore(ctx,os.Getenv("DATABASE_URL"));if err!=nil{log.Fatal(err)}
 defer store.DB.Close()
 if err:=api.Migrate(ctx,store.DB);err!=nil{log.Fatal(err)}
 log.Println("Migración y datos de demostración aplicados sin sobrescribir registros existentes")
}
