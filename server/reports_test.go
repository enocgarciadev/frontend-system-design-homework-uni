package api

import (
 "context"
 "fmt"
 "os"
 "testing"
 "time"
)

func TestInventoryReportPostgres(t *testing.T){
 url:=os.Getenv("DATABASE_URL")
 if url==""{t.Skip("DATABASE_URL no configurado")}
 store,err:=OpenStore(context.Background(),url)
 if err!=nil{t.Fatal(err)}
 defer store.DB.Close()
 ctx:=context.Background()
 if err:=Migrate(ctx,store.DB);err!=nil{t.Fatal(err)}
 baseline,err:=store.InventoryReport(ctx)
 if err!=nil{t.Fatal(err)}
 id:=fmt.Sprintf("pr11-report-%d",time.Now().UnixNano())
 _,err=store.DB.ExecContext(ctx,
  "INSERT INTO productos(id,nombre,categoria_id,precio_centavos,stock_actual,stock_minimo) VALUES($1,'Prueba reporte','abarrotes',1900,2,5)",id)
 if err!=nil{t.Fatal(err)}
 t.Cleanup(func(){store.DB.ExecContext(context.Background(),"DELETE FROM productos WHERE id=$1",id)})
 report,err:=store.InventoryReport(ctx)
 if err!=nil{t.Fatal(err)}
 if report.ProductsTotal!=baseline.ProductsTotal+1||
  report.LowStockCount!=baseline.LowStockCount+1||
  report.OutOfStockCount!=baseline.OutOfStockCount{
  t.Fatalf("Contadores inválidos: antes=%+v despues=%+v",baseline,report)
 }
 found:=false
 for _,p:=range report.LowStockProducts{if p.ID==id{found=true}}
 if !found{t.Fatal("El producto bajo mínimo no está incluido")}
 // No sales are created here; totals must remain valid nonnegative amounts.
 if report.RevenueToday<0||report.SalesToday<0{t.Fatal("Reporte de ventas inválido")}
}
