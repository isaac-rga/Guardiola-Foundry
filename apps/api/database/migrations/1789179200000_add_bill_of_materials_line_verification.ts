import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('bill_of_materials_lines', (table) => {
      table
        .integer('verified_by_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.timestamp('verified_at', { useTz: true }).nullable()
      table.check(
        '(verified_by_user_id IS NULL AND verified_at IS NULL) OR (verified_by_user_id IS NOT NULL AND verified_at IS NOT NULL)',
        {},
        'bill_of_materials_lines_verification_evidence_check'
      )
      table.index(['verified_by_user_id'])
    })
  }

  async down() {
    this.schema.alterTable('bill_of_materials_lines', (table) => {
      table.dropChecks('bill_of_materials_lines_verification_evidence_check')
      table.dropIndex(['verified_by_user_id'])
      table.dropColumn('verified_at')
      table.dropColumn('verified_by_user_id')
    })
  }
}
