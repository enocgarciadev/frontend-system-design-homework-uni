import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function App() {
  const [notifications, setNotifications] = useState(true)

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col items-center justify-center gap-6 p-8">
      <header className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            shadcn/ui
          </h1>
          <Badge variant="secondary">Base UI</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Componentes copiados al proyecto: 61 en{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            src/components/ui
          </code>
        </p>
      </header>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acceso</CardTitle>
            <CardDescription>
              Formulario con componentes del registry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vos@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox />
              Recordarme
            </label>
          </CardContent>
          <CardAction>
            <Button className="w-full">Entrar</Button>
          </CardAction>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferencias</CardTitle>
            <CardDescription>Estado y tabs con Base UI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm">Notificaciones</span>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </label>
            <Separator />
            <Tabs defaultValue="ui">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ui">UI</TabsTrigger>
                <TabsTrigger value="base">Base</TabsTrigger>
              </TabsList>
              <TabsContent value="ui" className="pt-3 text-sm">
                Estilo Nova sobre componentes headless de Base UI.
              </TabsContent>
              <TabsContent value="base" className="pt-3 text-sm">
                Accesibles, sin dependencias de Radix.
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardAction>
            <Button variant="outline" className="w-full">
              Guardar cambios
            </Button>
          </CardAction>
        </Card>
      </div>
    </main>
  )
}

export default App
