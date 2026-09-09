import {
  BillOfMaterialsValidationError,
  createBillOfMaterialsTemplate,
  getBillOfMaterials,
  listBillsOfMaterials,
} from '#modules/bills_of_materials/services/bills_of_materials_service'
import { createBillOfMaterialsTemplateRequestSchema } from '@guardiola-foundry/shared-validation'
import type { HttpContext } from '@adonisjs/core/http'

export default class BillsOfMaterialsController {
  async index({ response }: HttpContext) {
    return response.ok(await listBillsOfMaterials())
  }

  async show({ params, response }: HttpContext) {
    const billOfMaterials = await getBillOfMaterials(params.billOfMaterialsId)
    if (!billOfMaterials) return response.notFound({ message: 'Bill of Materials not found.' })
    return response.ok(billOfMaterials)
  }

  async store({ authenticatedSession, request, response }: HttpContext) {
    const payload = createBillOfMaterialsTemplateRequestSchema.safeParse(request.body())
    if (!payload.success) {
      return response.unprocessableEntity({ errors: payload.error.flatten().fieldErrors })
    }

    try {
      return response.created(
        await createBillOfMaterialsTemplate(authenticatedSession.user.id, payload.data)
      )
    } catch (error) {
      if (error instanceof BillOfMaterialsValidationError) {
        return response.unprocessableEntity({ errors: { [error.field]: [error.message] } })
      }
      throw error
    }
  }
}
