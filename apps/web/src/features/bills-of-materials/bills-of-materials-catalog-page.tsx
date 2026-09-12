import { CopyPlusIcon, FileStackIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import type { ProductVariantCandidate } from '@guardiola-foundry/shared-types'
import type { BillOfMaterialsSummary } from '@guardiola-foundry/shared-types'

import { PageHeader } from '@/components/app/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  useBillsOfMaterials,
  useDeleteBillOfMaterials,
  useRestoreBillOfMaterials,
} from './api/bills-of-materials'
import { BillOfMaterialsMutationDialog } from './components/bill-of-materials-mutation-dialog'
import { AssociateTemplateProductButton } from './components/associate-template-product-button'
import { ProductVariantCandidateDialog } from './components/product-variant-candidate-dialog'

export function BillsOfMaterialsCatalogPage({
  onCreateTemplate,
  onCreateImplementation,
  onApplyTemplate,
  onDeriveTemplate,
  onEdit,
}: {
  onCreateTemplate: () => void
  onCreateImplementation: (candidate: ProductVariantCandidate) => void
  onApplyTemplate: (
    templateId: string,
    candidate: ProductVariantCandidate,
  ) => void
  onDeriveTemplate: (originId: string) => void
  onEdit: (billOfMaterialsId: string) => void
}) {
  const { session } = useAppShell()
  const isAdmin = session.user.role === 'admin'
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const { billsOfMaterials, isLoading, loadError } = useBillsOfMaterials(
    session.token,
    isAdmin && includeDeleted,
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
          <div className="flex gap-2">
            {isAdmin ? (
              <Button
                aria-pressed={includeDeleted}
                type="button"
                variant={includeDeleted ? 'secondary' : 'outline'}
                onClick={() => setIncludeDeleted((value) => !value)}
              >
                {includeDeleted ? 'Including deleted' : 'Include deleted'}
              </Button>
            ) : null}
            <CreateBomMenu
              onCreateImplementation={() => setVariantDialogOpen(true)}
              onCreateTemplate={onCreateTemplate}
            />
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Operational catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading Bills of Materials...
            </p>
          ) : null}
          {loadError ? <p role="alert">{loadError.message}</p> : null}
          {!isLoading && !loadError && billsOfMaterials.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No Bills of Materials registered yet.
            </div>
          ) : null}
          {billsOfMaterials.length > 0 ? (
            <Table className="min-w-[58rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Bill of Materials</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product context</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last updated</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billsOfMaterials.map((billOfMaterials) => (
                  <TableRow key={billOfMaterials.id}>
                    <TableCell className="max-w-[18rem] whitespace-normal align-top">
                      <p className="font-medium">{billOfMaterials.name}</p>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {billOfMaterials.id}
                      </p>
                      {billOfMaterials.origin ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Origin: {billOfMaterials.origin.name} ·{' '}
                          {billOfMaterials.origin.kind === 'template'
                            ? 'Template'
                            : 'Implementation'}{' '}
                          · {billOfMaterials.origin.availability}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge
                        variant={
                          billOfMaterials.deletedAt
                            ? 'destructive'
                            : billOfMaterials.kind === 'template'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {billOfMaterials.deletedAt
                          ? 'Deleted'
                          : billOfMaterials.kind === 'template'
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
                    <TableCell className="whitespace-normal align-top text-sm">
                      <p>{billOfMaterials.createdBy.email}</p>
                      <p className="text-muted-foreground">
                        {new Date(
                          billOfMaterials.createdAt,
                        ).toLocaleDateString()}
                      </p>
                    </TableCell>
                    <TableCell className="align-top text-sm">
                      {new Date(billOfMaterials.updatedAt).toLocaleDateString()}
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
