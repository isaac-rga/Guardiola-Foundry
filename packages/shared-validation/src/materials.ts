import type {
  GetMaterialResponse,
  LinkMaterialSourceRequest,
  LinkMaterialSourceResponse,
  ListMaterialsResponse,
  MaterialDetail,
  MaterialPreferredSourceSummary,
  MaterialSourceRelationshipSummary,
  MaterialSummary,
  UnlinkMaterialSourceResponse,
} from '@guardiola-foundry/shared-types'
import { z } from 'zod'

export const materialUseSchema = z.enum(['base-fabric', 'structure', 'lace'])

export const materialColorSchema = z.enum(['ivory', 'champagne', 'white'])

export const materialUnitSchema = z.literal('meter')

export const materialPreferredSourceSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: z.string().min(1),
  normalizedUnitCostCents: z.number().int().nonnegative(),
  normalizedUnit: materialUnitSchema,
  needsAttention: z.boolean(),
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

export const materialSourceRelationshipSummarySchema = z.object({
  id: z.string().regex(/^S-\d{4,}$/),
  name: z.string().min(1),
  vendor: z.string().min(1),
  relationship: z.enum(['preferred', 'alternate']),
  relationshipStatus: z.enum(['active', 'historical']),
  vendorShade: z
    .object({
      id: z.number().int().positive(),
      nameOrCode: z.string().min(1),
    })
    .nullable(),
}) satisfies z.ZodType<MaterialSourceRelationshipSummary>

export const materialDetailSchema = z.object({
  id: z.string().regex(/^M-\d{4,}$/),
  name: z.string().min(1),
  materialColor: materialColorSchema,
  materialUse: materialUseSchema,
  materialUnit: materialUnitSchema,
  comments: z.string().nullable(),
  sourceRelationships: z.array(materialSourceRelationshipSummarySchema),
}) satisfies z.ZodType<MaterialDetail>

export const getMaterialResponseSchema = z.object({
  material: materialDetailSchema,
}) satisfies z.ZodType<GetMaterialResponse>

export const linkMaterialSourceRequestSchema = z.object({
  sourceId: z.string().regex(/^S-\d{4,}$/),
  vendorShadeId: z.number().int().positive().nullable().optional(),
}) satisfies z.ZodType<LinkMaterialSourceRequest>

export const linkMaterialSourceResponseSchema =
  getMaterialResponseSchema satisfies z.ZodType<LinkMaterialSourceResponse>

export const unlinkMaterialSourceResponseSchema =
  getMaterialResponseSchema satisfies z.ZodType<UnlinkMaterialSourceResponse>
