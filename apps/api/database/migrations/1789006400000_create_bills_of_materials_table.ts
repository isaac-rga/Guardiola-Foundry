import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('bills_of_materials', (table) => {
      table.increments('id')
      table.string('public_id').notNullable().unique()
      table.enu('kind', ['template', 'implementation']).notNullable()
      table.string('name').notNullable()
      table.text('description').nullable()
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
    this.schema.dropTable('bills_of_materials')
  }
}
