import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { createProduct, listProducts } from '@/lib/api/products'
import { createProductRequestSchema } from '@guardiola-foundry/shared-validation'
import type {
  CreateProductRequest,
  ListProductsResponse,
  ProductLifecycleStatus,
  ProductStatus,
} from '@guardiola-foundry/shared-types'

const productsQueryKey = ['products']

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

const defaultFormValues: CreateProductRequest = {
  name: '',
  lifecycleStatus: 'concept',
  productStatus: 'active',
}

export function ProductManagementPage() {
  const queryClient = useQueryClient()
  const { session } = useAppShell()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const form = useForm<CreateProductRequest>({
    resolver: zodResolver(createProductRequestSchema),
    defaultValues: defaultFormValues,
  })
  const productsQuery = useQuery({
    queryKey: productsQueryKey,
    queryFn: () => listProducts(session.token),
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
      setSubmissionError(null)
      setIsCreateDialogOpen(false)
    },
    onError: (error) => {
      setSubmissionError(error instanceof Error ? error.message : 'Unable to create product.')
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmissionError(null)
    await createProductMutation.mutateAsync(values)
  })

  const products = productsQuery.data?.products ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Product lifecycle"
        title="Products"
        description="Register bridal-design products quickly, keep the core lifecycle states explicit, and anchor each record with stable creation metadata."
        badges={[
          { label: 'Create path live', variant: 'secondary' },
          { label: 'Collection reference data ready', variant: 'outline' },
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
            New products appear here immediately after a successful create so the workspace stays grounded in persisted records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-muted/18 px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">No products registered yet.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Start with a product name and let the workflow default to Concept and Active.
              </p>
            </div>
          ) : null}

          {products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Lifecycle Status</TableHead>
                  <TableHead>Product Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Product ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{product.name}</p>
                        {product.collection ? (
                          <p className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
                            Collection {product.collection.name}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">No collection</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={toLifecycleStatusLabel(product.lifecycleStatus)} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={toProductStatusLabel(product.productStatus)}
                        tone={product.productStatus === 'active' ? 'success' : 'muted'}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{product.createdBy.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCreatedAt(product.createdAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
                      {product.id}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                      <Input {...field} className="h-11 rounded-xl" autoFocus />
                    </FormControl>
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCreateDialogChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createProductMutation.isPending}>
                  {createProductMutation.isPending ? 'Creating product…' : 'Create product'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )

  function handleCreateDialogChange(open: boolean) {
    setIsCreateDialogOpen(open)

    if (!open) {
      resetCreateForm()
      setSubmissionError(null)
    }
  }

  function resetCreateForm() {
    form.reset(defaultFormValues)
  }
}

function toLifecycleStatusLabel(status: ProductLifecycleStatus) {
  return lifecycleStatusOptions.find((option) => option.value === status)?.label ?? status
}

function toProductStatusLabel(status: ProductStatus) {
  return productStatusOptions.find((option) => option.value === status)?.label ?? status
}

function formatCreatedAt(createdAt: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(createdAt))
}
