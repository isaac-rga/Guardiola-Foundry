import { createFileRoute } from '@tanstack/react-router'

import { AppShellPage } from '@/features/app-shell/authenticated-app-shell'
import { MaterialsWorkspacePage } from '@/features/app-shell/workspace-pages'

export const Route = createFileRoute('/app/materials')({
  component: MaterialsRoute,
})

function MaterialsRoute() {
  return (
    <AppShellPage
      eyebrow="Inventory"
      title="Materials"
      subtitle="Track sourcing availability, vendor pressure, and quality review."
    >
      <MaterialsWorkspacePage />
    </AppShellPage>
  )
}
