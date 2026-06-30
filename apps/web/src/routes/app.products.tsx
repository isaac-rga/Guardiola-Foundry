import { createFileRoute } from '@tanstack/react-router'

import { AppShellPage, WorkInProgressPage } from '@/features/app-shell/authenticated-app-shell'

export const Route = createFileRoute('/app/products')({
  component: ProductsRoute,
})

function ProductsRoute() {
  return (
    <AppShellPage title="Products" subtitle="Work in progress…">
      <WorkInProgressPage />
    </AppShellPage>
  )
}
