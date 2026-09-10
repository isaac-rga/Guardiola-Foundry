import {
  BillOfMaterialsValidationError,
  BillOfMaterialsProductConflictError,
  BillOfMaterialsTypificationConflictError,
  BillOfMaterialsVariantConflictError,
  associateBillOfMaterialsTemplateProduct,
  createBillOfMaterials,
  getBillOfMaterials,
  listBillsOfMaterials,
  searchProductVariantCandidates,
} from '#modules/bills_of_materials/services/bills_of_materials_service'
import {
  associateBillOfMaterialsTemplateProductRequestSchema,
  createBillOfMaterialsRequestSchema,
  searchProductVariantCandidatesQuerySchema,
} from '@guardiola-foundry/shared-validation'
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

  async searchProductVariantCandidates({ request, response }: HttpContext) {
    const query = searchProductVariantCandidatesQuerySchema.safeParse(request.qs())
    if (!query.success) {
      return response.unprocessableEntity({ message: 'Enter a Product Variant search.' })
    }
    return response.ok(await searchProductVariantCandidates(query.data.search))
  }

  async store({ authenticatedSession, request, response }: HttpContext) {
    const payload = createBillOfMaterialsRequestSchema.safeParse(request.body())
    if (!payload.success) {
      return response.unprocessableEntity({ errors: payload.error.flatten().fieldErrors })
    }

    try {
      return response.created(
        await createBillOfMaterials(authenticatedSession.user.id, payload.data)
      )
    } catch (error) {
      if (error instanceof BillOfMaterialsValidationError) {
        return response.unprocessableEntity({ errors: { [error.field]: [error.message] } })
      }
      if (error instanceof BillOfMaterialsProductConflictError) {
        return response.conflict({
          message: error.message,
          conflictingTemplate: error.conflictingTemplate,
        })
      }
      if (error instanceof BillOfMaterialsVariantConflictError) {
        return response.conflict({
          message: error.message,
          conflictingImplementation: error.conflictingImplementation,
        })
      }
      if (error instanceof BillOfMaterialsTypificationConflictError) {
        return response.conflict({
          message: error.message,
          errors: { name: [error.message] },
          conflictingImplementation: error.conflictingImplementation,
        })
      }
      throw error
    }
  }

  async associateProduct({ params, request, response }: HttpContext) {
    const payload = associateBillOfMaterialsTemplateProductRequestSchema.safeParse(request.body())
    if (!payload.success) {
      return response.unprocessableEntity({ errors: payload.error.flatten().fieldErrors })
    }

    const result = await associateBillOfMaterialsTemplateProduct(
      params.billOfMaterialsId,
      payload.data.productId
    )
    if (result === 'template-not-found') {
      return response.notFound({ message: 'BOM Template not found.' })
    }
    if (result === 'template-already-associated') {
      return response.unprocessableEntity({
        errors: { productId: ['A Template Product association is permanent once assigned.'] },
      })
    }
    if (result === 'product-unavailable') {
      return response.unprocessableEntity({
        errors: { productId: ['BOM Templates can only be associated with an active Product.'] },
      })
    }
    if ('conflict' in result) {
      return response.conflict({
        message: `Product is already associated with ${result.conflict.name}.`,
        conflictingTemplate: result.conflict,
      })
    }
    return response.ok(result)
  }
}
