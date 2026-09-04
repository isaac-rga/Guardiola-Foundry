import {
  getMaterial,
  linkMaterialSource,
  listMaterials,
  MaterialRelationshipError,
  replacePreferredSource,
  unlinkMaterialSource,
} from '#modules/materials/materials_service'
import {
  linkMaterialSourceRequestSchema,
  replacePreferredSourceRequestSchema,
} from '@guardiola-foundry/shared-validation'
import type { HttpContext } from '@adonisjs/core/http'

export default class MaterialsController {
  async index({ response }: HttpContext) {
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

  async replacePreferredSource({ params, request, response }: HttpContext) {
    const payload = replacePreferredSourceRequestSchema.safeParse(request.body())

    if (!payload.success) {
      return response.unprocessableEntity({
        message: 'Select a linked alternate Source.',
      })
    }

    try {
      return response.ok(await replacePreferredSource(params.materialId, payload.data))
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
}
