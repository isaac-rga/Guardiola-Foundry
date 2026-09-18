import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('bills_of_materials', (table) => {
      table
        .integer('product_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('products')
        .onDelete('RESTRICT')
    })

    this.schema.raw(`
      CREATE UNIQUE INDEX bills_of_materials_product_unique
      ON bills_of_materials (product_id)
      WHERE product_id IS NOT NULL
    `)
    this.schema.raw(`
      ALTER TABLE bills_of_materials
      ADD CONSTRAINT bills_of_materials_template_product_check
      CHECK (product_id IS NULL OR kind = 'template')
    `)
  }

  async down() {
    this.schema.alterTable('bills_of_materials', (table) => {
      table.dropColumn('product_id')
    })
  }
}
