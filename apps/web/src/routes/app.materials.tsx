import { createFileRoute } from '@tanstack/react-router'

import { AppShellPage, WorkInProgressPage } from '@/features/app-shell/authenticated-app-shell'

export const Route = createFileRoute('/app/materials')({
  component: MaterialsRoute,
})

function MaterialsRoute() {
  return (
    <AppShellPage title="Materials" subtitle="Work in progress…">
      <WorkInProgressPage />
    </AppShellPage>
  )
}
