import { extractBearerToken } from '#modules/auth/bearer_token'
import { getCurrentSession } from '#modules/auth/auth_service'
import {
  getMaterial,
  linkMaterialSource,
  listMaterials,
  MaterialRelationshipError,
  unlinkMaterialSource,
} from '#modules/materials/materials_service'
import { linkMaterialSourceRequestSchema } from '@guardiola-foundry/shared-validation'
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

  async linkSource({ params, request, response }: HttpContext) {
    const payload = linkMaterialSourceRequestSchema.safeParse(request.body())

    if (!payload.success) {
      return response.unprocessableEntity({
        message: 'Select an Active Source and an applicable Vendor Shade.',
      })
    }

    try {
      return response.created(await linkMaterialSource(params.materialId, payload.data))
    } catch (error) {
      return this.respondToRelationshipError(error, response)
    }
  }

  async unlinkSource({ params, response }: HttpContext) {
    try {
      return response.ok(await unlinkMaterialSource(params.materialId, params.sourceId))
    } catch (error) {
      return this.respondToRelationshipError(error, response)
    }
  }

  private respondToRelationshipError(error: unknown, response: HttpContext['response']) {
    if (!(error instanceof MaterialRelationshipError)) {
      throw error
    }

    if (
      error.code === 'material-not-found' ||
      error.code === 'source-not-found' ||
      error.code === 'source-relationship-not-found'
    ) {
      return response.notFound({ message: error.message })
    }

    if (error.code === 'vendor-shade-mismatch') {
      return response.unprocessableEntity({ message: error.message })
    }

    return response.conflict({ message: error.message })
  }

  private async authenticate(authorizationHeader: string | undefined) {
    const token = extractBearerToken(authorizationHeader)

    if (!token) {
      return null
    }

    return getCurrentSession(token)
  }
}
