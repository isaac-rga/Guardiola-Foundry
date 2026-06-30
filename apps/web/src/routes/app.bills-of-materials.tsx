import { createFileRoute } from '@tanstack/react-router'

import { AppShellPage, WorkInProgressPage } from '@/features/app-shell/authenticated-app-shell'

export const Route = createFileRoute('/app/bills-of-materials')({
  component: BillsOfMaterialsRoute,
})

function BillsOfMaterialsRoute() {
  return (
    <AppShellPage title="Bills of Materials" subtitle="Work in progress…">
      <WorkInProgressPage />
    </AppShellPage>
  )
}
