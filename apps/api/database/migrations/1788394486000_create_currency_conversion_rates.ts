import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('currency_conversion_rates', (table) => {
      table.integer('id').primary().notNullable().defaultTo(1)
      table.decimal('usd_to_mxn_rate', 18, 6).nullable()
      table.date('effective_date').nullable()
    })

    this.schema.raw(`
      ALTER TABLE currency_conversion_rates
        ADD CONSTRAINT currency_conversion_rates_singleton
          CHECK (id = 1);
    `)
  }

  async down() {
    this.schema.dropTable('currency_conversion_rates')
  }
}
