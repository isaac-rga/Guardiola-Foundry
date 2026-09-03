import type { ListSourcesQuery } from '@guardiola-foundry/shared-types'
import { Link } from '@tanstack/react-router'

import { PageHeader } from '@/components/app/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import { MaterialsAreaNavigation } from '@/features/materials/components/materials-area-navigation'
import {
  useCurrencyConversionRate,
  useSourceList,
} from '@/features/sources/api/queries'
import { SourceFilters } from '@/features/sources/components/source-filters'
import { SourcesTable } from '@/features/sources/components/sources-table'

type SourcesPageProps = {
  filters: ListSourcesQuery
  onFiltersChange: (changes: Partial<ListSourcesQuery>) => void
}

export function SourcesPage({ filters, onFiltersChange }: SourcesPageProps) {
  const { session } = useAppShell()
  const currencyConversionRateQuery = useCurrencyConversionRate(session.token)
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

      <div className="flex flex-wrap items-start gap-3">
        <MaterialsAreaNavigation />

        <section
          aria-labelledby="currency-conversion-rate-heading"
          className="ml-auto w-fit max-w-full rounded-xl border border-border/70 bg-muted/25 px-4 py-2"
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2
              className="text-xs font-semibold text-foreground"
              id="currency-conversion-rate-heading"
            >
              Currency Conversion Rate
            </h2>

            {currencyConversionRateQuery.isLoading ? (
              <p className="text-xs text-muted-foreground">Loading...</p>
            ) : null}

            {currencyConversionRateQuery.isError ? (
              <p className="text-xs text-muted-foreground">
                Unavailable. Source catalog work is still available.
              </p>
            ) : null}

            {currencyConversionRateQuery.data?.state === 'missing' ? (
              <p className="text-xs text-muted-foreground">
                Not configured. Source catalog work is still available.
              </p>
            ) : null}

            {currencyConversionRateQuery.data?.state === 'invalid' ? (
              <p className="text-xs text-muted-foreground">
                Invalid configuration. Source catalog work is still available.
              </p>
            ) : null}

            {currencyConversionRateQuery.data?.state === 'configured' ? (
              <dl className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    USD:MXN
                  </dt>
                  <dd className="text-xs font-semibold text-foreground">
                    {formatRate(currencyConversionRateQuery.data.usdToMxnRate)}
                  </dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    MXN:USD
                  </dt>
                  <dd className="text-xs font-semibold text-foreground">
                    {formatRate(currencyConversionRateQuery.data.mxnToUsdRate)}
                  </dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Effective Date
                  </dt>
                  <dd className="text-xs font-semibold text-foreground">
                    {formatEffectiveDate(
                      currencyConversionRateQuery.data.effectiveDate,
                    )}
                  </dd>
                </div>
              </dl>
            ) : null}
          </div>

          {currencyConversionRateQuery.data?.state === 'configured' ? (
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
              Informational only · no Source price or Landed Unit Cost
              conversion.
            </p>
          ) : null}
        </section>
      </div>

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

function formatRate(rate: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6,
  }).format(rate)
}

function formatEffectiveDate(effectiveDate: string) {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${effectiveDate}T00:00:00Z`))
}
