import {
  createPatternSet,
  getPatternSet,
  getPatternSetUsageImpact,
  listPatternSets,
  restorePatternSet,
  retirePatternSet,
  searchPatternSets,
  updatePatternSet,
} from '#modules/pattern_sets/services/pattern_sets_service'
import {
  createPatternSetRequestSchema,
  searchPatternSetsQuerySchema,
  updatePatternSetRequestSchema,
} from '@guardiola-foundry/shared-validation'
import type { HttpContext } from '@adonisjs/core/http'

export default class PatternSetsController {
  async search({ request, response }: HttpContext) {
    const query = searchPatternSetsQuerySchema.safeParse(request.qs())
    if (!query.success) {
      return response.unprocessableEntity({ message: 'Enter a Pattern Set search.' })
    }
    return response.ok(await searchPatternSets(query.data.search))
  }

  async show({ params, response }: HttpContext) {
    const patternSet = await getPatternSet(params.patternSetId)
    if (!patternSet) return response.notFound({ message: 'Pattern Set not found.' })
    return response.ok(patternSet)
  }

  async usage({ params, response }: HttpContext) {
    const impact = await getPatternSetUsageImpact(params.patternSetId)
    if (!impact) return response.notFound({ message: 'Pattern Set not found.' })
    return response.ok(impact)
  }

  async index({ authenticatedSession, request, response }: HttpContext) {
    const includeRetired =
      authenticatedSession.user.role === 'admin' &&
      (request.input('includeRetired') === true || request.input('includeRetired') === 'true')
    return response.ok(await listPatternSets(includeRetired))
  }

  async store({ authenticatedSession, request, response }: HttpContext) {
    const payload = createPatternSetRequestSchema.safeParse(request.body())
    if (!payload.success)
      return response.unprocessableEntity({ errors: payload.error.flatten().fieldErrors })
    const result = await createPatternSet(authenticatedSession.user.id, payload.data)
    if (result === 'duplicate-name') return this.duplicateName(response)
    return response.created(result)
  }

  async update({ params, request, response }: HttpContext) {
    const payload = updatePatternSetRequestSchema.safeParse(request.body())
    if (!payload.success)
      return response.unprocessableEntity({ errors: payload.error.flatten().fieldErrors })
    const result = await updatePatternSet(params.patternSetId, payload.data)
    if (result === 'not-found') return response.notFound({ message: 'Pattern Set not found.' })
    if (result === 'retired')
      return response.unprocessableEntity({
        errors: { status: ['Retired Pattern Sets cannot be edited.'] },
      })
    if (result === 'duplicate-name') return this.duplicateName(response)
    return response.ok(result)
  }

  async destroy({ params, response }: HttpContext) {
    const result = await retirePatternSet(params.patternSetId)
    if (result === 'not-found')
      return response.notFound({ message: 'Active Pattern Set not found.' })
    return response.noContent()
  }

  async restore({ authenticatedSession, params, response }: HttpContext) {
    if (authenticatedSession.user.role !== 'admin') {
      return response.forbidden({ message: 'Only Admins can restore retired Pattern Sets.' })
    }
    const result = await restorePatternSet(params.patternSetId)
    if (result === 'not-found')
      return response.notFound({ message: 'Retired Pattern Set not found.' })
    return response.ok(result)
  }

  private duplicateName(response: HttpContext['response']) {
    return response.unprocessableEntity({
      errors: { name: ['Another Active or Retired Pattern Set already uses this name.'] },
    })
  }
}
