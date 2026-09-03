import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('material_sources', (table) => {
      table.jsonb('source_import_snapshot').nullable()
    })

    this.schema.alterTable('materials', (table) => {
      table.jsonb('source_links_import_snapshot').nullable()
    })
  }

  async down() {
    this.schema.alterTable('materials', (table) => {
      table.dropColumn('source_links_import_snapshot')
    })

    this.schema.alterTable('material_sources', (table) => {
      table.dropColumn('source_import_snapshot')
    })
  }
}
