import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'

import { SourcesPage } from '@/features/sources/sources-page'

export const Route = createFileRoute('/app/sources/')({
  component: SourcesIndexRoute,
})

function SourcesIndexRoute() {
  const filters = useSearch({ from: '/app/sources' })
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
