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
  BillOfMaterialsDeletedConflictError,
  BillOfMaterialsNotFoundError,
  BillOfMaterialsStaleConflictError,
  BillOfMaterialsUpdateValidationError,
  updateBillOfMaterials,
  ApplyBillOfMaterialsTemplateValidationError,
  BillOfMaterialsTemplateNotFoundError,
  applyBillOfMaterialsTemplate,
  ProductVariantCandidateTemplateUnavailableError,
} from '#modules/bills_of_materials/services/index'
import {
  ImplementationDestinationTypificationConflictError,
  ImplementationDestinationVariantConflictError,
} from '#modules/bills_of_materials/services/implementation_destination'
import {
  applyBillOfMaterialsTemplateRequestSchema,
  associateBillOfMaterialsTemplateProductRequestSchema,
  createBillOfMaterialsRequestSchema,
  searchProductVariantCandidatesQuerySchema,
  updateBillOfMaterialsRequestSchema,
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
    try {
      return response.ok(
        await searchProductVariantCandidates(query.data.search, query.data.templateId)
      )
    } catch (error) {
      if (error instanceof ProductVariantCandidateTemplateUnavailableError) {
        return response.unprocessableEntity({
          message: 'Associate this BOM Template with a Product before selecting a Variant.',
        })
      }
      throw error
    }
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

  async applyTemplate({ authenticatedSession, params, request, response }: HttpContext) {
    const payload = applyBillOfMaterialsTemplateRequestSchema.safeParse(request.body())
    if (!payload.success) {
      return response.unprocessableEntity({ errors: payload.error.flatten().fieldErrors })
    }

    try {
      return response.created(
        await applyBillOfMaterialsTemplate(
          params.billOfMaterialsId,
          authenticatedSession.user.id,
          payload.data
        )
      )
    } catch (error) {
      if (error instanceof BillOfMaterialsTemplateNotFoundError) {
        return response.notFound({ message: 'BOM Template not found.' })
      }
      if (error instanceof ApplyBillOfMaterialsTemplateValidationError) {
        return response.unprocessableEntity({ errors: { [error.field]: [error.message] } })
      }
      if (error instanceof ImplementationDestinationVariantConflictError) {
        return response.conflict({
          message: error.message,
          conflictingImplementation: error.conflictingImplementation,
        })
      }
      if (error instanceof ImplementationDestinationTypificationConflictError) {
        return response.conflict({
          message: error.message,
          errors: { name: [error.message] },
          conflictingImplementation: error.conflictingImplementation,
        })
      }
      throw error
    }
  }

  async update({ authenticatedSession, params, request, response }: HttpContext) {
    const payload = updateBillOfMaterialsRequestSchema.safeParse(request.body())
    if (!payload.success) {
      return response.unprocessableEntity({ errors: payload.error.flatten().fieldErrors })
    }

    try {
      return response.ok(
        await updateBillOfMaterials(
          params.billOfMaterialsId,
          authenticatedSession.user.id,
          payload.data
        )
      )
    } catch (error) {
      if (error instanceof BillOfMaterialsNotFoundError) {
        return response.notFound({ message: 'Bill of Materials not found.' })
      }
      if (error instanceof BillOfMaterialsUpdateValidationError) {
        return response.unprocessableEntity({ errors: { [error.field]: [error.message] } })
      }
      if (error instanceof BillOfMaterialsStaleConflictError) {
        return response.conflict({
          message: error.message,
          currentUpdatedAt: error.currentUpdatedAt,
        })
      }
      if (error instanceof BillOfMaterialsDeletedConflictError) {
        return response.conflict({ message: error.message, deleted: true })
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
