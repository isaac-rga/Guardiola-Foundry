import { Link } from '@tanstack/react-router'
import { MoreHorizontalIcon } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useProductVariants } from '@/features/products/api/product-variants'
import {
  useDeleteProduct,
  useProductAvailability,
  useRestoreProduct,
} from '@/features/products/api/products'
import { ProductInactivationDialog } from '@/features/products/components/product-availability-action'
import type { ProductSummary } from '@guardiola-foundry/shared-types'

export type ProductActionFeedback = {
  focus?: boolean
  message: string
  type: 'error' | 'success'
}

export function ProductTableActions({
  focusFeedbackOnAvailabilitySuccess,
  isAdmin,
  onFeedback,
  product,
  token,
}: {
  focusFeedbackOnAvailabilitySuccess: boolean
  isAdmin: boolean
  onFeedback: (feedback: ProductActionFeedback) => void
  product: ProductSummary
  token: string
}) {
  const [isInactivationDialogOpen, setIsInactivationDialogOpen] =
    useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const actionTriggerRef = useRef<HTMLButtonElement>(null)
  const availability = useProductAvailability(token, product.id)
  const deletion = useDeleteProduct(token, product.id)
  const restoration = useRestoreProduct(token, product.id)
  const productVariants = useProductVariants(
    token,
    product.id,
    isInactivationDialogOpen,
    false,
  )
  const isPending =
    availability.isChangingAvailability ||
    deletion.isDeleting ||
    restoration.isRestoring

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={actionTriggerRef}
            aria-label={`Actions for ${product.name}`}
            disabled={isPending}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link
              to="/app/products/$productId"
              params={{ productId: product.id }}
              search={{ deletedProductName: undefined }}
            >
              {product.deletedAt ? 'View Product' : 'Edit Product'}
            </Link>
          </DropdownMenuItem>
          {!product.deletedAt ? (
            <>
              <DropdownMenuItem
                onSelect={() => {
                  if (product.productStatus === 'active') {
                    setIsInactivationDialogOpen(true)
                  } else {
                    void activateProductFromList()
                  }
                }}
              >
                {product.productStatus === 'active'
                  ? 'Inactivate Product'
                  : 'Activate Product'}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setIsDeleteDialogOpen(true)}
              >
                Delete Product
              </DropdownMenuItem>
            </>
          ) : isAdmin ? (
            <DropdownMenuItem onSelect={() => void restoreProductFromList()}>
              Restore Product
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ProductInactivationDialog
        availabilityError={availability.availabilityError}
        changeAvailability={availability.changeAvailability}
        hasActiveVariants={productVariants.variants.some(
          (variant) => variant.status === 'active' && !variant.deletedAt,
        )}
        isChangingAvailability={availability.isChangingAvailability}
        isLoadingVariants={productVariants.isLoading}
        open={isInactivationDialogOpen}
        returnFocusRef={actionTriggerRef}
        variantLoadError={
          productVariants.loadError instanceof Error
            ? productVariants.loadError
            : null
        }
        onOpenChange={setIsInactivationDialogOpen}
        onSuccess={(message) => {
          onFeedback({
            focus: focusFeedbackOnAvailabilitySuccess,
            message,
            type: 'success',
          })
        }}
      />

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!deletion.isDeleting) setIsDeleteDialogOpen(open)
        }}
      >
        <DialogContent
          onCloseAutoFocus={(event) => {
            if (!actionTriggerRef.current) return
            event.preventDefault()
            actionTriggerRef.current.focus()
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
            <DialogDescription>
              Delete {product.name}? This removes it from normal Product views
              while preserving its Product Variants and Bills of Materials.
            </DialogDescription>
          </DialogHeader>

          {deletion.deleteError ? (
            <p className="text-sm text-destructive" role="alert">
              {deletion.deleteError.message}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deletion.isDeleting}
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deletion.isDeleting}
              onClick={() => void deleteProductFromList()}
            >
              {deletion.isDeleting ? 'Deleting Product…' : 'Delete Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

  async function activateProductFromList() {
    try {
      await availability.changeAvailability({ type: 'activate' })
      onFeedback({
        focus: focusFeedbackOnAvailabilitySuccess,
        message: 'Product activated.',
        type: 'success',
      })
    } catch (error) {
      onFeedback({
        message:
          error instanceof Error
            ? error.message
            : 'Unable to activate Product.',
        type: 'error',
      })
    }
  }

  async function deleteProductFromList() {
    try {
      await deletion.deleteProduct()
      setIsDeleteDialogOpen(false)
      onFeedback({
        focus: true,
        message: `Deleted ${product.name}.`,
        type: 'success',
      })
    } catch {
      // Keep the confirmation open with Product-specific mutation feedback.
    }
  }

  async function restoreProductFromList() {
    try {
      await restoration.restoreProduct()
      onFeedback({ message: `Restored ${product.name}.`, type: 'success' })
    } catch (error) {
      onFeedback({
        message:
          error instanceof Error ? error.message : 'Unable to restore product.',
        type: 'error',
      })
    }
  }
}
