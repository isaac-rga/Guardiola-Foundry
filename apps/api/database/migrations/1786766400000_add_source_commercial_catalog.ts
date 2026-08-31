import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('material_sources', (table) => {
      table.renameColumn('provider', 'vendor')
      table.renameColumn('normalized_unit_cost_cents', 'landed_unit_cost_cents')
      // The pre-catalog shell already contains rows. Keep new core fields nullable here so the
      // migration does not invent workbook facts; the importer is the current write boundary and
      // rejects incomplete catalog rows with an actionable report.
      table.string('purchase_presentation').nullable()
      table.decimal('fixed_piece_length', 14, 4).nullable()
      table.decimal('minimum_purchase_quantity', 14, 4).nullable()
      table.integer('purchase_price_cents').unsigned().nullable()
      table.date('price_date').nullable()
      table.string('vendor_currency').nullable()
      table.string('source_status').notNullable().defaultTo('active')
    })

    this.schema.raw(`
      ALTER TABLE material_sources
        ALTER COLUMN landed_unit_cost_cents DROP NOT NULL;
    `)
  }

  async down() {
    this.schema.raw(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM material_sources
          WHERE landed_unit_cost_cents IS NULL
        ) THEN
          RAISE EXCEPTION 'Cannot roll back while a Source has no Landed Unit Cost';
        END IF;
      END;
      $$;

      ALTER TABLE material_sources
        ALTER COLUMN landed_unit_cost_cents SET NOT NULL;
    `)

    this.schema.alterTable('material_sources', (table) => {
      table.dropColumns(
        'purchase_presentation',
        'fixed_piece_length',
        'minimum_purchase_quantity',
        'purchase_price_cents',
        'price_date',
        'vendor_currency',
        'source_status'
      )
      table.renameColumn('landed_unit_cost_cents', 'normalized_unit_cost_cents')
      table.renameColumn('vendor', 'provider')
    })
  }
}
