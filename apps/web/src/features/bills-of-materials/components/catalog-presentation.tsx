import { FilterIcon, SearchIcon } from 'lucide-react'
import type {
  BillOfMaterialsCostProjection,
  BillsOfMaterialsCatalogSummary,
  ListBillsOfMaterialsQuery,
} from '@guardiola-foundry/shared-types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function CatalogSummary({
  summary,
}: {
  summary: BillsOfMaterialsCatalogSummary
}) {
  return (
    <section
      aria-label="Bills of Materials summary"
      className="grid gap-3 md:grid-cols-3"
    >
      <SummaryMetric
        detail={`${summary.templateCount} Templates · ${summary.implementationCount} Implementations`}
        label="Available BOMs"
        value={summary.totalAvailable}
      />
      <SummaryMetric
        label="BOMs without an associated Product Variant"
        value={summary.withoutProductVariantCount}
        warning={summary.withoutProductVariantCount > 0}
      />
      <SummaryMetric
        label="BOMs pending line verification"
        value={summary.withUnverifiedLinesCount}
        warning={summary.withUnverifiedLinesCount > 0}
      />
    </section>
  )
}

export function SummaryMetric({
  detail,
  label,
  value,
  warning = false,
}: {
  detail?: string
  label: string
  value: number
  warning?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/70 bg-card/80 px-4 py-3',
        warning && 'border-amber-500/25 bg-amber-50/70',
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-editorial mt-1 text-3xl">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      ) : null}
    </div>
  )
}

export function CatalogFilters({
  filters,
  isAdmin,
  onChange,
}: {
  filters: ListBillsOfMaterialsQuery
  isAdmin: boolean
  onChange: (changes: ListBillsOfMaterialsQuery) => void
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
      <div className="relative w-full lg:max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search Bills of Materials"
          className="h-9 pl-10"
          onChange={(event) =>
            onChange({
              ...filters,
              search: event.target.value.trimStart() || undefined,
            })
          }
          placeholder="Search name, ID, Product, Variant, or origin"
          type="search"
          value={filters.search ?? ''}
        />
      </div>
      {[
        { label: 'All', value: undefined },
        { label: 'Templates', value: 'template' as const },
        { label: 'Implementations', value: 'implementation' as const },
      ].map((option) => (
        <Button
          aria-pressed={filters.kind === option.value}
          className="h-9"
          key={option.label}
          onClick={() => onChange({ ...filters, kind: option.value })}
          size="sm"
          type="button"
          variant={filters.kind === option.value ? 'secondary' : 'ghost'}
        >
          {option.label}
        </Button>
      ))}
      {isAdmin ? (
        <Button
          aria-pressed={Boolean(filters.includeDeleted)}
          className="h-9"
          onClick={() =>
            onChange({
              ...filters,
              includeDeleted: filters.includeDeleted ? undefined : true,
            })
          }
          size="sm"
          type="button"
          variant={filters.includeDeleted ? 'secondary' : 'outline'}
        >
          <FilterIcon />
          {filters.includeDeleted ? 'Including deleted' : 'Include deleted'}
        </Button>
      ) : null}
    </div>
  )
}

export function CatalogEmptyState({
  filtered,
  onClear,
  onCreateImplementation,
  onCreateTemplate,
}: {
  filtered: boolean
  onClear: () => void
  onCreateImplementation: () => void
  onCreateTemplate: () => void
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/18 px-6 py-10 text-center">
      <p className="text-sm font-medium text-foreground">
        {filtered
          ? 'No Bills of Materials match this view.'
          : 'No Bills of Materials registered yet.'}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {filtered ? (
          <Button onClick={onClear} size="sm" type="button" variant="outline">
            Clear catalog filters
          </Button>
        ) : (
          <>
            <Button onClick={onCreateTemplate} size="sm" type="button">
              Create Template
            </Button>
            <Button
              onClick={onCreateImplementation}
              size="sm"
              type="button"
              variant="outline"
            >
              Create Implementation
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export function CostProjection({
  projection,
}: {
  projection: BillOfMaterialsCostProjection
}) {
  const availability =
    projection.availability === 'complete'
      ? 'Complete'
      : projection.availability === 'partial'
        ? 'Partial'
        : 'Unavailable'
  const amount =
    projection.amountCents === null
      ? null
      : new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'MXN',
        }).format(projection.amountCents / 100)
  const exclusion =
    projection.excludedLineCount > 0
      ? `${projection.excludedLineCount} ${
          projection.excludedLineCount === 1 ? 'line' : 'lines'
        } excluded`
      : null

  return (
    <div
      aria-label={`${availability} projection${amount ? `: ${amount}` : ''}${
        exclusion ? `; ${exclusion}` : ''
      }`}
    >
      <p className="font-medium">{amount ?? 'Unavailable'}</p>
      <p
        className={cn(
          'text-xs',
          projection.availability === 'complete'
            ? 'text-muted-foreground'
            : 'text-amber-700',
        )}
      >
        {availability}
        {exclusion ? ` · ${exclusion}` : ''}
      </p>
    </div>
  )
}
