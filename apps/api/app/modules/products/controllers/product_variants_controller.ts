import {
  createProductVariant,
  listProductVariants,
  restoreProductVariant,
  softDeleteProductVariant,
  updateProductVariant,
} from '#modules/products/product_variants_service'
import {
  createProductVariantRequestSchema,
  updateProductVariantRequestSchema,
} from '@guardiola-foundry/shared-validation'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProductVariantsController {
  async index({ authenticatedSession, params, request, response }: HttpContext) {
    const result = await listProductVariants(params.productId, {
      includeDeleted:
        authenticatedSession.user.role === 'admin' &&
        this.shouldIncludeDeleted(request.input('includeDeleted')),
    })

    if (result === 'product-not-found') {
      return response.notFound({ message: 'Product not found.' })
    }

    return response.ok(result)
  }

  async destroy({ params, response }: HttpContext) {
    const result = await softDeleteProductVariant(params.productId, params.variantId)

    if (result === 'product-not-found') {
      return response.notFound({ message: 'Product not found.' })
    }

    if (result === 'variant-not-found') {
      return response.notFound({ message: 'Product Variant not found.' })
    }

    return response.noContent()
  }

  async restore({ authenticatedSession, params, response }: HttpContext) {
    if (authenticatedSession.user.role !== 'admin') {
      return response.forbidden({
        message: 'Only Admins can restore deleted Product Variants.',
      })
    }

    const result = await restoreProductVariant(params.productId, params.variantId)

    if (result === 'product-not-found') {
      return response.notFound({ message: 'Product not found.' })
    }

    if (result === 'variant-not-found') {
      return response.notFound({ message: 'Deleted Product Variant not found.' })
    }

    if (result === 'duplicate-name') {
      return response.unprocessableEntity({
        errors: {
          name: [
            'Restore blocked: another Product Variant in this Product already uses this name.',
          ],
        },
      })
    }

    return response.ok(result)
  }

  async store({ params, request, response }: HttpContext) {
    const payload = createProductVariantRequestSchema.safeParse(request.body())

    if (!payload.success) {
      return response.unprocessableEntity({ errors: payload.error.flatten().fieldErrors })
    }

    const result = await createProductVariant(params.productId, payload.data)

    if (result === 'product-not-found') {
      return response.notFound({ message: 'Product not found.' })
    }

    if (result === 'product-unavailable') {
      return response.unprocessableEntity({
        errors: {
          productId: ['Product Variants can only be added to an active Product.'],
        },
      })
    }

    if (result === 'duplicate-name') {
      return response.unprocessableEntity({
        errors: {
          name: ['Another Product Variant in this Product already uses this name.'],
        },
      })
    }

    return response.created(result)
  }

  async update({ params, request, response }: HttpContext) {
    const payload = updateProductVariantRequestSchema.safeParse(request.body())

    if (!payload.success) {
      return response.unprocessableEntity({ errors: payload.error.flatten().fieldErrors })
    }

    const result = await updateProductVariant(params.productId, params.variantId, payload.data)

    if (result === 'product-not-found') {
      return response.notFound({ message: 'Product not found.' })
    }

    if (result === 'variant-not-found') {
      return response.notFound({ message: 'Product Variant not found.' })
    }

    if (result === 'product-unavailable') {
      return response.unprocessableEntity({
        errors: {
          productId: ['Product Variants cannot be changed while the Product is deleted.'],
        },
      })
    }

    if (result === 'duplicate-name') {
      return response.unprocessableEntity({
        errors: {
          name: ['Another Product Variant in this Product already uses this name.'],
        },
      })
    }

    return response.ok(result)
  }

  private shouldIncludeDeleted(includeDeleted: unknown) {
    return includeDeleted === true || includeDeleted === 'true'
  }
}
