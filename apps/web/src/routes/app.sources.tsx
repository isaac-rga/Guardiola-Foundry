import { createFileRoute, Outlet } from '@tanstack/react-router'
import { listSourcesQuerySchema } from '@guardiola-foundry/shared-validation'

export const Route = createFileRoute('/app/sources')({
  validateSearch: listSourcesQuerySchema,
  component: SourcesLayoutRoute,
})

function SourcesLayoutRoute() {
  return <Outlet />
}
