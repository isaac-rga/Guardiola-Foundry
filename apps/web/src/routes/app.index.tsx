import { createFileRoute } from '@tanstack/react-router'

import { DashboardWorkspacePage } from '@/features/app-shell/workspace-pages'

export const Route = createFileRoute('/app/')({
  component: AppHomeRoute,
})

function AppHomeRoute() {
  return <DashboardWorkspacePage />
}
