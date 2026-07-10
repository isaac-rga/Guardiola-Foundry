import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppShell } from '@/features/app-shell/authenticated-app-shell'
import { productListQueryKey } from '@/features/products/query-keys'
import { findDuplicateProductName } from '@/features/products/utils/product-name-warning'
import { createProduct, listProducts } from '@/lib/api/products'
import { createProductRequestSchema } from '@guardiola-foundry/shared-validation'
import type {
  CreateProductRequest,
  ListProductsResponse,
  ProductCategory,
  ProductLifecycleStatus,
  ProductStatus,
  ProductSummary,
} from '@guardiola-foundry/shared-types'

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

const defaultFormValues: CreateProductRequest = {
  name: '',
  lifecycleStatus: 'concept',
  productStatus: 'active',
}

export function ProductManagementPage({
  deletedProductName,
  onDismissDeletedFeedback,
}: {
  deletedProductName?: string
  onDismissDeletedFeedback?: () => void
}) {
  const queryClient = useQueryClient()
  const { session } = useAppShell()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [lifecycleFilter, setLifecycleFilter] = useState<'all' | ProductLifecycleStatus>('all')
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | ProductStatus>('all')
  const [productCategoryFilter, setProductCategoryFilter] = useState<
    'all' | ProductCategory | 'none'
  >('all')
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'none' | `${number}`>('all')
  const [includeDeletedFilter, setIncludeDeletedFilter] = useState(false)
  const [createFeedbackMessage, setCreateFeedbackMessage] = useState<string | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const isAdmin = session.user.role === 'admin'
  const effectiveIncludeDeleted = isAdmin && includeDeletedFilter
  const productsQueryKey = productListQueryKey(effectiveIncludeDeleted)
  const form = useForm<CreateProductRequest>({
    resolver: zodResolver(createProductRequestSchema),
    defaultValues: defaultFormValues,
  })
  const productsQuery = useQuery({
    queryKey: productsQueryKey,
    queryFn: () => listProducts(session.token, { includeDeleted: effectiveIncludeDeleted }),
  })
  const createProductMutation = useMutation({
    mutationFn: (payload: CreateProductRequest) => createProduct(session.token, payload),
    onSuccess: (createdProduct) => {
      queryClient.setQueryData<ListProductsResponse>(productsQueryKey, (currentData) => {
        if (!currentData) {
          return {
            products: [createdProduct],
            collections: [],
          }
        }

        return {
          ...currentData,
          products: [createdProduct, ...currentData.products],
        }
      })

      resetCreateForm()
      setCreateFeedbackMessage(`Created ${createdProduct.name}.`)
      setSubmissionError(null)
      setIsCreateDialogOpen(false)
    },
    onError: (error) => {
      setSubmissionError(error instanceof Error ? error.message : 'Unable to create product.')
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setCreateFeedbackMessage(null)
    setSubmissionError(null)
    await createProductMutation.mutateAsync(values)
  })

  const products = [...(productsQuery.data?.products ?? [])].sort(compareProductsByNewestFirst)
  const collections = productsQuery.data?.collections ?? []
  const createNameValue = form.watch('name')
  const createNameDuplicate = findDuplicateProductName(products, createNameValue)
  const isCreatePending = createProductMutation.isPending
  const normalizedSearchValue = searchValue.trim().toLocaleLowerCase()
  const hasActiveFilters =
    normalizedSearchValue.length > 0 ||
    lifecycleFilter !== 'all' ||
    productStatusFilter !== 'all' ||
    productCategoryFilter !== 'all' ||
    collectionFilter !== 'all' ||
    effectiveIncludeDeleted
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      normalizedSearchValue.length === 0 ||
      product.name.toLocaleLowerCase().includes(normalizedSearchValue)
    const matchesLifecycle =
      lifecycleFilter === 'all' || product.lifecycleStatus === lifecycleFilter
    const matchesProductStatus =
      productStatusFilter === 'all' || product.productStatus === productStatusFilter
    const matchesProductCategory =
      productCategoryFilter === 'all'
        ? true
        : productCategoryFilter === 'none'
          ? product.productCategory === null
          : product.productCategory === productCategoryFilter
    const matchesCollection =
      collectionFilter === 'all'
        ? true
        : collectionFilter === 'none'
          ? product.collection === null
          : product.collection?.id === Number(collectionFilter)

    return (
      matchesSearch &&
      matchesLifecycle &&
      matchesProductStatus &&
      matchesProductCategory &&
      matchesCollection
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Product lifecycle"
        title="Products"
        description="Work from the full visible product set, find records quickly by name, and keep lifecycle and registration context compact in one operational list."
        badges={[
          { label: 'Newest first', variant: 'secondary' },
          { label: 'Client-side filters live', variant: 'outline' },
        ]}
        action={
          <Button onClick={() => setIsCreateDialogOpen(true)} type="button">
            Create product
          </Button>
        }
      />

      <Card className="rounded-[1.75rem]">
        <CardHeader>
          <CardTitle>Product registrations</CardTitle>
          <CardDescription>
            Search by product name first, then narrow the loaded working set with single-select filters for state, category, and collection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deletedProductName ? (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3"
              role="status"
            >
              <p className="text-sm text-emerald-700">Deleted {deletedProductName}.</p>
              {onDismissDeletedFeedback ? (
                <Button type="button" variant="ghost" size="sm" onClick={onDismissDeletedFeedback}>
                  Dismiss
                </Button>
              ) : null}
            </div>
          ) : null}

          {createFeedbackMessage ? (
            <p
              className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700"
              role="status"
            >
              {createFeedbackMessage}
            </p>
          ) : null}

          {productsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading products…</p>
          ) : null}

          {productsQuery.isError ? (
            <p
              className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {productsQuery.error instanceof Error
                ? productsQuery.error.message
                : 'Unable to load products.'}
            </p>
          ) : null}

          {products.length > 0 || isAdmin ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-muted/10 p-2">
                <div className="min-w-[22rem] flex-1 sm:max-w-[28rem] sm:flex-none">
                  <label
                    className="sr-only"
                    htmlFor="product-name-search"
                  >
                    Search by product name
                  </label>
                  <div className="relative">
                    <SearchIcon
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="product-name-search"
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      className="h-9 rounded-lg pr-2.5 pl-8 text-sm"
                      placeholder="Search products by name"
                      type="search"
                    />
                  </div>
                </div>

                <div className="ml-auto flex flex-1 flex-wrap items-center justify-end gap-2 sm:flex-none">
                  <FilterSelect
                    label="Lifecycle Status"
                    value={lifecycleFilter}
                    placeholder="All lifecycle statuses"
                    onValueChange={(value) =>
                      setLifecycleFilter(value as 'all' | ProductLifecycleStatus)
                    }
                    options={[
                      { value: 'all', label: 'All lifecycle statuses' },
                      ...lifecycleStatusOptions,
                    ]}
                  />

                  <FilterSelect
                    label="Product Status"
                    value={productStatusFilter}
                    placeholder="All product statuses"
                    onValueChange={(value) => setProductStatusFilter(value as 'all' | ProductStatus)}
                    options={[{ value: 'all', label: 'All product statuses' }, ...productStatusOptions]}
                  />

                  <FilterSelect
                    label="Product Category"
                    value={productCategoryFilter}
                    placeholder="All product categories"
                    onValueChange={(value) =>
                      setProductCategoryFilter(value as 'all' | ProductCategory | 'none')
                    }
                    options={[
                      { value: 'all', label: 'All product categories' },
                      { value: 'none', label: 'No category' },
                      ...productCategoryOptions,
                    ]}
                  />

                  <FilterSelect
                    label="Collection"
                    value={collectionFilter}
                    placeholder="All collections"
                    onValueChange={(value) => setCollectionFilter(value as 'all' | 'none' | `${number}`)}
                    options={[
                      { value: 'all', label: 'All collections' },
                      { value: 'none', label: 'No collection' },
                      ...collections.map((collection) => ({
                        value: `${collection.id}`,
                        label: collection.name,
                      })),
                    ]}
                  />

                  {isAdmin ? (
                    <Button
                      type="button"
                      variant={effectiveIncludeDeleted ? 'secondary' : 'outline'}
                      size="sm"
                      aria-pressed={effectiveIncludeDeleted}
                      onClick={() => setIncludeDeletedFilter((currentValue) => !currentValue)}
                    >
                      {effectiveIncludeDeleted ? 'Including deleted' : 'Include deleted'}
                    </Button>
                  ) : null}
                </div>

                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    aria-label="Clear search and filters"
                  >
                    Clear
                  </Button>
                ) : null}
              </div>

              {products.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/18 px-6 py-10 text-center">
                  <p className="text-sm font-medium text-foreground">No products registered yet.</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Start with a product name and let the workflow default to Concept and Active.
                  </p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/18 px-6 py-10 text-center">
                  <p className="text-sm font-medium text-foreground">
                    No products match the current search and filters.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Adjust the search term or select different filters to broaden the visible set.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Record</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="py-4">
                          <div className="space-y-2">
                            <Link
                              to="/app/products/$productId"
                              params={{ productId: product.id }}
                              search={{ deletedProductName: undefined }}
                              className="font-medium text-foreground underline-offset-4 hover:underline"
                            >
                              {product.name}
                            </Link>
                            <div className="flex flex-wrap gap-2">
                              <StatusBadge
                                label={
                                  product.collection
                                    ? `Collection ${product.collection.name}`
                                    : 'No collection'
                                }
                                tone="muted"
                              />
                              <StatusBadge
                                label={toProductCategoryLabel(product.productCategory)}
                                tone="muted"
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <p className="text-[0.65rem] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                                Status
                              </p>
                              {product.deletedAt ? (
                                <StatusBadge label="Deleted" tone="warning" />
                              ) : null}
                              <StatusBadge
                                label={toProductStatusLabel(product.productStatus)}
                                tone={product.productStatus === 'active' ? 'success' : 'muted'}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-[0.65rem] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                                Lifecycle
                              </p>
                              <StatusBadge label={toLifecycleStatusLabel(product.lifecycleStatus)} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                              {product.createdBy.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatCreatedAt(product.createdAt)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <p className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
                              {product.id}
                            </p>
                            <p className="text-xs text-muted-foreground">Stable short ID</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ) : !productsQuery.isLoading && !productsQuery.isError ? (
            <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/18 px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">No products registered yet.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Start with a product name and let the workflow default to Concept and Active.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={handleCreateDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create product</DialogTitle>
            <DialogDescription>
              Register a bridal-design product with the minimum required input, then refine it in later slices.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form className="space-y-5" onSubmit={onSubmit}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product name</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 rounded-xl" autoFocus disabled={isCreatePending} />
                    </FormControl>
                    {createNameDuplicate ? (
                      <p className="text-sm text-amber-700" role="status">
                        Active product {createNameDuplicate.name} already uses this name. You can
                        still create another record.
                      </p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="lifecycleStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lifecycle Status</FormLabel>
                      <Select
                        disabled={isCreatePending}
                        value={field.value}
                        onValueChange={(value) => field.onChange(value as ProductLifecycleStatus)}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 w-full rounded-xl">
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
                        disabled={isCreatePending}
                        value={field.value}
                        onValueChange={(value) => field.onChange(value as ProductStatus)}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 w-full rounded-xl">
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

              {submissionError ? (
                <p
                  className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
                  role="alert"
                >
                  {submissionError}
                </p>
              ) : null}

              {isCreatePending ? (
                <p className="text-sm text-muted-foreground" role="status">
                  Creating product…
                </p>
              ) : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isCreatePending}
                  onClick={() => handleCreateDialogChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatePending}>
                  {isCreatePending ? 'Creating product…' : 'Create product'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )

  function handleCreateDialogChange(open: boolean) {
    if (isCreatePending) {
      return
    }

    setIsCreateDialogOpen(open)

    if (!open) {
      resetCreateForm()
      setSubmissionError(null)
    }
  }

  function resetCreateForm() {
    form.reset(defaultFormValues)
  }

  function resetFilters() {
    setSearchValue('')
    setLifecycleFilter('all')
    setProductStatusFilter('all')
    setProductCategoryFilter('all')
    setCollectionFilter('all')
    setIncludeDeletedFilter(false)
  }
}

type FilterSelectProps = {
  label: string
  onValueChange: (value: string) => void
  options: Array<{
    label: string
    value: string
  }>
  placeholder: string
  value: string
}

function FilterSelect({ label, onValueChange, options, placeholder, value }: FilterSelectProps) {
  return (
    <div className="min-w-[10rem] flex-1 sm:flex-none">
      <label className="sr-only">
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger aria-label={label} className="h-9 w-full min-w-[10rem] rounded-lg px-2.5" size="sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function compareProductsByNewestFirst(left: ProductSummary, right: ProductSummary) {
  return Date.parse(right.createdAt) - Date.parse(left.createdAt)
}

function toLifecycleStatusLabel(status: ProductLifecycleStatus) {
  return lifecycleStatusOptions.find((option) => option.value === status)?.label ?? status
}

function toProductStatusLabel(status: ProductStatus) {
  return productStatusOptions.find((option) => option.value === status)?.label ?? status
}

function toProductCategoryLabel(category: ProductCategory | null) {
  if (category === null) {
    return 'No category'
  }

  return productCategoryOptions.find((option) => option.value === category)?.label ?? category
}

function formatCreatedAt(createdAt: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(createdAt))
}
