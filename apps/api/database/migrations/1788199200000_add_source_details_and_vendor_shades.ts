import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('material_sources', (table) => {
      table.string('vendor_sku').nullable()
      table.text('url').nullable()
      table.text('description').nullable()
      table.string('manufacturer').nullable()
      table.string('fiber').nullable()
      table.string('composition').nullable()
      table.decimal('gsm_grams_per_square_meter', 14, 4).nullable()
      table.decimal('width_centimeters', 14, 4).nullable()
      table.string('finish').nullable()
      table.string('weave').nullable()
      table.text('presentation_notes').nullable()
      table.string('country_of_origin').nullable()
      table.text('comments').nullable()
      table.integer('estimated_shipping_usd_per_kilogram_cents').unsigned().nullable()
      table.decimal('igi_percentage', 7, 4).nullable()
    })

    this.schema.raw(`
      ALTER TABLE material_sources
        ADD CONSTRAINT material_sources_gsm_positive
          CHECK (gsm_grams_per_square_meter IS NULL OR gsm_grams_per_square_meter > 0),
        ADD CONSTRAINT material_sources_width_positive
          CHECK (width_centimeters IS NULL OR width_centimeters > 0),
        ADD CONSTRAINT material_sources_igi_percentage_range
          CHECK (igi_percentage IS NULL OR igi_percentage BETWEEN 0 AND 100);
    `)

    this.schema.createTable('material_source_vendor_shades', (table) => {
      table.increments('id')
      table
        .integer('material_source_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('material_sources')
        .onDelete('CASCADE')
      table.string('name_or_code').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.unique(['material_source_id', 'name_or_code'])
      table.unique(['id', 'material_source_id'])
    })

    this.schema.alterTable('material_source_links', (table) => {
      table.integer('vendor_shade_id').unsigned().nullable()
    })

    this.schema.raw(`
      ALTER TABLE material_source_links
        ADD CONSTRAINT material_source_links_vendor_shade_source_fk
        FOREIGN KEY (vendor_shade_id, material_source_id)
        REFERENCES material_source_vendor_shades (id, material_source_id)
        ON DELETE RESTRICT;
    `)
  }

  async down() {
    this.schema.raw(`
      ALTER TABLE material_source_links
        DROP CONSTRAINT material_source_links_vendor_shade_source_fk;
    `)

    this.schema.alterTable('material_source_links', (table) => {
      table.dropColumn('vendor_shade_id')
    })

    this.schema.dropTable('material_source_vendor_shades')

    this.schema.alterTable('material_sources', (table) => {
      table.dropColumns(
        'vendor_sku',
        'url',
        'description',
        'manufacturer',
        'fiber',
        'composition',
        'gsm_grams_per_square_meter',
        'width_centimeters',
        'finish',
        'weave',
        'presentation_notes',
        'country_of_origin',
        'comments',
        'estimated_shipping_usd_per_kilogram_cents',
        'igi_percentage'
      )
    })
  }
}
