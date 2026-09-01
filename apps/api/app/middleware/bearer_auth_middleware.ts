import { extractBearerToken } from '#modules/auth/bearer_token'
import { getCurrentSession } from '#modules/auth/auth_service'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { CurrentSessionResponse } from '@guardiola-foundry/shared-types'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    authenticatedSession: CurrentSessionResponse
  }
}

export default class BearerAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const token = extractBearerToken(ctx.request.header('authorization'))
    const session = token ? await getCurrentSession(token) : null

    if (!session) {
      return ctx.response.unauthorized({ message: 'Unauthorized' })
    }

    ctx.authenticatedSession = session
    return next()
  }
}
