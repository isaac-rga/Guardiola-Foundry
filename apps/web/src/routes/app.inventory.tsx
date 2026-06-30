import { createFileRoute } from '@tanstack/react-router'

import { AppShellPage, WorkInProgressPage } from '@/features/app-shell/authenticated-app-shell'

export const Route = createFileRoute('/app/inventory')({
  component: InventoryRoute,
})

function InventoryRoute() {
  return (
    <AppShellPage title="Inventory" subtitle="Work in progress…">
      <WorkInProgressPage />
    </AppShellPage>
  )
}
