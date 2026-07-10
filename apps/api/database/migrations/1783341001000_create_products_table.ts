import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('public_id').notNullable().unique()
      table.string('name').notNullable()
      table
        .enu('lifecycle_status', [
          'concept',
          'fabric-trim-selection',
          'design-and-prototyping',
          'testing',
          'approved',
          'on-documentation',
          'finished',
        ])
        .notNullable()
        .defaultTo('concept')
      table.enu('product_status', ['active', 'inactive']).notNullable().defaultTo('active')
      table
        .integer('collection_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('collections')
        .onDelete('SET NULL')
      table
        .integer('created_by_user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
