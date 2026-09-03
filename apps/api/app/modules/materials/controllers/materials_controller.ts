import { extractBearerToken } from '#modules/auth/bearer_token'
import { getCurrentSession } from '#modules/auth/auth_service'
import { getMaterial, listMaterials } from '#modules/materials/materials_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class MaterialsController {
  async index({ request, response }: HttpContext) {
    const authenticatedUser = await this.authenticate(request.header('authorization'))

    if (!authenticatedUser) {
      return response.unauthorized({
        message: 'Unauthorized',
      })
    }

    return response.ok(await listMaterials())
  }

  async show({ params, response }: HttpContext) {
    const result = await getMaterial(params.materialId)

    if (!result) {
      return response.notFound({ message: 'Material not found.' })
    }

    return response.ok(result)
  }

  private async authenticate(authorizationHeader: string | undefined) {
    const token = extractBearerToken(authorizationHeader)

    if (!token) {
      return null
    }

    return getCurrentSession(token)
  }
}
