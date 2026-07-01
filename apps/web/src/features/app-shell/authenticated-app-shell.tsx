import type { ReactNode } from 'react'
import { useLocation, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

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
  useSidebar,
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
const SHELL_SIDEBAR_STORAGE_KEY = 'authenticated-app-shell.sidebar-open'

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
  const [sidebarOpen, setSidebarOpen] = useState(readPersistedSidebarOpenState)

  return (
    <appShellContext.Provider value={contextValue}>
      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={(open) => {
          setSidebarOpen(open)
          persistSidebarOpenState(open)
        }}
      >
        <AuthenticatedAppShellFrame>{children}</AuthenticatedAppShellFrame>
      </SidebarProvider>
    </appShellContext.Provider>
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
  const { isMobile, openMobile, setOpenMobile, state } = useSidebar()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const roleLabel = toRoleLabel(session.user.role)
  const initials = session.user.email.slice(0, 1).toUpperCase()
  const useCompactMenuWidth = isMobile || state === 'collapsed'

  return (
    <div className="space-y-2">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
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
          className={cn(
            'w-56',
            !useCompactMenuWidth && 'md:w-[var(--radix-dropdown-menu-trigger-width)]'
          )}
        >
          <DropdownMenuItem
            onSelect={() => {
              setMenuOpen(false)

              if (isMobile && openMobile) {
                setOpenMobile(false)
              }

              void navigate({ to: '/app/user-settings' })
            }}
          >
              <Settings />
              <span>User Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isSigningOut}
            onSelect={() => {
              setMenuOpen(false)

              if (isMobile && openMobile) {
                setOpenMobile(false)
              }

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

function AuthenticatedAppShellFrame({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isMobile, openMobile, setOpenMobile } = useSidebar()
  const contentRegionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const contentRegion = contentRegionRef.current

    if (!contentRegion) {
      return
    }

    contentRegion.scrollTop = 0
  }, [location.pathname])

  const navigateWithinShell = (to: NavigationItem['to']) => {
    if (isMobile && openMobile) {
      setOpenMobile(false)
    }

    void navigate({ to })
  }

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="gap-4 px-3 py-5">
          <Link
            to="/app"
            className="flex min-h-18 items-center justify-center rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/35 px-3 py-4 transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring outline-none"
            aria-label="Guardiola Bridal home"
            onClick={(event) => {
              if (!isMobile) {
                return
              }

              event.preventDefault()
              navigateWithinShell('/app')
            }}
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
                            navigateWithinShell('/app')
                          }}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                          <Link
                            to={item.to}
                            aria-current={isActive ? 'page' : undefined}
                            onClick={(event) => {
                              if (!isMobile) {
                                return
                              }

                              event.preventDefault()
                              navigateWithinShell(item.to)
                            }}
                          >
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
      <SidebarInset className="h-svh overflow-hidden bg-transparent">
        <div className="relative flex min-h-0 flex-1 flex-col">
          <SidebarTrigger className="absolute top-4 left-4 z-20 md:hidden" />
          <div
            ref={contentRegionRef}
            data-authenticated-content="true"
            className="flex-1 overflow-y-auto px-4 py-16 md:px-8 md:py-8"
          >
            {children}
          </div>
        </div>
      </SidebarInset>
    </>
  )
}

function readPersistedSidebarOpenState() {
  const storedValue = localStorage.getItem(SHELL_SIDEBAR_STORAGE_KEY)

  if (storedValue === 'false') {
    return false
  }

  if (storedValue === 'true') {
    return true
  }

  return true
}

function persistSidebarOpenState(open: boolean) {
  localStorage.setItem(SHELL_SIDEBAR_STORAGE_KEY, String(open))
}
