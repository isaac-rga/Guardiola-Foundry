import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class CurrencyConversionRate extends BaseModel {
  static table = 'currency_conversion_rates'

  @column({ isPrimary: true })
  declare id: number

  @column({
    columnName: 'usd_to_mxn_rate',
    consume: (value: string | null) => (value === null ? null : Number(value)),
  })
  declare usdToMxnRate: number | null

  @column.date({ columnName: 'effective_date' })
  declare effectiveDate: DateTime | null
}
