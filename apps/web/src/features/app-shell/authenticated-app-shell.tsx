import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import guardiolaBridalLogo from '@/assets/guardiola-bridal-logo.png'
import { cn } from '@/lib/utils'
import type { AuthSessionResponse, ChangePasswordRequest } from '@guardiola-foundry/shared-types'
import {
  Boxes,
  Factory,
  House,
  Package,
  Settings,
  Shapes,
} from 'lucide-react'
import { createContext, useContext } from 'react'

type AppShellContextValue = {
  changePasswordError: string | null
  isChangingPassword: boolean
  isSigningOut: boolean
  logoutError: string | null
  session: AuthSessionResponse
  onChangePassword: (payload: ChangePasswordRequest) => Promise<void>
  onSignOut: () => Promise<void>
}

type AuthenticatedAppShellProps = {
  changePasswordError: string | null
  children: ReactNode
  isChangingPassword: boolean
  isSigningOut: boolean
  logoutError: string | null
  onChangePassword: (payload: ChangePasswordRequest) => Promise<void>
  onSignOut: () => Promise<void>
  session: AuthSessionResponse
}

type NavigationItem = {
  icon: typeof House
  label: string
  to: '/app' | '/app/products' | '/app/materials' | '/app/inventory' | '/app/bills-of-materials'
}

const appShellContext = createContext<AppShellContextValue | null>(null)

const primaryNavigation: NavigationItem[] = [
  { icon: House, label: 'Home', to: '/app' },
  { icon: Boxes, label: 'Products', to: '/app/products' },
  { icon: Package, label: 'Materials', to: '/app/materials' },
  { icon: Factory, label: 'Inventory', to: '/app/inventory' },
  { icon: Shapes, label: 'Bills of Materials', to: '/app/bills-of-materials' },
]

export function AuthenticatedAppShell({
  changePasswordError,
  children,
  isChangingPassword,
  isSigningOut,
  logoutError,
  onChangePassword,
  onSignOut,
  session,
}: AuthenticatedAppShellProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const contextValue = useMemo<AppShellContextValue>(
    () => ({
      changePasswordError,
      isChangingPassword,
      isSigningOut,
      logoutError,
      session,
      onChangePassword,
      onSignOut,
    }),
    [
      changePasswordError,
      isChangingPassword,
      isSigningOut,
      logoutError,
      session,
      onSignOut,
      onChangePassword,
    ]
  )

  return (
    <appShellContext.Provider value={contextValue}>
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon">
          <SidebarHeader className="gap-4 px-3 py-5">
            <Link
              to="/app"
              className="flex min-h-18 items-center justify-center rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/35 px-3 py-4 transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring outline-none"
              aria-label="Guardiola Bridal home"
            >
              <img
                src={guardiolaBridalLogo}
                alt="Guardiola Bridal"
                className="h-auto w-full max-w-[11rem] object-contain group-data-[collapsible=icon]:hidden"
              />
              <span className="font-editorial hidden text-2xl leading-none tracking-[0.08em] text-sidebar-foreground group-data-[collapsible=icon]:inline">
                GB
              </span>
            </Link>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {primaryNavigation.map((item) => {
                    const isActive = location.pathname === item.to

                    return (
                      <SidebarMenuItem key={item.to}>
                        {item.to === '/app' ? (
                          <SidebarMenuButton
                            tooltip={item.label}
                            onClick={() => {
                              void navigate({ to: '/app' })
                            }}
                          >
                            <item.icon />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        ) : (
                          <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                            <Link to={item.to} aria-current={isActive ? 'page' : undefined}>
                              <item.icon />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarSeparator />
          <SidebarFooter className="px-3 py-3">
            <AccountMenu />
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset className="bg-transparent">
          <div className="relative flex min-h-svh flex-col">
            <SidebarTrigger className="absolute top-4 left-4 z-20 md:hidden" />
            <div className="flex-1 px-4 py-16 md:px-8 md:py-8">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </appShellContext.Provider>
  )
}

export function WorkInProgressPage() {
  return (
    <div className="flex min-h-[calc(100svh-10rem)] items-center justify-center">
      <section className="w-full max-w-3xl rounded-[2rem] border border-dashed border-border/80 bg-card/80 px-8 py-16 text-center shadow-[0_18px_48px_rgba(72,53,40,0.05)]">
        <div className="mx-auto max-w-xl space-y-3">
          <p className="text-sm font-medium tracking-[0.28em] text-muted-foreground uppercase">
            Shared authenticated shell
          </p>
          <p className="font-editorial text-balance text-4xl leading-none">Work in progress</p>
          <p className="text-sm leading-6 text-muted-foreground">
            New product, materials, and operational workflows can slot into this shell without changing the routing or auth structure.
          </p>
        </div>
      </section>
    </div>
  )
}

export function useAppShell() {
  const context = useContext(appShellContext)

  if (!context) {
    throw new Error('useAppShell must be used within the authenticated app shell.')
  }

  return context
}

function AccountMenu() {
  const { isSigningOut, logoutError, onSignOut, session } = useAppShell()

  const roleLabel = toRoleLabel(session.user.role)
  const initials = session.user.email.slice(0, 1).toUpperCase()

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-3 rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/55 px-3 py-2.5 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring',
              'group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'
            )}
            aria-label="Open account menu"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-medium text-sidebar-primary-foreground">
              {initials}
            </span>
            <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <span className="block truncate text-sm font-medium">{session.user.email}</span>
              <span className="block text-xs text-sidebar-foreground/70">{roleLabel}</span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          className="w-56 md:w-[var(--radix-dropdown-menu-trigger-width)]"
        >
          <DropdownMenuItem asChild>
            <Link to="/app/user-settings">
              <Settings />
              <span>User Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isSigningOut}
            onSelect={(event) => {
              event.preventDefault()
              void onSignOut()
            }}
          >
            <span>{isSigningOut ? 'Signing out…' : 'Log Out'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {logoutError ? (
        <p
          className="rounded-2xl border border-destructive/20 bg-destructive/8 px-3 py-2 text-sm text-destructive group-data-[collapsible=icon]:hidden"
          role="alert"
        >
          {logoutError}
        </p>
      ) : null}
    </div>
  )
}

function toRoleLabel(role: AuthSessionResponse['user']['role']) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}
