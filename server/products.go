package api

import (
 "context"
 "database/sql"
 "errors"
 "math"
 "regexp"
 "strings"
 "unicode/utf8"

 "github.com/lib/pq"
)

// ProductInput is the management contract. Updates must not change stock:
// adjustment/movement tracking is implemented in a separate use case.
type ProductInput struct {
 ID string `json:"id,omitempty"`
 Nombre string `json:"nombre"`
 Categoria string `json:"categoria"`
 PrecioVenta float64 `json:"precioVenta"`
 StockActual *int `json:"stockActual,omitempty"`
 StockMinimo int `json:"stockMinimo"`
 CodigoBarras string `json:"codigoBarras"`
}

var productIDPattern = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{2,79}$`)

func validProductID(id string) bool { return productIDPattern.MatchString(id) }

func validateProduct(input ProductInput,creating bool) (int64,error) {
 if creating && !validProductID(input.ID) { return 0,invalid("El código debe usar 3-80 caracteres: letras minúsculas, números y guiones") }
 if !creating && input.ID!="" { return 0,invalid("El código no se puede modificar") }
 name:=strings.TrimSpace(input.Nombre)
 if utf8.RuneCountInString(name)<2||utf8.RuneCountInString(name)>120 { return 0,invalid("El nombre debe tener 2-120 caracteres") }
 if input.Nombre!=name { return 0,invalid("No agregués espacios al principio o final del nombre") }
 if input.Categoria==""||len(input.Categoria)>80 { return 0,invalid("Categoría inválida") }
 if input.StockMinimo<0||input.StockMinimo>10000000 { return 0,invalid("Stock mínimo inválido") }
 if creating {
  if input.StockActual==nil||*input.StockActual<0||*input.StockActual>10000000 { return 0,invalid("Stock inicial inválido") }
 } else if input.StockActual!=nil {return 0,invalid("Modificá las existencias mediante movimientos de inventario")}
 barcode:=input.CodigoBarras
 if barcode!="" {
  if len(barcode)<8||len(barcode)>20 { return 0,invalid("Código de barras inválido") }
  for _,c:=range barcode {if c<'0'||c>'9'{return 0,invalid("Código de barras debe contener solo números")}}
 }
 if math.IsNaN(input.PrecioVenta)||math.IsInf(input.PrecioVenta,0)||input.PrecioVenta<=0||input.PrecioVenta>1000000 { return 0,invalid("Precio inválido") }
 cents:=math.Round(input.PrecioVenta*100)
 if math.Abs(input.PrecioVenta*100-cents)>0.00001 { return 0,invalid("Precio admite como máximo dos decimales") }
 return int64(cents),nil
}

const productColumns = "id,nombre,categoria_id,precio_centavos,stock_actual,stock_minimo,COALESCE(codigo_barras,'')"

func scanProduct(row *sql.Row) (Product,error) {
 var p Product;var cents int64
 err:=row.Scan(&p.ID,&p.Nombre,&p.Categoria,&cents,&p.StockActual,&p.StockMinimo,&p.CodigoBarras)
 if err==nil {p.PrecioVenta=float64(cents)/100}
 return p,err
}
func productDatabaseError(err error) error {
 var pg *pq.Error
 if errors.As(err,&pg) {
  switch string(pg.Code) {
  case "23505":return conflict("Ya existe un producto con ese código o código de barras")
  case "23503":return invalid("La categoría no existe")
  case "23514":return invalid("Los valores del producto no son válidos")
  }
 }
 return err
}
func (s *Store) CreateProduct(ctx context.Context,input ProductInput) (Product,error) {
 cents,err:=validateProduct(input,true)
 if err!=nil{return Product{},err}
 p,err:=scanProduct(s.DB.QueryRowContext(ctx,
  "INSERT INTO productos(id,nombre,categoria_id,precio_centavos,stock_actual,stock_minimo,codigo_barras) VALUES($1,$2,$3,$4,$5,$6,NULLIF($7,'')) RETURNING "+productColumns,
  input.ID,input.Nombre,input.Categoria,cents,*input.StockActual,input.StockMinimo,input.CodigoBarras))
 return p,productDatabaseError(err)
}
func (s *Store) UpdateProduct(ctx context.Context,id string,input ProductInput) (Product,error) {
 if !validProductID(id){return Product{},&DomainError{404,"Producto no encontrado"}}
 cents,err:=validateProduct(input,false)
 if err!=nil{return Product{},err}
 // Never overwrite stock through a product profile edit.
 p,err:=scanProduct(s.DB.QueryRowContext(ctx,
  "UPDATE productos SET nombre=$2,categoria_id=$3,precio_centavos=$4,stock_minimo=$5,codigo_barras=NULLIF($6,'') WHERE id=$1 AND activo=TRUE RETURNING "+productColumns,
  id,input.Nombre,input.Categoria,cents,input.StockMinimo,input.CodigoBarras))
 if errors.Is(err,sql.ErrNoRows){return Product{},&DomainError{404,"Producto no encontrado"}}
 return p,productDatabaseError(err)
}
func (s *Store) DeactivateProduct(ctx context.Context,id string) error {
 if !validProductID(id){return &DomainError{404,"Producto no encontrado"}}
 result,err:=s.DB.ExecContext(ctx,"UPDATE productos SET activo=FALSE WHERE id=$1 AND activo=TRUE",id)
 if err!=nil{return productDatabaseError(err)}
 affected,err:=result.RowsAffected()
 if err!=nil{return err}
 if affected==0{return &DomainError{404,"Producto no encontrado"}}
 return nil
}
