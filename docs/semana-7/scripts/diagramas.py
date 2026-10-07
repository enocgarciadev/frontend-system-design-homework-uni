"""Diagramas editables SVG y PNG con la misma geometría. Requiere Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from html import escape
import math
OUT=Path(__file__).resolve().parent.parent/'diagramas'
FONT='/System/Library/Fonts/Supplemental/Arial.ttf'
class Figure:
 def __init__(self,w,h):
  self.w,self.h=w,h; self.im=Image.new('RGB',(w,h),'white');self.d=ImageDraw.Draw(self.im)
  self.svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><rect width="100%" height="100%" fill="white"/>']
 def text(self,x,y,t,size=25,anchor='mm',color='#17212b'):
  font=ImageFont.truetype(FONT,size);self.d.text((x,y),t,font=font,fill=color,anchor=anchor)
  align='middle' if anchor.startswith('m') else 'start'
  self.svg.append(f'<text x="{x}" y="{y+size*.34}" text-anchor="{align}" font-family="Arial,sans-serif" font-size="{size}" fill="{color}">{escape(t)}</text>')
 def box(self,x,y,w,h,lines,fill='#edf3f8',size=25,dash=False):
  self.d.rounded_rectangle((x,y,x+w,y+h),radius=12,fill=fill,outline='#425466',width=2)
  self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{fill}" stroke="#425466" stroke-width="2"/>')
  for i,t in enumerate(lines):self.text(x+w/2,y+h/2+(i-(len(lines)-1)/2)*(size+9),t,size)
 def diamond(self,x,y,w,h,lines):
  points=[(x+w/2,y),(x+w,y+h/2),(x+w/2,y+h),(x,y+h/2)]
  self.d.polygon(points,fill='#edf3f8',outline='#425466',width=2)
  self.svg.append('<polygon points="'+' '.join(f'{a},{b}' for a,b in points)+'" fill="#edf3f8" stroke="#425466" stroke-width="2"/>')
  for i,t in enumerate(lines):self.text(x+w/2,y+h/2+(i-(len(lines)-1)/2)*28,t,23)
 def line(self,points,label=None,lx=None,ly=None):
  self.d.line(points,fill='#425466',width=3)
  self.svg.append('<polyline points="'+' '.join(f'{x},{y}' for x,y in points)+'" fill="none" stroke="#425466" stroke-width="3"/>')
  x,y=points[-1]; a,b=points[-2];angle=math.atan2(y-b,x-a)
  tip=[(x,y),(x-14*math.cos(angle-.45),y-14*math.sin(angle-.45)),(x-14*math.cos(angle+.45),y-14*math.sin(angle+.45))]
  self.d.polygon(tip,fill='#425466');self.svg.append('<polygon points="'+' '.join(f'{a},{b}' for a,b in tip)+'" fill="#425466"/>')
  if label:self.text(lx,ly,label,22)
 def save(self,name):
  self.im.save(OUT/(name+'.png'));(OUT/(name+'.svg')).write_text('\n'.join(self.svg+['</svg>']))

f=Figure(1500,800)
f.text(750,38,'Arquitectura propuesta para producción',34)
f.box(60,130,310,120,['Navegador','React 19 + Vite 8']);f.box(580,130,340,120,['Cloudflare Pages','HTML CSS JS por HTTPS'])
f.line([(370,190),(580,190)],'HTTPS',470,160)
f.box(580,370,340,120,['API Node.js + Express','Render PaaS'])
f.line([(215,250),(215,430),(580,430)],'REST JSON / HTTPS',370,400)
f.box(1120,370,320,120,['PostgreSQL gestionado','Render DBaaS'])
f.line([(920,430),(1120,430)],'SQL / TLS',1020,400)
f.box(1120,620,320,100,['Respaldo cifrado','Almacenamiento externo'])
f.line([(1280,490),(1280,620)],'pg_dump',1350,555)
f.box(60,620,360,100,['GitHub','Código y revisión por PR'])
f.line([(420,670),(750,670),(750,490)],'despliegue de API',615,705)
f.box(1120,130,320,120,['DNS Cloudflare','app / api / staging'])
f.line([(215,130),(215,82),(1280,82),(1280,130)],'consulta de nombres',750,100)
f.text(750,760,'Propuesta: API, base de datos y respaldos aún no implementados.',25)
f.save('arquitectura-propuesta')

f=Figure(1500,810)
f.text(750,38,'Modelo de contenido de PulpeStock Web',34)
f.box(50,110,390,210,['Categoría [actual]','id','label'])
f.box(580,110,550,210,['Producto [actual]','id · nombre · categoria','precioVenta · codigoBarras','stockActual · stockMinimo'])
f.line([(440,220),(580,220)],'1 a N',510,190)
f.box(50,480,390,190,['Ticket temporal [actual]','cart: productoId → cantidad','cash: efectivo recibido'])
f.line([(855,320),(855,480)],'1 producto por línea',1005,395)
f.box(580,480,550,190,['Línea del ticket [derivada]','product · quantity','importe = precioVenta × quantity'])
f.line([(440,580),(580,580)],'1 a N',510,548)
f.box(1190,110,250,210,['Venta','[propuesta]','fecha · total','efectivo · vuelto'])
f.box(1190,480,250,190,['DetalleVenta','[propuesta]','ventaId · productoId','cantidad · precio'])
f.line([(1315,320),(1315,480)],'1 a N',1390,400)
f.line([(1130,220),(1160,220),(1160,575),(1190,575)])
f.text(750,752,'Actual = estructuras en memoria. Propuesta = persistencia SQL pendiente.',25)
f.save('contenido')

f=Figure(1500,800)
f.text(750,38,'Mapa navegacional actual',34)
f.box(490,100,520,100,['AppShell · activeId · sin router'])
f.box(40,290,330,170,['Punto de Venta [actual]','Catálogo → agregar','Ticket → efectivo → cobrar'])
f.box(410,290,320,170,['Punto de Venta','Ventas [pendiente]','Caja / Arqueo [pendiente]'])
f.box(780,290,310,170,['Inventario','Productos [pendiente]','Categorías [pendiente]','Movimientos [pendiente]'],size=23)
f.box(1130,290,330,170,['Clientes y Proveedores','Clientes [pendiente]','Proveedores [pendiente]','Compras [pendiente]'],size=23)
for x in [205,570,935,1295]:f.line([(750,200),(750,245),(x,245),(x,290)])
f.box(485,590,530,125,['Administración [pendiente]','Reportes · Usuarios y roles · Configuración'])
f.line([(750,200),(750,590)])
f.text(750,750,'Cada selección reemplaza la vista; los pendientes muestran ModulePlaceholder.',25)
f.save('navegacion')

f=Figure(1500,1050)
f.text(750,40,'Proceso actual CU 06 de cobro y salida de stock',34)
f.box(490,100,520,85,['Buscar producto y filtrar categoría'])
f.box(490,230,520,85,['Agregar si tiene stock disponible'])
f.line([(750,185),(750,230)])
f.box(490,360,520,85,['Ajustar cantidad entre 1 y stockActual'])
f.line([(750,315),(750,360)])
f.box(490,490,520,85,['Calcular total e ingresar efectivo'])
f.line([(750,445),(750,490)])
f.diamond(490,605,520,130,['¿Hay artículos y','efectivo ≥ total?'])
f.line([(750,575),(750,605)])
f.box(40,620,330,95,['No: bloquear cobro','Corregir ticket o efectivo'])
f.line([(490,668),(370,668)],'No',430,642)
f.line([(205,620),(205,532),(490,532)])
f.box(490,770,520,95,['Sí: descontar stock local','Mostrar toast y vaciar ticket'])
f.line([(750,735),(750,770)],'Sí',790,742)
f.box(1090,770,350,95,['Recarga o salir de POS','Restablece catálogo inicial'])
f.line([(1010,818),(1090,818)])
f.text(750,970,'No se registra una venta persistente ni se valida stock contra un servidor.',26)
f.save('proceso-cu06')

f=Figure(1500,850)
f.text(750,38,'Wireframe 1 Punto de Venta en escritorio',34)
f.box(30,100,230,670,['MENÚ','POS','Ventas *','Caja *','Productos *','Categorías *','Movimientos *','Otros *'],fill='#f5f5f5',size=27)
f.box(280,100,1190,70,['CABECERA    Punto de Venta     Tema     Perfil'],fill='#f5f5f5')
f.box(280,190,700,100,['CATÁLOGO   búsqueda por nombre o código','Todas · Abarrotes · Bebidas · Lácteos · Limpieza'],fill='#fff',size=23)
for i in range(6):
 x=280+(i%3)*238;y=320+(i//3)*220
 f.box(x,y,220,190,['Producto','Stock / estado','Precio     [ + ]'],fill='#fff',size=23)
f.box(1000,190,470,580,['TICKET DE VENTA','Producto | Cantidad | Importe','[ - ]  1  [ + ]   [quitar]','Subtotal / Total','Efectivo recibido [ 100 ]','Vuelto [ 20 ]','[ Cobrar y Descontar Stock ]'],fill='#fff',size=25)
f.text(750,816,'Vista existente del CU 06. * Enlaces a módulos pendientes.',25)
f.save('wireframe-escritorio')

f=Figure(900,1050)
f.text(450,36,'Wireframe 2 Cobro en móvil',32)
f.box(220,90,460,70,['Menú     POS     Tema     Perfil'],fill='#f5f5f5',size=23)
f.box(220,185,460,580,['TICKET DE VENTA     [Vaciar]','2 artículos','Arroz | [ - ] 1 [ + ] | C$38','Frijol | [ - ] 1 [ + ] | C$42','Subtotal C$80','Total C$80','Efectivo [ 100 ]','Vuelto C$20','[ Cobrar y Descontar Stock ]'],fill='#fff',size=23)
f.box(220,795,460,85,['2 artículos   C$80    [ Cobrar ]'],fill='#f5f5f5',size=23)
f.text(450,943,'Detalle del CU 06 tras desplazar la página.',24)
f.text(450,984,'Barra fija de cobro mientras exista carrito.',24)
f.save('wireframe-movil')
