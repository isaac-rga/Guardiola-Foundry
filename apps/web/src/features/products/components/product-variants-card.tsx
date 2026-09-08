import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { StatusBadge } from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { updateProductVariantRequestSchema } from '@guardiola-foundry/shared-validation'
import type {
  ProductDetail,
  ProductVariant,
  ProductVariantStatus,
  UpdateProductVariantRequest
} from '@guardiola-foundry/shared-types'

const defaultFormValues: UpdateProductVariantRequest = {
  name: '',
  status: 'active'
}

export function ProductVariantsCard({
  isLoading,
  isSaving,
  loadError,
  onSave,
  product,
  variants,
}: {
  isLoading: boolean
  isSaving: boolean
  loadError: unknown
  onSave: (input: {
    currentVariant: ProductVariant | null
    values: UpdateProductVariantRequest
  }) => Promise<ProductVariant>
  product: ProductDetail
  variants: ProductVariant[]
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const form = useForm<UpdateProductVariantRequest>({
    resolver: zodResolver(updateProductVariantRequestSchema),
    defaultValues: defaultFormValues
  })
  const onSubmit = form.handleSubmit(async (values) => {
    setSubmissionError(null)
    setFeedbackMessage(null)

    try {
      const savedVariant = await onSave({ currentVariant: editingVariant, values })

      setFeedbackMessage(editingVariant ? `Saved ${savedVariant.name}.` : `Added ${savedVariant.name}.`)
      setIsDialogOpen(false)
      setEditingVariant(null)
      form.reset(defaultFormValues)
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Unable to save Product Variant.')
    }
  })
  const isProductActive = product.productStatus === 'active'

  return (
    <>
      <Card className="rounded-[1.75rem]">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle>Product Variants</CardTitle>
            <CardDescription>
              Maintain commercially named, constructively distinct Variants without treating them as Product revisions.
            </CardDescription>
          </div>
          <Button type="button" disabled={!isProductActive} onClick={() => openCreateDialog()}>
            Add Product Variant
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isProductActive ? (
            <p className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-900">
              Activate this Product before adding a Product Variant. Existing Variants remain available for maintenance.
            </p>
          ) : null}

          {feedbackMessage ? (
            <p
              className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700"
              role="status"
            >
              {feedbackMessage}
            </p>
          ) : null}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading Product Variants…</p>
          ) : loadError ? (
            <p
              className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {loadError instanceof Error ? loadError.message : 'Unable to load Product Variants.'}
            </p>
          ) : variants.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/18 px-6 py-8 text-center">
              <p className="text-sm font-medium text-foreground">No Product Variants registered yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Add a commercial Variant name when this Product has a constructively distinct realization.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell className="font-medium text-foreground">{variant.name}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={variant.status === 'active' ? 'Active' : 'Inactive'}
                        tone={variant.status === 'active' ? 'success' : 'muted'}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{variant.id}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEditDialog(variant)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVariant ? 'Edit Product Variant' : 'Add Product Variant'}</DialogTitle>
            <DialogDescription>
              {editingVariant
                ? 'Rename this Variant or change its independent availability without changing its Product ownership.'
                : `Register a constructively distinct Variant for ${product.name}. New Variants start Active.`}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form className="space-y-5" onSubmit={onSubmit}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Variant name</FormLabel>
                    <FormControl>
                      <Input {...field} autoFocus className="h-11 rounded-xl" disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {editingVariant ? (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Variant status</FormLabel>
                      <Select
                        disabled={isSaving}
                        value={field.value}
                        onValueChange={(value) => field.onChange(value as ProductVariantStatus)}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 w-full rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              {submissionError ? (
                <p
                  className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
                  role="alert"
                >
                  {submissionError}
                </p>
              ) : null}

              <DialogFooter>
                <Button type="button" variant="outline" disabled={isSaving} onClick={() => handleDialogChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving
                    ? editingVariant
                      ? 'Saving Variant…'
                      : 'Adding Variant…'
                    : editingVariant
                      ? 'Save Variant'
                      : 'Add Variant'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )

  function openCreateDialog() {
    setEditingVariant(null)
    setSubmissionError(null)
    form.reset(defaultFormValues)
    setIsDialogOpen(true)
  }

  function openEditDialog(variant: ProductVariant) {
    setEditingVariant(variant)
    setSubmissionError(null)
    form.reset({ name: variant.name, status: variant.status })
    setIsDialogOpen(true)
  }

  function handleDialogChange(open: boolean) {
    if (isSaving) {
      return
    }

    setIsDialogOpen(open)

    if (!open) {
      setEditingVariant(null)
      setSubmissionError(null)
      form.reset(defaultFormValues)
    }
  }
}
