import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useBlocker, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { PageHeader } from '@/components/app/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import { getProduct, updateProduct } from '@/lib/api/products'
import { updateProductRequestSchema } from '@guardiola-foundry/shared-validation'
import type {
  ListProductsResponse,
  ProductCategory,
  ProductDetail,
  ProductLifecycleStatus,
  ProductStatus,
  UpdateProductRequest,
} from '@guardiola-foundry/shared-types'

const productsQueryKey = ['products']
const unsavedChangesMessage = 'You have unsaved changes. Leave this product without saving?'

const lifecycleStatusOptions: Array<{
  label: string
  value: ProductLifecycleStatus
}> = [
  { value: 'concept', label: 'Concept' },
  { value: 'fabric-trim-selection', label: 'Fabric & Trim Selection' },
  { value: 'design-and-prototyping', label: 'Design & Prototyping' },
  { value: 'testing', label: 'Testing' },
  { value: 'approved', label: 'Approved' },
  { value: 'on-documentation', label: 'On Documentation' },
  { value: 'finished', label: 'Finished' },
]

const productStatusOptions: Array<{
  label: string
  value: ProductStatus
}> = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const productCategoryOptions: Array<{
  label: string
  value: ProductCategory
}> = [
  { value: 'dress', label: 'Dress' },
  { value: 'accessory', label: 'Accessory' },
  { value: 'other', label: 'Other' },
]

const defaultFormValues: UpdateProductRequest = {
  name: '',
  shortDescription: null,
  lifecycleStatus: 'concept',
  productStatus: 'active',
  productCategory: null,
  collectionId: null,
}

export function ProductEditPage({ productId }: { productId: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { session } = useAppShell()
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const form = useForm<UpdateProductRequest>({
    resolver: zodResolver(updateProductRequestSchema),
    defaultValues: defaultFormValues,
  })
  const productQuery = useQuery({
    queryKey: ['products', productId],
    queryFn: () => getProduct(session.token, productId),
  })

  const product = productQuery.data?.product ?? null
  const collections = productQuery.data?.collections ?? []

  useEffect(() => {
    if (!product) {
      return
    }

    form.reset(toFormValues(product))
  }, [form, product])

  useEffect(() => {
    if (form.formState.isDirty) {
      setSaveMessage(null)
    }
  }, [form.formState.isDirty])

  useBlocker({
    shouldBlockFn: () => form.formState.isDirty && !window.confirm(unsavedChangesMessage),
    enableBeforeUnload: () => form.formState.isDirty,
  })

  const updateProductMutation = useMutation({
    mutationFn: (payload: UpdateProductRequest) => updateProduct(session.token, productId, payload),
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData(['products', productId], (currentData: typeof productQuery.data) => {
        if (!currentData) {
          return currentData
        }

        return {
          ...currentData,
          product: updatedProduct,
        }
      })
      queryClient.setQueryData<ListProductsResponse>(productsQueryKey, (currentData) => {
        if (!currentData) {
          return currentData
        }

        return {
          ...currentData,
          products: currentData.products.map((currentProduct) =>
            currentProduct.id === updatedProduct.id ? toProductSummary(updatedProduct) : currentProduct
          ),
        }
      })
      form.reset(toFormValues(updatedProduct))
      setSaveMessage('Changes saved.')
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await updateProductMutation.mutateAsync(values)
  })

  if (productQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading product…</p>
  }

  if (productQuery.isError || !product) {
    return (
      <p
        className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
        role="alert"
      >
        {productQuery.error instanceof Error ? productQuery.error.message : 'Unable to load product.'}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Product workspace"
        title={product.name}
        description="Edit the saved product record directly, keep immutable registration context visible, and commit changes only when you explicitly save them."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => void navigate({ to: '/app/products' })}>
              Back to products
            </Button>
            <Button
              type="submit"
              form="product-edit-form"
              disabled={updateProductMutation.isPending || !form.formState.isDirty}
            >
              {updateProductMutation.isPending ? 'Saving changes…' : 'Save changes'}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="rounded-[1.75rem]">
          <CardHeader>
            <CardTitle>Product details</CardTitle>
            <CardDescription>
              Keep optional fields light until the record is ready for more detail, then save the full edit set explicitly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-6" id="product-edit-form" onSubmit={onSubmit}>
                <div className="grid gap-5 lg:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel>Product name</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-11 rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="productCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Category</FormLabel>
                        <Select
                          value={field.value ?? 'none'}
                          onValueChange={(value) =>
                            field.onChange(value === 'none' ? null : (value as ProductCategory))
                          }
                        >
                          <FormControl>
                            <SelectTrigger aria-label="Product Category" className="h-11 w-full rounded-xl">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No category</SelectItem>
                            {productCategoryOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="collectionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collection</FormLabel>
                        <Select
                          value={field.value === null ? 'none' : `${field.value}`}
                          onValueChange={(value) =>
                            field.onChange(value === 'none' ? null : Number(value))
                          }
                        >
                          <FormControl>
                            <SelectTrigger aria-label="Collection" className="h-11 w-full rounded-xl">
                              <SelectValue placeholder="Select a collection" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No collection</SelectItem>
                            {collections.map((collection) => (
                              <SelectItem key={collection.id} value={`${collection.id}`}>
                                {collection.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shortDescription"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel>Short product description</FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-28 rounded-xl"
                            value={field.value ?? ''}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-5 border-t border-border/70 pt-6 lg:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="lifecycleStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lifecycle Status</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => field.onChange(value as ProductLifecycleStatus)}
                        >
                          <FormControl>
                            <SelectTrigger aria-label="Lifecycle Status" className="h-11 w-full rounded-xl">
                              <SelectValue placeholder="Select lifecycle status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {lifecycleStatusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="productStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Status</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => field.onChange(value as ProductStatus)}
                        >
                          <FormControl>
                            <SelectTrigger aria-label="Product Status" className="h-11 w-full rounded-xl">
                              <SelectValue placeholder="Select product status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {productStatusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {updateProductMutation.isError ? (
                  <p
                    className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
                    role="alert"
                  >
                    {updateProductMutation.error instanceof Error
                      ? updateProductMutation.error.message
                      : 'Unable to save product changes.'}
                  </p>
                ) : null}

                {saveMessage ? (
                  <p
                    className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700"
                    role="status"
                  >
                    {saveMessage}
                  </p>
                ) : null}
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem]">
          <CardHeader>
            <CardTitle>Record metadata</CardTitle>
            <CardDescription>
              Immutable registration context stays visible here without competing with the editable fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <MetadataItem label="Product ID" value={product.id} mono />
            <MetadataItem label="Created by" value={product.createdBy.email} />
            <MetadataItem label="Created at" value={formatCreatedAt(product.createdAt)} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetadataItem({
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
      <p className="text-[0.7rem] font-medium tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className={mono ? 'font-mono text-xs text-foreground' : 'text-sm text-foreground'}>{value}</p>
    </div>
  )
}

function toFormValues(product: ProductDetail): UpdateProductRequest {
  return {
    name: product.name,
    shortDescription: product.shortDescription,
    lifecycleStatus: product.lifecycleStatus,
    productStatus: product.productStatus,
    productCategory: product.productCategory,
    collectionId: product.collection?.id ?? null,
  }
}

function toProductSummary(product: ProductDetail): ListProductsResponse['products'][number] {
  return {
    id: product.id,
    name: product.name,
    lifecycleStatus: product.lifecycleStatus,
    productStatus: product.productStatus,
    productCategory: product.productCategory,
    collection: product.collection,
    createdAt: product.createdAt,
    createdBy: product.createdBy,
  }
}

function formatCreatedAt(createdAt: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(createdAt))
}
