import {
  createBillOfMaterialsTemplate,
  listBillsOfMaterials,
} from '#modules/bills_of_materials/services/bills_of_materials_service'
import { createBillOfMaterialsTemplateRequestSchema } from '@guardiola-foundry/shared-validation'
import type { HttpContext } from '@adonisjs/core/http'

export default class BillsOfMaterialsController {
  async index({ response }: HttpContext) {
    return response.ok(await listBillsOfMaterials())
  }

  async store({ authenticatedSession, request, response }: HttpContext) {
    const payload = createBillOfMaterialsTemplateRequestSchema.safeParse(request.body())
    if (!payload.success) {
      return response.unprocessableEntity({ errors: payload.error.flatten().fieldErrors })
    }

    return response.created(
      await createBillOfMaterialsTemplate(authenticatedSession.user.id, payload.data)
    )
  }
}
