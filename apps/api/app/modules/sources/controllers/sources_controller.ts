import { getSource, listSources } from '#modules/sources/services/sources_service'
import { listSourcesQuerySchema } from '@guardiola-foundry/shared-validation'
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
}
