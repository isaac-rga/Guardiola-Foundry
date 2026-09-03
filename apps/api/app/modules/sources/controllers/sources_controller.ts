import {
  createSource,
  getSource,
  listSources,
  restoreSource,
  retireSource,
  SourceLifecycleError,
  updateSource,
} from '#modules/sources/services/sources_service'
import {
  createSourceRequestSchema,
  listSourcesQuerySchema,
  updateSourceRequestSchema,
} from '@guardiola-foundry/shared-validation'
import type { HttpContext } from '@adonisjs/core/http'

export default class SourcesController {
  async index({ authenticatedSession, request, response }: HttpContext) {
    const parsedFilters = listSourcesQuerySchema.safeParse(request.qs())

    if (!parsedFilters.success) {
      return response.unprocessableEntity({ message: 'Invalid Source filters.' })
    }

    if (parsedFilters.data.status === 'retired' && authenticatedSession.user.role !== 'admin') {
      return response.forbidden({
        message:
          'Only Admins can view Retired Sources. Remove the Status filter to view Active Sources.',
      })
    }

    return response.ok(await listSources(parsedFilters.data))
  }

  async show({ authenticatedSession, params, response }: HttpContext) {
    const result = await getSource(params.sourceId, authenticatedSession.user.role === 'admin')

    if (!result) {
      return response.notFound({ message: 'Source not found.' })
    }

    return response.ok(result)
  }

  async store({ request, response }: HttpContext) {
    const payload = createSourceRequestSchema.safeParse(request.body())

    if (!payload.success) {
      return response.unprocessableEntity({
        errors: payload.error.flatten().fieldErrors,
      })
    }

    return response.created(await createSource(payload.data))
  }

  async update({ authenticatedSession, params, request, response }: HttpContext) {
    const payload = updateSourceRequestSchema.safeParse(request.body())

    if (!payload.success) {
      return response.unprocessableEntity({
        errors: payload.error.flatten().fieldErrors,
      })
    }

    const result = await updateSource(
      params.sourceId,
      payload.data,
      authenticatedSession.user.role === 'admin'
    )

    if (!result) {
      return response.notFound({ message: 'Source not found.' })
    }

    return response.ok(result)
  }

  async destroy({ params, response }: HttpContext) {
    try {
      return response.ok(await retireSource(params.sourceId))
    } catch (error) {
      return this.respondToLifecycleError(error, response)
    }
  }

  async restore({ authenticatedSession, params, response }: HttpContext) {
    if (authenticatedSession.user.role !== 'admin') {
      return response.forbidden({ message: 'Only Admins can restore Retired Sources.' })
    }

    try {
      return response.ok(await restoreSource(params.sourceId))
    } catch (error) {
      return this.respondToLifecycleError(error, response)
    }
  }

  private respondToLifecycleError(error: unknown, response: HttpContext['response']) {
    if (!(error instanceof SourceLifecycleError)) {
      throw error
    }

    if (error.code === 'not-found') {
      return response.notFound({ message: error.message })
    }

    if (error.code === 'preferred-source') {
      return response.conflict({
        message: error.message,
        affectedMaterials: error.affectedMaterials,
      })
    }

    return response.conflict({ message: error.message })
  }
}
