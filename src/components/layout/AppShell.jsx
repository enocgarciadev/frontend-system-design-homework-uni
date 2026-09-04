import { useState } from 'react'
import { PackageOpen } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import PosScreen from '@/features/pos/PosScreen'
import AppSidebar from './AppSidebar'
import ModeToggle from './ModeToggle'
import UserMenu from './UserMenu'
import { getModuleById } from './navigation'

function ModulePlaceholder({ moduleId }) {
  const module = getModuleById(moduleId)
  if (!module) return null
  const Icon = module.icon

  return (
    <div className="mx-auto flex w-full max-w-xl">
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <div className="mb-1 grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Icon aria-hidden="true" className="size-6" />
          </div>
          <CardTitle>{module.label}</CardTitle>
          <CardDescription>{module.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-2 pb-6 text-center">
          <PackageOpen
            aria-hidden="true"
            className="size-8 text-muted-foreground/50"
          />
          <p className="max-w-sm text-sm text-muted-foreground">
            Este módulo todavía no está implementado. Por ahora usá el Punto de
            Venta desde la navegación.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function AppShell() {
  const [activeId, setActiveId] = useState('pos')
  const activeModule = getModuleById(activeId)

  return (
    <SidebarProvider>
      <AppSidebar activeId={activeId} onSelect={setActiveId} />
      <SidebarInset className="lg:h-svh lg:overflow-hidden">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background px-3 sm:px-4">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">
            {activeModule?.label}
          </h1>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <ModeToggle />
            <UserMenu />
          </div>
        </header>

        <div className="min-h-0 flex-1 bg-muted/30 p-3 sm:p-4 lg:overflow-hidden lg:p-5">
          {activeId === 'pos' ? (
            <PosScreen />
          ) : (
            <ModulePlaceholder moduleId={activeId} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AppShell
