import {
  PRODUCT_VARIANT_NAME_MAX_LENGTH,
  type CreateProductVariantRequest,
  type ListProductVariantsResponse,
  type ProductVariant,
  type UpdateProductVariantRequest,
} from '@guardiola-foundry/shared-types'
import { z } from 'zod'

export const productVariantStatusSchema = z.enum(['active', 'inactive'])

const productVariantNameSchema = z
  .string()
  .trim()
  .min(1, 'Product Variant name is required.')
  .max(
    PRODUCT_VARIANT_NAME_MAX_LENGTH,
    `Product Variant name must be ${PRODUCT_VARIANT_NAME_MAX_LENGTH} characters or fewer.`
  )

export const productVariantSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  name: productVariantNameSchema,
  status: productVariantStatusSchema,
  deletedAt: z.string().datetime({ offset: true }).nullable(),
  createdAt: z.string().datetime({ offset: true }),
}) satisfies z.ZodType<ProductVariant>

export const listProductVariantsResponseSchema = z.object({
  variants: z.array(productVariantSchema),
}) satisfies z.ZodType<ListProductVariantsResponse>

export const createProductVariantRequestSchema = z.object({
  name: productVariantNameSchema,
}) satisfies z.ZodType<CreateProductVariantRequest>

export const updateProductVariantRequestSchema = z.object({
  name: productVariantNameSchema,
  status: productVariantStatusSchema,
}) satisfies z.ZodType<UpdateProductVariantRequest>
