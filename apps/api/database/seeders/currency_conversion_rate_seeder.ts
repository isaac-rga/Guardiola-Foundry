import CurrencyConversionRate from '#modules/sources/models/currency_conversion_rate'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

const USD_TO_MXN_RATE = 17
const EFFECTIVE_DATE = '2026-09-02'

export default class extends BaseSeeder {
  async run() {
    const currencyConversionRate = await CurrencyConversionRate.find(1)

    if (!currencyConversionRate) {
      await CurrencyConversionRate.create({
        id: 1,
        usdToMxnRate: USD_TO_MXN_RATE,
        effectiveDate: DateTime.fromISO(EFFECTIVE_DATE, { zone: 'utc' }),
      })

      return
    }

    currencyConversionRate.merge({
      usdToMxnRate: USD_TO_MXN_RATE,
      effectiveDate: DateTime.fromISO(EFFECTIVE_DATE, { zone: 'utc' }),
    })

    await currencyConversionRate.save()
  }
}
