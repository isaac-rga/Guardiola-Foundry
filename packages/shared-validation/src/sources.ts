import {
  PURCHASE_PRESENTATIONS,
  PURCHASE_UNITS,
  SOURCE_ATTENTION_STATES,
  SOURCE_LINK_STATES,
  SOURCE_STATUSES,
  TEXTILE_FAMILIES,
  VENDOR_CURRENCIES,
} from '@guardiola-foundry/shared-types'
import type {
  ListSourcesQuery,
  ListSourcesResponse,
  SourceSummary,
} from '@guardiola-foundry/shared-types'
import { z } from 'zod'

export const textileFamilySchema = z.enum(TEXTILE_FAMILIES)
export const purchasePresentationSchema = z.enum(PURCHASE_PRESENTATIONS)
export const purchaseUnitSchema = z.enum(PURCHASE_UNITS)
export const vendorCurrencySchema = z.enum(VENDOR_CURRENCIES)
export const sourceStatusSchema = z.enum(SOURCE_STATUSES)
export const sourceLinkStateSchema = z.enum(SOURCE_LINK_STATES)
export const sourceAttentionStateSchema = z.enum(SOURCE_ATTENTION_STATES)

export const listSourcesQuerySchema = z.object({
  search: z
    .string()
    .max(200)
    .refine((value) => value.trim().length > 0)
    .optional(),
  textileFamily: textileFamilySchema.optional(),
  status: sourceStatusSchema.optional(),
  linkState: sourceLinkStateSchema.optional(),
  attentionState: sourceAttentionStateSchema.optional(),
}) satisfies z.ZodType<ListSourcesQuery>

export const sourceSummarySchema = z.object({
  id: z.string().regex(/^S-\d{4,}$/),
  name: z.string().min(1),
  vendor: z.string().min(1),
  textileFamily: textileFamilySchema,
  purchasePresentation: purchasePresentationSchema.nullable(),
  purchaseUnit: purchaseUnitSchema,
  vendorCurrency: vendorCurrencySchema.nullable(),
  purchasePriceCents: z.number().int().nonnegative().nullable(),
  landedUnitCostCents: z.number().int().nonnegative().nullable(),
  linkedMaterialCount: z.number().int().nonnegative(),
  costNeedsAttention: z.boolean(),
  dataNeedsAttention: z.boolean(),
}) satisfies z.ZodType<SourceSummary>

export const listSourcesResponseSchema = z.object({
  sources: z.array(sourceSummarySchema),
}) satisfies z.ZodType<ListSourcesResponse>
