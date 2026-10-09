import type { ListSourcesQuery } from '@guardiola-foundry/shared-types'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ApiRequestError } from '@/lib/api/transport'
import { clearAuthSession } from '@/lib/auth/session-storage'

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
  onFiltersChange: (
    changes: Partial<ListSourcesQuery>,
    options?: { replace?: boolean },
  ) => void
}

export function SourcesPage({ filters, onFiltersChange }: SourcesPageProps) {
  const { session } = useAppShell()
  const [searchValue, setSearchValue] = useState(filters.search ?? '')
  const effectiveSearch = filters.search ?? ''
  const normalizedSearch = searchValue.trim()
  const isDebouncing = normalizedSearch !== effectiveSearch

  useEffect(() => {
    setSearchValue(filters.search ?? '')
  }, [filters.search])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (normalizedSearch === effectiveSearch) return
      onFiltersChange(
        { search: normalizedSearch || undefined },
        { replace: true },
      )
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [effectiveSearch, normalizedSearch, onFiltersChange])
  const currencyConversionRateQuery = useCurrencyConversionRate(session.token)
  const effectiveFilters =
    session.user.role === 'admin'
      ? filters
      : { ...filters, includeRetired: undefined }
  const sourcesQuery = useSourceList(session.token, effectiveFilters)
  const isForbidden =
    sourcesQuery.error instanceof ApiRequestError &&
    sourcesQuery.error.status === 403
  const isUnauthorized =
    sourcesQuery.error instanceof ApiRequestError &&
    sourcesQuery.error.status === 401

  useEffect(() => {
    if (filters.includeRetired && session.user.role !== 'admin') {
      onFiltersChange({ includeRetired: undefined }, { replace: true })
    }
  }, [filters.includeRetired, session.user.role, onFiltersChange])

  function clearFilters() {
    if (isForbidden) {
      void sourcesQuery.recoverDefault()
    }
    setSearchValue('')
    onFiltersChange({
      search: undefined,
      textileFamily: undefined,
      linkState: undefined,
      attentionState: undefined,
      includeRetired: undefined,
    })
  }
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
            filters={{ ...effectiveFilters, search: searchValue }}
            onFiltersChange={onFiltersChange}
            onSearchChange={setSearchValue}
            onClearAll={clearFilters}
            role={session.user.role}
          />

          {isDebouncing ||
          (sourcesQuery.isFetching && !sourcesQuery.isLoading) ? (
            <p role="status" className="text-xs text-muted-foreground">
              Updating Sources...
            </p>
          ) : null}

          {sourcesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading Sources...</p>
          ) : null}

          {sourcesQuery.isError && !isForbidden && !isUnauthorized ? (
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

          {isForbidden ? (
            <div
              role="alert"
              className="rounded-xl border border-border px-4 py-3"
            >
              <p>
                You do not have permission to view this Source catalog
                selection.
              </p>
              <Button className="mt-3" variant="outline" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          ) : null}

          {isUnauthorized ? (
            <div role="alert">
              <p>Your session has expired. Sign in again to continue.</p>
              <Button asChild variant="outline" className="mt-3">
                <Link to="/sign-in" onClick={clearAuthSession}>
                  Sign in again
                </Link>
              </Button>
            </div>
          ) : null}

          {!sourcesQuery.isLoading &&
          !sourcesQuery.isError &&
          sources.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/18 px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                No Sources match this view.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Clear search or filters to return to the operational catalog.
              </p>
            </div>
          ) : null}

          {!sourcesQuery.isError && sources.length > 0 ? (
            <SourcesTable sources={sources} />
          ) : null}
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
