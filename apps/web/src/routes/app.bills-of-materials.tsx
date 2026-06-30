import { createFileRoute } from '@tanstack/react-router'

import { BillsOfMaterialsWorkspacePage } from '@/features/app-shell/workspace-pages'

export const Route = createFileRoute('/app/bills-of-materials')({
  component: BillsOfMaterialsRoute,
})

function BillsOfMaterialsRoute() {
  return <BillsOfMaterialsWorkspacePage />
}
