import { useState } from 'react'
import type { RefObject } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { ProductStatus } from '@guardiola-foundry/shared-types'

export type ProductAvailabilityActionRequest =
  | { type: 'activate' }
  | { type: 'inactivate'; inactivateVariants: boolean }

export function ProductAvailabilityAction({
  availabilityError,
  changeAvailability,
  disabled,
  hasActiveVariants,
  isChangingAvailability,
  productStatus,
}: {
  availabilityError: Error | null
  changeAvailability: (
    request: ProductAvailabilityActionRequest,
  ) => Promise<unknown>
  disabled: boolean
  hasActiveVariants: boolean
  isChangingAvailability: boolean
  productStatus: ProductStatus
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const onActivate = async () => {
    setSuccessMessage(null)

    try {
      await changeAvailability({ type: 'activate' })
      setSuccessMessage('Product activated.')
    } catch {
      // The mutation exposes action-specific error feedback below.
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={disabled || isChangingAvailability}
        onClick={() => {
          setSuccessMessage(null)

          if (productStatus === 'active') {
            setIsDialogOpen(true)
            return
          }

          void onActivate()
        }}
      >
        {isChangingAvailability
          ? productStatus === 'active'
            ? 'Inactivating Product…'
            : 'Activating Product…'
          : productStatus === 'active'
            ? 'Inactivate Product'
            : 'Activate Product'}
      </Button>

      {isChangingAvailability && !isDialogOpen ? (
        <p className="text-sm text-muted-foreground" role="status">
          Updating Product availability…
        </p>
      ) : null}

      {availabilityError && !isDialogOpen ? (
        <p
          className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {availabilityError.message}
        </p>
      ) : null}

      {successMessage ? (
        <p
          className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}

      <ProductInactivationDialog
        availabilityError={availabilityError}
        changeAvailability={changeAvailability}
        hasActiveVariants={hasActiveVariants}
        isChangingAvailability={isChangingAvailability}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={setSuccessMessage}
      />
    </div>
  )
}

export function ProductInactivationDialog({
  availabilityError,
  changeAvailability,
  hasActiveVariants,
  isChangingAvailability,
  isLoadingVariants = false,
  onOpenChange,
  onSuccess,
  open,
  returnFocusRef,
  variantLoadError = null,
}: {
  availabilityError: Error | null
  changeAvailability: (
    request: ProductAvailabilityActionRequest,
  ) => Promise<unknown>
  hasActiveVariants: boolean
  isChangingAvailability: boolean
  isLoadingVariants?: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (message: string) => void
  open: boolean
  returnFocusRef?: RefObject<HTMLButtonElement | null>
  variantLoadError?: Error | null
}) {
  const [inactivationScope, setInactivationScope] = useState<
    'product' | 'product-and-variants'
  >('product')

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          if (!returnFocusRef?.current) return
          event.preventDefault()
          returnFocusRef.current.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>Inactivate Product?</DialogTitle>
          <DialogDescription>
            Choose whether to inactivate only this Product or also every Product
            Variant that is currently Active.
          </DialogDescription>
        </DialogHeader>

        {isLoadingVariants ? (
          <p className="text-sm text-muted-foreground" role="status">
            Loading Product Variants…
          </p>
        ) : variantLoadError ? (
          <p className="text-sm text-destructive" role="alert">
            {variantLoadError.message}
          </p>
        ) : hasActiveVariants ? (
          <fieldset disabled={isChangingAvailability}>
            <legend className="sr-only">Inactivation scope</legend>
            <RadioGroup
              aria-label="Inactivation scope"
              value={inactivationScope}
              onValueChange={(value) =>
                setInactivationScope(
                  value as 'product' | 'product-and-variants',
                )
              }
            >
              <label className="flex items-start gap-3 rounded-xl border border-border p-4">
                <RadioGroupItem id="product-only" value="product" />
                <span>
                  <span className="block text-sm font-medium">
                    Product only
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    Keep every Product Variant status unchanged.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-border p-4">
                <RadioGroupItem
                  id="product-and-variants"
                  value="product-and-variants"
                />
                <span>
                  <span className="block text-sm font-medium">
                    Product and Active Variants
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    Also inactivate every Product Variant that is Active when
                    this action runs.
                  </span>
                </span>
              </label>
            </RadioGroup>
          </fieldset>
        ) : (
          <p className="text-sm text-muted-foreground">
            This Product has no Active Product Variants, so only the Product
            will be inactivated.
          </p>
        )}

        {availabilityError ? (
          <p className="text-sm text-destructive" role="alert">
            {availabilityError.message}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isChangingAvailability}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={
              isChangingAvailability ||
              isLoadingVariants ||
              variantLoadError !== null
            }
            onClick={() => void onInactivate()}
          >
            {isChangingAvailability
              ? 'Inactivating Product…'
              : 'Inactivate Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  function handleOpenChange(nextOpen: boolean) {
    if (isChangingAvailability) return
    onOpenChange(nextOpen)
    if (!nextOpen) setInactivationScope('product')
  }

  async function onInactivate() {
    const inactivateVariants =
      hasActiveVariants && inactivationScope === 'product-and-variants'

    try {
      await changeAvailability({ type: 'inactivate', inactivateVariants })
      onSuccess(
        inactivateVariants
          ? 'Product and active Product Variants inactivated.'
          : 'Product inactivated.',
      )
      handleOpenChange(false)
    } catch {
      // Keep the dialog and selected scope in place so the user can retry.
    }
  }
}
