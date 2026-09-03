import type {
  MaterialDetail,
  MaterialSourceRelationshipSummary,
} from '@guardiola-foundry/shared-types'
import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'
import { useState } from 'react'

import { StatusBadge } from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import {
  useLinkMaterialSource,
  useMaterialDetail,
  useUnlinkMaterialSource,
} from '@/features/materials/api/queries'
import { useSourceDetail, useSourceList } from '@/features/sources/api/queries'

export function MaterialRelationshipDialog({
  materialId,
  onOpenChange,
}: {
  materialId: string | undefined
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={materialId !== undefined} onOpenChange={onOpenChange}>
      {materialId ? (
        <MaterialRelationshipContent materialId={materialId} />
      ) : null}
    </Dialog>
  )
}

function MaterialRelationshipContent({ materialId }: { materialId: string }) {
  const { session } = useAppShell()
  const materialQuery = useMaterialDetail(session.token, materialId)

  return (
    <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-4xl">
      {materialQuery.isLoading ? (
        <>
          <DialogHeader>
            <DialogTitle>Material relationships</DialogTitle>
            <DialogDescription>
              Loading the selected Material without leaving the Materials view.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Loading Material relationships...
          </p>
        </>
      ) : null}

      {!materialQuery.isLoading &&
      (materialQuery.isError || !materialQuery.data) ? (
        <>
          <DialogHeader>
            <DialogTitle>Material relationships</DialogTitle>
            <DialogDescription>
              The Materials view remains available behind this dialog.
            </DialogDescription>
          </DialogHeader>
          <div
            className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {materialQuery.error instanceof Error
              ? materialQuery.error.message
              : 'Unable to load Material.'}
          </div>
          <Button type="button" onClick={() => void materialQuery.refetch()}>
            Try again
          </Button>
        </>
      ) : null}

      {materialQuery.data ? (
        <MaterialRelationshipRecord material={materialQuery.data.material} />
      ) : null}
    </DialogContent>
  )
}

function MaterialRelationshipRecord({
  material,
}: {
  material: MaterialDetail
}) {
  const { session } = useAppShell()
  const [showLinkPanel, setShowLinkPanel] = useState(false)
  const unlinkMutation = useUnlinkMaterialSource(session.token, material.id)
  const preferredSources = material.sourceRelationships.filter(
    (source) => source.relationship === 'preferred',
  )
  const activeAlternates = material.sourceRelationships.filter(
    (source) =>
      source.relationship === 'alternate' &&
      source.relationshipStatus === 'active',
  )
  const historicalRelationships = material.sourceRelationships.filter(
    (source) =>
      source.relationship === 'alternate' &&
      source.relationshipStatus === 'historical',
  )

  return (
    <>
      <DialogHeader>
        <DialogTitle>{material.name}</DialogTitle>
        <DialogDescription>
          Read-only Material identity and Source relationship context.
        </DialogDescription>
      </DialogHeader>

      <dl className="grid gap-4 rounded-2xl border border-border/70 bg-muted/18 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <IdentityField label="Material ID" value={material.id} mono />
        <IdentityField
          label="Material Color"
          value={formatTitle(material.materialColor)}
        />
        <IdentityField
          label="Material Use"
          value={formatTitle(material.materialUse)}
        />
        <IdentityField
          label="Material Unit"
          value={formatTitle(material.materialUnit)}
        />
        <div className="space-y-1 sm:col-span-2 lg:col-span-4">
          <dt className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Comments
          </dt>
          <dd className="text-sm leading-6 text-foreground">
            {material.comments ?? 'No comments'}
          </dd>
        </div>
      </dl>

      <div className="grid gap-4 lg:grid-cols-3">
        <RelationshipGroup
          label="Preferred Source"
          sources={preferredSources}
        />
        <RelationshipGroup
          label="Active alternates"
          sources={activeAlternates}
          isUnlinking={unlinkMutation.isPending}
          onUnlink={(source) => {
            if (
              !window.confirm(
                `Unlink ${source.name} from ${material.name}? The Source will remain in the catalog.`,
              )
            ) {
              return
            }

            unlinkMutation.mutate(source.id)
          }}
        />
        <RelationshipGroup
          label="Historical relationships"
          sources={historicalRelationships}
        />
      </div>

      {unlinkMutation.isError ? (
        <RelationshipError error={unlinkMutation.error} />
      ) : null}

      <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Add an alternate Source
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Select an existing Active Source. Create new Sources from the Sources catalog.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowLinkPanel((visible) => !visible)}
          >
            {showLinkPanel ? 'Cancel linking' : 'Link existing Source'}
          </Button>
        </div>
        {showLinkPanel ? (
          <LinkSourcePanel
            material={material}
            onLinked={() => setShowLinkPanel(false)}
          />
        ) : null}
      </section>
    </>
  )
}

function IdentityField({
  label,
  mono = false,
  value,
}: {
  label: string
  mono?: boolean
  value: string
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd
        className={
          mono ? 'font-mono text-sm text-foreground' : 'text-sm text-foreground'
        }
      >
        {value}
      </dd>
    </div>
  )
}

function RelationshipGroup({
  isUnlinking = false,
  label,
  onUnlink,
  sources,
}: {
  isUnlinking?: boolean
  label: string
  onUnlink?: (source: MaterialSourceRelationshipSummary) => void
  sources: MaterialSourceRelationshipSummary[]
}) {
  return (
    <section
      aria-label={label}
      className="space-y-3 rounded-2xl border border-border/70 bg-card p-4"
    >
      <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      {sources.length === 0 ? (
        <p className="text-sm text-muted-foreground">None</p>
      ) : (
        sources.map((source) => (
          <div
            className="space-y-2 border-t border-border/60 pt-3 first:border-t-0 first:pt-0"
            key={source.id}
          >
            <div>
              <Link
                aria-label={`Open Source ${source.name}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
                params={{ sourceId: source.id }}
                to="/app/sources/$sourceId"
              >
                {source.name}
                <ArrowRightIcon
                  aria-hidden="true"
                  className="ml-1 inline size-3.5 align-[-0.125em]"
                />
              </Link>
              <p className="text-xs leading-5 text-muted-foreground">
                {source.id} · {source.vendor}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                label={formatTitle(source.relationshipStatus)}
                tone={
                  source.relationshipStatus === 'historical'
                    ? 'warning'
                    : 'success'
                }
              />
              {source.vendorShade ? (
                <StatusBadge
                  label={`Vendor Shade: ${source.vendorShade.nameOrCode}`}
                  tone="muted"
                />
              ) : null}
            </div>
            {source.relationship === 'preferred' ? (
              <p className="text-xs leading-5 text-muted-foreground">
                Replace the Preferred Source before unlinking it.
              </p>
            ) : null}
            {onUnlink && source.relationshipStatus === 'active' ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isUnlinking}
                onClick={() => onUnlink(source)}
              >
                {isUnlinking ? 'Unlinking…' : `Unlink ${source.name}`}
              </Button>
            ) : null}
          </div>
        ))
      )}
    </section>
  )
}

function LinkSourcePanel({
  material,
  onLinked,
}: {
  material: MaterialDetail
  onLinked: () => void
}) {
  const { session } = useAppShell()
  const [sourceId, setSourceId] = useState<string>()
  const [vendorShadeId, setVendorShadeId] = useState('none')
  const sourceListQuery = useSourceList(session.token, {})
  const linkMutation = useLinkMaterialSource(session.token, material.id)
  const linkedSourceIds = new Set(material.sourceRelationships.map((source) => source.id))
  const eligibleSources =
    sourceListQuery.data?.sources.filter((source) => !linkedSourceIds.has(source.id)) ?? []

  const selectSource = (nextSourceId: string) => {
    setSourceId(nextSourceId)
    setVendorShadeId('none')
    linkMutation.reset()
  }

  return (
    <div className="grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="material-source-link-source">Source</Label>
        <Select value={sourceId} onValueChange={selectSource}>
          <SelectTrigger
            aria-label="Source"
            className="w-full"
            id="material-source-link-source"
          >
            <SelectValue placeholder="Select an Active Source" />
          </SelectTrigger>
          <SelectContent>
            {eligibleSources.map((source) => (
              <SelectItem key={source.id} value={source.id}>
                {source.name} · {source.vendor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {sourceListQuery.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading Active Sources...</p>
        ) : null}
        {sourceListQuery.isError ? (
          <RelationshipError error={sourceListQuery.error} />
        ) : null}
        {!sourceListQuery.isLoading && !sourceListQuery.isError && eligibleSources.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No additional Active Sources are available.
          </p>
        ) : null}
      </div>

      {sourceId ? (
        <VendorShadeSelect
          sourceId={sourceId}
          value={vendorShadeId}
          onValueChange={(value) => {
            setVendorShadeId(value)
            linkMutation.reset()
          }}
        />
      ) : null}

      {linkMutation.isError ? (
        <div className="sm:col-span-2">
          <RelationshipError error={linkMutation.error} />
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <Button
          type="button"
          disabled={!sourceId || linkMutation.isPending}
          onClick={() => {
            if (!sourceId) return

            linkMutation.mutate(
              {
                sourceId,
                vendorShadeId: vendorShadeId === 'none' ? null : Number(vendorShadeId),
              },
              { onSuccess: onLinked },
            )
          }}
        >
          {linkMutation.isPending ? 'Linking Source…' : 'Link Source'}
        </Button>
      </div>
    </div>
  )
}

function VendorShadeSelect({
  onValueChange,
  sourceId,
  value,
}: {
  onValueChange: (value: string) => void
  sourceId: string
  value: string
}) {
  const { session } = useAppShell()
  const sourceQuery = useSourceDetail(session.token, sourceId)

  return (
    <div className="space-y-2">
      <Label htmlFor="material-source-link-shade">Vendor Shade</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          aria-label="Vendor Shade"
          className="w-full"
          id="material-source-link-shade"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Not known</SelectItem>
          {sourceQuery.data?.source.vendorShades.map((shade) => (
            <SelectItem key={shade.id} value={String(shade.id)}>
              {shade.nameOrCode}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {sourceQuery.isLoading ? (
        <p className="text-xs text-muted-foreground">Loading Vendor Shades...</p>
      ) : null}
      {sourceQuery.isError ? <RelationshipError error={sourceQuery.error} /> : null}
    </div>
  )
}

function RelationshipError({ error }: { error: unknown }) {
  return (
    <p
      className="rounded-xl border border-destructive/20 bg-destructive/8 px-3 py-2 text-sm text-destructive"
      role="alert"
    >
      {error instanceof Error ? error.message : 'Unable to update Source relationships.'}
    </p>
  )
}

function formatTitle(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
