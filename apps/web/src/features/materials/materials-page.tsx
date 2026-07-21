import { useQuery } from '@tanstack/react-query'

import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import { listMaterials } from '@/features/materials/api/endpoints'
import { materialListQueryKey } from '@/features/materials/query-keys'
import type { MaterialColor, MaterialSummary, MaterialUnit, MaterialUse } from '@guardiola-foundry/shared-types'

export function MaterialsPage() {
  const { session } = useAppShell()
  const materialsQuery = useQuery({
    queryKey: materialListQueryKey,
    queryFn: () => listMaterials(session.token),
  })
  const materials = materialsQuery.data?.materials ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Materials"
        description="Scan the active textile Material list with Preferred Source cost context kept compact beside each Material identity."
      />

      <Card>
        <CardContent>
          {materialsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading materials...</p>
          ) : null}

          {materialsQuery.isError ? (
            <p
              className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {materialsQuery.error instanceof Error
                ? materialsQuery.error.message
                : 'Unable to load materials.'}
            </p>
          ) : null}

          {!materialsQuery.isLoading && !materialsQuery.isError && materials.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/18 px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">No active materials found.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Imported textile Materials will appear here after they have valid linked Source data.
              </p>
            </div>
          ) : null}

          {materials.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Material Color</TableHead>
                  <TableHead>Material Use</TableHead>
                  <TableHead>Material Unit</TableHead>
                  <TableHead>Preferred Source</TableHead>
                  <TableHead className="text-right">Derived Cost</TableHead>
                  <TableHead className="text-right">Alt. Sources</TableHead>
                  <TableHead>Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <MaterialRow key={material.id} material={material} />
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function MaterialRow({ material }: { material: MaterialSummary }) {
  return (
    <TableRow>
      <TableCell className="py-3 align-top font-mono text-xs text-muted-foreground">
        {material.id}
      </TableCell>
      <TableCell className="max-w-[16rem] py-3 align-top whitespace-normal">
        <p className="text-sm font-medium leading-5 text-foreground">{material.name}</p>
      </TableCell>
      <TableCell className="py-3 align-top">
        <StatusBadge label={toMaterialColorLabel(material.materialColor)} tone="muted" />
      </TableCell>
      <TableCell className="py-3 align-top">
        <StatusBadge label={toMaterialUseLabel(material.materialUse)} />
      </TableCell>
      <TableCell className="py-3 align-top">
        <StatusBadge label={toMaterialUnitLabel(material.materialUnit)} tone="muted" />
      </TableCell>
      <TableCell className="max-w-[14rem] py-3 align-top whitespace-normal">
        <div className="space-y-1">
          <p className="text-sm font-medium leading-5 text-foreground">
            {material.preferredSource.name}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">{material.preferredSource.provider}</p>
        </div>
      </TableCell>
      <TableCell className="py-3 text-right align-top font-medium">
        {formatUnitCost(material.derivedUnitCostCents, material.preferredSource.normalizedUnit)}
      </TableCell>
      <TableCell className="py-3 text-right align-top">
        {material.alternateSourceCount}
      </TableCell>
      <TableCell className="max-w-[14rem] py-3 align-top whitespace-normal">
        <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
          {material.comments ?? 'No comments'}
        </p>
      </TableCell>
    </TableRow>
  )
}

function toMaterialColorLabel(materialColor: MaterialColor) {
  return {
    ivory: 'Ivory',
    champagne: 'Champagne',
    white: 'White',
  }[materialColor]
}

function toMaterialUseLabel(materialUse: MaterialUse) {
  return {
    'base-fabric': 'Base Fabric',
    structure: 'Structure',
    lace: 'Lace',
  }[materialUse]
}

function toMaterialUnitLabel(materialUnit: MaterialUnit) {
  return {
    meter: 'Meter',
  }[materialUnit]
}

function formatUnitCost(costCents: number, unit: MaterialUnit) {
  return `${new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(costCents / 100)} / ${toMaterialUnitLabel(unit).toLocaleLowerCase()}`
}
