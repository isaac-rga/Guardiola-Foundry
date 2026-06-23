import type { HealthResponse } from '@guardiola-foundry/shared-types'
import type { HttpContext } from '@adonisjs/core/http'

export default class HealthController {
  show({ response }: HttpContext) {
    const health: HealthResponse = { status: 'ok' }

    return response.ok(health)
  }
}
