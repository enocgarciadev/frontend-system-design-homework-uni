package main

import (
 "context"
 "log"
 "os"
 "time"

 api "github.com/enocgarciadev/frontend-system-design-homework-uni/server"
)

// Run explicitly, never from server startup. Secrets must be provided via env.
func main(){
 ctx,cancel:=context.WithTimeout(context.Background(),30*time.Second)
 defer cancel()
 password:=os.Getenv("BOOTSTRAP_PASSWORD")
 if password==""{log.Fatal("Definí BOOTSTRAP_PASSWORD (mínimo 12 caracteres)")}
 role:=os.Getenv("BOOTSTRAP_ROLE")
 if role==""{role="admin"}
 store,err:=api.OpenStore(ctx,os.Getenv("DATABASE_URL"))
 if err!=nil{log.Fatal(err)}
 defer store.DB.Close()
 user,err:=store.CreateUser(ctx,api.UserRegistration{
  Name:os.Getenv("BOOTSTRAP_NAME"),Email:os.Getenv("BOOTSTRAP_EMAIL"),
  Password:password,Role:role,
 })
 if err!=nil{log.Fatal("No se creó el usuario: ",err)}
 log.Printf("Usuario creado: %s (%s)",user.Email,user.Role)
}
