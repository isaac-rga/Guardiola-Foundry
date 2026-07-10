import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enu('product_category', ['dress', 'accessory', 'other'])
        .nullable()
        .after('product_status')
      table.text('short_description').nullable().after('name')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('product_category')
      table.dropColumn('short_description')
    })
  }
}
