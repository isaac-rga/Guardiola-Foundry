import { createFileRoute } from '@tanstack/react-router'

import { AppShellPage } from '@/features/app-shell/authenticated-app-shell'
import { DashboardWorkspacePage } from '@/features/app-shell/workspace-pages'

export const Route = createFileRoute('/app/')({
  component: AppHomeRoute,
})

function AppHomeRoute() {
  return (
    <AppShellPage
      eyebrow="Overview"
      title="Home"
      subtitle="Shared priorities across collections, sourcing, and production."
    >
      <DashboardWorkspacePage />
    </AppShellPage>
  )
}
