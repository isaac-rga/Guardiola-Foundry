import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('pattern_sets', (table) => {
      table.increments('id')
      table.string('public_id').notNullable().unique()
      table.string('name').notNullable()
      table.text('description').nullable()
      table.enu('status', ['active', 'retired']).notNullable().defaultTo('active')
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

    this.schema.raw(`
      CREATE UNIQUE INDEX pattern_sets_normalized_name_unique
      ON pattern_sets (lower(btrim(name)))
    `)

    this.schema.createTable('pattern_set_quantity_proposals', (table) => {
      table.increments('id')
      table
        .integer('pattern_set_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('pattern_sets')
        .onDelete('CASCADE')
      table.specificType('assumed_width_cm', 'numeric').notNullable()
      table.specificType('quantity_meters', 'numeric').notNullable()
      table.text('evidence_note').nullable()
      table.unique(['pattern_set_id', 'assumed_width_cm'])
      table.check('assumed_width_cm > 0')
      table.check('quantity_meters > 0')
      table.check('quantity_meters = round(quantity_meters, 3)')
    })
  }

  async down() {
    this.schema.dropTable('pattern_set_quantity_proposals')
    this.schema.dropTable('pattern_sets')
  }
}
