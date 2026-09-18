import { RotateCcwIcon, Trash2Icon } from 'lucide-react'
import type { BillOfMaterialsSummary } from '@guardiola-foundry/shared-types'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BillOfMaterialsRestoreConflictError } from '../api/endpoints'

export function BillOfMaterialsMutationDialog({
  action,
  error,
  isPending,
  onConfirm,
  onOpenBillOfMaterials,
  onOpenChange,
  target,
}: {
  action: 'delete' | 'restore'
  error: Error | null
  isPending: boolean
  onConfirm: () => void
  onOpenBillOfMaterials: (id: string) => void
  onOpenChange: (open: boolean) => void
  target: BillOfMaterialsSummary | null
}) {
  const restoring = action === 'restore'
  const conflict =
    error instanceof BillOfMaterialsRestoreConflictError
      ? error.conflictingBillOfMaterials
      : null

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {restoring ? 'Restore' : 'Delete'}{' '}
            {target?.name ?? 'Bill of Materials'}?
          </DialogTitle>
          <DialogDescription>
            {restoring
              ? 'Restoring makes this BOM available again and reclaims its exclusive Product or Product Variant relationship.'
              : 'This removes the BOM from normal views and releases its exclusive Product or Product Variant relationship. Its independent descendants remain available.'}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
          <p className="font-medium">{target?.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {target?.kind === 'template'
              ? `Template · ${target.product?.name ?? 'No Product'}`
              : `Implementation · ${target?.productVariant?.name}`}
          </p>
          {!restoring && target && target.descendantCount > 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {target.descendantCount}{' '}
              {target.descendantCount === 1
                ? 'descendant retains'
                : 'descendants retain'}{' '}
              this BOM as Origin.
            </p>
          ) : null}
        </div>
        {error ? (
          <div className="space-y-2" role="alert">
            <p>{error.message}</p>
            {conflict ? (
              <Button
                type="button"
                variant="link"
                onClick={() => onOpenBillOfMaterials(conflict.id)}
              >
                Open {conflict.name}
              </Button>
            ) : null}
          </div>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={isPending}
            onClick={onConfirm}
            type="button"
            variant={restoring ? 'default' : 'destructive'}
          >
            {restoring ? <RotateCcwIcon /> : <Trash2Icon />}
            {isPending
              ? 'Working...'
              : restoring
                ? 'Restore BOM'
                : 'Delete BOM'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
