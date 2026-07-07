import { extractBearerToken } from '#modules/auth/bearer_token'
import { getCurrentSession } from '#modules/auth/auth_service'
import User from '#models/user'
import {
  createProduct,
  getProduct,
  listProducts,
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

  async show({ params, request, response }: HttpContext) {
    const authenticatedUser = await this.authenticate(request.header('authorization'))

    if (!authenticatedUser) {
      return response.unauthorized({
        message: 'Unauthorized',
      })
    }

    const result = await getProduct(params.productId)

    if (result === 'not-found') {
      return response.notFound({
        message: 'Product not found.',
      })
    }

    return response.ok(result)
  }

  async update({ params, request, response }: HttpContext) {
    const authenticatedUser = await this.authenticate(request.header('authorization'))

    if (!authenticatedUser) {
      return response.unauthorized({
        message: 'Unauthorized',
      })
    }

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

  async destroy({ params, request, response }: HttpContext) {
    const authenticatedUser = await this.authenticate(request.header('authorization'))

    if (!authenticatedUser) {
      return response.unauthorized({
        message: 'Unauthorized',
      })
    }

    const result = await softDeleteProduct(params.productId)

    if (result === 'not-found') {
      return response.notFound({
        message: 'Product not found.',
      })
    }

    return response.noContent()
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
}
