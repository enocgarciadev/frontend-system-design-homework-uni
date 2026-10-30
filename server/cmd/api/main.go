package main

import (
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"time"

	api "github.com/enocgarciadev/frontend-system-design-homework-uni/server"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" { port = "3001" }
	number, err := strconv.Atoi(port)
	if err != nil || number < 1 || number > 65535 { log.Fatal("PORT debe ser un número entre 1 y 65535") }

	host := os.Getenv("HOST")
	if host == "" { host = "127.0.0.1" }
	address := net.JoinHostPort(host, port)

	server := &http.Server{
		Addr: address,
		Handler: api.NewHandler(),
		ReadHeaderTimeout: 5 * time.Second,
	}
	log.Printf("PulpeStock API (Go) en http://%s", address)
	log.Fatal(server.ListenAndServe())
}
