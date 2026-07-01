import { createFileRoute } from '@tanstack/react-router'

import { MaterialsWorkspacePage } from '@/features/app-shell/workspace-pages'

export const Route = createFileRoute('/app/materials')({
  component: MaterialsRoute,
})

function MaterialsRoute() {
  return <MaterialsWorkspacePage />
}
