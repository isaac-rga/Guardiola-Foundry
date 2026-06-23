import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <main className="p-8">Page not found.</main>,
})

function RootLayout() {
  return <Outlet />
}
