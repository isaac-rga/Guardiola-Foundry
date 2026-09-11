import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('bills_of_materials', (table) => {
      table
        .integer('origin_bill_of_materials_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('bills_of_materials')
        .onDelete('RESTRICT')
      table.index(['origin_bill_of_materials_id'])
    })
  }

  async down() {
    this.schema.alterTable('bills_of_materials', (table) => {
      table.dropColumn('origin_bill_of_materials_id')
    })
  }
}
