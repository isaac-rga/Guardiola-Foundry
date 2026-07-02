import { extractBearerToken } from '#modules/auth/bearer_token'
import { getCurrentSession } from '#modules/auth/auth_service'
import User from '#models/user'
import { createProduct, listProducts } from '#modules/products/products_service'
import { createProductRequestSchema } from '@guardiola-foundry/shared-validation'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProductsController {
  async index({ request, response }: HttpContext) {
    const authenticatedUser = await this.authenticate(request.header('authorization'))

    if (!authenticatedUser) {
      return response.unauthorized({
        message: 'Unauthorized',
      })
    }

    return response.ok(await listProducts())
  }

  async store({ request, response }: HttpContext) {
    const authenticatedUser = await this.authenticate(request.header('authorization'))

    if (!authenticatedUser) {
      return response.unauthorized({
        message: 'Unauthorized',
      })
    }

    const payload = createProductRequestSchema.safeParse(request.body())

    if (!payload.success) {
      return response.unprocessableEntity({
        errors: payload.error.flatten().fieldErrors,
      })
    }

    const result = await createProduct(authenticatedUser, payload.data)

    if (result === 'collection-not-found') {
      return response.unprocessableEntity({
        errors: {
          collectionId: ['Selected collection was not found.'],
        },
      })
    }

    return response.created(result)
  }

  private async authenticate(authorizationHeader: string | undefined) {
    const token = extractBearerToken(authorizationHeader)

    if (!token) {
      return null
    }

    const session = await getCurrentSession(token)

    if (!session) {
      return null
    }

    return User.find(session.user.id)
  }
}
