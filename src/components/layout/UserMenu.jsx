import { ChevronsUpDown, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function UserMenu({ user, onLogout }) {
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Abrir menú de perfil"
        className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full px-2 text-sm font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 sm:px-3 data-[popup-open]:bg-accent data-[popup-open]:text-accent-foreground"
      >
        <Avatar className="size-7 shrink-0 rounded-full">
          <AvatarFallback className="rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-40 truncate lg:inline">{user.name}</span>
        <ChevronsUpDown aria-hidden="true" className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="min-w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <p className="text-xs text-muted-foreground">Sesión activa · {user.role}</p>
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLogout}>
          <LogOut aria-hidden="true" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserMenu
