import {
  BILL_OF_MATERIALS_NAME_MAX_LENGTH,
  type BillOfMaterialsSummary,
  type CreateBillOfMaterialsTemplateRequest,
  type ListBillsOfMaterialsResponse,
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

export const billOfMaterialsSummarySchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['template', 'implementation']),
  name: billOfMaterialsNameSchema,
  description: z.string().nullable(),
  createdBy: z.object({
    id: z.number().int().positive(),
    email: z.string().email(),
  }),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
}) satisfies z.ZodType<BillOfMaterialsSummary>

export const listBillsOfMaterialsResponseSchema = z.object({
  billsOfMaterials: z.array(billOfMaterialsSummarySchema),
}) satisfies z.ZodType<ListBillsOfMaterialsResponse>

export const createBillOfMaterialsTemplateRequestSchema = z.object({
  kind: z.literal('template'),
  name: billOfMaterialsNameSchema,
  description: optionalTrimmedText,
}) satisfies z.ZodType<CreateBillOfMaterialsTemplateRequest>
