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
import { productDetailQueryKey, productListQueryKey } from '@/features/products/query-keys'
import { findDuplicateProductName } from '@/features/products/utils/product-name-warning'
import {
  deleteProduct,
  getProduct,
  listProducts,
  restoreProduct,
  updateProduct,
  type UpdateProductInput,
} from '@/lib/api/products'
import { updateProductRequestSchema } from '@guardiola-foundry/shared-validation'
import type {
  DeletedProductDetail,
  ListProductsResponse,
  ProductCategory,
  ProductDetail,
  ProductLifecycleStatus,
  ProductStatus,
  UpdateProductRequest,
} from '@guardiola-foundry/shared-types'

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
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [imageInputKey, setImageInputKey] = useState(0)
  const [isNavigatingAfterDelete, setIsNavigatingAfterDelete] = useState(false)
  const productQueryKey = productDetailQueryKey(productId)
  const defaultProductsQueryKey = productListQueryKey(false)
  const form = useForm<UpdateProductRequest>({
    resolver: zodResolver(updateProductRequestSchema),
    defaultValues: defaultFormValues,
  })
  const productQuery = useQuery({
    queryKey: productQueryKey,
    queryFn: () => getProduct(session.token, productId),
  })
  const productsQuery = useQuery({
    queryKey: defaultProductsQueryKey,
    queryFn: () => listProducts(session.token),
  })

  const product = productQuery.data?.state === 'active' ? productQuery.data.product : null
  const deletedProduct = productQuery.data?.state === 'deleted' ? productQuery.data.product : null
  const collections = productQuery.data?.state === 'active' ? productQuery.data.collections : []
  const hasPendingImageChanges = selectedImageFile !== null || removeImage
  const hasPendingChanges = form.formState.isDirty || hasPendingImageChanges

  useEffect(() => {
    if (!product) {
      return
    }

    form.reset(toFormValues(product))
    setSelectedImageFile(null)
    setRemoveImage(false)
    setImageInputKey((currentValue) => currentValue + 1)
  }, [form, product])

  useEffect(() => {
    if (hasPendingChanges) {
      setSaveMessage(null)
    }
  }, [hasPendingChanges])

  useBlocker({
    shouldBlockFn: () =>
      !isNavigatingAfterDelete && hasPendingChanges && !window.confirm(unsavedChangesMessage),
    enableBeforeUnload: () => hasPendingChanges,
  })

  const updateProductMutation = useMutation({
    mutationFn: (payload: UpdateProductInput) => updateProduct(session.token, productId, payload),
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData(productQueryKey, (currentData: typeof productQuery.data) => {
        if (!currentData) {
          return currentData
        }

        return {
          ...currentData,
          product: updatedProduct,
        }
      })
      updateProductInListCaches(queryClient, updatedProduct)
      form.reset(toFormValues(updatedProduct))
      setSelectedImageFile(null)
      setRemoveImage(false)
      setImageInputKey((currentValue) => currentValue + 1)
      setSaveMessage('Changes saved.')
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await updateProductMutation.mutateAsync({
      ...values,
      imageFile: selectedImageFile,
      removeImage,
    })
  })
  const restoreProductMutation = useMutation({
    mutationFn: () => restoreProduct(session.token, productId),
    onSuccess: async () => {
      setSaveMessage('Product restored. Review the record and save any follow-up changes when ready.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productQueryKey }),
        queryClient.invalidateQueries({ queryKey: productListQueryKey(false) }),
        queryClient.invalidateQueries({ queryKey: productListQueryKey(true) }),
      ])
    },
  })
  const deleteProductMutation = useMutation({
    mutationFn: () => deleteProduct(session.token, productId),
    onSuccess: async () => {
      if (!product) {
        return
      }

      queryClient.removeQueries({ queryKey: productQueryKey })
      queryClient.setQueryData<ListProductsResponse>(defaultProductsQueryKey, (currentData) => {
        if (!currentData) {
          return currentData
        }

        return {
          ...currentData,
          products: currentData.products.filter((currentProduct) => currentProduct.id !== productId),
        }
      })
      setIsNavigatingAfterDelete(true)
      await queryClient.invalidateQueries({ queryKey: productListQueryKey(true) })
      await navigate({
        to: '/app/products',
        search: {
          deletedProductName: product.name,
        },
      })
    },
  })
  const nameValue = form.watch('name')
  const duplicateNameMatch = findDuplicateProductName(productsQuery.data?.products ?? [], nameValue, {
    excludeProductId: productId,
  })
  const isSaving = updateProductMutation.isPending
  const isRestoring = restoreProductMutation.isPending
  const isDeleting = deleteProductMutation.isPending
  const isMutating = isSaving || isRestoring || isDeleting

  if (productQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading product…</p>
  }

  if (deletedProduct) {
    return (
      <DeletedProductPage
        product={deletedProduct}
        isAdmin={session.user.role === 'admin'}
        isRestoring={isRestoring}
        onBackToProducts={() =>
          navigate({
            to: '/app/products',
            search: {
              deletedProductName: undefined,
            },
          })
        }
        onRestore={() => void restoreProductMutation.mutateAsync()}
      />
    )
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
            <Button
              type="button"
              variant="destructive"
              disabled={isMutating}
              onClick={() => {
                if (!window.confirm(`Delete ${product.name}? This removes it from normal product views.`)) {
                  return
                }

                void deleteProductMutation.mutateAsync()
              }}
            >
              {isDeleting ? 'Deleting product…' : 'Delete'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isMutating}
              onClick={() =>
                void navigate({
                  to: '/app/products',
                  search: {
                    deletedProductName: undefined,
                  },
                })
              }
            >
              Back to products
            </Button>
            <Button
              type="submit"
              form="product-edit-form"
              disabled={isMutating || !hasPendingChanges}
            >
              {isSaving ? 'Saving changes…' : 'Save changes'}
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
                          <Input {...field} className="h-11 rounded-xl" disabled={isMutating} />
                        </FormControl>
                        {duplicateNameMatch ? (
                          <p className="text-sm text-amber-700" role="status">
                            Active product {duplicateNameMatch.name} already uses this name. You
                            can still save this product.
                          </p>
                        ) : null}
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
                          disabled={isMutating}
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
                          disabled={isMutating}
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
                            disabled={isMutating}
                            value={field.value ?? ''}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-muted/10 p-4 lg:col-span-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">Product image</p>
                      <p className="text-sm text-muted-foreground">
                        Keep image handling light in this first slice: upload one primary image on the Product page, or remove it to return to a true no-image state.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground" htmlFor="product-image">
                        Upload image
                      </label>
                      <Input
                        key={imageInputKey}
                        accept="image/png,image/jpeg,image/webp"
                        className="rounded-xl"
                        disabled={isMutating}
                        id="product-image"
                        type="file"
                        onChange={(event) => {
                          const nextFile = event.target.files?.[0] ?? null

                          setSelectedImageFile(nextFile)
                          setRemoveImage(false)
                        }}
                      />
                    </div>

                    <div className="space-y-2 rounded-xl border border-dashed border-border/70 bg-background/80 p-4">
                      <p className="text-sm font-medium text-foreground">Current image state</p>
                      {selectedImageFile ? (
                        <p className="text-sm text-foreground">
                          Selected to upload on save: {selectedImageFile.name}
                        </p>
                      ) : removeImage ? (
                        <p className="text-sm text-muted-foreground">Current image will be removed on save.</p>
                      ) : product.image ? (
                        <p className="text-sm text-foreground">Saved image: {product.image.fileName}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No product image uploaded.</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {selectedImageFile ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isMutating}
                          onClick={() => {
                            setSelectedImageFile(null)
                            setImageInputKey((currentValue) => currentValue + 1)
                          }}
                        >
                          Clear selected image
                        </Button>
                      ) : null}

                      {product.image && !removeImage && !selectedImageFile ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isMutating}
                          onClick={() => {
                            setSelectedImageFile(null)
                            setRemoveImage(true)
                            setImageInputKey((currentValue) => currentValue + 1)
                          }}
                        >
                          Remove image
                        </Button>
                      ) : null}

                      {removeImage ? (
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isMutating}
                          onClick={() => setRemoveImage(false)}
                        >
                          Keep current image
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 border-t border-border/70 pt-6 lg:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="lifecycleStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lifecycle Status</FormLabel>
                        <Select
                          disabled={isMutating}
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
                          disabled={isMutating}
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

                {isSaving ? (
                  <p className="text-sm text-muted-foreground" role="status">
                    Saving product changes…
                  </p>
                ) : null}

                {isDeleting ? (
                  <p className="text-sm text-muted-foreground" role="status">
                    Deleting product…
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

function DeletedProductPage({
  isAdmin,
  isRestoring,
  onBackToProducts,
  onRestore,
  product,
}: {
  isAdmin: boolean
  isRestoring: boolean
  onBackToProducts: () => void
  onRestore: () => void
  product: DeletedProductDetail
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Product workspace"
        title={product.name}
        description="This Product has been removed from normal product views. It stays read-only until an admin restores it."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <Button type="button" disabled={isRestoring} onClick={onRestore}>
                {isRestoring ? 'Restoring product…' : 'Restore'}
              </Button>
            ) : null}
            <Button type="button" variant="outline" disabled={isRestoring} onClick={onBackToProducts}>
              Back to products
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="rounded-[1.75rem]">
          <CardHeader>
            <CardTitle>Deleted product</CardTitle>
            <CardDescription>
              This record is preserved for recovery, but this page is read-only in the current slice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p
              className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-900"
              role="status"
            >
              {isAdmin
                ? 'This Product has been removed from normal views. Restore it to return the record to editable mode with Product Status set to Inactive.'
                : 'This Product has been removed from normal views. An admin is required for recovery.'}
            </p>

            <div className="grid gap-5 lg:grid-cols-2">
              <MetadataItem label="Product name" value={product.name} />
              <MetadataItem label="Product status" value={product.productStatus} />
              <MetadataItem label="Lifecycle status" value={product.lifecycleStatus} />
              <MetadataItem label="Deleted at" value={formatDeletedAt(product.deletedAt)} />
              <MetadataItem
                label="Short description"
                value={product.shortDescription ?? 'No short description saved.'}
              />
              <MetadataItem
                label="Current image state"
                value={product.image ? product.image.fileName : 'No product image uploaded.'}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem]">
          <CardHeader>
            <CardTitle>Record metadata</CardTitle>
            <CardDescription>
              Immutable registration context stays visible even after the Product leaves normal working views.
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
    deletedAt: product.deletedAt,
    productCategory: product.productCategory,
    collection: product.collection,
    createdAt: product.createdAt,
    createdBy: product.createdBy,
  }
}

function updateProductInListCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  updatedProduct: ProductDetail
) {
  for (const includeDeleted of [false, true]) {
    queryClient.setQueryData<ListProductsResponse>(productListQueryKey(includeDeleted), (currentData) => {
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
  }
}

function formatCreatedAt(createdAt: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(createdAt))
}

function formatDeletedAt(deletedAt: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(deletedAt))
}
