import type { PropsWithChildren, ReactNode } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useLayoutEffect, useMemo, useState } from 'react'

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

type AppShellMetadata = {
  subtitle?: string
  title: string
}

type AppShellContextValue = {
  changePasswordError: string | null
  isChangingPassword: boolean
  isSigningOut: boolean
  logoutError: string | null
  session: AuthSessionResponse
  setPageMetadata: (metadata: AppShellMetadata) => void
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
  const [pageMetadata, setPageMetadata] = useState<AppShellMetadata>({
    title: '',
  })

  const contextValue = useMemo<AppShellContextValue>(
    () => ({
      changePasswordError,
      isChangingPassword,
      isSigningOut,
      logoutError,
      session,
      setPageMetadata,
      onChangePassword,
      onSignOut,
    }),
    [
      changePasswordError,
      isChangingPassword,
      isSigningOut,
      logoutError,
      session,
      onChangePassword,
      onSignOut,
    ]
  )

  return (
    <appShellContext.Provider value={contextValue}>
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon">
          <SidebarHeader className="gap-3 px-3 py-4">
            <Link
              to="/app"
              className="rounded-xl px-2 py-2 transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring outline-none"
            >
              <p className="text-xs font-semibold tracking-[0.3em] text-sidebar-foreground/65 uppercase">
                Guardiola Foundry
              </p>
              <p className="mt-1 text-sm text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
                Authenticated workspace
              </p>
            </Link>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {primaryNavigation.map((item) => {
                    const isActive = item.to === '/app' ? false : location.pathname === item.to

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
        <SidebarInset className="bg-muted/30">
          <div className="flex min-h-svh flex-col">
            <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="flex min-h-16 items-center gap-3 px-4 py-3 md:px-6">
                <SidebarTrigger className="md:hidden" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-semibold tracking-tight">{pageMetadata.title}</h1>
                  {pageMetadata.subtitle ? (
                    <p className="text-sm text-muted-foreground">{pageMetadata.subtitle}</p>
                  ) : null}
                </div>
                <div aria-hidden="true" className="h-10 min-w-16 shrink-0" />
              </div>
            </header>
            <div className="flex-1 px-4 py-6 md:px-6">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </appShellContext.Provider>
  )
}

export function AppShellPage({
  children,
  subtitle,
  title,
}: PropsWithChildren<AppShellMetadata>) {
  const { setPageMetadata } = useAppShell()

  useLayoutEffect(() => {
    setPageMetadata({ title, subtitle })
  }, [setPageMetadata, subtitle, title])

  return <>{children}</>
}

export function WorkInProgressPage() {
  return (
    <div className="flex min-h-[calc(100svh-10rem)] items-center justify-center">
      <section className="w-full max-w-3xl rounded-[2rem] border border-dashed border-border bg-card/80 px-8 py-16 text-center shadow-sm">
        <div className="mx-auto max-w-xl space-y-3">
          <p className="text-sm font-semibold tracking-[0.3em] text-muted-foreground uppercase">
            Shared authenticated shell
          </p>
          <p className="text-balance text-2xl font-semibold tracking-tight">Work in progress…</p>
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
              'flex w-full items-center gap-3 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/50 px-2.5 py-2 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring',
              'group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'
            )}
            aria-label="Open account menu"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
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
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive group-data-[collapsible=icon]:hidden"
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
