import type {
  ListMaterialsResponse,
  MaterialPreferredSourceSummary,
  MaterialSummary,
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
