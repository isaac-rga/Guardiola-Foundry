import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_variants'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('public_id').notNullable().unique()
      table
        .integer('product_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('RESTRICT')
      table.string('name').notNullable()
      table.enu('status', ['active', 'inactive']).notNullable().defaultTo('active')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('deleted_at', { useTz: true }).nullable()
    })

    this.schema.raw(`
      CREATE UNIQUE INDEX product_variants_product_name_unique
      ON product_variants (product_id, lower(name))
      WHERE deleted_at IS NULL
    `)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
