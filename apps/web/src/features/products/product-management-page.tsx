import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { PageHeader } from '@/components/app/page-header'
import { StatusBadge } from '@/components/app/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
import {
  useCreateProduct,
  useProductList,
} from '@/features/products/api/products'
import {
  TableFilters,
  type TableFilterCriterion,
} from '@/components/app/table-filters'
import {
  ProductTableActions,
  type ProductActionFeedback,
} from '@/features/products/components/product-table-actions'
import type {
  ProductCatalogFilters,
  ProductCatalogRouteSearch,
} from '@/features/products/product-catalog-filters'
import { findDuplicateProductName } from '@/features/products/utils/product-name-warning'
import { ApiRequestError } from '@/lib/api/transport'
import { clearAuthSession } from '@/lib/auth/session-storage'
import { createProductRequestSchema } from '@guardiola-foundry/shared-validation'
import type {
  CreateProductRequest,
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
}

export function ProductManagementPage({
  filters,
  onFiltersChange,
  onDismissDeletedFeedback,
}: {
  filters: ProductCatalogRouteSearch
  onFiltersChange: (
    changes: Partial<ProductCatalogFilters>,
    options?: { replace?: boolean },
  ) => void
  onDismissDeletedFeedback?: () => void
}) {
  const { session } = useAppShell()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(filters.search ?? '')
  const [createFeedbackMessage, setCreateFeedbackMessage] = useState<
    string | null
  >(null)
  const [actionFeedback, setActionFeedback] =
    useState<ProductActionFeedback | null>(null)
  const actionFeedbackRef = useRef<HTMLParagraphElement>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const isAdmin = session.user.role === 'admin'
  const lifecycleFilter = filters.lifecycleStatus ?? 'all'
  const productStatusFilter = filters.productStatus ?? 'all'
  const productCategoryFilter = filters.productCategory ?? 'all'
  const collectionFilter: 'all' | 'none' | `${number}` =
    filters.collection === undefined
      ? 'all'
      : filters.collection === 'none'
        ? 'none'
        : `${filters.collection}`
  const effectiveIncludeDeleted = isAdmin && filters.includeDeleted === true
  const effectiveSearch = filters.search ?? ''
  const normalizedInputSearch = searchValue.trim().replace(/\s+/g, ' ')
  const isDebouncing = normalizedInputSearch !== effectiveSearch
  const form = useForm<CreateProductRequest>({
    resolver: zodResolver(createProductRequestSchema),
    defaultValues: defaultFormValues,
  })
  const productsQuery = useProductList(session.token, {
    search: effectiveSearch || undefined,
    includeDeleted: effectiveIncludeDeleted,
  })
  const { createProduct: createProductRecord, isCreating } = useCreateProduct(
    session.token,
  )

  useEffect(() => {
    setSearchValue(filters.search ?? '')
  }, [filters.search])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (normalizedInputSearch === effectiveSearch) return
      onFiltersChange(
        { search: normalizedInputSearch || undefined },
        { replace: true },
      )
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [effectiveSearch, normalizedInputSearch, onFiltersChange])

  useEffect(() => {
    if (isAdmin || filters.includeDeleted !== true) return
    onFiltersChange({ includeDeleted: undefined }, { replace: true })
  }, [filters.includeDeleted, isAdmin, onFiltersChange])

  useEffect(() => {
    if (!actionFeedback?.focus) return
    const focusFeedback = window.setTimeout(
      () => actionFeedbackRef.current?.focus(),
      50,
    )
    return () => window.clearTimeout(focusFeedback)
  }, [actionFeedback])

  const onSubmit = form.handleSubmit(async (values) => {
    setCreateFeedbackMessage(null)
    setSubmissionError(null)
    try {
      const createdProduct = await createProductRecord(values)
      resetCreateForm()
      setCreateFeedbackMessage(`Created ${createdProduct.name}.`)
      setIsCreateDialogOpen(false)
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : 'Unable to create product.',
      )
    }
  })

  const products = [...(productsQuery.data?.products ?? [])].sort(
    compareProductsByNewestFirst,
  )
  const collections = productsQuery.data?.collections ?? []
  const createNameValue = form.watch('name')
  const createNameDuplicate = findDuplicateProductName(
    products,
    createNameValue,
  )
  const isCreatePending = isCreating
  const isUnauthorized =
    productsQuery.error instanceof ApiRequestError &&
    productsQuery.error.status === 401
  const isForbidden =
    productsQuery.error instanceof ApiRequestError &&
    productsQuery.error.status === 403
  const isUpdatingProducts =
    isDebouncing || (productsQuery.isFetching && !productsQuery.isLoading)
  const hasActiveFilters =
    searchValue.trim().length > 0 ||
    lifecycleFilter !== 'all' ||
    productStatusFilter !== 'all' ||
    productCategoryFilter !== 'all' ||
    collectionFilter !== 'all' ||
    effectiveIncludeDeleted
  const filteredProducts = products.filter((product) => {
    const matchesLifecycle =
      lifecycleFilter === 'all' || product.lifecycleStatus === lifecycleFilter
    const matchesProductStatus =
      productStatusFilter === 'all' ||
      product.productStatus === productStatusFilter
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
      matchesLifecycle &&
      matchesProductStatus &&
      matchesProductCategory &&
      matchesCollection
    )
  })

  const filterCriteria: TableFilterCriterion[] = [
    {
      key: 'lifecycleStatus',
      label: 'Lifecycle status',
      value: filters.lifecycleStatus,
      valueLabel: filters.lifecycleStatus
        ? toLifecycleStatusLabel(filters.lifecycleStatus)
        : undefined,
      options: lifecycleStatusOptions,
      onChange: (value) =>
        onFiltersChange({
          lifecycleStatus: lifecycleStatusOptions.find(
            (option) => option.value === value,
          )?.value,
        }),
    },
    {
      key: 'productStatus',
      label: 'Product status',
      value: filters.productStatus,
      valueLabel: filters.productStatus
        ? toProductStatusLabel(filters.productStatus)
        : undefined,
      options: productStatusOptions,
      onChange: (value) =>
        onFiltersChange({
          productStatus: productStatusOptions.find(
            (option) => option.value === value,
          )?.value,
        }),
    },
    {
      key: 'productCategory',
      label: 'Product category',
      value: filters.productCategory,
      valueLabel: filters.productCategory
        ? toProductCategoryLabel(
            filters.productCategory === 'none' ? null : filters.productCategory,
          )
        : undefined,
      options: [
        { value: 'none', label: 'No category' },
        ...productCategoryOptions,
      ],
      onChange: (value) =>
        onFiltersChange({
          productCategory:
            value === 'none'
              ? 'none'
              : productCategoryOptions.find((option) => option.value === value)
                  ?.value,
        }),
    },
    {
      key: 'collection',
      label: 'Collection',
      value: filters.collection === undefined ? undefined : collectionFilter,
      valueLabel:
        filters.collection === undefined
          ? undefined
          : filters.collection === 'none'
            ? 'No collection'
            : (collections.find(
                (collection) => collection.id === filters.collection,
              )?.name ?? 'Unknown collection'),
      searchable: true,
      options: [
        { value: 'none', label: 'No collection' },
        ...collections.map((collection) => ({
          value: `${collection.id}`,
          label: collection.name,
        })),
      ],
      onChange: (value) =>
        onFiltersChange({
          collection:
            value === undefined
              ? undefined
              : value === 'none'
                ? 'none'
                : Number(value),
        }),
    },
    ...(isAdmin
      ? [
          {
            key: 'includeDeleted',
            label: 'Include deleted',
            additive: true,
            value: effectiveIncludeDeleted ? 'true' : undefined,
            onChange: (value: string | undefined) =>
              onFiltersChange({
                includeDeleted: value === 'true' || undefined,
              }),
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Work from the full visible product set, find records quickly by name, and keep lifecycle and registration context compact in one operational list."
        action={
          <Button onClick={() => setIsCreateDialogOpen(true)} type="button">
            Create product
          </Button>
        }
      />

      <Card className="rounded-[1.75rem]">
        <CardContent className="space-y-4">
          {filters.deletedProductName ? (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3"
              role="status"
            >
              <p className="text-sm text-emerald-700">
                Deleted {filters.deletedProductName}.
              </p>
              {onDismissDeletedFeedback ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDismissDeletedFeedback}
                >
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

          {actionFeedback ? (
            <p
              ref={actionFeedbackRef}
              className={
                actionFeedback.type === 'success'
                  ? 'rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700'
                  : 'rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive'
              }
              role={actionFeedback.type === 'success' ? 'status' : 'alert'}
              tabIndex={actionFeedback.focus ? -1 : undefined}
            >
              {actionFeedback.message}
            </p>
          ) : null}

          {productsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading products…</p>
          ) : null}

          {isUpdatingProducts ? (
            <p className="text-sm text-muted-foreground" role="status">
              Updating products…
            </p>
          ) : null}

          {productsQuery.isError && !isUnauthorized && !isForbidden ? (
            <p
              className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {productsQuery.error instanceof Error
                ? productsQuery.error.message
                : 'Unable to load products.'}
            </p>
          ) : null}

          <div className="space-y-3">
            <TableFilters
              criteria={filterCriteria}
              onClearAll={resetFilters}
              search={{
                label: 'Search by product name',
                placeholder: 'Search products by name',
                value: searchValue,
                onChange: setSearchValue,
              }}
            />

            {isUnauthorized ? (
              <div
                className="rounded-[1.5rem] border border-destructive/20 bg-destructive/8 px-6 py-8 text-center"
                role="alert"
              >
                <p className="text-sm font-medium text-destructive">
                  Your session has expired.
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Sign in again to continue working with Products.
                </p>
                <Button asChild className="mt-4" variant="outline">
                  <Link to="/sign-in" onClick={clearAuthSession}>
                    Sign in again
                  </Link>
                </Button>
              </div>
            ) : isForbidden ? (
              <div
                className="rounded-[1.5rem] border border-destructive/20 bg-destructive/8 px-6 py-8 text-center"
                role="alert"
              >
                <p className="text-sm font-medium text-destructive">
                  You do not have permission to view this Product catalog
                  configuration.
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Clear all filters to return to the safe default catalog.
                </p>
                <Button
                  className="mt-4"
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                >
                  Clear all
                </Button>
              </div>
            ) : productsQuery.isLoading ||
              productsQuery.isError ||
              (isUpdatingProducts &&
                products.length === 0) ? null : products.length === 0 &&
              hasActiveFilters ? (
              <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/18 px-6 py-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  No products match the current search and filters.
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Clear search or filters to broaden the visible set.
                </p>
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/18 px-6 py-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  No products registered yet.
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Start with a product name and let the workflow default to
                  Concept and Active.
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/18 px-6 py-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  No products match the current search and filters.
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Clear search or filters to broaden the visible set.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Collection</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lifecycle</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="py-3 align-top whitespace-normal">
                        <Link
                          to="/app/products/$productId"
                          params={{ productId: product.id }}
                          search={{ deletedProductName: undefined }}
                          className="block text-sm font-medium leading-5 text-foreground underline-offset-4 hover:underline"
                        >
                          {product.name}
                        </Link>
                      </TableCell>
                      <TableCell className="py-3 align-top whitespace-normal">
                        <StatusBadge
                          label={
                            product.collection
                              ? `Collection ${product.collection.name}`
                              : 'No collection'
                          }
                          tone="muted"
                        />
                      </TableCell>
                      <TableCell className="py-3 align-top whitespace-normal">
                        <StatusBadge
                          label={toProductCategoryLabel(
                            product.productCategory,
                          )}
                          tone="muted"
                        />
                      </TableCell>
                      <TableCell className="py-3 align-top whitespace-normal">
                        <div className="flex flex-wrap gap-1.5">
                          {product.deletedAt ? (
                            <StatusBadge label="Deleted" tone="warning" />
                          ) : null}
                          <StatusBadge
                            label={toProductStatusLabel(product.productStatus)}
                            tone={
                              product.productStatus === 'active'
                                ? 'success'
                                : 'muted'
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-3 align-top whitespace-normal">
                        <div className="flex flex-wrap gap-1.5">
                          <StatusBadge
                            label={toLifecycleStatusLabel(
                              product.lifecycleStatus,
                            )}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-3 align-top whitespace-normal">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-5 text-foreground">
                            {product.createdBy.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCreatedAt(product.createdAt)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-right align-top">
                        <ProductTableActions
                          focusFeedbackOnAvailabilitySuccess={
                            productStatusFilter !== 'all'
                          }
                          isAdmin={isAdmin}
                          product={product}
                          token={session.token}
                          onFeedback={setActionFeedback}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={handleCreateDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create product</DialogTitle>
            <DialogDescription>
              Register a bridal-design product with the minimum required input,
              then refine it in later slices.
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
                      <Input
                        {...field}
                        className="h-11 rounded-xl"
                        autoFocus
                        disabled={isCreatePending}
                      />
                    </FormControl>
                    {createNameDuplicate ? (
                      <p className="text-sm text-amber-700" role="status">
                        Active product {createNameDuplicate.name} already uses
                        this name. You can still create another record.
                      </p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-5">
                <FormField
                  control={form.control}
                  name="lifecycleStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lifecycle Status</FormLabel>
                      <Select
                        disabled={isCreatePending}
                        value={field.value}
                        onValueChange={(value) =>
                          field.onChange(value as ProductLifecycleStatus)
                        }
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
    if (isForbidden && !effectiveSearch && !effectiveIncludeDeleted) {
      void productsQuery.refetch()
    }
    setSearchValue('')
    onFiltersChange({
      search: undefined,
      lifecycleStatus: undefined,
      productStatus: undefined,
      productCategory: undefined,
      collection: undefined,
      includeDeleted: undefined,
    })
  }
}

function compareProductsByNewestFirst(
  left: ProductSummary,
  right: ProductSummary,
) {
  return Date.parse(right.createdAt) - Date.parse(left.createdAt)
}

function toLifecycleStatusLabel(status: ProductLifecycleStatus) {
  return (
    lifecycleStatusOptions.find((option) => option.value === status)?.label ??
    status
  )
}

function toProductStatusLabel(status: ProductStatus) {
  return (
    productStatusOptions.find((option) => option.value === status)?.label ??
    status
  )
}

function toProductCategoryLabel(category: ProductCategory | null) {
  if (category === null) {
    return 'No category'
  }

  return (
    productCategoryOptions.find((option) => option.value === category)?.label ??
    category
  )
}

function formatCreatedAt(createdAt: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(createdAt))
}
