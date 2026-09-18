import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('bills_of_materials', (table) => {
      table
        .integer('product_variant_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('RESTRICT')
    })

    this.schema.raw(`
      CREATE UNIQUE INDEX bills_of_materials_product_variant_unique
      ON bills_of_materials (product_variant_id)
      WHERE product_variant_id IS NOT NULL
    `)
    this.schema.raw(`
      ALTER TABLE bills_of_materials
      DROP CONSTRAINT bills_of_materials_template_product_check
    `)
    this.schema.raw(`
      ALTER TABLE bills_of_materials
      ADD CONSTRAINT bills_of_materials_kind_relationship_check
      CHECK (
        (kind = 'template' AND product_variant_id IS NULL)
        OR
        (kind = 'implementation' AND product_id IS NULL AND product_variant_id IS NOT NULL)
      )
    `)
  }

  async down() {
    this.schema.raw(`
      ALTER TABLE bills_of_materials
      DROP CONSTRAINT bills_of_materials_kind_relationship_check
    `)
    this.schema.raw(`
      ALTER TABLE bills_of_materials
      ADD CONSTRAINT bills_of_materials_template_product_check
      CHECK (product_id IS NULL OR kind = 'template')
    `)
    this.schema.alterTable('bills_of_materials', (table) => {
      table.dropColumn('product_variant_id')
    })
  }
}
