import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('product_image_file_name').nullable().after('short_description')
      table.string('product_image_storage_key').nullable().after('product_image_file_name')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('product_image_storage_key')
      table.dropColumn('product_image_file_name')
    })
  }
}
