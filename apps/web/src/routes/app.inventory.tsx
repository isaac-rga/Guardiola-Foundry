import { createFileRoute } from '@tanstack/react-router'

import { AppShellPage } from '@/features/app-shell/authenticated-app-shell'
import { InventoryWorkspacePage } from '@/features/app-shell/workspace-pages'

export const Route = createFileRoute('/app/inventory')({
  component: InventoryRoute,
})

function InventoryRoute() {
  return (
    <AppShellPage
      eyebrow="Warehouse"
      title="Inventory"
      subtitle="Live stock visibility with structured filters and muted status signaling."
    >
      <InventoryWorkspacePage />
    </AppShellPage>
  )
}
