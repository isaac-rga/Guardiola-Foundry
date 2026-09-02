import type {
  PurchasePresentation,
  PurchaseUnit,
  SourceSummary,
} from '@guardiola-foundry/shared-types'
import { Link } from '@tanstack/react-router'

import { StatusBadge } from '@/components/app/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function SourcesTable({ sources }: { sources: SourceSummary[] }) {
  return (
    <Table className="min-w-[74rem]">
      <TableHeader>
        <TableRow>
          <TableHead>Source ID</TableHead>
          <TableHead>Source Name</TableHead>
          <TableHead>Vendor</TableHead>
          <TableHead>Textile Family</TableHead>
          <TableHead>Presentation / Unit</TableHead>
          <TableHead className="text-right">Vendor Price</TableHead>
          <TableHead className="text-right">Landed Unit Cost</TableHead>
          <TableHead className="text-right">Linked Materials</TableHead>
          <TableHead>Attention</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sources.map((source) => (
          <TableRow key={source.id}>
            <TableCell className="font-mono text-xs">
              <Link
                aria-label={`${source.id} ${source.name}`}
                className="text-primary underline-offset-4 hover:underline"
                params={{ sourceId: source.id }}
                to="/app/sources/$sourceId"
              >
                {source.id}
              </Link>
            </TableCell>
            <TableCell className="max-w-[15rem] whitespace-normal font-medium">
              {source.name}
            </TableCell>
            <TableCell className="max-w-[13rem] whitespace-normal">
              {source.vendor}
            </TableCell>
            <TableCell>
              <StatusBadge label={source.textileFamily} tone="muted" />
            </TableCell>
            <TableCell>
              {formatPresentation(source.purchasePresentation)} /{' '}
              {formatUnit(source.purchaseUnit)}
            </TableCell>
            <TableCell className="text-right">
              {formatMoney(source.purchasePriceCents, source.vendorCurrency)}
            </TableCell>
            <TableCell className="text-right">
              {source.landedUnitCostCents === null
                ? 'Not recorded'
                : `${formatMoney(source.landedUnitCostCents, 'MXN')} / meter`}
            </TableCell>
            <TableCell className="text-right">
              {source.linkedMaterialCount === 0 ? (
                <StatusBadge label="Unlinked" tone="warning" />
              ) : (
                source.linkedMaterialCount
              )}
            </TableCell>
            <TableCell>
              <div className="flex min-w-[10rem] flex-col items-start gap-1">
                {source.costNeedsAttention ? (
                  <StatusBadge label="Cost needs attention" tone="warning" />
                ) : null}
                {source.dataNeedsAttention ? (
                  <StatusBadge label="Data needs attention" tone="muted" />
                ) : null}
                {!source.costNeedsAttention && !source.dataNeedsAttention ? (
                  <span className="text-sm text-muted-foreground">
                    Complete
                  </span>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function formatPresentation(value: PurchasePresentation | null) {
  if (value === null) return 'Not recorded'
  return value === 'roll' ? 'Roll' : 'Piece'
}

function formatUnit(value: PurchaseUnit) {
  return value === 'meter' ? 'Meter' : 'Yard'
}

function formatMoney(cents: number | null, currency: 'USD' | 'MXN' | null) {
  if (cents === null || currency === null) return 'Not recorded'

  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
    cents / 100,
  )
}
