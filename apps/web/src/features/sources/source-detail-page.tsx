import { useState, type ReactNode } from 'react'
import type { SourceDetail, SourceLinkedMaterialSummary } from '@guardiola-foundry/shared-types'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'

import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import { SourceLifecycleConflictError } from '@/features/sources/api/endpoints'
import {
  useRestoreSource,
  useRetireSource,
  useSourceDetail,
} from '@/features/sources/api/queries'

export function SourceDetailPage({ sourceId }: { sourceId: string }) {
  const { session } = useAppShell()
  const sourceQuery = useSourceDetail(session.token, sourceId)

  if (sourceQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading Source detail...</p>
  }

  if (sourceQuery.isError || !sourceQuery.data) {
    return (
      <div className="space-y-4">
        <p
          className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {sourceQuery.error instanceof Error
            ? sourceQuery.error.message
            : 'Unable to load Source.'}
          <span className="mt-1 block">
            Return to the catalog or try this request again.
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/app/sources">Back to Sources</Link>
          </Button>
          <Button type="button" onClick={() => void sourceQuery.refetch()}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return <SourceRecord source={sourceQuery.data.source} />
}

function SourceRecord({ source }: { source: SourceDetail }) {
  const { session } = useAppShell()
  const navigate = useNavigate({ from: '/app/sources/$sourceId' })
  const [retirementOpen, setRetirementOpen] = useState(false)
  const retireMutation = useRetireSource(session.token, source.id)
  const restoreMutation = useRestoreSource(session.token, source.id)
  const activeMaterials = source.linkedMaterials.filter(
    (material) => material.relationshipStatus === 'active',
  )
  const preferredMaterials = activeMaterials.filter(
    (material) => material.relationship === 'preferred',
  )
  const lifecycleConflict =
    retireMutation.error instanceof SourceLifecycleConflictError
      ? retireMutation.error
      : null
  const blockedMaterials = lifecycleConflict?.affectedMaterials ?? []
  const retirementBlocked =
    preferredMaterials.length > 0 || blockedMaterials.length > 0
  const retirementMaterials =
    blockedMaterials.length > 0
      ? blockedMaterials.map((material) => ({
          ...material,
          relationship: 'preferred' as const,
        }))
      : activeMaterials

  return (
    <div className="space-y-6">
      <PageHeader
        title={source.name}
        description="Inspect the complete vendor offering and its read-only Material usage context."
        action={
          <div className="flex flex-wrap gap-2">
            {source.sourceStatus === 'active' || session.user.role === 'admin' ? (
              <Button asChild>
                <Link
                  to="/app/sources/$sourceId/edit"
                  params={{ sourceId: source.id }}
                >
                  Edit Source
                </Link>
              </Button>
            ) : null}
            {source.sourceStatus === 'active' ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  retireMutation.reset()
                  setRetirementOpen(true)
                }}
              >
                Retire Source
              </Button>
            ) : session.user.role === 'admin' ? (
              <Button
                type="button"
                disabled={restoreMutation.isPending}
                onClick={() => restoreMutation.mutate()}
              >
                {restoreMutation.isPending ? 'Restoring Source…' : 'Restore Source'}
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to="/app/sources">Back to Sources</Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground">{source.id}</span>
        <StatusBadge label={formatTitle(source.sourceStatus)} tone="muted" />
        {source.costNeedsAttention ? (
          <StatusBadge label="Cost needs attention" tone="warning" />
        ) : null}
        {source.dataNeedsAttention ? (
          <StatusBadge label="Data needs attention" tone="muted" />
        ) : null}
        {!source.costNeedsAttention && !source.dataNeedsAttention ? (
          <StatusBadge label="Complete" tone="success" />
        ) : null}
      </div>

      {restoreMutation.isError ? (
        <p
          className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {restoreMutation.error instanceof Error
            ? restoreMutation.error.message
            : 'Unable to restore Source.'}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <DetailCard
          description="Purchase identity, presentation, pricing, and stable provenance."
          label="Commercial data"
        >
          <DetailGrid
            items={[
              ['Vendor', source.vendor],
              ['Textile Family', source.textileFamily],
              ['Vendor SKU', valueOrFallback(source.vendorSku)],
              ['Legacy Source ID', valueOrFallback(source.legacySourceId)],
              ['Purchase Presentation', formatNullableTitle(source.purchasePresentation)],
              ['Fixed Piece Length', formatMeasurement(source.fixedPieceLength, source.purchaseUnit)],
              ['Purchase Unit', formatTitle(source.purchaseUnit)],
              ['Minimum Purchase Quantity', formatQuantity(source.minimumPurchaseQuantity, source.purchaseUnit)],
              [
                'Vendor Price',
                formatVendorMoney(
                  source.purchasePriceCents,
                  source.vendorCurrency,
                ),
              ],
              ['Price Date', formatDate(source.priceDate)],
              ['Landed Unit Cost', formatLandedCost(source.landedUnitCostCents)],
              ['Normalized Unit', formatTitle(source.normalizedUnit)],
            ]}
          />
          {source.url ? (
            <a
              className="text-sm text-primary underline-offset-4 hover:underline"
              href={source.url}
              rel="noreferrer"
              target="_blank"
            >
              Open Vendor URL
            </a>
          ) : null}
        </DetailCard>

        <DetailCard
          description="Textile specification and Vendor Shade information."
          label="Technical data"
        >
          <DetailGrid
            items={[
              ['Description', valueOrFallback(source.description)],
              ['Manufacturer', valueOrFallback(source.manufacturer)],
              ['Fiber', valueOrFallback(source.fiber)],
              ['Composition', valueOrFallback(source.composition)],
              ['GSM', formatMeasurement(source.gsmGramsPerSquareMeter, 'g/m²')],
              ['Width', formatMeasurement(source.widthCentimeters, 'cm')],
              ['Finish', valueOrFallback(source.finish)],
              ['Weave', valueOrFallback(source.weave)],
              ['Presentation Notes', valueOrFallback(source.presentationNotes)],
              ['Country of Origin', valueOrFallback(source.countryOfOrigin)],
              ['Comments', valueOrFallback(source.comments)],
              [
                'Vendor Shades',
                source.vendorShades.length > 0
                  ? source.vendorShades.map((shade) => shade.nameOrCode).join(', ')
                  : 'None recorded',
              ],
            ]}
          />
        </DetailCard>
      </div>

      <DetailCard
        description="These inputs do not recalculate Landed Unit Cost. The recorded Landed Unit Cost remains manual."
        label="Future costing inputs"
      >
        <DetailGrid
          items={[
            [
              'Estimated Shipping',
              source.estimatedShippingUsdPerKilogramCents === null
                ? 'Not recorded'
                : `USD ${formatMoney(source.estimatedShippingUsdPerKilogramCents, 'USD')} / kg`,
            ],
            ['Import Duty', source.igiPercentage === null ? 'Not recorded' : `IGI ${formatNumber(source.igiPercentage)}%`],
            ['Value Added Tax', `IVA ${source.ivaPercentage}% fixed business rule`],
          ]}
        />
      </DetailCard>

      <LinkedMaterialsCard materials={source.linkedMaterials} />

      <Dialog
        open={retirementOpen}
        onOpenChange={(open) => {
          setRetirementOpen(open)
          if (!open) retireMutation.reset()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retire {source.name}?</DialogTitle>
            <DialogDescription>
              Retirement preserves every Material link but removes this Source from active
              purchasing choices.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {activeMaterials.length === 0 && blockedMaterials.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No Active Materials are affected. This Source is currently Unlinked.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">Affected Active Materials</p>
                <ul className="space-y-2">
                  {retirementMaterials.map((material) => (
                    <li
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2"
                      key={material.id}
                    >
                      <span>
                        <span className="block text-sm font-medium">{material.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {material.id}
                        </span>
                      </span>
                      <StatusBadge label={formatTitle(material.relationship)} tone="muted" />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {retirementBlocked ? (
              <p className="text-sm text-destructive">
                Assign eligible replacements for every Preferred relationship before retiring
                this Source.
              </p>
            ) : null}

            {retireMutation.isError ? (
              <p
                className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {retireMutation.error instanceof Error
                  ? retireMutation.error.message
                  : 'Unable to retire Source.'}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={retireMutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={retirementBlocked || retireMutation.isPending}
              onClick={() =>
                retireMutation.mutate(undefined, {
                  onSuccess: () => {
                    setRetirementOpen(false)
                    if (session.user.role === 'operator') {
                      void navigate({ to: '/app/sources' })
                    }
                  },
                })
              }
            >
              {retirementBlocked
                ? 'Retirement blocked'
                : retireMutation.isPending
                  ? 'Retiring Source…'
                  : 'Confirm retirement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailCard({
  children,
  description,
  label,
}: {
  children: ReactNode
  description: string
  label: string
}) {
  return (
    <Card aria-label={label} role="region">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

function DetailGrid({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div className="space-y-1" key={label}>
          <dt className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            {label}
          </dt>
          <dd className="text-sm leading-6 text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function LinkedMaterialsCard({ materials }: { materials: SourceLinkedMaterialSummary[] }) {
  return (
    <DetailCard
      description="These relationships are shown for context only, including historical Material usage."
      label="Linked Materials"
    >
      {materials.length === 0 ? (
        <p className="text-sm text-muted-foreground">This Source is currently Unlinked.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Color / Use</TableHead>
              <TableHead>Relationship</TableHead>
              <TableHead>Vendor Shade</TableHead>
              <TableHead>Relationship Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((material) => (
              <TableRow key={material.id}>
                <TableCell>
                  <Link
                    className="block font-medium text-primary underline-offset-4 hover:underline"
                    to="/app/materials"
                    search={{ materialId: material.id }}
                  >
                    {material.name}
                    <ArrowRightIcon
                      aria-hidden="true"
                      className="ml-1 inline size-3.5 align-[-0.125em]"
                    />
                  </Link>
                  <span className="font-mono text-xs text-muted-foreground">{material.id}</span>
                </TableCell>
                <TableCell>
                  {formatTitle(material.materialColor)} / {formatTitle(material.materialUse)}
                </TableCell>
                <TableCell>
                  <StatusBadge label={formatTitle(material.relationship)} tone="muted" />
                </TableCell>
                <TableCell>{material.vendorShade?.nameOrCode ?? 'Not recorded'}</TableCell>
                <TableCell>
                  <StatusBadge
                    label={formatTitle(material.relationshipStatus)}
                    tone={material.relationshipStatus === 'historical' ? 'warning' : 'success'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DetailCard>
  )
}

function valueOrFallback(value: string | null) {
  return value ?? 'Not recorded'
}

function formatNullableTitle(value: string | null) {
  return value === null ? 'Not recorded' : formatTitle(value)
}

function formatTitle(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatMeasurement(value: number | null, unit: string) {
  return value === null ? 'Not recorded' : `${formatNumber(value)} ${unit}`
}

function formatQuantity(value: number | null, unit: string) {
  return value === null ? 'Not recorded' : `${formatNumber(value)} ${formatTitle(unit)}`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(value)
}

function formatMoney(cents: number | null, currency: 'USD' | 'MXN' | null) {
  if (cents === null || currency === null) return 'Not recorded'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

function formatVendorMoney(cents: number | null, currency: 'USD' | 'MXN' | null) {
  if (cents === null || currency === null) return 'Not recorded'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  }).format(cents / 100)
}

function formatLandedCost(cents: number | null) {
  return cents === null ? 'Not recorded' : `${formatMoney(cents, 'MXN')} / meter`
}

function formatDate(value: string | null) {
  if (value === null) return 'Not recorded'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00Z`),
  )
}
