import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('bills_of_materials', (table) => {
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })
    this.schema.raw('DROP INDEX bills_of_materials_product_unique')
    this.schema.raw(`
      CREATE UNIQUE INDEX bills_of_materials_product_unique
      ON bills_of_materials (product_id)
      WHERE product_id IS NOT NULL AND deleted_at IS NULL
    `)
    this.schema.raw('DROP INDEX bills_of_materials_product_variant_unique')
    this.schema.raw(`
      CREATE UNIQUE INDEX bills_of_materials_product_variant_unique
      ON bills_of_materials (product_variant_id)
      WHERE product_variant_id IS NOT NULL AND deleted_at IS NULL
    `)
  }

  async down() {
    this.schema.raw('DROP INDEX bills_of_materials_product_variant_unique')
    this.schema.raw(`
      CREATE UNIQUE INDEX bills_of_materials_product_variant_unique
      ON bills_of_materials (product_variant_id)
      WHERE product_variant_id IS NOT NULL
    `)
    this.schema.raw('DROP INDEX bills_of_materials_product_unique')
    this.schema.raw(`
      CREATE UNIQUE INDEX bills_of_materials_product_unique
      ON bills_of_materials (product_id)
      WHERE product_id IS NOT NULL
    `)
    this.schema.alterTable('bills_of_materials', (table) => {
      table.dropColumn('deleted_at')
    })
  }
}
