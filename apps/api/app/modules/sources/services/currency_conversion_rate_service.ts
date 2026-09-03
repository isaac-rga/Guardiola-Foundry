import CurrencyConversionRate from '#modules/sources/models/currency_conversion_rate'
import type { GetCurrencyConversionRateResponse } from '@guardiola-foundry/shared-types'

export async function getCurrencyConversionRate(): Promise<GetCurrencyConversionRateResponse> {
  const configuration = await CurrencyConversionRate.first()

  if (!configuration) {
    return { state: 'missing' }
  }

  const { effectiveDate, usdToMxnRate } = configuration
  const serializedEffectiveDate = effectiveDate?.toISODate()

  if (
    usdToMxnRate === null ||
    !Number.isFinite(usdToMxnRate) ||
    usdToMxnRate <= 0 ||
    !effectiveDate?.isValid ||
    !serializedEffectiveDate
  ) {
    return { state: 'invalid' }
  }

  return {
    state: 'configured',
    usdToMxnRate,
    mxnToUsdRate: 1 / usdToMxnRate,
    effectiveDate: serializedEffectiveDate,
  }
}
