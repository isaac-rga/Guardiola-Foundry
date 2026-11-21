import type {
  BillOfMaterialsCostProjection,
  BillOfMaterialsKind,
  BillsOfMaterialsCatalogSummary,
  ListBillsOfMaterialsQuery,
} from '@guardiola-foundry/shared-types'

import { Button } from '@/components/ui/button'
import {
  TableFilters,
  type TableFilterCriterion,
} from '@/components/app/table-filters'
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
  onSearchChange,
  onClearAll,
}: {
  filters: ListBillsOfMaterialsQuery
  isAdmin: boolean
  onChange: (changes: ListBillsOfMaterialsQuery) => void
  onSearchChange: (value: string) => void
  onClearAll: () => void
}) {
  const criteria: TableFilterCriterion[] = [
    {
      key: 'kind',
      label: 'Kind',
      value: filters.kind,
      valueLabel:
        filters.kind === 'template'
          ? 'Template'
          : filters.kind === 'implementation'
            ? 'Implementation'
            : undefined,
      options: [
        { label: 'Template', value: 'template' },
        { label: 'Implementation', value: 'implementation' },
      ],
      onChange: (value) =>
        onChange({ kind: value as BillOfMaterialsKind | undefined }),
    },
  ]
  if (isAdmin) {
    criteria.push({
      key: 'includeDeleted',
      label: 'Include deleted',
      value: filters.includeDeleted ? 'true' : undefined,
      additive: true,
      onChange: (value) =>
        onChange({ includeDeleted: value ? true : undefined }),
    })
  }
  return (
    <TableFilters
      criteria={criteria}
      onClearAll={onClearAll}
      search={{
        label: 'Search Bills of Materials',
        placeholder: 'Search name, ID, Product, Variant, or origin',
        value: filters.search ?? '',
        onChange: onSearchChange,
      }}
    />
  )
}

export function CatalogEmptyState({
  filtered,
  onCreateImplementation,
  onCreateTemplate,
}: {
  filtered: boolean
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
          <p className="text-sm text-muted-foreground">
            Clear search or filters to return to the operational catalog.
          </p>
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
