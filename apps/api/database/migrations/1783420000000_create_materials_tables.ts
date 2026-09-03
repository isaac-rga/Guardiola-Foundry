import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('materials', (table) => {
      table.increments('id')
      table.string('public_id').notNullable().unique()
      table.string('legacy_material_id').notNullable().unique()
      table.string('name').notNullable()
      table.enu('material_color', ['ivory', 'champagne', 'white']).notNullable()
      table.enu('material_use', ['base-fabric', 'structure', 'lace']).notNullable()
      table.enu('material_unit', ['meter']).notNullable().defaultTo('meter')
      table.text('comments').nullable()
      table.timestamp('deleted_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    this.schema.createTable('material_sources', (table) => {
      table.increments('id')
      table.string('public_id').notNullable().unique()
      table.string('legacy_source_id').notNullable().unique()
      table.string('name').notNullable()
      table.string('provider').notNullable()
      table.string('textile_family').notNullable()
      table.string('purchase_unit').notNullable()
      table.integer('normalized_unit_cost_cents').unsigned().notNullable()
      table.enu('normalized_unit', ['meter']).notNullable().defaultTo('meter')
      table.timestamp('deleted_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    this.schema.createTable('material_source_links', (table) => {
      table.increments('id')
      table
        .integer('material_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('materials')
        .onDelete('CASCADE')
      table
        .integer('material_source_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('material_sources')
        .onDelete('RESTRICT')
      table.integer('sort_order').unsigned().notNullable()
      table.boolean('is_preferred').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.unique(['material_id', 'material_source_id'])
    })
  }

  async down() {
    this.schema.dropTable('material_source_links')
    this.schema.dropTable('material_sources')
    this.schema.dropTable('materials')
  }
}
