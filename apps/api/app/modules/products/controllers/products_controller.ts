import {
  createProduct,
  getProduct,
  listProducts,
  restoreProduct,
  softDeleteProduct,
  updateProduct,
} from '#modules/products/products_service'
import {
  createProductRequestSchema,
  updateProductRequestSchema,
} from '@guardiola-foundry/shared-validation'
import type { HttpContext } from '@adonisjs/core/http'
import type { MultipartFile } from '@adonisjs/core/bodyparser'

export default class ProductsController {
  async index({ authenticatedSession, request, response }: HttpContext) {
    return response.ok(
      await listProducts({
        includeDeleted:
          authenticatedSession.user.role === 'admin' &&
          this.shouldIncludeDeleted(request.input('includeDeleted')),
      })
    )
  }

  async store({ authenticatedSession, request, response }: HttpContext) {
    const payload = createProductRequestSchema.safeParse(request.body())

    if (!payload.success) {
      return response.unprocessableEntity({
        errors: payload.error.flatten().fieldErrors,
      })
    }

    const result = await createProduct(authenticatedSession.user.id, payload.data)

    if (result === 'collection-not-found') {
      return response.unprocessableEntity({
        errors: {
          collectionId: ['Selected collection was not found.'],
        },
      })
    }

    return response.created(result)
  }

  async show({ params, response }: HttpContext) {
    const result = await getProduct(params.productId)

    if (result === 'not-found') {
      return response.notFound({
        message: 'Product not found.',
      })
    }

    return response.ok(result)
  }

  async update({ params, request, response }: HttpContext) {
    const imageFile = request.file('image', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (imageFile?.hasErrors) {
      return response.unprocessableEntity({
        errors: {
          image: imageFile.errors.map((error) => error.message),
        },
      })
    }

    const payload = updateProductRequestSchema.safeParse(this.normalizeUpdatePayload(request))

    if (!payload.success) {
      return response.unprocessableEntity({
        errors: payload.error.flatten().fieldErrors,
      })
    }

    const result = await updateProduct(params.productId, payload.data, {
      imageFile,
      removeImage: this.shouldRemoveImage(request, imageFile),
    })

    if (result === 'not-found') {
      return response.notFound({
        message: 'Product not found.',
      })
    }

    if (result === 'collection-not-found') {
      return response.unprocessableEntity({
        errors: {
          collectionId: ['Selected collection was not found.'],
        },
      })
    }

    return response.ok(result)
  }

  async destroy({ params, response }: HttpContext) {
    const result = await softDeleteProduct(params.productId)

    if (result === 'not-found') {
      return response.notFound({
        message: 'Product not found.',
      })
    }

    return response.noContent()
  }

  async restore({ authenticatedSession, params, response }: HttpContext) {
    if (authenticatedSession.user.role !== 'admin') {
      return response.forbidden({
        message: 'Only admins can restore deleted Products.',
      })
    }

    const result = await restoreProduct(params.productId)

    if (result === 'not-found') {
      return response.notFound({
        message: 'Product not found.',
      })
    }

    return response.noContent()
  }

  private normalizeUpdatePayload(request: HttpContext['request']) {
    const body = request.all()

    return {
      name: body.name,
      shortDescription: body.shortDescription ?? null,
      lifecycleStatus: body.lifecycleStatus,
      productStatus: body.productStatus,
      productCategory: body.productCategory ?? null,
      collectionId:
        body.collectionId === null || body.collectionId === undefined || body.collectionId === ''
          ? null
          : Number(body.collectionId),
    }
  }

  private shouldRemoveImage(request: HttpContext['request'], imageFile: MultipartFile | null) {
    if (imageFile) {
      return false
    }

    const body = request.all()

    return body.removeImage === true || body.removeImage === 'true'
  }

  private shouldIncludeDeleted(includeDeleted: unknown) {
    return includeDeleted === true || includeDeleted === 'true'
  }
}
