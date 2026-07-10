import { BaseSchema } from '@adonisjs/lucid/schema'

const COLLECTION_NAMES = ['2025', '2026', '2027']

export default class extends BaseSchema {
  protected tableName = 'collections'

  async up() {
    const now = this.now()

    await this.db.table(this.tableName).insert(
      COLLECTION_NAMES.map((name) => ({
        name,
        created_at: now,
        updated_at: now,
      }))
    )
  }

  async down() {
    await this.db.from(this.tableName).whereIn('name', COLLECTION_NAMES).del()
  }
}
