import {
  PATTERN_SET_NAME_MAX_LENGTH,
  type CreatePatternSetRequest,
  type ListPatternSetsResponse,
  type PatternSet,
  type PatternSetSearchItem,
  type PatternSetQuantityProposal,
  type PatternSetUsageImpact,
  type SearchPatternSetsResponse,
  type UpdatePatternSetRequest,
} from '@guardiola-foundry/shared-types'
import { z } from 'zod'

const optionalTrimmedText = z
  .union([z.string(), z.null()])
  .transform((value) => {
    if (value === null) {
      return null
    }

    const normalizedValue = value.trim()

    return normalizedValue.length > 0 ? normalizedValue : null
  })

const positiveNumber = (label: string) =>
  z
    .number({ message: `${label} must be a number.` })
    .positive(`${label} must be greater than zero.`)

const quantityMetersSchema = positiveNumber('Quantity').refine((value) => {
  const scaledValue = value * 1000
  return Math.abs(scaledValue - Math.round(scaledValue)) < 1e-9
}, 'Quantity supports at most three decimal places.')

export const patternSetQuantityProposalSchema = z.object({
  assumedWidthCm: positiveNumber('Assumed width'),
  quantityMeters: quantityMetersSchema,
  evidenceNote: optionalTrimmedText,
}) satisfies z.ZodType<PatternSetQuantityProposal>

const patternSetNameSchema = z
  .string()
  .trim()
  .min(1, 'Pattern Set name is required.')
  .max(
    PATTERN_SET_NAME_MAX_LENGTH,
    `Pattern Set name must be ${PATTERN_SET_NAME_MAX_LENGTH} characters or fewer.`,
  )

const quantityProposalsSchema = z
  .array(patternSetQuantityProposalSchema)
  .superRefine((proposals, context) => {
    const widths = new Set<number>()

    proposals.forEach((proposal, index) => {
      if (widths.has(proposal.assumedWidthCm)) {
        context.addIssue({
          code: 'custom',
          message: 'Each assumed width may appear only once.',
          path: [index, 'assumedWidthCm'],
        })
      }

      widths.add(proposal.assumedWidthCm)
    })
  })

const patternSetMutationSchema = z.object({
  name: patternSetNameSchema,
  description: optionalTrimmedText,
  quantityProposals: quantityProposalsSchema,
})

export const patternSetSchema = z.object({
  id: z.string().min(1),
  name: patternSetNameSchema,
  description: z.string().nullable(),
  status: z.enum(['active', 'retired']),
  quantityProposals: z.array(patternSetQuantityProposalSchema),
  createdBy: z.object({
    id: z.number().int().positive(),
    email: z.string().email(),
  }),
  createdAt: z.string().datetime({ offset: true }),
}) satisfies z.ZodType<PatternSet>

export const listPatternSetsResponseSchema = z.object({
  patternSets: z.array(patternSetSchema),
}) satisfies z.ZodType<ListPatternSetsResponse>

export const searchPatternSetsQuerySchema = z.object({
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

export const patternSetSearchItemSchema = z.object({
  id: z.string().regex(/^PS-[A-Z2-9]{6}$/),
  name: z.string().min(1),
  quantityProposalCount: z.number().int().nonnegative(),
}) satisfies z.ZodType<PatternSetSearchItem>

export const searchPatternSetsResponseSchema = z.object({
  items: z.array(patternSetSearchItemSchema).max(25),
  hasMore: z.boolean(),
}) satisfies z.ZodType<SearchPatternSetsResponse>

export const patternSetUsageImpactSchema = z.object({
  billOfMaterialsLineCount: z.number().int().nonnegative(),
  billOfMaterialsCount: z.number().int().nonnegative(),
}) satisfies z.ZodType<PatternSetUsageImpact>

export const createPatternSetRequestSchema =
  patternSetMutationSchema satisfies z.ZodType<CreatePatternSetRequest>
export const updatePatternSetRequestSchema =
  patternSetMutationSchema satisfies z.ZodType<UpdatePatternSetRequest>
