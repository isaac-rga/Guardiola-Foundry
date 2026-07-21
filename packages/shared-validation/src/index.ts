import type {
  AuthSessionResponse,
  ChangePasswordRequest,
  CreateProductRequest,
  CurrentSessionResponse,
  DeletedProductDetail,
  GetProductResponse,
  HealthResponse,
  ListMaterialsResponse,
  ListProductsResponse,
  LoginRequest,
  MaterialPreferredSourceSummary,
  MaterialSummary,
  ProductCollection,
  ProductDetail,
  ProductImage,
  ProductCreatedBy,
  ProductSummary,
  SessionUser,
  UpdateProductRequest,
} from '@guardiola-foundry/shared-types'
import { z } from 'zod'

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
}) satisfies z.ZodType<HealthResponse>

export const loginRequestSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
}) satisfies z.ZodType<LoginRequest>

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
}) satisfies z.ZodType<ChangePasswordRequest>

export const sessionUserSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  role: z.enum(['admin', 'operator']),
  active: z.boolean(),
}) satisfies z.ZodType<SessionUser>

export const authSessionResponseSchema = z.object({
  token: z.string().min(1),
  tokenType: z.literal('Bearer'),
  expiresAt: z.string().datetime({ offset: true }),
  user: sessionUserSchema,
}) satisfies z.ZodType<AuthSessionResponse>

export const currentSessionResponseSchema = z.object({
  tokenType: z.literal('Bearer'),
  expiresAt: z.string().datetime({ offset: true }),
  user: sessionUserSchema,
}) satisfies z.ZodType<CurrentSessionResponse>

export const productLifecycleStatusSchema = z.enum([
  'concept',
  'fabric-trim-selection',
  'design-and-prototyping',
  'testing',
  'approved',
  'on-documentation',
  'finished',
])

export const productStatusSchema = z.enum(['active', 'inactive'])

export const productCategorySchema = z.enum(['dress', 'accessory', 'other'])

export const productCollectionSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
}) satisfies z.ZodType<ProductCollection>

export const productCreatedBySchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
}) satisfies z.ZodType<ProductCreatedBy>

export const productImageSchema = z.object({
  fileName: z.string().min(1),
}) satisfies z.ZodType<ProductImage>

export const productSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  lifecycleStatus: productLifecycleStatusSchema,
  productStatus: productStatusSchema,
  deletedAt: z.string().datetime({ offset: true }).nullable().optional(),
  productCategory: productCategorySchema.nullable(),
  collection: productCollectionSchema.nullable(),
  createdAt: z.string().datetime({ offset: true }),
  createdBy: productCreatedBySchema,
}) satisfies z.ZodType<ProductSummary>

export const productDetailSchema = productSummarySchema.extend({
  shortDescription: z.string().nullable(),
  image: productImageSchema.nullable(),
}) satisfies z.ZodType<ProductDetail>

export const deletedProductDetailSchema = productDetailSchema.extend({
  deletedAt: z.string().datetime({ offset: true }),
}) satisfies z.ZodType<DeletedProductDetail>

export const listProductsResponseSchema = z.object({
  products: z.array(productSummarySchema),
  collections: z.array(productCollectionSchema),
}) satisfies z.ZodType<ListProductsResponse>

export const getProductResponseSchema = z.discriminatedUnion('state', [
  z.object({
    state: z.literal('active'),
    product: productDetailSchema,
    collections: z.array(productCollectionSchema),
  }),
  z.object({
    state: z.literal('deleted'),
    product: deletedProductDetailSchema,
  }),
]) satisfies z.ZodType<GetProductResponse>

export const createProductRequestSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required.'),
  lifecycleStatus: productLifecycleStatusSchema.optional(),
  productStatus: productStatusSchema.optional(),
  collectionId: z.number().int().positive().nullable().optional(),
}) satisfies z.ZodType<CreateProductRequest>

export const updateProductRequestSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required.'),
  shortDescription: z
    .union([z.string(), z.null()])
    .transform((value) => {
      if (value === null) {
        return null
      }

      const normalizedValue = value.trim()

      return normalizedValue.length > 0 ? normalizedValue : null
    }),
  lifecycleStatus: productLifecycleStatusSchema,
  productStatus: productStatusSchema,
  productCategory: productCategorySchema.nullable(),
  collectionId: z.number().int().positive().nullable(),
}) satisfies z.ZodType<UpdateProductRequest>

export const materialUseSchema = z.enum(['base-fabric', 'structure', 'lace'])

export const materialColorSchema = z.enum(['ivory', 'champagne', 'white'])

export const materialUnitSchema = z.literal('meter')

export const materialPreferredSourceSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: z.string().min(1),
  normalizedUnitCostCents: z.number().int().nonnegative(),
  normalizedUnit: materialUnitSchema,
}) satisfies z.ZodType<MaterialPreferredSourceSummary>

export const materialSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  materialColor: materialColorSchema,
  materialUse: materialUseSchema,
  materialUnit: materialUnitSchema,
  preferredSource: materialPreferredSourceSummarySchema,
  derivedUnitCostCents: z.number().int().nonnegative(),
  alternateSourceCount: z.number().int().nonnegative(),
  comments: z.string().nullable(),
}) satisfies z.ZodType<MaterialSummary>

export const listMaterialsResponseSchema = z.object({
  materials: z.array(materialSummarySchema),
}) satisfies z.ZodType<ListMaterialsResponse>
