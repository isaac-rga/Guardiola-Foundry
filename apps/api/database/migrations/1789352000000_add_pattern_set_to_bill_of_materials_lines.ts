import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('bill_of_materials_lines', (table) => {
      table
        .integer('pattern_set_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('pattern_sets')
        .onDelete('RESTRICT')
      table.index(['pattern_set_id'])
    })
  }

  async down() {
    this.schema.alterTable('bill_of_materials_lines', (table) => {
      table.dropIndex(['pattern_set_id'])
      table.dropColumn('pattern_set_id')
    })
  }
}
