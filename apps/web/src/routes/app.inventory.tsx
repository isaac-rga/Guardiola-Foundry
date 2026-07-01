import { createFileRoute } from '@tanstack/react-router'

import { InventoryWorkspacePage } from '@/features/app-shell/workspace-pages'

export const Route = createFileRoute('/app/inventory')({
  component: InventoryRoute,
})

function InventoryRoute() {
  return <InventoryWorkspacePage />
}
