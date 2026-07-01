import { createFileRoute } from '@tanstack/react-router'

import { AppShellPage } from '@/features/app-shell/authenticated-app-shell'
import { BillsOfMaterialsWorkspacePage } from '@/features/app-shell/workspace-pages'

export const Route = createFileRoute('/app/bills-of-materials')({
  component: BillsOfMaterialsRoute,
})

function BillsOfMaterialsRoute() {
  return (
    <AppShellPage
      eyebrow="Production planning"
      title="Bills of Materials"
      subtitle="Component readiness, material pressure, and production ownership."
    >
      <BillsOfMaterialsWorkspacePage />
    </AppShellPage>
  )
}
