import { extractBearerToken } from '#modules/auth/bearer_token'
import {
  changePassword,
  getCurrentSession,
  revokeCurrentSession,
  signIn,
} from '#modules/auth/auth_service'
import {
  changePasswordRequestSchema,
  loginRequestSchema,
} from '@guardiola-foundry/shared-validation'
import type { HttpContext } from '@adonisjs/core/http'

export default class AuthController {
  async login({ request, response }: HttpContext) {
    const payload = loginRequestSchema.safeParse(request.body())

    if (!payload.success) {
      return response.unprocessableEntity({
        errors: payload.error.flatten().fieldErrors,
      })
    }

    const session = await signIn(payload.data.email, payload.data.password)

    if (session === 'email-not-found') {
      return response.unauthorized({
        message: 'Email Address was not found.',
      })
    }

    if (session === 'incorrect-password') {
      return response.unauthorized({
        message: 'Password is incorrect.',
      })
    }

    if (session === 'inactive-user') {
      return response.unauthorized({
        message: 'User is inactive.',
      })
    }

    if (session === 'locked-out') {
      return response.status(429).send({
        message: 'Too many failed sign-in attempts. Try again in 15 minutes.',
      })
    }

    return response.ok(session)
  }

  async me({ request, response }: HttpContext) {
    const token = extractBearerToken(request.header('authorization'))

    if (!token) {
      return response.unauthorized({
        message: 'Unauthorized',
      })
    }

    const session = await getCurrentSession(token)

    if (!session) {
      return response.unauthorized({
        message: 'Unauthorized',
      })
    }

    return response.ok(session)
  }

  async logout({ request, response }: HttpContext) {
    const token = extractBearerToken(request.header('authorization'))

    if (!token) {
      return response.unauthorized({
        message: 'Unauthorized',
      })
    }

    const revoked = await revokeCurrentSession(token)

    if (!revoked) {
      return response.unauthorized({
        message: 'Unauthorized',
      })
    }

    return response.noContent()
  }

  async changePassword({ request, response }: HttpContext) {
    const token = extractBearerToken(request.header('authorization'))

    if (!token) {
      return response.unauthorized({
        message: 'Unauthorized',
      })
    }

    const payload = changePasswordRequestSchema.safeParse(request.body())

    if (!payload.success) {
      return response.unprocessableEntity({
        errors: payload.error.flatten().fieldErrors,
      })
    }

    const result = await changePassword(
      token,
      payload.data.currentPassword,
      payload.data.newPassword
    )

    if (result === 'invalid-session') {
      return response.unauthorized({
        message: 'Unauthorized',
      })
    }

    if (result === 'incorrect-current-password') {
      return response.unauthorized({
        message: 'Current password is incorrect.',
      })
    }

    return response.noContent()
  }
}
