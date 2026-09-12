import { CopyPlusIcon, FileStackIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import type {
  BillOfMaterialsSummary,
  ListBillsOfMaterialsQuery,
  ProductVariantCandidate,
} from '@guardiola-foundry/shared-types'

import { PageHeader } from '@/components/app/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import { cn } from '@/lib/utils'
import {
  useBillsOfMaterials,
  useDeleteBillOfMaterials,
  useRestoreBillOfMaterials,
} from './api/bills-of-materials'
import { BillOfMaterialsMutationDialog } from './components/bill-of-materials-mutation-dialog'
import { AssociateTemplateProductButton } from './components/associate-template-product-button'
import {
  CatalogEmptyState,
  CatalogFilters,
  CatalogSummary,
  CostProjection,
} from './components/catalog-presentation'
import { ProductVariantCandidateDialog } from './components/product-variant-candidate-dialog'

export function BillsOfMaterialsCatalogPage({
  onCreateTemplate,
  onCreateImplementation,
  onApplyTemplate,
  onDeriveTemplate,
  onEdit,
  filters,
  onFiltersChange,
}: {
  onCreateTemplate: () => void
  onCreateImplementation: (candidate: ProductVariantCandidate) => void
  onApplyTemplate: (
    templateId: string,
    candidate: ProductVariantCandidate,
  ) => void
  onDeriveTemplate: (originId: string) => void
  onEdit: (billOfMaterialsId: string) => void
  filters: ListBillsOfMaterialsQuery
  onFiltersChange: (changes: ListBillsOfMaterialsQuery) => void
}) {
  const { session } = useAppShell()
  const isAdmin = session.user.role === 'admin'
  const catalogFilters = {
    ...filters,
    includeDeleted: isAdmin && filters.includeDeleted,
  }
  const { billsOfMaterials, summary, isLoading, loadError, reload } =
    useBillsOfMaterials(session.token, catalogFilters)
  const hasActiveFilters = Boolean(
    catalogFilters.search ||
    catalogFilters.kind ||
    catalogFilters.includeDeleted,
  )
  const deletion = useDeleteBillOfMaterials(session.token)
  const restoration = useRestoreBillOfMaterials(session.token)
  const [pendingMutation, setPendingMutation] = useState<{
    action: 'delete' | 'restore'
    target: BillOfMaterialsSummary
  } | null>(null)
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [applicationTemplateId, setApplicationTemplateId] = useState<
    string | null
  >(null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bills of Materials"
        description="Browse reusable Templates and Product Variant Implementations in one operational catalog."
        action={
          <CreateBomMenu
            onCreateImplementation={() => setVariantDialogOpen(true)}
            onCreateTemplate={onCreateTemplate}
          />
        }
      />

      {summary ? <CatalogSummary summary={summary} /> : null}

      <Card>
        <CardContent className="space-y-5">
          <CatalogFilters
            filters={catalogFilters}
            isAdmin={isAdmin}
            onChange={onFiltersChange}
          />
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading Bills of Materials...
            </p>
          ) : null}
          {loadError ? (
            <div
              className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              <p>{loadError.message}</p>
              <Button
                className="mt-3"
                onClick={() => void reload()}
                size="sm"
                type="button"
                variant="outline"
              >
                Try again
              </Button>
            </div>
          ) : null}
          {!isLoading &&
          !loadError &&
          billsOfMaterials.length === 0 &&
          summary ? (
            <CatalogEmptyState
              filtered={hasActiveFilters || summary.totalAvailable > 0}
              onClear={() => onFiltersChange({})}
              onCreateImplementation={() => setVariantDialogOpen(true)}
              onCreateTemplate={onCreateTemplate}
            />
          ) : null}
          {billsOfMaterials.length > 0 ? (
            <Table className="min-w-[68rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Bill of Materials</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Product context</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead className="text-right">Cost projection</TableHead>
                  <TableHead className="text-right">Lines</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billsOfMaterials.map((billOfMaterials) => (
                  <TableRow
                    className={cn(billOfMaterials.deletedAt && 'opacity-65')}
                    key={billOfMaterials.id}
                  >
                    <TableCell className="max-w-[18rem] whitespace-normal align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          className="h-auto justify-start p-0 text-left whitespace-normal"
                          onClick={() => onEdit(billOfMaterials.id)}
                          type="button"
                          variant="link"
                        >
                          {billOfMaterials.name}
                        </Button>
                        {billOfMaterials.deletedAt ? (
                          <Badge variant="destructive">Deleted</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {billOfMaterials.id}
                      </p>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge
                        variant={
                          billOfMaterials.kind === 'template'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {billOfMaterials.kind === 'template'
                          ? 'Template'
                          : 'Implementation'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-normal align-top">
                      {billOfMaterials.product ? (
                        <div className="space-y-1">
                          <p>
                            <span className="font-medium">
                              {billOfMaterials.product.name}
                            </span>{' '}
                            <span className="text-xs text-muted-foreground">
                              · {billOfMaterials.product.id}
                            </span>
                          </p>
                          {billOfMaterials.productVariant ? (
                            <p className="text-xs">
                              {billOfMaterials.productVariant.name} ·{' '}
                              {billOfMaterials.productVariant.id}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="font-medium">No Product associated</p>
                          <p className="text-xs text-muted-foreground">
                            Product relationship is optional
                          </p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[14rem] whitespace-normal align-top">
                      {billOfMaterials.origin ? (
                        <div>
                          <p>{billOfMaterials.origin.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {billOfMaterials.origin.kind === 'template'
                              ? 'Template'
                              : 'Implementation'}
                            {billOfMaterials.origin.availability ===
                            'unavailable'
                              ? ' · Unavailable origin'
                              : ' · Immediate origin'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Created manually
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <CostProjection
                        projection={billOfMaterials.costProjection}
                      />
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <p className="font-medium">{billOfMaterials.lineCount}</p>
                      <p className="text-xs text-muted-foreground">
                        {billOfMaterials.verifiedLineCount} verified
                      </p>
                      {billOfMaterials.verifiedLineCount <
                      billOfMaterials.lineCount ? (
                        <p className="text-xs text-amber-700">
                          {billOfMaterials.lineCount -
                            billOfMaterials.verifiedLineCount}{' '}
                          {billOfMaterials.lineCount -
                            billOfMaterials.verifiedLineCount ===
                          1
                            ? 'needs'
                            : 'need'}{' '}
                          review
                        </p>
                      ) : null}
                      {billOfMaterials.attentionCount > 0 ? (
                        <p className="text-xs text-amber-700">
                          {billOfMaterials.attentionCount}{' '}
                          {billOfMaterials.attentionCount === 1
                            ? 'needs'
                            : 'need'}{' '}
                          attention
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right align-top">
                      <AssociateTemplateProductButton
                        billOfMaterialsId={billOfMaterials.id}
                        billOfMaterialsName={billOfMaterials.name}
                        canAssociateProduct={
                          !billOfMaterials.deletedAt &&
                          billOfMaterials.kind === 'template' &&
                          billOfMaterials.product === null
                        }
                        canCreateImplementation={
                          !billOfMaterials.deletedAt &&
                          billOfMaterials.kind === 'template' &&
                          billOfMaterials.product !== null &&
                          billOfMaterials.product.availability === 'available'
                        }
                        token={session.token}
                        isAdmin={isAdmin}
                        isDeleted={billOfMaterials.deletedAt !== null}
                        isReadOnly={billOfMaterials.readOnlyReason !== null}
                        onDelete={() => {
                          deletion.reset()
                          setPendingMutation({
                            action: 'delete',
                            target: billOfMaterials,
                          })
                        }}
                        onEdit={() => onEdit(billOfMaterials.id)}
                        onDeriveTemplate={() =>
                          onDeriveTemplate(billOfMaterials.id)
                        }
                        onRestore={() => {
                          restoration.reset()
                          setPendingMutation({
                            action: 'restore',
                            target: billOfMaterials,
                          })
                        }}
                        onCreateImplementation={() =>
                          setApplicationTemplateId(billOfMaterials.id)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
      <ProductVariantCandidateDialog
        open={variantDialogOpen}
        token={session.token}
        onOpenChange={setVariantDialogOpen}
        onSelect={onCreateImplementation}
      />
      <BillOfMaterialsMutationDialog
        action={pendingMutation?.action ?? 'delete'}
        error={
          (pendingMutation?.action === 'restore'
            ? restoration.error
            : deletion.error) ?? null
        }
        isPending={
          pendingMutation?.action === 'restore'
            ? restoration.isRestoring
            : deletion.isDeleting
        }
        target={pendingMutation?.target ?? null}
        onOpenBillOfMaterials={(id) => {
          setPendingMutation(null)
          onEdit(id)
        }}
        onOpenChange={(open) => {
          if (!open) {
            deletion.reset()
            restoration.reset()
            setPendingMutation(null)
          }
        }}
        onConfirm={async () => {
          if (!pendingMutation) return
          try {
            if (pendingMutation.action === 'restore')
              await restoration.restoreBillOfMaterials(
                pendingMutation.target.id,
              )
            else await deletion.deleteBillOfMaterials(pendingMutation.target.id)
            setPendingMutation(null)
          } catch {
            // Keep the dialog open with the server result and current catalog state.
          }
        }}
      />
      <ProductVariantCandidateDialog
        open={applicationTemplateId !== null}
        templateId={applicationTemplateId ?? undefined}
        token={session.token}
        onOpenChange={(open) => {
          if (!open) setApplicationTemplateId(null)
        }}
        onSelect={(candidate) => {
          if (applicationTemplateId)
            onApplyTemplate(applicationTemplateId, candidate)
        }}
      />
    </div>
  )
}

function CreateBomMenu({
  onCreateImplementation,
  onCreateTemplate,
}: {
  onCreateImplementation: () => void
  onCreateTemplate: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button">
          <PlusIcon /> Create BOM
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onSelect={onCreateImplementation}>
          <CopyPlusIcon />
          <div>
            <p className="font-medium">BOM Implementation</p>
            <p className="text-xs text-muted-foreground">
              Start manually for a Product Variant
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onCreateTemplate}>
          <FileStackIcon />
          <div>
            <p className="font-medium">BOM Template</p>
            <p className="text-xs text-muted-foreground">
              Create a reusable construction
            </p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
