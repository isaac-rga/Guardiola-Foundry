import { Outlet, createFileRoute } from '@tanstack/react-router'
import type { ProductCatalogRouteSearch } from '@/features/products/product-catalog-filters'
import {
  productCategorySchema,
  productLifecycleStatusSchema,
  productStatusSchema,
} from '@guardiola-foundry/shared-validation'
import { z } from 'zod'

const productCatalogSearchSchema = z.object({
  deletedProductName: z.string().min(1).optional().catch(undefined),
  filterPrototype: z.literal('A').optional().catch(undefined),
  search: z
    .string()
    .trim()
    .max(200)
    .refine((value) => value.length > 0)
    .optional()
    .catch(undefined),
  lifecycleStatus: productLifecycleStatusSchema.optional().catch(undefined),
  productStatus: productStatusSchema.optional().catch(undefined),
  productCategory: z
    .union([productCategorySchema, z.literal('none')])
    .optional()
    .catch(undefined),
  collection: z.preprocess(
    (value) => {
      if (value === 'none' || typeof value === 'number') return value
      if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
      return value
    },
    z
      .union([z.literal('none'), z.number().int().positive()])
      .optional()
      .catch(undefined),
  ),
  includeDeleted: z.preprocess(
    (value) => {
      if (value === 'true') return true
      if (value === 'false') return false
      return value
    },
    z
      .boolean()
      .optional()
      .catch(undefined)
      .transform((value) => value || undefined),
  ),
}) satisfies z.ZodType<ProductCatalogRouteSearch>

export const Route = createFileRoute('/app/products')({
  validateSearch: productCatalogSearchSchema,
  component: ProductsRoute,
})

function ProductsRoute() {
  return <Outlet />
}
