import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { listSourcesQuerySchema } from '@guardiola-foundry/shared-validation'

import { SourcesPage } from '@/features/sources/sources-page'

export const Route = createFileRoute('/app/sources')({
  validateSearch: listSourcesQuerySchema,
  component: SourcesRoute,
})

function SourcesRoute() {
  const filters = Route.useSearch()
  const navigate = useNavigate({ from: '/app/sources' })

  return (
    <SourcesPage
      filters={filters}
      onFiltersChange={(changes) =>
        void navigate({
          search: (current) => ({ ...current, ...changes }),
          replace: true,
        })
      }
    />
  )
}
