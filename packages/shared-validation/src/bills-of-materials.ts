import {
  BILL_OF_MATERIALS_NAME_MAX_LENGTH,
  BOM_LINE_CONSTRUCTION_PIECE_MAX_LENGTH,
  type BillOfMaterialsDetail,
  type BillOfMaterialsLine,
  type BillOfMaterialsSummary,
  type AssociateBillOfMaterialsTemplateProductRequest,
  type CreateBillOfMaterialsLineRequest,
  type CreateBillOfMaterialsImplementationRequest,
  type CreateBillOfMaterialsRequest,
  type CreateBillOfMaterialsTemplateRequest,
  type ListBillsOfMaterialsResponse,
  type ProductVariantCandidate,
  type SearchProductVariantCandidatesResponse,
  type UpdateBillOfMaterialsLineRequest,
  type UpdateBillOfMaterialsRequest,
} from '@guardiola-foundry/shared-types'
import { z } from 'zod'

const optionalTrimmedText = z
  .union([z.string(), z.null()])
  .transform((value) => {
    if (value === null) return null

    const normalizedValue = value.trim()
    return normalizedValue.length > 0 ? normalizedValue : null
  })

const billOfMaterialsNameSchema = z
  .string()
  .trim()
  .min(1, 'BOM name is required.')
  .max(
    BILL_OF_MATERIALS_NAME_MAX_LENGTH,
    `BOM name must be ${BILL_OF_MATERIALS_NAME_MAX_LENGTH} characters or fewer.`,
  )

const billOfMaterialsLineMaterialSchema = z.object({
  id: z.string().regex(/^M-\d{4,}$/),
  name: z.string().min(1),
  preferredSource: z
    .object({
      id: z.string().regex(/^S-\d{4,}$/),
      name: z.string().min(1),
      vendor: z.string().min(1),
      vendorShadeOrDetail: z.string().nullable(),
      widthCentimeters: z.number().positive().nullable(),
      landedUnitCostCents: z.number().int().nonnegative().nullable(),
    })
    .nullable(),
})

const billOfMaterialsLinePatternSetSchema = z.object({
  id: z.string().regex(/^PS-[A-Z2-9]{6}$/),
  name: z.string().min(1),
  status: z.enum(['active', 'retired']),
  quantityProposalCount: z.number().int().nonnegative(),
})

const billOfMaterialsUserReferenceSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
})

const billOfMaterialsProductReferenceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  availability: z.enum(['available', 'unavailable']),
})

const billOfMaterialsProductVariantReferenceSchema = z.object({
  id: z.string().regex(/^PV-[A-Z2-9]{6}$/),
  name: z.string().min(1),
  availability: z.enum(['available', 'unavailable']),
})

const billOfMaterialsReferenceSchema = z.object({
  id: z.string().regex(/^BOM-[A-Z2-9]{6}$/),
  name: z.string().min(1),
})

const billOfMaterialsLineVerificationSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('unverified'),
    verifiedBy: z.null(),
    verifiedAt: z.null(),
  }),
  z.object({
    status: z.literal('verified'),
    verifiedBy: billOfMaterialsUserReferenceSchema,
    verifiedAt: z.string().datetime({ offset: true }),
  }),
])

const billOfMaterialsLineCostProjectionSchema = z.object({
  amountCents: z.number().int().nonnegative().nullable(),
  exclusionReason: z
    .enum([
      'missing-material',
      'missing-material-quantity',
      'no-usable-landed-unit-cost',
    ])
    .nullable(),
})

const billOfMaterialsCostProjectionSchema = z.object({
  availability: z.enum(['complete', 'partial', 'unavailable']),
  amountCents: z.number().int().nonnegative().nullable(),
  excludedLineCount: z.number().int().nonnegative(),
})

export const billOfMaterialsLineSchema = z.object({
  id: z.string().regex(/^BML-[A-Z2-9]{6}$/),
  constructionPiece: z.string(),
  material: billOfMaterialsLineMaterialSchema.nullable(),
  materialQuantity: z.number().positive().nullable(),
  patternSet: billOfMaterialsLinePatternSetSchema.nullable(),
  lineNote: z.string().nullable(),
  order: z.number().int().nonnegative(),
  completeness: z.enum(['complete', 'incomplete']),
  verification: billOfMaterialsLineVerificationSchema,
  attention: z.array(
    z.enum([
      'material-needs-attention',
      'source-needs-attention',
      'pattern-needs-attention',
    ]),
  ),
  costProjection: billOfMaterialsLineCostProjectionSchema,
}) satisfies z.ZodType<BillOfMaterialsLine>

export const billOfMaterialsSummarySchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['template', 'implementation']),
  name: billOfMaterialsNameSchema,
  description: z.string().nullable(),
  product: billOfMaterialsProductReferenceSchema.nullable(),
  productVariant: billOfMaterialsProductVariantReferenceSchema.nullable(),
  origin: billOfMaterialsReferenceSchema.nullable(),
  createdBy: billOfMaterialsUserReferenceSchema,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
}) satisfies z.ZodType<BillOfMaterialsSummary>

export const listBillsOfMaterialsResponseSchema = z.object({
  billsOfMaterials: z.array(billOfMaterialsSummarySchema),
}) satisfies z.ZodType<ListBillsOfMaterialsResponse>

export const billOfMaterialsDetailSchema = billOfMaterialsSummarySchema.extend({
  lines: z.array(billOfMaterialsLineSchema),
  attentionCount: z.number().int().nonnegative(),
  costProjection: billOfMaterialsCostProjectionSchema,
}) satisfies z.ZodType<BillOfMaterialsDetail>

const billOfMaterialsLineRequestFields = {
  constructionPiece: z
    .union([z.string(), z.null()])
    .transform((value) => value?.trim() ?? '')
    .pipe(
      z
        .string()
        .min(1, 'Construction Piece is required.')
        .max(
          BOM_LINE_CONSTRUCTION_PIECE_MAX_LENGTH,
          `Construction Piece must be ${BOM_LINE_CONSTRUCTION_PIECE_MAX_LENGTH} characters or fewer.`,
        ),
    ),
  materialId: z
    .string()
    .regex(/^M-\d{4,}$/, 'Select a valid Material.')
    .nullable(),
  materialQuantity: z
    .number({ message: 'Final meters must be a number.' })
    .positive('Final meters must be greater than zero.')
    .refine(
      (value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-8,
      'Final meters must have at most three decimal places.',
    )
    .nullable(),
  patternSetId: z
    .string()
    .regex(/^PS-[A-Z2-9]{6}$/, 'Select a valid Pattern Set.')
    .nullable()
    .default(null),
  lineNote: optionalTrimmedText,
  verified: z.boolean().default(false),
}

export const createBillOfMaterialsLineRequestSchema = z
  .object(billOfMaterialsLineRequestFields)
  .superRefine((line, context) => {
    if (line.materialId === null && line.materialQuantity !== null) {
      context.addIssue({
        code: 'custom',
        path: ['materialQuantity'],
        message: 'Select a Material before entering Final meters.',
      })
    }
    if (
      line.verified &&
      (line.materialId === null || line.materialQuantity === null)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['verified'],
        message: 'Only a Complete BOM Line can be verified.',
      })
    }
  }) satisfies z.ZodType<CreateBillOfMaterialsLineRequest>

export const createBillOfMaterialsTemplateRequestSchema = z.object({
  kind: z.literal('template'),
  name: billOfMaterialsNameSchema,
  description: optionalTrimmedText,
  productId: z
    .string()
    .regex(/^P-[A-Z2-9]{6}$/)
    .nullable()
    .default(null),
  lines: z.array(createBillOfMaterialsLineRequestSchema).default([]),
}) satisfies z.ZodType<CreateBillOfMaterialsTemplateRequest>

export const createBillOfMaterialsImplementationRequestSchema = z.object({
  kind: z.literal('implementation'),
  name: billOfMaterialsNameSchema,
  description: optionalTrimmedText,
  productVariantId: z
    .string()
    .regex(/^PV-[A-Z2-9]{6}$/, 'Select a valid Product Variant.'),
  lines: z.array(createBillOfMaterialsLineRequestSchema).default([]),
}) satisfies z.ZodType<CreateBillOfMaterialsImplementationRequest>

export const createBillOfMaterialsRequestSchema = z.discriminatedUnion('kind', [
  createBillOfMaterialsTemplateRequestSchema,
  createBillOfMaterialsImplementationRequestSchema,
]) satisfies z.ZodType<CreateBillOfMaterialsRequest>

export const updateBillOfMaterialsLineRequestSchema = z
  .object({
    id: z
      .string()
      .regex(/^BML-[A-Z2-9]{6}$/)
      .nullable(),
    ...billOfMaterialsLineRequestFields,
  })
  .superRefine((line, context) => {
    if (line.materialId === null && line.materialQuantity !== null) {
      context.addIssue({
        code: 'custom',
        path: ['materialQuantity'],
        message: 'Select a Material before entering Final meters.',
      })
    }
    if (
      line.verified &&
      (line.materialId === null || line.materialQuantity === null)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['verified'],
        message: 'Only a Complete BOM Line can be verified.',
      })
    }
  }) satisfies z.ZodType<UpdateBillOfMaterialsLineRequest>

export const updateBillOfMaterialsRequestSchema = z
  .object({
    updatedAt: z.string().datetime({ offset: true }),
    name: billOfMaterialsNameSchema,
    description: optionalTrimmedText,
    lines: z.array(updateBillOfMaterialsLineRequestSchema),
  })
  .strict() satisfies z.ZodType<UpdateBillOfMaterialsRequest>

export const searchProductVariantCandidatesQuerySchema = z.object({
  search: z
    .string()
    .transform((value) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase(),
    )
    .pipe(z.string().min(1)),
})

const productVariantCandidateBaseSchema = z.object({
  id: z.string().regex(/^PV-[A-Z2-9]{6}$/),
  name: z.string().min(1),
  status: z.enum(['active', 'inactive']),
  product: billOfMaterialsProductReferenceSchema,
})

export const productVariantCandidateSchema = z.discriminatedUnion('outcome', [
  productVariantCandidateBaseSchema.extend({
    selectable: z.literal(true),
    outcome: z.literal('eligible'),
    existingImplementation: z.null(),
  }),
  productVariantCandidateBaseSchema.extend({
    selectable: z.literal(false),
    outcome: z.literal('implementation-exists'),
    existingImplementation: billOfMaterialsReferenceSchema,
  }),
  productVariantCandidateBaseSchema.extend({
    selectable: z.literal(false),
    outcome: z.enum(['product-unavailable', 'variant-inactive']),
    existingImplementation: z.null(),
  }),
]) satisfies z.ZodType<ProductVariantCandidate>

export const searchProductVariantCandidatesResponseSchema = z.object({
  items: z.array(productVariantCandidateSchema),
  hasMore: z.boolean(),
}) satisfies z.ZodType<SearchProductVariantCandidatesResponse>

export const associateBillOfMaterialsTemplateProductRequestSchema = z.object({
  productId: z.string().regex(/^P-[A-Z2-9]{6}$/),
}) satisfies z.ZodType<AssociateBillOfMaterialsTemplateProductRequest>
