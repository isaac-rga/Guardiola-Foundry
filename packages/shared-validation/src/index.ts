import type { AuthSessionResponse, HealthResponse, LoginRequest, SessionUser } from '@guardiola-foundry/shared-types'
import { z } from 'zod'

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
}) satisfies z.ZodType<HealthResponse>

export const loginRequestSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
}) satisfies z.ZodType<LoginRequest>

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
