import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS unaccent')
  }

  async down() {
    // The extension may predate this application and be shared by other schemas.
    // Rollback intentionally leaves it installed rather than destroying shared capability.
  }
}
