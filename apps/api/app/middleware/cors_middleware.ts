import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

const WEB_APP_ORIGIN = 'http://localhost:5173'
const ALLOWED_METHODS = 'GET,HEAD,POST,PUT,DELETE,OPTIONS'

export default class CorsMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    const requestOrigin = request.header('origin')

    if (requestOrigin === WEB_APP_ORIGIN) {
      response.header('Access-Control-Allow-Origin', requestOrigin)
      response.header('Vary', 'Origin')
      response.header('Access-Control-Allow-Methods', ALLOWED_METHODS)

      const requestedHeaders = request.header('access-control-request-headers')

      if (requestedHeaders) {
        response.header('Access-Control-Allow-Headers', requestedHeaders)
      }
    }

    if (request.method() === 'OPTIONS' && requestOrigin === WEB_APP_ORIGIN) {
      return response.status(204).send('')
    }

    return next()
  }
}
