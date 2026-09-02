import type { ListSourcesQuery } from '@guardiola-foundry/shared-types'
import { Link } from '@tanstack/react-router'

import { PageHeader } from '@/components/app/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import { MaterialsAreaNavigation } from '@/features/materials/components/materials-area-navigation'
import { useSourceList } from '@/features/sources/api/queries'
import { SourceFilters } from '@/features/sources/components/source-filters'
import { SourcesTable } from '@/features/sources/components/sources-table'

type SourcesPageProps = {
  filters: ListSourcesQuery
  onFiltersChange: (changes: Partial<ListSourcesQuery>) => void
}

export function SourcesPage({ filters, onFiltersChange }: SourcesPageProps) {
  const { session } = useAppShell()
  const sourcesQuery = useSourceList(session.token, filters)
  const sources = sourcesQuery.data?.sources ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sources"
        description="Browse vendor-specific textile offerings, commercial context, Material links, and attention needs."
        action={
          <Button asChild>
            <Link to="/app/sources/new">Create Source</Link>
          </Button>
        }
      />

      <MaterialsAreaNavigation />

      <Card>
        <CardContent className="space-y-5">
          <SourceFilters
            filters={filters}
            onFiltersChange={onFiltersChange}
            role={session.user.role}
          />

          {sourcesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading Sources...</p>
          ) : null}

          {sourcesQuery.isError ? (
            <p
              className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {sourcesQuery.error instanceof Error
                ? sourcesQuery.error.message
                : 'Unable to load Sources.'}
              <span className="mt-1 block">Refresh the page to try again.</span>
            </p>
          ) : null}

          {!sourcesQuery.isLoading &&
          !sourcesQuery.isError &&
          sources.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/18 px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                No Sources match this view.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Adjust the search or filters to return to the operational
                catalog.
              </p>
            </div>
          ) : null}

          {sources.length > 0 ? <SourcesTable sources={sources} /> : null}
        </CardContent>
      </Card>
    </div>
  )
}
