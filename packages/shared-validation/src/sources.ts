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
  GetSourceResponse,
  ListSourcesQuery,
  ListSourcesResponse,
  SourceDetail,
  SourceLinkedMaterialSummary,
  SourceSummary,
  SourceVendorShade,
} from '@guardiola-foundry/shared-types'
import { z } from 'zod'
import { materialColorSchema, materialUnitSchema, materialUseSchema } from './materials.js'

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

export const sourceVendorShadeSchema = z.object({
  id: z.number().int().positive(),
  nameOrCode: z.string().min(1),
}) satisfies z.ZodType<SourceVendorShade>

export const sourceLinkedMaterialSummarySchema = z.object({
  id: z.string().regex(/^M-\d{4,}$/),
  name: z.string().min(1),
  materialColor: materialColorSchema,
  materialUse: materialUseSchema,
  relationship: z.enum(['preferred', 'alternate']),
  relationshipStatus: z.enum(['active', 'historical']),
  vendorShade: sourceVendorShadeSchema.nullable(),
}) satisfies z.ZodType<SourceLinkedMaterialSummary>

export const sourceDetailSchema = z.object({
  id: z.string().regex(/^S-\d{4,}$/),
  legacySourceId: z.string().min(1).nullable(),
  name: z.string().min(1),
  vendor: z.string().min(1),
  textileFamily: textileFamilySchema,
  purchasePresentation: purchasePresentationSchema.nullable(),
  fixedPieceLength: z.number().positive().nullable(),
  purchaseUnit: purchaseUnitSchema,
  minimumPurchaseQuantity: z.number().positive().nullable(),
  purchasePriceCents: z.number().int().nonnegative().nullable(),
  priceDate: z.string().date().nullable(),
  vendorCurrency: vendorCurrencySchema.nullable(),
  landedUnitCostCents: z.number().int().nonnegative().nullable(),
  sourceStatus: sourceStatusSchema,
  normalizedUnit: materialUnitSchema,
  vendorSku: z.string().nullable(),
  url: z.string().nullable(),
  description: z.string().nullable(),
  manufacturer: z.string().nullable(),
  fiber: z.string().nullable(),
  composition: z.string().nullable(),
  gsmGramsPerSquareMeter: z.number().positive().nullable(),
  widthCentimeters: z.number().positive().nullable(),
  finish: z.string().nullable(),
  weave: z.string().nullable(),
  presentationNotes: z.string().nullable(),
  countryOfOrigin: z.string().nullable(),
  comments: z.string().nullable(),
  estimatedShippingUsdPerKilogramCents: z.number().int().nonnegative().nullable(),
  igiPercentage: z.number().min(0).max(100).nullable(),
  ivaPercentage: z.literal(16),
  costNeedsAttention: z.boolean(),
  dataNeedsAttention: z.boolean(),
  vendorShades: z.array(sourceVendorShadeSchema),
  linkedMaterials: z.array(sourceLinkedMaterialSummarySchema),
}) satisfies z.ZodType<SourceDetail>

export const getSourceResponseSchema = z.object({
  source: sourceDetailSchema,
}) satisfies z.ZodType<GetSourceResponse>
