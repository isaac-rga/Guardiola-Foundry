import { createFileRoute } from '@tanstack/react-router'

import { AppShellPage, WorkInProgressPage } from '@/features/app-shell/authenticated-app-shell'

export const Route = createFileRoute('/app/')({
  component: AppHomeRoute,
})

function AppHomeRoute() {
  return (
    <AppShellPage title="Home" subtitle="Work in progress…">
      <WorkInProgressPage />
    </AppShellPage>
  )
}
