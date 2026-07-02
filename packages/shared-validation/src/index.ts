import type {
  AuthSessionResponse,
  CreateProductRequest,
  ChangePasswordRequest,
  CurrentSessionResponse,
  HealthResponse,
  ListProductsResponse,
  LoginRequest,
  ProductCollection,
  ProductCreatedBy,
  ProductSummary,
  SessionUser,
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

export const productSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  lifecycleStatus: productLifecycleStatusSchema,
  productStatus: productStatusSchema,
  productCategory: productCategorySchema.nullable(),
  collection: productCollectionSchema.nullable(),
  createdAt: z.string().datetime({ offset: true }),
  createdBy: productCreatedBySchema,
}) satisfies z.ZodType<ProductSummary>

export const listProductsResponseSchema = z.object({
  products: z.array(productSummarySchema),
  collections: z.array(productCollectionSchema),
}) satisfies z.ZodType<ListProductsResponse>

export const createProductRequestSchema = z.object({
  name: z.string().trim().min(1),
  lifecycleStatus: productLifecycleStatusSchema.optional(),
  productStatus: productStatusSchema.optional(),
  collectionId: z.number().int().positive().nullable().optional(),
}) satisfies z.ZodType<CreateProductRequest>
