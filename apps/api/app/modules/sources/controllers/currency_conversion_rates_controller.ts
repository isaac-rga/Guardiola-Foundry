import { getCurrencyConversionRate } from '#modules/sources/services/currency_conversion_rate_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class CurrencyConversionRatesController {
  async show({ response }: HttpContext) {
    return response.ok(await getCurrencyConversionRate())
  }
}
