import { extractBearerToken } from '#modules/auth/bearer_token'
import { getCurrentSession, revokeCurrentSession, signIn } from '#modules/auth/auth_service'
import { loginRequestSchema } from '@guardiola-foundry/shared-validation'
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

    if (!session) {
      return response.unauthorized({
        message: 'Invalid email address or password.',
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
}
