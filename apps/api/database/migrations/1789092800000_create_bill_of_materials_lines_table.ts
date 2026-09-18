import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('bill_of_materials_lines', (table) => {
      table.increments('id')
      table.string('public_id').notNullable().unique()
      table
        .integer('bill_of_materials_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('bills_of_materials')
        .onDelete('CASCADE')
      table.string('construction_piece').notNullable()
      table
        .integer('material_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('materials')
        .onDelete('RESTRICT')
      table.specificType('material_quantity', 'numeric').nullable()
      table.text('line_note').nullable()
      table.integer('display_order').unsigned().notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.unique(['bill_of_materials_id', 'display_order'])
      table.check('material_quantity IS NULL OR material_id IS NOT NULL')
      table.check('material_quantity IS NULL OR material_quantity > 0')
      table.check('material_quantity IS NULL OR material_quantity = round(material_quantity, 3)')
      table.index(['material_id'])
    })
  }

  async down() {
    this.schema.dropTable('bill_of_materials_lines')
  }
}
