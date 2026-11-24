import type { ListProductsQuery } from '@guardiola-foundry/shared-types'
import { z } from 'zod'

export const listProductsQuerySchema = z.object({
  search: z
    .string()
    .max(200)
    .refine((value) => value.trim().length > 0)
    .optional(),
  includeDeleted: z.preprocess((value) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  }, z.boolean().optional()),
}) satisfies z.ZodType<ListProductsQuery>
