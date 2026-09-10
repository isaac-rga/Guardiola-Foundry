import type { ProductSummary } from '@guardiola-foundry/shared-types'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTemplateProductCandidates } from '../api/bills-of-materials'

export function TemplateProductScope({
  onSelect,
  selectedProduct,
  token,
}: {
  onSelect: (product: ProductSummary | null) => void
  selectedProduct: ProductSummary | null
  token: string
}) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  return (
    <>
      <section className="rounded-xl border border-border/70 bg-muted/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Product association recommended</p>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Choose the Product this Template permanently scopes, or continue without an
              association while the construction is still reusable.
            </p>
            {selectedProduct ? (
              <p className="text-sm">
                {selectedProduct.name} · {selectedProduct.id}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            {selectedProduct ? (
              <Button type="button" variant="ghost" onClick={() => onSelect(null)}>
                Continue without Product
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => setIsPickerOpen(true)}>
              {selectedProduct ? 'Change Product' : 'Choose Product'}
            </Button>
          </div>
        </div>
      </section>

      <TemplateProductPickerDialog
        open={isPickerOpen}
        token={token}
        onOpenChange={setIsPickerOpen}
        onSelect={(product) => {
          onSelect(product)
          setIsPickerOpen(false)
        }}
      />
    </>
  )
}

export function TemplateProductPickerDialog({
  error,
  onOpenChange,
  onSelect,
  open,
  token,
}: {
  error?: Error | null
  onOpenChange: (open: boolean) => void
  onSelect: (product: ProductSummary) => void
  open: boolean
  token: string
}) {
  const productCandidates = useTemplateProductCandidates(token, open)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose Product</DialogTitle>
          <DialogDescription>
            Only active Products without another associated Template are available.
          </DialogDescription>
        </DialogHeader>
        {productCandidates.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading eligible Products...</p>
        ) : null}
        {productCandidates.loadError ? (
          <p role="alert">{productCandidates.loadError.message}</p>
        ) : null}
        {error ? <p role="alert">{error.message}</p> : null}
        {!productCandidates.isLoading &&
        !productCandidates.loadError &&
        productCandidates.candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No eligible Products available.</p>
        ) : null}
        <div className="space-y-2">
          {productCandidates.candidates.map((product) => (
            <Button
              className="h-auto w-full justify-start py-3"
              key={product.id}
              type="button"
              variant="outline"
              onClick={() => onSelect(product)}
            >
              {product.name} · {product.id}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
