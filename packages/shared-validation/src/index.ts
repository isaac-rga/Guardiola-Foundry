import type { HealthResponse } from '@guardiola-foundry/shared-types'
import { z } from 'zod'

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
}) satisfies z.ZodType<HealthResponse>
